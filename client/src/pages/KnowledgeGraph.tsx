import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ComponentType,
} from "react";
import { useParams, Link } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import {
  ArrowLeft,
  Search,
  X,
  Database,
  Download,
  ExternalLink,
  AlertCircle,
  ChevronDown,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Layout as LayoutIcon,
  Network,
  Server,
  Component as ComponentIcon,
  Cog,
  Wrench,
  Settings,
  Circle,
  FileCode2,
  Folder,
  Keyboard,
  Map as MapIcon,
  GitBranch,
  Hash,
  Layers,
  Workflow,
  FolderTree,
  ChevronRight,
  EyeOff,
  Eye,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import api from "../api/axios";

/* ────────────────────────────────────────────────────────────────
 *  Types
 * ──────────────────────────────────────────────────────────────── */

type EdgeType = "import" | "calls" | "inherits" | "exports" | "contains";

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
  type: EdgeType;
  weight: number;
}

interface GraphResponse {
  status: "ready" | "not_indexed" | "indexing";
  nodes?: RawNode[];
  edges?: RawEdge[];
  repo?: { id: string; fullName: string };
}

type ModuleId =
  | "frontend"
  | "shared"
  | "utilities"
  | "services"
  | "api"
  | "backend"
  | "database"
  | "config"
  | "other";

interface ModuleConfig {
  label: string;
  color: string;
  layer: number;
  Icon: ComponentType<{ className?: string }>;
}

type FGKind = "file" | "cluster";
type ViewMode = "architecture" | "dependencies" | "folders";

interface FGNode {
  id: string;
  label: string;
  path: string;
  kind: FGKind;
  module: ModuleId;
  size: number;
  coupling_score: number;
  churn_score: number;
  language?: string;
  importance: number;
  childCount?: number;
  fileCount?: number;
  fx?: number;
  fy?: number;
  x?: number;
  y?: number;
}

interface FGLink {
  source: string | FGNode;
  target: string | FGNode;
  type: EdgeType;
  weight: number;
  fileCount: number;
}

/* ────────────────────────────────────────────────────────────────
 *  Module config — muted enterprise palette
 * ──────────────────────────────────────────────────────────────── */

const MODULES: Record<ModuleId, ModuleConfig> = {
  frontend: { label: "Frontend", color: "#6366f1", layer: 0, Icon: LayoutIcon },
  shared: { label: "Shared", color: "#8b5cf6", layer: 1, Icon: ComponentIcon },
  utilities: { label: "Utilities", color: "#64748b", layer: 1, Icon: Wrench },
  services: { label: "Services", color: "#0891b2", layer: 2, Icon: Cog },
  api: { label: "APIs", color: "#0d9488", layer: 3, Icon: Network },
  backend: { label: "Backend", color: "#2563eb", layer: 4, Icon: Server },
  database: { label: "Database", color: "#d97706", layer: 5, Icon: Database },
  config: { label: "Config", color: "#71717a", layer: 6, Icon: Settings },
  other: { label: "Other", color: "#52525b", layer: 6, Icon: Circle },
};

const MODULE_ORDER: ModuleId[] = [
  "frontend",
  "shared",
  "utilities",
  "services",
  "api",
  "backend",
  "database",
  "config",
  "other",
];

const LAYER_LABELS: Record<number, string> = {
  0: "Presentation",
  1: "UI / Helpers",
  2: "Services",
  3: "Interfaces",
  4: "Application",
  5: "Persistence",
  6: "Support",
};

const LAYOUT = {
  COLUMN_WIDTH: 340,
  FILE_ROW_HEIGHT: 46,
  CLUSTER_ROW_HEIGHT: 120,
  CLUSTER_INTRA_GAP: 80,
  TREE_COLUMN_WIDTH: 280,
  TREE_ROW_HEIGHT: 34,
  CANVAS_TOP_PAD: 80,
};

const LANG_LABELS: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  jsx: "JSX",
  py: "Python",
  css: "CSS",
  other: "Other",
};

/* ────────────────────────────────────────────────────────────────
 *  Helpers
 * ──────────────────────────────────────────────────────────────── */

function hexToRgba(hex: string, alpha = 1): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function classifyModule(path: string): ModuleId {
  const p = path.toLowerCase();

  const isClient =
    p.startsWith("client/") ||
    p.startsWith("frontend/") ||
    p.startsWith("web/") ||
    p.startsWith("apps/web/") ||
    p.startsWith("apps/client/");
  const isServer =
    p.startsWith("server/") ||
    p.startsWith("backend/") ||
    p.startsWith("api/") ||
    p.startsWith("apps/api/") ||
    p.startsWith("apps/server/");

  if (
    p.includes("/models/") ||
    p.includes("/migrations/") ||
    p.includes("/db/") ||
    p.includes("/database/") ||
    p.includes("/schema/") ||
    p.endsWith(".prisma") ||
    p.endsWith(".sql")
  )
    return "database";

  if (
    p.includes("/routes/") ||
    p.includes("/controllers/") ||
    p.includes("/endpoints/") ||
    p.includes("/handlers/")
  )
    return "api";

  if (
    p.includes("/services/") ||
    p.includes("/middlewares/") ||
    p.includes("/middleware/") ||
    p.includes("/jobs/") ||
    p.includes("/agents/") ||
    p.includes("/workers/") ||
    p.includes("/queue/") ||
    p.includes("/queues/")
  )
    return "services";

  if (
    p.includes("/components/") ||
    p.includes("/shared/") ||
    p.includes("/common/") ||
    p.includes("/ui/")
  )
    return "shared";

  if (
    p.includes("/utils/") ||
    p.includes("/helpers/") ||
    p.includes("/lib/") ||
    p.includes("/hooks/")
  )
    return "utilities";

  if (
    p.includes("/config/") ||
    p.endsWith(".config.ts") ||
    p.endsWith(".config.js") ||
    p.endsWith(".config.json") ||
    p.endsWith(".env") ||
    p.endsWith(".toml") ||
    p.endsWith(".yaml") ||
    p.endsWith(".yml")
  )
    return "config";

  if (isClient) return "frontend";
  if (isServer) return "backend";
  return "other";
}

/* ────────────────────────────────────────────────────────────────
 *  Graph builders
 * ──────────────────────────────────────────────────────────────── */

function buildArchitectureGraph(
  data: GraphResponse,
  moduleByFileId: Map<string, ModuleId>,
  importanceByFileId: Map<string, number>,
  expandedClusters: Set<ModuleId>,
  hiddenModules: Set<ModuleId>,
): { nodes: FGNode[]; links: FGLink[] } {
  if (!data.nodes) return { nodes: [], links: [] };

  const filesByModule = new Map<ModuleId, RawNode[]>();
  for (const n of data.nodes) {
    const mod = moduleByFileId.get(n.id) || "other";
    if (hiddenModules.has(mod)) continue;
    if (!filesByModule.has(mod)) filesByModule.set(mod, []);
    filesByModule.get(mod)!.push(n);
  }

  const nodes: FGNode[] = [];
  const visibleFileIds = new Set<string>();

  for (const [mod, files] of filesByModule) {
    if (expandedClusters.has(mod)) {
      for (const f of files) {
        visibleFileIds.add(f.id);
        nodes.push({
          id: f.id,
          label: f.label,
          path: f.path,
          kind: "file",
          module: mod,
          size: f.size,
          coupling_score: f.coupling_score,
          churn_score: f.churn_score,
          language: f.language,
          importance: importanceByFileId.get(f.id) || 0,
        });
      }
    } else {
      const totalImportance = files.reduce(
        (a, f) => a + (importanceByFileId.get(f.id) || 0),
        0,
      );
      nodes.push({
        id: `cluster::${mod}`,
        label: MODULES[mod].label,
        path: mod,
        kind: "cluster",
        module: mod,
        size: 1,
        coupling_score: 0,
        churn_score: 0,
        importance: totalImportance,
        childCount: files.length,
        fileCount: files.length,
      });
    }
  }

  const edgeKey = new Map<string, FGLink>();
  for (const e of data.edges || []) {
    if (e.type === "contains") continue;
    const sMod = moduleByFileId.get(e.source) || "other";
    const tMod = moduleByFileId.get(e.target) || "other";
    if (hiddenModules.has(sMod) || hiddenModules.has(tMod)) continue;

    const sId = visibleFileIds.has(e.source) ? e.source : `cluster::${sMod}`;
    const tId = visibleFileIds.has(e.target) ? e.target : `cluster::${tMod}`;
    if (sId === tId) continue;

    const key = `${sId}->${tId}::${e.type}`;
    const existing = edgeKey.get(key);
    if (existing) {
      existing.weight += e.weight;
      existing.fileCount += 1;
    } else {
      edgeKey.set(key, {
        source: sId,
        target: tId,
        type: e.type,
        weight: e.weight,
        fileCount: 1,
      });
    }
  }

  return { nodes, links: Array.from(edgeKey.values()) };
}

function buildFolderGraph(
  data: GraphResponse,
  moduleByFileId: Map<string, ModuleId>,
  importanceByFileId: Map<string, number>,
): { nodes: FGNode[]; links: FGLink[] } {
  if (!data.nodes) return { nodes: [], links: [] };
  const nodeMap = new Map<string, FGNode>();

  for (const n of data.nodes) {
    nodeMap.set(n.id, {
      id: n.id,
      label: n.label,
      path: n.path,
      kind: "file",
      module: moduleByFileId.get(n.id) || "other",
      size: n.size,
      coupling_score: n.coupling_score,
      churn_score: n.churn_score,
      language: n.language,
      importance: importanceByFileId.get(n.id) || 0,
    });
  }

  const childCount = new Map<string, number>();
  for (const n of data.nodes) {
    const parts = n.path.split("/");
    parts.pop();
    let acc = "";
    for (const p of parts) {
      acc = acc ? `${acc}/${p}` : p;
      const id = `dir::${acc}`;
      if (!nodeMap.has(id)) {
        nodeMap.set(id, {
          id,
          label: p,
          path: acc,
          kind: "cluster",
          module: classifyModule(acc + "/"),
          size: 0,
          coupling_score: 0,
          churn_score: 0,
          importance: 0,
          childCount: 0,
        });
      }
    }
    const immediate = parts.join("/");
    if (immediate)
      childCount.set(immediate, (childCount.get(immediate) || 0) + 1);
  }
  for (const [path, c] of childCount) {
    const node = nodeMap.get(`dir::${path}`);
    if (node) node.childCount = c;
  }

  const links: FGLink[] = [];
  const ids = new Set(nodeMap.keys());
  for (const node of nodeMap.values()) {
    const parts = node.path.split("/");
    if (node.kind === "file") parts.pop();
    else if (parts.length <= 1) continue;
    else parts.pop();
    const parent = parts.join("/");
    if (parent) {
      const parentId = `dir::${parent}`;
      if (ids.has(parentId)) {
        links.push({
          source: parentId,
          target: node.id,
          type: "contains",
          weight: 1,
          fileCount: 1,
        });
      }
    }
  }

  for (const e of data.edges || []) {
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    if (e.type === "contains") continue;
    links.push({
      source: e.source,
      target: e.target,
      type: e.type,
      weight: e.weight,
      fileCount: 1,
    });
  }

  return { nodes: Array.from(nodeMap.values()), links };
}

/* ────────────────────────────────────────────────────────────────
 *  Deterministic layout
 * ──────────────────────────────────────────────────────────────── */

function computeArchitectureLayout(
  nodes: FGNode[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const numLayers = 7;
  const totalWidth = (numLayers - 1) * LAYOUT.COLUMN_WIDTH;
  const xOffset = -totalWidth / 2;

  // Group nodes by layer, then within layer by module
  const byLayer = new Map<number, FGNode[]>();
  for (const n of nodes) {
    const layer = MODULES[n.module].layer;
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer)!.push(n);
  }

  for (const [layer, layerNodes] of byLayer) {
    const x = xOffset + layer * LAYOUT.COLUMN_WIDTH;

    // Stable ordering: cluster (by module index) > files (by importance desc, label asc)
    layerNodes.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "cluster" ? -1 : 1;
      const aMod = MODULE_ORDER.indexOf(a.module);
      const bMod = MODULE_ORDER.indexOf(b.module);
      if (aMod !== bMod) return aMod - bMod;
      if (a.importance !== b.importance) return b.importance - a.importance;
      return a.label.localeCompare(b.label);
    });

    // Group by module so we can add gaps between distinct modules in same layer
    const groups: FGNode[][] = [];
    let cur: FGNode[] = [];
    let curMod: ModuleId | null = null;
    for (const n of layerNodes) {
      if (n.module !== curMod) {
        if (cur.length) groups.push(cur);
        cur = [n];
        curMod = n.module;
      } else cur.push(n);
    }
    if (cur.length) groups.push(cur);

    // Compute total height
    let totalH = 0;
    for (let g = 0; g < groups.length; g++) {
      for (const n of groups[g]) {
        totalH +=
          n.kind === "cluster"
            ? LAYOUT.CLUSTER_ROW_HEIGHT
            : LAYOUT.FILE_ROW_HEIGHT;
      }
      if (g < groups.length - 1) totalH += LAYOUT.CLUSTER_INTRA_GAP;
    }

    let y = -totalH / 2;
    for (let g = 0; g < groups.length; g++) {
      for (const n of groups[g]) {
        const h =
          n.kind === "cluster"
            ? LAYOUT.CLUSTER_ROW_HEIGHT
            : LAYOUT.FILE_ROW_HEIGHT;
        positions.set(n.id, { x, y: y + h / 2 });
        y += h;
      }
      if (g < groups.length - 1) y += LAYOUT.CLUSTER_INTRA_GAP;
    }
  }

  return positions;
}

function computeFolderLayout(
  nodes: FGNode[],
  links: FGLink[],
): Map<string, { x: number; y: number }> {
  const parentOf = new Map<string, string>();
  for (const l of links) {
    if (l.type !== "contains") continue;
    const sId = typeof l.source === "string" ? l.source : l.source.id;
    const tId = typeof l.target === "string" ? l.target : l.target.id;
    parentOf.set(tId, sId);
  }

  const depthOf = new Map<string, number>();
  function depth(id: string, seen = new Set<string>()): number {
    if (depthOf.has(id)) return depthOf.get(id)!;
    if (seen.has(id)) return 0;
    seen.add(id);
    const p = parentOf.get(id);
    const d = p == null ? 0 : depth(p, seen) + 1;
    depthOf.set(id, d);
    return d;
  }
  for (const n of nodes) depth(n.id);

  const byDepth = new Map<number, FGNode[]>();
  for (const n of nodes) {
    const d = depthOf.get(n.id) || 0;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(n);
  }

  const positions = new Map<string, { x: number; y: number }>();
  const depths = Array.from(byDepth.keys()).sort((a, b) => a - b);
  const maxDepth = depths.length > 0 ? depths[depths.length - 1] : 0;
  const xOffset = -(maxDepth * LAYOUT.TREE_COLUMN_WIDTH) / 2;

  for (const d of depths) {
    const dnodes = byDepth.get(d)!;
    dnodes.sort((a, b) => {
      const pa = parentOf.get(a.id) || "";
      const pb = parentOf.get(b.id) || "";
      if (pa !== pb) return pa.localeCompare(pb);
      if (a.kind !== b.kind) return a.kind === "cluster" ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
    const x = xOffset + d * LAYOUT.TREE_COLUMN_WIDTH;
    const totalH = (dnodes.length - 1) * LAYOUT.TREE_ROW_HEIGHT;
    let y = -totalH / 2;
    for (const n of dnodes) {
      positions.set(n.id, { x, y });
      y += LAYOUT.TREE_ROW_HEIGHT;
    }
  }

  return positions;
}

/* ────────────────────────────────────────────────────────────────
 *  Component
 * ──────────────────────────────────────────────────────────────── */

export default function KnowledgeGraph() {
  const { repoId } = useParams<{ repoId: string }>();
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [data, setData] = useState<GraphResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>("architecture");
  const [expandedClusters, setExpandedClusters] = useState<Set<ModuleId>>(
    new Set(),
  );
  const [hiddenModules, setHiddenModules] = useState<Set<ModuleId>>(new Set());

  const [search, setSearch] = useState("");
  const [hoverNode, setHoverNode] = useState<FGNode | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<FGNode | null>(null);

  const [size, setSize] = useState({ w: 800, h: 600 });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [accordion, setAccordion] = useState<Record<string, boolean>>({
    metrics: true,
    imports: true,
    importedBy: true,
  });

  /* fetch */
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    api
      .get<GraphResponse>(`/api/repos/${repoId}/graph`)
      .then((res) => {
        if (alive) setData(res.data);
      })
      .catch((err) => {
        if (alive)
          setError(
            err.response?.data?.error ||
              err.message ||
              "Failed to load knowledge graph",
          );
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [repoId]);

  /* sizing */
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const r = containerRef.current.getBoundingClientRect();
        setSize({ w: Math.max(320, r.width), h: Math.max(360, r.height) });
      }
    }
    measure();
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [sidebarCollapsed, viewMode]);

  /* derived */
  const moduleByFileId = useMemo(() => {
    const m = new Map<string, ModuleId>();
    for (const n of data?.nodes || []) m.set(n.id, classifyModule(n.path));
    return m;
  }, [data]);

  const importanceByFileId = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of data?.edges || []) {
      m.set(e.source, (m.get(e.source) || 0) + 1);
      m.set(e.target, (m.get(e.target) || 0) + 1);
    }
    return m;
  }, [data]);

  const maxImportance = useMemo(() => {
    let mx = 1;
    for (const v of importanceByFileId.values()) if (v > mx) mx = v;
    return mx;
  }, [importanceByFileId]);

  const presentModules = useMemo(() => {
    const set = new Set<ModuleId>();
    for (const m of moduleByFileId.values()) set.add(m);
    return MODULE_ORDER.filter((m) => set.has(m));
  }, [moduleByFileId]);

  /* graph data + deterministic positions */
  const graphData = useMemo<{ nodes: FGNode[]; links: FGLink[] }>(() => {
    if (data?.status !== "ready" || !data.nodes) return { nodes: [], links: [] };

    const built =
      viewMode === "folders"
        ? buildFolderGraph(data, moduleByFileId, importanceByFileId)
        : buildArchitectureGraph(
            data,
            moduleByFileId,
            importanceByFileId,
            expandedClusters,
            hiddenModules,
          );

    const positions =
      viewMode === "folders"
        ? computeFolderLayout(built.nodes, built.links)
        : computeArchitectureLayout(built.nodes);

    for (const node of built.nodes) {
      const p = positions.get(node.id);
      if (p) {
        node.x = p.x;
        node.y = p.y;
        node.fx = p.x;
        node.fy = p.y;
      }
    }
    return built;
  }, [
    data,
    viewMode,
    expandedClusters,
    hiddenModules,
    moduleByFileId,
    importanceByFileId,
  ]);

  /* fit on layout change */
  useEffect(() => {
    if (!fgRef.current) return;
    const t = setTimeout(() => fgRef.current?.zoomToFit(500, 60), 80);
    return () => clearTimeout(t);
  }, [graphData.nodes.length, viewMode]);

  /* path highlight */
  const focused = selectedNode || hoverNode;
  const highlightedNodeIds = useMemo(() => {
    if (!focused) return null;
    const set = new Set<string>([focused.id]);
    const fwd = [focused.id];
    while (fwd.length) {
      const cur = fwd.shift()!;
      for (const e of graphData.links) {
        const sId = typeof e.source === "object" ? e.source.id : e.source;
        const tId = typeof e.target === "object" ? e.target.id : e.target;
        if (sId === cur && !set.has(tId)) {
          set.add(tId);
          fwd.push(tId);
        }
      }
    }
    const back = [focused.id];
    while (back.length) {
      const cur = back.shift()!;
      for (const e of graphData.links) {
        const sId = typeof e.source === "object" ? e.source.id : e.source;
        const tId = typeof e.target === "object" ? e.target.id : e.target;
        if (tId === cur && !set.has(sId)) {
          set.add(sId);
          back.push(sId);
        }
      }
    }
    return set;
  }, [focused, graphData.links]);

  /* sizing helpers */
  const nodeRadius = useCallback(
    (n: FGNode) => {
      if (n.kind === "cluster" && viewMode !== "folders") {
        const fc = n.fileCount || 1;
        return 38 + Math.min(24, Math.sqrt(fc) * 3.8);
      }
      if (n.kind === "cluster") return 11;
      const norm = (n.importance || 0) / Math.max(1, maxImportance);
      return 11 + norm * 14;
    },
    [maxImportance, viewMode],
  );

  const matchesSearch = useCallback(
    (n: FGNode) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        n.label.toLowerCase().includes(q) ||
        n.path.toLowerCase().includes(q) ||
        MODULES[n.module].label.toLowerCase().includes(q)
      );
    },
    [search],
  );

  const isDimmed = useCallback(
    (n: FGNode) => {
      if (!matchesSearch(n)) return true;
      if (highlightedNodeIds && !highlightedNodeIds.has(n.id)) return true;
      return false;
    },
    [matchesSearch, highlightedNodeIds],
  );

  /* canvas drawing — minimal, no glow/pulse */
  const drawNode = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const r = nodeRadius(node);
      const isHover = hoverNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const dim = isDimmed(node);
      const baseColor = MODULES[node.module].color;
      const alpha = dim ? 0.16 : 1;
      const isCluster = node.kind === "cluster";
      const isFolderTreeCluster =
        isCluster && viewMode === "folders";

      ctx.save();
      ctx.globalAlpha = alpha;

      if (isCluster && !isFolderTreeCluster) {
        // Architecture cluster — rounded rect card
        const w = LAYOUT.COLUMN_WIDTH - 60;
        const h = LAYOUT.CLUSTER_ROW_HEIGHT - 16;

        // Soft outer glow when hovered/selected for visibility
        if (isHover || isSelected) {
          ctx.shadowColor = hexToRgba(baseColor, 0.45);
          ctx.shadowBlur = 18;
        }
        roundRect(ctx, x - w / 2, y - h / 2, w, h, 12);
        ctx.fillStyle = "rgba(20, 22, 30, 0.96)";
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.lineWidth = isSelected ? 2.4 : isHover ? 2 : 1.4;
        ctx.strokeStyle = isSelected
          ? "rgba(255,255,255,0.85)"
          : isHover
            ? hexToRgba(baseColor, 0.95)
            : hexToRgba(baseColor, 0.7);
        ctx.stroke();

        // colored left accent bar
        ctx.fillStyle = baseColor;
        roundRect(ctx, x - w / 2, y - h / 2, 4, h, 12);
        ctx.fill();

        // text
        const titleSize = 17;
        const subSize = 13;
        const padL = x - w / 2 + 18;

        ctx.font = `700 ${titleSize}px Inter, ui-sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.99)";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label.toUpperCase(), padL, y - 14);

        ctx.font = `600 ${subSize}px Inter, ui-sans-serif`;
        ctx.fillStyle = hexToRgba(baseColor, 0.95);
        ctx.fillText(`${node.childCount} files`, padL, y + 8);

        ctx.font = `500 ${subSize - 1}px Inter, ui-sans-serif`;
        ctx.fillStyle = "rgba(180,180,195,0.85)";
        ctx.fillText(
          `${node.importance} dependencies`,
          padL,
          y + 26,
        );
      } else if (isFolderTreeCluster) {
        // Folder tree — small square node
        const s = 12;
        ctx.fillStyle = hexToRgba(baseColor, 0.22);
        ctx.strokeStyle = isSelected
          ? "rgba(255,255,255,0.75)"
          : hexToRgba(baseColor, 0.85);
        ctx.lineWidth = isSelected ? 1.8 : 1.2;
        roundRect(ctx, x - s / 2, y - s / 2, s, s, 2);
        ctx.fill();
        ctx.stroke();

        // label to the right
        ctx.font = `600 13px Inter, ui-sans-serif`;
        ctx.fillStyle = dim
          ? "rgba(161,161,170,0.4)"
          : "rgba(244,244,245,0.96)";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, x + 11, y);
      } else {
        // File node — circle + label
        if (isHover || isSelected) {
          ctx.shadowColor = hexToRgba(baseColor, 0.6);
          ctx.shadowBlur = 14;
        }
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.lineWidth = isSelected ? 2.2 : isHover ? 1.8 : 1.2;
        ctx.strokeStyle = isSelected
          ? "rgba(255,255,255,0.95)"
          : isHover
            ? "rgba(255,255,255,0.7)"
            : "rgba(255,255,255,0.32)";
        ctx.stroke();

        // coupling indicator dot — high coupling badge
        if (node.coupling_score >= 60) {
          ctx.beginPath();
          ctx.arc(x + r * 0.75, y - r * 0.75, 3, 0, 2 * Math.PI);
          ctx.fillStyle = "#f43f5e";
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(0,0,0,0.6)";
          ctx.stroke();
        }

        // label
        const labelSize = 13;
        ctx.font = `600 ${labelSize}px Inter, ui-sans-serif`;
        ctx.fillStyle = dim
          ? "rgba(161,161,170,0.45)"
          : "rgba(250,250,252,0.98)";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        const labelX = x + r + 10;
        // Truncate label if too wide to keep alignment clean
        let text = node.label;
        const maxPx = LAYOUT.COLUMN_WIDTH * 0.65;
        if (ctx.measureText(text).width > maxPx) {
          while (text.length > 4 && ctx.measureText(text + "…").width > maxPx) {
            text = text.slice(0, -1);
          }
          text += "…";
        }
        ctx.fillText(text, labelX, y);
      }

      ctx.restore();
      void globalScale;
    },
    [nodeRadius, hoverNode, selectedNode, isDimmed, viewMode],
  );

  const linkColor = useCallback(
    (link: FGLink) => {
      const sId = typeof link.source === "object" ? link.source.id : link.source;
      const tId = typeof link.target === "object" ? link.target.id : link.target;
      const sNode = graphData.nodes.find((n) => n.id === sId);
      const tNode = graphData.nodes.find((n) => n.id === tId);
      const dim = (sNode && isDimmed(sNode)) || (tNode && isDimmed(tNode));
      const onPath = focused && (sId === focused.id || tId === focused.id);
      if (dim) return "rgba(120,130,150,0.05)";
      if (onPath) return "rgba(255,255,255,0.85)";
      // Use the source module color so flows are visually traceable
      const srcModule = sNode?.module;
      if (srcModule) {
        const c = MODULES[srcModule].color;
        return link.type === "contains"
          ? hexToRgba(c, 0.35)
          : hexToRgba(c, 0.42);
      }
      if (link.type === "contains") return "rgba(180,180,200,0.28)";
      return "rgba(180,180,200,0.22)";
    },
    [graphData.nodes, isDimmed, focused],
  );

  const linkWidth = useCallback(
    (link: FGLink) => {
      const sId = typeof link.source === "object" ? link.source.id : link.source;
      const tId = typeof link.target === "object" ? link.target.id : link.target;
      const onPath = focused && (sId === focused.id || tId === focused.id);
      if (link.type === "contains") return onPath ? 1.6 : 1.1;
      const fc = link.fileCount || 1;
      const base = 1.2 + Math.min(3.5, Math.log2(fc + 1) * 0.9);
      return onPath ? base + 1.6 : base;
    },
    [focused],
  );

  /* interactions */
  const handleClusterToggle = (mod: ModuleId) => {
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  };

  const focusNode = useCallback(
    (n: FGNode | string) => {
      const id = typeof n === "string" ? n : n.id;
      const target = graphData.nodes.find((x) => x.id === id);
      if (!target) return;
      setSelectedNode(target);
      if (fgRef.current && target.x != null && target.y != null) {
        fgRef.current.centerAt(target.x, target.y, 320);
        fgRef.current.zoom(1.6, 320);
      }
    },
    [graphData.nodes],
  );

  const onNodeClick = (n: FGNode) => {
    if (n.kind === "cluster" && viewMode !== "folders") {
      handleClusterToggle(n.module);
      return;
    }
    focusNode(n);
  };

  const handleResetView = () => fgRef.current?.zoomToFit(500, 60);
  const handleZoomIn = () => {
    if (!fgRef.current) return;
    const z = fgRef.current.zoom();
    fgRef.current.zoom(Math.min(8, z * 1.3), 220);
  };
  const handleZoomOut = () => {
    if (!fgRef.current) return;
    const z = fgRef.current.zoom();
    fgRef.current.zoom(Math.max(0.2, z * 0.77), 220);
  };

  const handleExportPng = () => {
    if (!fgRef.current) return;
    const canvas =
      fgRef.current.canvas?.() ||
      containerRef.current?.querySelector("canvas");
    const node: HTMLCanvasElement | null =
      canvas instanceof HTMLCanvasElement ? canvas : null;
    if (!node) return;
    const link = document.createElement("a");
    link.download = `knowledge-graph-${repoId}.png`;
    link.href = node.toDataURL("image/png");
    link.click();
  };

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inField =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable;
      if (e.key === "Escape") {
        if (showShortcuts) setShowShortcuts(false);
        else if (selectedNode) setSelectedNode(null);
        return;
      }
      if (inField) return;
      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key.toLowerCase() === "r") handleResetView();
      else if (e.key === "+" || e.key === "=") handleZoomIn();
      else if (e.key === "-" || e.key === "_") handleZoomOut();
      else if (e.key === "?") setShowShortcuts((v) => !v);
      else if (e.key.toLowerCase() === "m") setShowMinimap((v) => !v);
      else if (e.key === "1") setViewMode("architecture");
      else if (e.key === "2") setViewMode("dependencies");
      else if (e.key === "3") setViewMode("folders");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedNode, showShortcuts]);

  /* panel data */
  const incoming = useMemo(() => {
    if (!selectedNode || !data?.edges) return [] as RawEdge[];
    return data.edges.filter((e) => e.target === selectedNode.id);
  }, [selectedNode, data]);

  const outgoing = useMemo(() => {
    if (!selectedNode || !data?.edges) return [] as RawEdge[];
    return data.edges.filter((e) => e.source === selectedNode.id);
  }, [selectedNode, data]);

  const githubUrl = useMemo(() => {
    if (!selectedNode || selectedNode.kind !== "file" || !data?.repo)
      return null;
    return `https://github.com/${data.repo.fullName}/blob/HEAD/${selectedNode.path}`;
  }, [selectedNode, data]);

  /* status guards */
  if (loading) return <Status label="Loading knowledge graph" tone="neutral" />;
  if (error)
    return (
      <Status label={error} tone="error" backHref="/dashboard/repos" backLabel="Back to repositories" />
    );
  if (data?.status === "not_indexed")
    return (
      <Status
        label="No codebase index found"
        sub="Run “Index Codebase” on the Repositories page to enable the knowledge graph."
        backHref="/dashboard/repos"
        backLabel="Go to Repositories"
      />
    );
  if (data?.status === "indexing")
    return (
      <Status
        label="Codebase is being indexed"
        sub="This page will be available once indexing finishes."
        tone="indexing"
      />
    );

  const fileCount = graphData.nodes.filter((n) => n.kind === "file").length;
  const clusterCount = graphData.nodes.filter((n) => n.kind === "cluster").length;

  return (
    <div
      className="fixed inset-0 bg-background text-foreground overflow-hidden"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      <SubtleGrid />

      {/* Architecture column headers */}
      {viewMode !== "folders" && (
        <ArchitectureColumns
          presentModules={presentModules.filter((m) => !hiddenModules.has(m))}
          sidebarCollapsed={sidebarCollapsed}
        />
      )}

      {/* Top bar */}
      <div
        className="absolute top-2 left-2 right-2 z-30 h-12 clay-sm flex items-center px-3 gap-2"
        style={{ borderRadius: 16 }}
      >
        <Link
          to="/dashboard/repos"
          className="px-2.5 py-1.5 rounded-xl hover:bg-white/[0.04] text-xs flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
        <div className="h-4 w-px bg-white/10" />
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className={`p-1.5 rounded-xl transition-all ${
            sidebarCollapsed
              ? "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              : "clay-pressed text-foreground"
          }`}
          title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar (full-screen graph)"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftClose className="w-3.5 h-3.5" />
          )}
        </button>
        <div className="h-4 w-px bg-white/10" />
        {data?.repo?.fullName && (
          <div className="text-[13px] font-medium text-foreground flex items-center gap-2 min-w-0">
            <GitBranch className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="truncate">{data.repo.fullName}</span>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-0.5 clay-pill px-1 py-0.5">
          <ViewBtn
            icon={<Layers className="w-3.5 h-3.5" />}
            label="Architecture"
            active={viewMode === "architecture"}
            onClick={() => setViewMode("architecture")}
          />
          <ViewBtn
            icon={<Workflow className="w-3.5 h-3.5" />}
            label="Dependencies"
            active={viewMode === "dependencies"}
            onClick={() => setViewMode("dependencies")}
          />
          <ViewBtn
            icon={<FolderTree className="w-3.5 h-3.5" />}
            label="Folders"
            active={viewMode === "folders"}
            onClick={() => setViewMode("folders")}
          />
        </div>

        <div className="flex-1" />

        <div className="text-[11px] text-muted-foreground flex items-center gap-2 font-mono tabular-nums">
          <span className="clay-pill px-2 py-1 flex items-center gap-1.5 text-foreground">
            <FileCode2 className="w-3 h-3 text-primary" />
            {fileCount}
          </span>
          {clusterCount > 0 && (
            <span className="clay-pill px-2 py-1 flex items-center gap-1.5 text-foreground">
              <Layers className="w-3 h-3 text-secondary" />
              {clusterCount}
            </span>
          )}
          <span className="clay-pill px-2 py-1 text-foreground">
            {graphData.links.length} edges
          </span>
        </div>
      </div>

      {/* Left sidebar */}
      {!sidebarCollapsed && (
      <aside
        className="absolute top-16 left-2 bottom-2 w-64 z-20 clay-lg flex flex-col overflow-hidden"
        style={{ borderRadius: 20 }}
      >
        <div className="p-3 border-b border-white/[0.04]">
          <div className="clay-pressed flex items-center gap-2 px-3 py-2 transition-all">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files, modules…"
              className="flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground text-foreground"
            />
            <kbd className="clay-pill text-[9px] text-muted-foreground px-1.5 py-0.5">
              /
            </kbd>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                Modules
              </p>
              {viewMode !== "folders" && (
                <button
                  onClick={() => setExpandedClusters(new Set())}
                  className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-white/[0.04]"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="space-y-1">
              {presentModules.map((m) => {
                const cfg = MODULES[m];
                const hidden = hiddenModules.has(m);
                const expanded = expandedClusters.has(m);
                return (
                  <div
                    key={m}
                    className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-all ${
                      hidden
                        ? "opacity-50"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setHiddenModules((prev) => {
                          const n = new Set(prev);
                          if (n.has(m)) n.delete(m);
                          else n.add(m);
                          return n;
                        })
                      }
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      title={hidden ? "Show" : "Hide"}
                    >
                      {hidden ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: cfg.color,
                        boxShadow: `0 0 6px ${hexToRgba(cfg.color, 0.6)}`,
                      }}
                    />
                    <cfg.Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span
                      className={`text-[12px] flex-1 truncate ${
                        hidden ? "text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {cfg.label}
                    </span>
                    {viewMode !== "folders" && !hidden && (
                      <button
                        onClick={() => handleClusterToggle(m)}
                        className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5 opacity-0 group-hover:opacity-100"
                      >
                        {expanded ? "Collapse" : "Expand"}
                        <ChevronRight
                          className={`w-3 h-3 transition-transform ${
                            expanded ? "rotate-90" : ""
                          }`}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {selectedNode && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 px-1">
                Selection
              </p>
              <div className="clay-pressed px-3 py-2">
                <p className="text-[12px] font-semibold text-foreground truncate">
                  {selectedNode.label}
                </p>
                <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                  {selectedNode.path}
                </p>
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2 px-1">
              Legend
            </p>
            <div className="clay-pressed p-2.5 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-foreground">Node size</span>
                <span className="text-muted-foreground">Importance</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Edge width</span>
                <span className="text-muted-foreground">Strength</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground">Red dot</span>
                <span className="text-muted-foreground">High coupling</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
      )}

      {/* Canvas area */}
      <div
        ref={containerRef}
        className={`absolute ${sidebarCollapsed ? "left-2" : "left-[17rem]"} right-2 bottom-2 ${
          viewMode === "folders" ? "top-16" : "top-[7rem]"
        } clay-pressed overflow-hidden`}
        style={{ borderRadius: 20 }}
      >
        {graphData.nodes.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
            No graph data available.
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            width={size.w}
            height={size.h}
            graphData={graphData}
            backgroundColor="rgba(0,0,0,0)"
            nodeRelSize={1}
            nodeVal={(n: any) => Math.pow(nodeRadius(n), 2) / 4}
            nodeCanvasObject={drawNode as any}
            nodePointerAreaPaint={(node: any, color, ctx) => {
              if (
                node.kind === "cluster" &&
                viewMode !== "folders"
              ) {
                const w = LAYOUT.COLUMN_WIDTH - 60;
                const h = LAYOUT.CLUSTER_ROW_HEIGHT - 14;
                ctx.fillStyle = color;
                ctx.fillRect(node.x - w / 2, node.y - h / 2, w, h);
              } else {
                const r = nodeRadius(node) + 4;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                ctx.fill();
              }
            }}
            linkColor={linkColor as any}
            linkWidth={linkWidth as any}
            linkDirectionalArrowLength={(l: any) =>
              l.type === "contains" ? 0 : 7
            }
            linkDirectionalArrowRelPos={0.97}
            linkDirectionalArrowColor={linkColor as any}
            cooldownTicks={0}
            warmupTicks={0}
            d3AlphaMin={1}
            enableNodeDrag={false}
            onNodeHover={(n: any) => {
              setHoverNode(n || null);
              if (containerRef.current) {
                containerRef.current.style.cursor = n ? "pointer" : "default";
              }
            }}
            onNodeClick={(n: any) => onNodeClick(n)}
            onBackgroundClick={() => setSelectedNode(null)}
          />
        )}
      </div>

      {/* Hover tooltip */}
      {hoverNode && (
        <div
          className="pointer-events-none fixed z-40 clay-sm px-3 py-2 text-[11px]"
          style={{
            left: Math.min(mousePos.x + 14, window.innerWidth - 296),
            top: Math.min(mousePos.y + 14, window.innerHeight - 200),
            maxWidth: 280,
            borderRadius: 14,
          }}
        >
          <div className="flex items-center gap-1.5 font-semibold text-foreground">
            {hoverNode.kind === "cluster" ? (
              <Layers
                className="w-3 h-3"
                style={{ color: MODULES[hoverNode.module].color }}
              />
            ) : (
              <FileCode2
                className="w-3 h-3"
                style={{ color: MODULES[hoverNode.module].color }}
              />
            )}
            <span className="truncate">{hoverNode.label}</span>
          </div>
          <div className="text-muted-foreground text-[10px] mt-0.5 break-all font-mono">
            {hoverNode.kind === "cluster" && viewMode !== "folders"
              ? `${MODULES[hoverNode.module].label} · ${hoverNode.childCount} files`
              : hoverNode.path}
          </div>
          {hoverNode.kind === "file" && (
            <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-foreground">
              <Row k="Module" v={MODULES[hoverNode.module].label} />
              <Row
                k="Lang"
                v={
                  LANG_LABELS[hoverNode.language || "other"] ||
                  hoverNode.language ||
                  "—"
                }
              />
              <Row k="Deps" v={`${hoverNode.importance}`} />
              <Row
                k="Coupling"
                v={`${hoverNode.coupling_score}%`}
                tone={
                  hoverNode.coupling_score >= 60
                    ? "red"
                    : hoverNode.coupling_score >= 30
                      ? "amber"
                      : "neutral"
                }
              />
            </div>
          )}
          <div className="mt-1.5 text-[10px] text-muted-foreground border-t border-white/10 pt-1.5">
            {hoverNode.kind === "cluster" && viewMode !== "folders"
              ? "Click to expand cluster"
              : "Click to inspect"}
          </div>
        </div>
      )}

      {/* Floating zoom toolbar */}
      <div
        className="absolute bottom-6 right-6 z-20 flex items-center gap-0.5 clay-sm p-1"
        style={{ borderRadius: 14 }}
      >
        <ToolbarBtn onClick={handleZoomIn} title="Zoom in">
          <ZoomIn className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleZoomOut} title="Zoom out">
          <ZoomOut className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleResetView} title="Fit (R)">
          <Maximize2 className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <span className="w-px h-5 bg-white/10 mx-1" />
        <ToolbarBtn
          onClick={() => setShowMinimap((v) => !v)}
          title="Minimap (M)"
          active={showMinimap}
        >
          <MapIcon className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn onClick={handleExportPng} title="Export PNG">
          <Download className="w-3.5 h-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => setShowShortcuts((v) => !v)}
          title="Shortcuts (?)"
          active={showShortcuts}
        >
          <Keyboard className="w-3.5 h-3.5" />
        </ToolbarBtn>
      </div>

      {/* Minimap */}
      {showMinimap && graphData.nodes.length > 0 && (
        <div
          className="absolute bottom-6 right-[calc(1.5rem+288px)] z-20 clay-sm p-2"
          style={{ width: 208, height: 148, borderRadius: 16 }}
        >
          <Minimap
            nodes={graphData.nodes}
            onClick={(x, y) => fgRef.current?.centerAt(x, y, 320)}
          />
        </div>
      )}

      {/* Shortcuts */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="clay-lg p-6 w-[440px]"
            style={{ borderRadius: 24 }}
          >
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="clay-icon w-8 h-8 flex items-center justify-center bg-primary/10 text-primary">
                  <Keyboard className="w-4 h-4" />
                </div>
                <p className="text-[14px] font-semibold text-foreground">Keyboard shortcuts</p>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <ShortcutRow keys={["/"]} label="Focus search" />
              <ShortcutRow keys={["Esc"]} label="Close panel / dialog" />
              <ShortcutRow keys={["R"]} label="Fit graph" />
              <ShortcutRow keys={["+", "-"]} label="Zoom in / out" />
              <ShortcutRow keys={["M"]} label="Toggle minimap" />
              <ShortcutRow keys={["?"]} label="Show this dialog" />
              <ShortcutRow
                keys={["1", "2", "3"]}
                label="Architecture / Dependencies / Folders"
              />
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedNode && (
        <div
          className="absolute top-16 right-2 bottom-2 w-[380px] z-30 clay-lg flex flex-col overflow-hidden"
          style={{
            borderRadius: 20,
            transition: "transform 180ms ease-out",
          }}
        >
          <div className="flex items-start justify-between px-4 py-3 border-b border-white/[0.04]">
            <div className="min-w-0 flex items-start gap-2.5">
              <div
                className="clay-icon w-9 h-9 flex items-center justify-center flex-shrink-0"
                style={{
                  background: `linear-gradient(145deg, ${hexToRgba(MODULES[selectedNode.module].color, 0.18)}, ${hexToRgba(MODULES[selectedNode.module].color, 0.08)})`,
                }}
              >
                {selectedNode.kind === "cluster" ? (
                  <Layers
                    className="w-4 h-4"
                    style={{ color: MODULES[selectedNode.module].color }}
                  />
                ) : (
                  <FileCode2
                    className="w-4 h-4"
                    style={{ color: MODULES[selectedNode.module].color }}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold truncate text-foreground">
                  {selectedNode.label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 break-all font-mono">
                  {selectedNode.kind === "cluster" && viewMode !== "folders"
                    ? `${MODULES[selectedNode.module].label} · ${selectedNode.childCount} files`
                    : selectedNode.path}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-muted-foreground hover:text-foreground ml-2 p-1.5 rounded-lg hover:bg-white/[0.04] transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3 overflow-y-auto flex-1 text-xs">
            {selectedNode.kind === "cluster" && viewMode !== "folders" ? (
              <>
                <Section
                  id="metrics"
                  title="Overview"
                  open={accordion.metrics}
                  onToggle={() =>
                    setAccordion((p) => ({ ...p, metrics: !p.metrics }))
                  }
                >
                  <Grid>
                    <Stat label="Module" value={MODULES[selectedNode.module].label} />
                    <Stat label="Files" value={`${selectedNode.childCount}`} />
                    <Stat
                      label="Total deps"
                      value={`${selectedNode.importance}`}
                    />
                    <Stat
                      label="Layer"
                      value={`${MODULES[selectedNode.module].layer} · ${LAYER_LABELS[MODULES[selectedNode.module].layer]}`}
                    />
                  </Grid>
                </Section>
                <button
                  onClick={() => handleClusterToggle(selectedNode.module)}
                  className="clay-btn clay-btn-ghost w-full px-3 py-2 text-[12px] flex items-center justify-center gap-1.5"
                >
                  {expandedClusters.has(selectedNode.module)
                    ? "Collapse cluster"
                    : "Expand to view files"}
                </button>
              </>
            ) : (
              <>
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="clay-btn clay-btn-ghost w-full px-3 py-2 text-[12px] flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on GitHub
                  </a>
                )}

                <Section
                  id="metrics"
                  title="Metrics"
                  open={accordion.metrics}
                  onToggle={() =>
                    setAccordion((p) => ({ ...p, metrics: !p.metrics }))
                  }
                >
                  <Grid>
                    <Stat label="Module" value={MODULES[selectedNode.module].label} />
                    <Stat
                      label="Language"
                      value={
                        LANG_LABELS[selectedNode.language || "other"] ||
                        selectedNode.language ||
                        "—"
                      }
                    />
                    <Stat
                      label="Importance"
                      value={`${selectedNode.importance} deps`}
                    />
                    <Stat
                      label="Coupling"
                      value={`${selectedNode.coupling_score}%`}
                      tone={
                        selectedNode.coupling_score >= 60
                          ? "red"
                          : selectedNode.coupling_score >= 30
                            ? "amber"
                            : "neutral"
                      }
                    />
                  </Grid>
                </Section>

                <Section
                  id="imports"
                  title={`Depends on · ${outgoing.length}`}
                  icon={<Hash className="w-3 h-3 text-muted-foreground" />}
                  open={accordion.imports}
                  onToggle={() =>
                    setAccordion((p) => ({ ...p, imports: !p.imports }))
                  }
                >
                  <FileLinkList
                    edges={outgoing}
                    fieldToShow="target"
                    moduleByFileId={moduleByFileId}
                    onSelect={focusNode}
                  />
                </Section>

                <Section
                  id="importedBy"
                  title={`Used by · ${incoming.length}`}
                  icon={<Hash className="w-3 h-3 text-muted-foreground" />}
                  open={accordion.importedBy}
                  onToggle={() =>
                    setAccordion((p) => ({
                      ...p,
                      importedBy: !p.importedBy,
                    }))
                  }
                >
                  <FileLinkList
                    edges={incoming}
                    fieldToShow="source"
                    moduleByFileId={moduleByFileId}
                    onSelect={focusNode}
                  />
                </Section>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Architecture column header rail
 * ──────────────────────────────────────────────────────────────── */

function ArchitectureColumns({
  presentModules,
  sidebarCollapsed,
}: {
  presentModules: ModuleId[];
  sidebarCollapsed?: boolean;
}) {
  const leftClass = sidebarCollapsed ? "left-2" : "left-[17rem]";
  const layers = useMemo(() => {
    const m = new Map<number, ModuleId[]>();
    for (const id of presentModules) {
      const layer = MODULES[id].layer;
      if (!m.has(layer)) m.set(layer, []);
      m.get(layer)!.push(id);
    }
    return Array.from(m.entries()).sort((a, b) => a[0] - b[0]);
  }, [presentModules]);

  return (
    <>
      {/* Background bands behind the canvas */}
      <div
        className={`absolute top-[7rem] ${leftClass} right-2 bottom-2 z-0 flex pointer-events-none overflow-hidden`}
        style={{ borderRadius: 20 }}
      >
        {layers.map(([layer, mods]) => {
          const accent = MODULES[mods[0]].color;
          return (
            <div
              key={`band-${layer}`}
              className="flex-1 border-r border-white/[0.04] last:border-r-0 relative"
              style={{
                background: `linear-gradient(180deg, ${hexToRgba(accent, 0.06)} 0%, ${hexToRgba(accent, 0.015)} 100%)`,
              }}
            />
          );
        })}
      </div>

      {/* Header rail */}
      <div
        className={`absolute top-16 ${leftClass} right-2 h-12 z-10 clay-sm flex pointer-events-none overflow-hidden`}
        style={{ borderRadius: 16 }}
      >
        {layers.map(([layer, mods], idx) => {
          const accent = MODULES[mods[0]].color;
          return (
            <div
              key={layer}
              className={`flex-1 px-4 flex flex-col justify-center gap-0.5 relative ${
                idx > 0 ? "border-l border-white/[0.04]" : ""
              }`}
            >
              <div
                className="absolute top-0 left-3 right-3 h-0.5 rounded-full"
                style={{
                  background: accent,
                  boxShadow: `0 0 8px ${hexToRgba(accent, 0.5)}`,
                }}
              />
              <div className="flex items-center gap-2">
                <span
                  className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{
                    background: hexToRgba(accent, 0.18),
                    color: accent,
                    border: `1px solid ${hexToRgba(accent, 0.3)}`,
                  }}
                >
                  L{layer}
                </span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-foreground">
                  {LAYER_LABELS[layer]}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground truncate">
                {mods.map((m) => MODULES[m].label).join(" · ")}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Sub-components
 * ──────────────────────────────────────────────────────────────── */

function SubtleGrid() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, rgba(129, 140, 248, 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 90%, rgba(45, 212, 191, 0.04) 0%, transparent 50%)",
        }}
      />
    </>
  );
}

function Status({
  label,
  sub,
  tone = "neutral",
  backHref,
  backLabel,
}: {
  label: string;
  sub?: string;
  tone?: "neutral" | "error" | "indexing";
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4 p-6 relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(129, 140, 248, 0.08) 0%, transparent 50%)",
        }}
      />
      <div
        className="clay-lg flex flex-col items-center gap-4 px-8 py-8 max-w-md relative"
        style={{ borderRadius: 24 }}
      >
        {tone === "error" ? (
          <div className="clay-icon w-12 h-12 flex items-center justify-center bg-destructive/10 text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
        ) : (
          <div className="clay-icon w-12 h-12 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20 border-t-primary animate-spin" />
          </div>
        )}
        <p
          className={`text-[14px] font-semibold text-center ${
            tone === "error" ? "text-destructive" : "text-foreground"
          }`}
        >
          {label}
        </p>
        {sub && (
          <p className="text-[11px] text-muted-foreground max-w-md text-center leading-relaxed">
            {sub}
          </p>
        )}
        {backHref && (
          <Link
            to={backHref}
            className="clay-btn clay-btn-ghost px-4 py-2 text-[12px] mt-1"
          >
            {backLabel || "Back"}
          </Link>
        )}
      </div>
    </div>
  );
}

function ViewBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
        active
          ? "clay-pressed text-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ToolbarBtn({
  children,
  onClick,
  title,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
        active
          ? "clay-pressed text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
      }`}
    >
      {children}
    </button>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
      <span className="text-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="clay-pill px-2 py-0.5 text-[10px] font-mono text-foreground"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="clay-pressed overflow-hidden" style={{ borderRadius: 14 }}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wide">
            {title}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
            open ? "rotate-0" : "-rotate-90"
          }`}
        />
        <span className="hidden">{id}</span>
      </button>
      {open && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

function Row({
  k,
  v,
  tone = "neutral",
}: {
  k: string;
  v: string;
  tone?: "neutral" | "red" | "amber";
}) {
  const cls =
    tone === "red"
      ? "text-destructive"
      : tone === "amber"
        ? "text-accent"
        : "text-foreground";
  return (
    <div className="flex items-center justify-between gap-2 text-[10px]">
      <span className="text-muted-foreground">{k}</span>
      <span className={`font-medium ${cls} font-mono tabular-nums`}>{v}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "red" | "amber";
}) {
  const cls =
    tone === "red"
      ? "text-destructive"
      : tone === "amber"
        ? "text-accent"
        : "text-foreground";
  return (
    <div className="clay-pressed px-2.5 py-1.5" style={{ borderRadius: 12 }}>
      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</p>
      <p className={`text-[12px] font-semibold ${cls} truncate font-mono tabular-nums`}>{value}</p>
    </div>
  );
}

function FileLinkList({
  edges,
  fieldToShow,
  moduleByFileId,
  onSelect,
}: {
  edges: RawEdge[];
  fieldToShow: "source" | "target";
  moduleByFileId: Map<string, ModuleId>;
  onSelect: (id: string) => void;
}) {
  if (edges.length === 0) {
    return <p className="text-[11px] text-muted-foreground px-1 py-1">None</p>;
  }
  return (
    <div className="space-y-0.5 max-h-52 overflow-y-auto">
      {edges.map((e, i) => {
        const id = e[fieldToShow];
        const filename = id.split("/").pop() || id;
        const mod = moduleByFileId.get(id) || "other";
        const cfg = MODULES[mod];
        return (
          <button
            key={`${id}-${i}`}
            onClick={() => onSelect(id)}
            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/[0.04] flex items-center gap-2 transition-all"
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: cfg.color,
                boxShadow: `0 0 4px ${hexToRgba(cfg.color, 0.5)}`,
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-foreground truncate">
                {filename}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-mono">
                {id}
              </p>
            </div>
            <span className="clay-pill text-[9px] uppercase text-muted-foreground flex-shrink-0 font-mono px-1.5 py-0.5">
              {e.type}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Minimap({
  nodes,
  onClick,
}: {
  nodes: FGNode[];
  onClick: (x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boundsRef = useRef({ minX: 0, minY: 0, maxX: 1, maxY: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const positioned = nodes.filter(
      (n) => typeof n.x === "number" && typeof n.y === "number",
    );
    if (positioned.length === 0) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of positioned) {
      if (n.x! < minX) minX = n.x!;
      if (n.x! > maxX) maxX = n.x!;
      if (n.y! < minY) minY = n.y!;
      if (n.y! > maxY) maxY = n.y!;
    }
    const pad = 16;
    minX -= pad;
    minY -= pad;
    maxX += pad;
    maxY += pad;
    boundsRef.current = { minX, minY, maxX, maxY };
    const dx = maxX - minX;
    const dy = maxY - minY;
    const s = Math.min(w / dx, h / dy);
    const ox = (w - dx * s) / 2;
    const oy = (h - dy * s) / 2;

    for (const n of positioned) {
      const px = ox + (n.x! - minX) * s;
      const py = oy + (n.y! - minY) * s;
      ctx.beginPath();
      ctx.arc(px, py, n.kind === "cluster" ? 2.6 : 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = MODULES[n.module].color;
      ctx.fill();
    }
  }, [nodes]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const { minX, minY, maxX, maxY } = boundsRef.current;
    onClick(minX + fx * (maxX - minX), minY + fy * (maxY - minY));
  };

  return (
    <canvas
      ref={canvasRef}
      width={192}
      height={132}
      onClick={handleClick}
      className="w-full h-full rounded cursor-pointer"
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
