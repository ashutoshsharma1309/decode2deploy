import { Request, Response } from "express";
import { Types } from "mongoose";
import { RepoContext } from "../models/RepoContext";
import { Repo } from "../models/Repo";
import { redis } from "../config/redis";

interface GraphNode {
  id: string;
  label: string;
  path: string;
  language: string;
  size: number;
  coupling_score: number;
  churn_score: number;
}

type EdgeType = "import" | "calls" | "inherits" | "exports";

interface GraphEdge {
  source: string;
  target: string;
  type: EdgeType;
  weight: number;
}

interface GraphPayload {
  status: "ready";
  nodes: GraphNode[];
  edges: GraphEdge[];
  repo: { id: string; fullName: string };
  generatedAt: string;
}

const CACHE_TTL_SECONDS = 60 * 60;

function languageFromPath(path: string): string {
  const lower = path.toLowerCase();
  const dotIdx = lower.lastIndexOf(".");
  if (dotIdx === -1) return "other";
  const ext = lower.slice(dotIdx);
  if (ext === ".tsx") return "tsx";
  if (ext === ".ts") return "ts";
  if (ext === ".jsx") return "jsx";
  if (ext === ".js" || ext === ".mjs" || ext === ".cjs") return "js";
  if (ext === ".py") return "py";
  if (ext === ".css" || ext === ".scss" || ext === ".sass") return "css";
  return "other";
}

function inferEdgeType(
  sourcePath: string,
  targetPath: string,
  weight: number,
): EdgeType {
  const tLang = languageFromPath(targetPath);
  if (tLang === "css") return "import";
  if (weight >= 5) return "calls";
  return "import";
}

export async function getRepoGraph(req: Request, res: Response): Promise<void> {
  const repoId = String(req.params.repoId || "");
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!repoId || !Types.ObjectId.isValid(repoId)) {
    res.status(400).json({ error: "Invalid repoId" });
    return;
  }

  try {
    const repo = await Repo.findOne({
      _id: repoId,
      connectedBy: userId,
      isActive: true,
    }).lean();

    if (!repo) {
      res.status(404).json({ error: "Repository not found" });
      return;
    }

    const cacheKey = `graph:${repoId}`;
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          res.setHeader("X-Graph-Cache", "hit");
          res.json(JSON.parse(cached));
          return;
        }
      } catch {
        /* ignore cache read errors */
      }
    }

    const ctx = await RepoContext.findOne({ repoId }).lean();

    if (!ctx) {
      res.json({ status: "not_indexed" });
      return;
    }

    if (ctx.indexStatus === "indexing") {
      res.json({ status: "indexing" });
      return;
    }

    if (ctx.indexStatus !== "ready") {
      res.json({ status: "not_indexed" });
      return;
    }

    const fileTree: string[] = ctx.fileTree || [];
    const definitions = ctx.definitions || [];
    const storedEdges = ctx.graphEdges || [];
    const recentChanged = new Set(ctx.recentChangedFiles || []);

    const defsByPath = new Map<string, number>();
    const sizeByPath = new Map<string, number>();
    for (const d of definitions) {
      defsByPath.set(d.path, (defsByPath.get(d.path) || 0) + 1);
      const lineEnd = Math.max(sizeByPath.get(d.path) || 0, d.line || 0);
      sizeByPath.set(d.path, lineEnd);
    }

    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();
    for (const e of storedEdges) {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      outDegree.set(e.source, (outDegree.get(e.source) || 0) + 1);
    }

    const validPaths = new Set<string>(fileTree);
    for (const e of storedEdges) {
      validPaths.add(e.source);
      validPaths.add(e.target);
    }

    let maxCoupling = 0;
    const couplingRaw = new Map<string, number>();
    for (const path of validPaths) {
      const total = (inDegree.get(path) || 0) + (outDegree.get(path) || 0);
      couplingRaw.set(path, total);
      if (total > maxCoupling) maxCoupling = total;
    }

    let maxSize = 0;
    for (const v of sizeByPath.values()) if (v > maxSize) maxSize = v;

    const nodes: GraphNode[] = [];
    for (const path of validPaths) {
      if (!path) continue;
      const filename = path.split("/").pop() || path;
      const language = languageFromPath(path);
      const sizeRaw =
        sizeByPath.get(path) || Math.max(1, defsByPath.get(path) || 1);
      const sizeNorm = maxSize > 0 ? sizeRaw / maxSize : 0.5;
      const couplingRawVal = couplingRaw.get(path) || 0;
      const coupling =
        maxCoupling > 0 ? Math.round((couplingRawVal / maxCoupling) * 100) : 0;
      const churn = recentChanged.has(path) ? 100 : 0;

      nodes.push({
        id: path,
        label: filename,
        path,
        language,
        size: Number(sizeNorm.toFixed(4)),
        coupling_score: coupling,
        churn_score: churn,
      });
    }

    const edges: GraphEdge[] = [];
    if (storedEdges.length > 0) {
      for (const e of storedEdges) {
        if (!e.source || !e.target || e.source === e.target) continue;
        if (!validPaths.has(e.source) || !validPaths.has(e.target)) continue;
        const type = inferEdgeType(e.source, e.target, e.weight) as EdgeType;
        edges.push({
          source: e.source,
          target: e.target,
          type,
          weight: e.weight || 1,
        });
      }
    } else if (ctx.repoMap) {
      const importRe =
        /(?:^|\n)\s*(?:import\s+[^'"`\n]+?from\s+|require\s*\()\s*['"`]([^'"`\n]+)['"`]/g;
      const fileChunks = ctx.repoMap.split(/\n(?=[^\s])/g);
      for (const chunk of fileChunks) {
        const firstLine = chunk.split("\n")[0]?.trim();
        if (!firstLine || !validPaths.has(firstLine)) continue;
        let m: RegExpExecArray | null;
        while ((m = importRe.exec(chunk)) !== null) {
          const target = m[1];
          if (!target || target.startsWith(".") === false) continue;
          const resolved = resolveRelative(firstLine, target);
          const matched =
            fileTree.find((f) => f === resolved || f.startsWith(resolved + ".")) ||
            null;
          if (matched && matched !== firstLine) {
            edges.push({
              source: firstLine,
              target: matched,
              type: "import",
              weight: 1,
            });
          }
        }
      }
    }

    const payload: GraphPayload = {
      status: "ready",
      nodes,
      edges,
      repo: { id: String(repo._id), fullName: repo.fullName },
      generatedAt: new Date().toISOString(),
    };

    if (redis) {
      try {
        await redis.set(
          cacheKey,
          JSON.stringify(payload),
          "EX",
          CACHE_TTL_SECONDS,
        );
      } catch {
        /* ignore cache write errors */
      }
    }

    res.setHeader("X-Graph-Cache", "miss");
    res.json(payload);
  } catch (err) {
    console.error("[Graph] Failed to build graph", err);
    res.status(500).json({ error: "Failed to build graph" });
  }
}

function resolveRelative(fromFile: string, importPath: string): string {
  const fromParts = fromFile.split("/");
  fromParts.pop();
  const importParts = importPath.split("/");
  for (const p of importParts) {
    if (p === "." || p === "") continue;
    if (p === "..") fromParts.pop();
    else fromParts.push(p);
  }
  return fromParts.join("/");
}
