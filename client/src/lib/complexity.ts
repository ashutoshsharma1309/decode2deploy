/**
 * Complexity Analysis — types, utilities, mock data.
 *
 * All metrics here are the canonical contract for the Complexity Analysis
 * feature. Components and charts should import types from this module and
 * never reshape mock data inline.
 */

export type ModuleId =
  | "frontend"
  | "backend"
  | "services"
  | "tests"
  | "shared"
  | "other";

export type RiskLevel = "low" | "medium" | "high";

export interface FileComplexity {
  path: string;
  module: ModuleId;
  cyclomaticComplexity: number;
  avgFunctionLength: number;
  nestingDepth: number;
  lineCount: number;
  churnCount: number;
  dependencies: number;
  /** ISO date of the last commit touching the file. */
  lastModified: string;
  /** Optional human-readable hints for the inspection modal. */
  hotspots?: string[];
}

export interface ComplexityTrendPoint {
  /** Short commit SHA (7 chars). */
  commitSha: string;
  date: string;
  avgComplexity: number;
  maxComplexity: number;
}

export interface RepoComplexity {
  repoFullName: string;
  /** 0–100. Higher is healthier. */
  overallScore: number;
  totalComplexFiles: number;
  avgComplexityPerFile: number;
  highestRiskModule: ModuleId;
  files: FileComplexity[];
  trend: ComplexityTrendPoint[];
}

/* ────────────────────────────────────────────────────────────
 *  Utilities
 * ──────────────────────────────────────────────────────────── */

const COMPLEXITY_THRESHOLDS = {
  low: 10,
  medium: 20,
} as const;

/** Classify cyclomatic complexity into a risk bucket. */
export function classifyComplexity(cyclomatic: number): RiskLevel {
  if (cyclomatic < COMPLEXITY_THRESHOLDS.low) return "low";
  if (cyclomatic < COMPLEXITY_THRESHOLDS.medium) return "medium";
  return "high";
}

/**
 * Compound risk score combining complexity, churn, nesting depth, and file
 * size. Returns 0–100 where higher = riskier. Files that change frequently
 * AND are structurally complex score the highest — the classic "hotspot".
 */
export function calculateRiskScore(file: FileComplexity): number {
  const complexityWeight = Math.min(file.cyclomaticComplexity / 40, 1) * 40;
  const churnWeight = Math.min(file.churnCount / 20, 1) * 25;
  const nestingWeight = Math.min(file.nestingDepth / 7, 1) * 20;
  const sizeWeight = Math.min(file.lineCount / 1000, 1) * 15;
  return Math.round(
    complexityWeight + churnWeight + nestingWeight + sizeWeight,
  );
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score < 35) return "low";
  if (score < 65) return "medium";
  return "high";
}

export function colorForRisk(risk: RiskLevel): string {
  switch (risk) {
    case "low":
      return "#4ade80";
    case "medium":
      return "#fbbf24";
    case "high":
      return "#f87171";
  }
}

export function colorForModule(m: ModuleId): string {
  switch (m) {
    case "frontend":
      return "#5d6bff";
    case "backend":
      return "#ff5fc8";
    case "services":
      return "#00d97f";
    case "tests":
      return "#ffd700";
    case "shared":
      return "#a78bfa";
    case "other":
      return "#8a7da0";
  }
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(Math.round(n));
}

export function formatScore(n: number): string {
  return n.toFixed(1);
}

/** Per-module averages used by the highest-risk-module summary card. */
export function summarizeByModule(
  files: FileComplexity[],
): { module: ModuleId; avgComplexity: number; fileCount: number }[] {
  const buckets = new Map<
    ModuleId,
    { sum: number; count: number }
  >();
  for (const f of files) {
    const b = buckets.get(f.module) || { sum: 0, count: 0 };
    b.sum += f.cyclomaticComplexity;
    b.count += 1;
    buckets.set(f.module, b);
  }
  return Array.from(buckets.entries()).map(([m, b]) => ({
    module: m,
    avgComplexity: b.sum / b.count,
    fileCount: b.count,
  }));
}

/** Distribution counts for the pie chart. */
export function distributionByRisk(
  files: FileComplexity[],
): { risk: RiskLevel; count: number }[] {
  const counts: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0 };
  for (const f of files) {
    counts[riskLevelFromScore(calculateRiskScore(f))]++;
  }
  return [
    { risk: "low", count: counts.low },
    { risk: "medium", count: counts.medium },
    { risk: "high", count: counts.high },
  ];
}

/* ────────────────────────────────────────────────────────────
 *  Mock data — realistic CodePulse repo
 * ──────────────────────────────────────────────────────────── */

const MOCK_FILES: FileComplexity[] = [
  {
    path: "server/src/agents/context/indexer.ts",
    module: "services",
    cyclomaticComplexity: 42,
    avgFunctionLength: 38,
    nestingDepth: 6,
    lineCount: 612,
    churnCount: 14,
    dependencies: 12,
    lastModified: "2026-05-16T18:24:00Z",
    hotspots: [
      "Deep nested AST traversal in extractDefinitions()",
      "Two 80-line switch statements for language detection",
    ],
  },
  {
    path: "server/src/jobs/context.job.ts",
    module: "services",
    cyclomaticComplexity: 31,
    avgFunctionLength: 28,
    nestingDepth: 5,
    lineCount: 489,
    churnCount: 9,
    dependencies: 8,
    lastModified: "2026-05-15T11:42:00Z",
  },
  {
    path: "client/src/pages/KnowledgeGraph.tsx",
    module: "frontend",
    cyclomaticComplexity: 28,
    avgFunctionLength: 24,
    nestingDepth: 4,
    lineCount: 542,
    churnCount: 11,
    dependencies: 6,
    lastModified: "2026-05-18T10:08:00Z",
    hotspots: [
      "useMemo recomputes graph on every search keystroke",
      "Three separate fallbacks for empty data",
    ],
  },
  {
    path: "server/src/controllers/repo.controller.ts",
    module: "backend",
    cyclomaticComplexity: 24,
    avgFunctionLength: 22,
    nestingDepth: 4,
    lineCount: 478,
    churnCount: 7,
    dependencies: 9,
    lastModified: "2026-05-12T09:15:00Z",
  },
  {
    path: "client/src/pages/RepoHealth.tsx",
    module: "frontend",
    cyclomaticComplexity: 22,
    avgFunctionLength: 26,
    nestingDepth: 5,
    lineCount: 412,
    churnCount: 5,
    dependencies: 7,
    lastModified: "2026-05-17T14:30:00Z",
  },
  {
    path: "server/src/controllers/webhook.controller.ts",
    module: "backend",
    cyclomaticComplexity: 21,
    avgFunctionLength: 32,
    nestingDepth: 4,
    lineCount: 296,
    churnCount: 8,
    dependencies: 5,
    lastModified: "2026-05-10T16:45:00Z",
  },
  {
    path: "server/src/services/healthScore.service.ts",
    module: "services",
    cyclomaticComplexity: 18,
    avgFunctionLength: 19,
    nestingDepth: 3,
    lineCount: 124,
    churnCount: 6,
    dependencies: 4,
    lastModified: "2026-05-13T08:22:00Z",
  },
  {
    path: "client/src/pages/CommitDiff.tsx",
    module: "frontend",
    cyclomaticComplexity: 17,
    avgFunctionLength: 21,
    nestingDepth: 4,
    lineCount: 320,
    churnCount: 3,
    dependencies: 4,
    lastModified: "2026-05-18T11:00:00Z",
  },
  {
    path: "server/src/agents/context/history.ts",
    module: "services",
    cyclomaticComplexity: 15,
    avgFunctionLength: 18,
    nestingDepth: 3,
    lineCount: 198,
    churnCount: 4,
    dependencies: 5,
    lastModified: "2026-05-09T12:00:00Z",
  },
  {
    path: "server/src/utils/github.ts",
    module: "shared",
    cyclomaticComplexity: 14,
    avgFunctionLength: 16,
    nestingDepth: 3,
    lineCount: 156,
    churnCount: 4,
    dependencies: 3,
    lastModified: "2026-05-08T15:00:00Z",
  },
  {
    path: "client/src/pages/Repos.tsx",
    module: "frontend",
    cyclomaticComplexity: 13,
    avgFunctionLength: 18,
    nestingDepth: 3,
    lineCount: 308,
    churnCount: 6,
    dependencies: 4,
    lastModified: "2026-05-17T19:00:00Z",
  },
  {
    path: "client/src/pages/Landing.tsx",
    module: "frontend",
    cyclomaticComplexity: 12,
    avgFunctionLength: 28,
    nestingDepth: 3,
    lineCount: 540,
    churnCount: 8,
    dependencies: 2,
    lastModified: "2026-05-18T13:00:00Z",
  },
  {
    path: "server/src/jobs/queue.ts",
    module: "services",
    cyclomaticComplexity: 9,
    avgFunctionLength: 14,
    nestingDepth: 2,
    lineCount: 80,
    churnCount: 3,
    dependencies: 2,
    lastModified: "2026-05-11T10:00:00Z",
  },
  {
    path: "client/src/components/ui/DashboardLayout.tsx",
    module: "frontend",
    cyclomaticComplexity: 9,
    avgFunctionLength: 12,
    nestingDepth: 3,
    lineCount: 192,
    churnCount: 5,
    dependencies: 3,
    lastModified: "2026-05-17T20:00:00Z",
  },
  {
    path: "server/src/controllers/graph.controller.ts",
    module: "backend",
    cyclomaticComplexity: 19,
    avgFunctionLength: 22,
    nestingDepth: 4,
    lineCount: 258,
    churnCount: 4,
    dependencies: 5,
    lastModified: "2026-05-14T17:00:00Z",
  },
  {
    path: "server/src/controllers/health.controller.ts",
    module: "backend",
    cyclomaticComplexity: 12,
    avgFunctionLength: 18,
    nestingDepth: 3,
    lineCount: 184,
    churnCount: 3,
    dependencies: 4,
    lastModified: "2026-05-13T13:00:00Z",
  },
  {
    path: "server/src/models/RepoContext.ts",
    module: "backend",
    cyclomaticComplexity: 7,
    avgFunctionLength: 0,
    nestingDepth: 1,
    lineCount: 95,
    churnCount: 2,
    dependencies: 1,
    lastModified: "2026-05-07T09:00:00Z",
  },
  {
    path: "server/src/models/Repo.ts",
    module: "backend",
    cyclomaticComplexity: 5,
    avgFunctionLength: 0,
    nestingDepth: 1,
    lineCount: 72,
    churnCount: 2,
    dependencies: 1,
    lastModified: "2026-05-06T08:00:00Z",
  },
  {
    path: "client/src/components/health/ScoreGauge.tsx",
    module: "frontend",
    cyclomaticComplexity: 6,
    avgFunctionLength: 14,
    nestingDepth: 2,
    lineCount: 88,
    churnCount: 3,
    dependencies: 2,
    lastModified: "2026-05-17T16:00:00Z",
  },
  {
    path: "client/src/components/health/SignalCard.tsx",
    module: "frontend",
    cyclomaticComplexity: 5,
    avgFunctionLength: 12,
    nestingDepth: 2,
    lineCount: 72,
    churnCount: 3,
    dependencies: 1,
    lastModified: "2026-05-17T16:30:00Z",
  },
  {
    path: "client/src/components/health/TrendChart.tsx",
    module: "frontend",
    cyclomaticComplexity: 7,
    avgFunctionLength: 18,
    nestingDepth: 3,
    lineCount: 96,
    churnCount: 2,
    dependencies: 2,
    lastModified: "2026-05-17T17:00:00Z",
  },
  {
    path: "client/src/api/axios.ts",
    module: "shared",
    cyclomaticComplexity: 11,
    avgFunctionLength: 16,
    nestingDepth: 3,
    lineCount: 92,
    churnCount: 1,
    dependencies: 1,
    lastModified: "2026-05-05T11:00:00Z",
  },
  {
    path: "client/src/context/AuthContext.tsx",
    module: "shared",
    cyclomaticComplexity: 8,
    avgFunctionLength: 14,
    nestingDepth: 2,
    lineCount: 118,
    churnCount: 2,
    dependencies: 2,
    lastModified: "2026-05-04T10:00:00Z",
  },
  {
    path: "client/src/hooks/useSocket.ts",
    module: "shared",
    cyclomaticComplexity: 9,
    avgFunctionLength: 16,
    nestingDepth: 3,
    lineCount: 132,
    churnCount: 2,
    dependencies: 1,
    lastModified: "2026-05-04T11:00:00Z",
  },
  {
    path: "server/src/middlewares/auth.ts",
    module: "backend",
    cyclomaticComplexity: 8,
    avgFunctionLength: 18,
    nestingDepth: 3,
    lineCount: 84,
    churnCount: 1,
    dependencies: 2,
    lastModified: "2026-05-03T09:00:00Z",
  },
  {
    path: "server/src/utils/encryption.ts",
    module: "shared",
    cyclomaticComplexity: 4,
    avgFunctionLength: 12,
    nestingDepth: 2,
    lineCount: 48,
    churnCount: 1,
    dependencies: 1,
    lastModified: "2026-05-02T08:00:00Z",
  },
  {
    path: "server/src/__tests__/health.api.test.ts",
    module: "tests",
    cyclomaticComplexity: 16,
    avgFunctionLength: 24,
    nestingDepth: 4,
    lineCount: 248,
    churnCount: 3,
    dependencies: 3,
    lastModified: "2026-05-13T20:00:00Z",
  },
  {
    path: "server/src/__tests__/healthScore.gini.test.ts",
    module: "tests",
    cyclomaticComplexity: 6,
    avgFunctionLength: 10,
    nestingDepth: 2,
    lineCount: 56,
    churnCount: 2,
    dependencies: 1,
    lastModified: "2026-05-13T20:30:00Z",
  },
  {
    path: "server/src/config/db.ts",
    module: "shared",
    cyclomaticComplexity: 6,
    avgFunctionLength: 14,
    nestingDepth: 2,
    lineCount: 58,
    churnCount: 1,
    dependencies: 1,
    lastModified: "2026-05-01T08:00:00Z",
  },
  {
    path: "server/src/config/socket.ts",
    module: "shared",
    cyclomaticComplexity: 5,
    avgFunctionLength: 12,
    nestingDepth: 2,
    lineCount: 52,
    churnCount: 1,
    dependencies: 1,
    lastModified: "2026-05-01T09:00:00Z",
  },
];

const MOCK_TREND: ComplexityTrendPoint[] = [
  { commitSha: "a1b2c3d", date: "2026-04-20", avgComplexity: 11.4, maxComplexity: 32 },
  { commitSha: "e4f5g6h", date: "2026-04-23", avgComplexity: 11.8, maxComplexity: 33 },
  { commitSha: "i7j8k9l", date: "2026-04-26", avgComplexity: 12.1, maxComplexity: 35 },
  { commitSha: "m0n1o2p", date: "2026-04-29", avgComplexity: 12.5, maxComplexity: 36 },
  { commitSha: "q3r4s5t", date: "2026-05-02", avgComplexity: 12.9, maxComplexity: 38 },
  { commitSha: "u6v7w8x", date: "2026-05-05", avgComplexity: 13.3, maxComplexity: 39 },
  { commitSha: "y9z0a1b", date: "2026-05-08", avgComplexity: 13.0, maxComplexity: 39 },
  { commitSha: "c2d3e4f", date: "2026-05-11", avgComplexity: 13.4, maxComplexity: 40 },
  { commitSha: "g5h6i7j", date: "2026-05-14", avgComplexity: 13.7, maxComplexity: 41 },
  { commitSha: "k8l9m0n", date: "2026-05-17", avgComplexity: 13.9, maxComplexity: 42 },
];

export const MOCK_REPO_COMPLEXITY: RepoComplexity = (() => {
  const overallScore = (() => {
    const avgC =
      MOCK_FILES.reduce((s, f) => s + f.cyclomaticComplexity, 0) /
      MOCK_FILES.length;
    // Map avg complexity → score: 0 complexity → 100, 30 → 0.
    return Math.round(Math.max(0, Math.min(100, 100 - (avgC / 30) * 100)));
  })();
  const totalComplexFiles = MOCK_FILES.filter(
    (f) => f.cyclomaticComplexity >= COMPLEXITY_THRESHOLDS.medium,
  ).length;
  const avgComplexityPerFile =
    MOCK_FILES.reduce((s, f) => s + f.cyclomaticComplexity, 0) /
    MOCK_FILES.length;
  const summary = summarizeByModule(MOCK_FILES);
  const highestRiskModule = summary.sort(
    (a, b) => b.avgComplexity - a.avgComplexity,
  )[0].module;

  return {
    repoFullName: "ashutoshsharma1309/meow",
    overallScore,
    totalComplexFiles,
    avgComplexityPerFile,
    highestRiskModule,
    files: MOCK_FILES,
    trend: MOCK_TREND,
  };
})();

/** Mock async loader so swapping to a real API later is a one-line change. */
export function fetchRepoComplexity(): Promise<RepoComplexity> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(MOCK_REPO_COMPLEXITY), 600),
  );
}
