import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import api from "../api/axios";

type ModuleId =
  | "frontend"
  | "backend"
  | "services"
  | "tests"
  | "other";

const MODULES: Record<ModuleId, { label: string; color: string }> = {
  frontend: { label: "FRONTEND", color: "#00f0ff" },
  backend: { label: "BACKEND", color: "#ff2bd6" },
  services: { label: "SERVICES", color: "#b6ff3c" },
  tests: { label: "TESTS", color: "#ffb800" },
  other: { label: "OTHER", color: "#7a8aa8" },
};

interface RawNode {
  id: string;
  label: string;
  path: string;
  language: string;
  size: number;
  coupling_score: number;
  churn_score: number;
}

interface RawEdge {
  source: string;
  target: string;
  type: string;
  weight: number;
}

interface GraphResponse {
  status: "ready" | "not_indexed" | "indexing";
  nodes?: RawNode[];
  edges?: RawEdge[];
  repo?: { id: string; fullName: string };
}

interface FGNode extends RawNode {
  module: ModuleId;
  rank: number;
  x?: number;
  y?: number;
}

interface FGLink {
  source: string | FGNode;
  target: string | FGNode;
  weight: number;
}

function classifyModule(path: string): ModuleId {
  const p = path.toLowerCase();
  if (p.includes("test") || p.endsWith(".test.ts") || p.endsWith(".spec.ts"))
    return "tests";
  if (
    p.includes("/services/") ||
    p.includes("/jobs/") ||
    p.includes("/agents/") ||
    p.includes("/workers/")
  )
    return "services";
  if (
    p.startsWith("client/") ||
    p.startsWith("frontend/") ||
    p.startsWith("web/") ||
    p.includes("/components/")
  )
    return "frontend";
  if (
    p.startsWith("server/") ||
    p.startsWith("backend/") ||
    p.includes("/routes/") ||
    p.includes("/controllers/") ||
    p.includes("/models/")
  )
    return "backend";
  return "other";
}

function pageRank(
  nodes: RawNode[],
  edges: RawEdge[],
  iterations = 20,
  damping = 0.85,
): Map<string, number> {
  const n = nodes.length || 1;
  const ranks = new Map<string, number>();
  nodes.forEach((nd) => ranks.set(nd.id, 1 / n));
  const outgoing = new Map<string, RawEdge[]>();
  for (const e of edges) {
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e);
  }
  const incoming = new Map<string, RawEdge[]>();
  for (const e of edges) {
    if (!incoming.has(e.target)) incoming.set(e.target, []);
    incoming.get(e.target)!.push(e);
  }
  for (let i = 0; i < iterations; i++) {
    const next = new Map<string, number>();
    for (const nd of nodes) {
      let sum = 0;
      for (const e of incoming.get(nd.id) || []) {
        const out = (outgoing.get(e.source) || []).length || 1;
        sum += (ranks.get(e.source) || 0) / out;
      }
      next.set(nd.id, (1 - damping) / n + damping * sum);
    }
    next.forEach((v, k) => ranks.set(k, v));
  }
  return ranks;
}

export default function KnowledgeGraph() {
  const { repoId } = useParams<{ repoId: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState<Set<ModuleId>>(new Set());
  const [dims, setDims] = useState({ w: 800, h: 600 });

  useEffect(() => {
    if (!repoId) return;
    setLoading(true);
    api
      .get(`/api/repos/${repoId}/graph`)
      .then(({ data }) => setData(data))
      .catch(() => setData({ status: "not_indexed" }))
      .finally(() => setLoading(false));
  }, [repoId]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDims({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const graphData = useMemo(() => {
    if (!data?.nodes) return { nodes: [], links: [] as FGLink[] };
    const ranks = pageRank(data.nodes, data.edges || []);
    const maxRank = Math.max(...ranks.values(), 1e-9);
    const nodes: FGNode[] = data.nodes
      .map((n) => ({
        ...n,
        module: classifyModule(n.path),
        rank: ranks.get(n.id)! / maxRank,
      }))
      .filter((n) => !hidden.has(n.module))
      .filter((n) =>
        search ? n.path.toLowerCase().includes(search.toLowerCase()) : true,
      );
    const ids = new Set(nodes.map((n) => n.id));
    const links: FGLink[] = (data.edges || [])
      .filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({ source: e.source, target: e.target, weight: e.weight }));
    return { nodes, links };
  }, [data, hidden, search]);

  const toggleModule = (m: ModuleId) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m);
      else next.add(m);
      return next;
    });
  };

  return (
    <div
      className="-m-6 md:-m-8 h-screen flex flex-col no-grid overflow-hidden"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="flex items-center justify-between gap-4 px-6 py-3 border-b"
        style={{
          borderColor: "var(--border-default)",
          background: "var(--bg-panel)",
        }}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-neon">
            {"< BACK"}
          </button>
          <div>
            <p className="label-mono">KNOWLEDGE GRAPH</p>
            <p
              className="font-mono text-xs"
              style={{ color: "var(--neon-cyan)" }}
            >
              {data?.repo?.fullName || "—"}
            </p>
          </div>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="> search nodes_"
          className="input-neon"
          style={{ minWidth: 280 }}
        />

        <div className="flex items-center gap-3">
          {Object.entries(MODULES).map(([m, cfg]) => {
            const active = !hidden.has(m as ModuleId);
            return (
              <button
                key={m}
                onClick={() => toggleModule(m as ModuleId)}
                className="text-[10px] label-mono px-2 py-1 transition-all"
                style={{
                  color: active ? cfg.color : "var(--text-muted)",
                  border: `1px solid ${active ? cfg.color : "var(--text-muted)"}`,
                  opacity: active ? 1 : 0.4,
                }}
              >
                {cfg.label}
              </button>
            );
          })}
        </div>

        <p className="label-mono">
          {"> NODES: "}
          <span style={{ color: "var(--neon-cyan)" }}>
            {graphData.nodes.length}
          </span>
          {" · EDGES: "}
          <span style={{ color: "var(--neon-cyan)" }}>
            {graphData.links.length}
          </span>
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className="w-56 p-4 border-r overflow-y-auto"
          style={{
            borderColor: "var(--border-default)",
            background: "var(--bg-panel)",
          }}
        >
          <p className="label-mono mb-4">/ / LEGEND</p>
          {Object.entries(MODULES).map(([m, cfg]) => (
            <div key={m} className="flex items-center gap-3 mb-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }}
              />
              <span
                className="text-[11px] font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                {cfg.label}
              </span>
            </div>
          ))}
          <p
            className="label-mono mt-6 mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            / / HINT
          </p>
          <p
            className="text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {"> NODE SIZE ∝ PAGERANK"}
            <br />
            {"> EDGE WIDTH ∝ WEIGHT"}
          </p>
        </aside>

        <div ref={containerRef} className="flex-1 relative overflow-hidden">
          {loading ? (
            <p className="label-mono p-6">{"> RENDERING GRAPH_"}</p>
          ) : data?.status !== "ready" ? (
            <div className="p-6">
              <p
                className="label-mono"
                style={{ color: "var(--neon-amber)" }}
              >
                {"> STATUS: "}
                {data?.status?.toUpperCase() || "UNKNOWN"}
              </p>
              <p
                className="text-xs mt-2 font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                / / GRAPH NOT AVAILABLE. INDEX THE REPO TO BUILD ONE.
              </p>
            </div>
          ) : (
            <ForceGraph2D
              ref={fgRef}
              width={dims.w}
              height={dims.h}
              graphData={graphData as any}
              backgroundColor="rgba(5,6,10,1)"
              nodeRelSize={4}
              nodeVal={(n: any) => 2 + n.rank * 30}
              nodeColor={(n: any) => MODULES[n.module as ModuleId].color}
              nodeLabel={(n: any) => n.path}
              linkColor={() => "rgba(0, 240, 255, 0.25)"}
              linkWidth={(l: any) => 0.5 + (l.weight || 1) * 0.2}
              cooldownTicks={100}
              nodeCanvasObjectMode={() => "after"}
              nodeCanvasObject={(node: any, ctx, scale) => {
                if (scale < 1.2) return;
                ctx.font = `${10 / scale}px "JetBrains Mono", monospace`;
                ctx.fillStyle = "rgba(230, 247, 255, 0.7)";
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                ctx.fillText(
                  node.label,
                  node.x,
                  node.y + 4 + Math.sqrt(2 + node.rank * 30) * 2,
                );
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
