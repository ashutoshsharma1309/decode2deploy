type SignalType = "coupling" | "churnRisk" | "debt" | "confidence";

const SIGNAL_META: Record<
  SignalType,
  { label: string; description: (v: any) => string }
> = {
  coupling: {
    label: "COUPLING",
    description: (v) =>
      v.normalized < 0.2
        ? "MODULAR — DEPS WELL DISTRIBUTED"
        : v.normalized < 0.5
          ? "PARTIAL CENTRALIZATION"
          : "HIGH COUPLING — GOD-FILES DETECTED",
  },
  churnRisk: {
    label: "CHURN RISK",
    description: (v) =>
      v.hotFileCount === 0
        ? "NO BLAST-RADIUS FILES"
        : `${v.hotFileCount} HIGH-CENTRALITY FILE${
            v.hotFileCount > 1 ? "S" : ""
          } CHANGING FREQUENTLY`,
  },
  debt: {
    label: "FINDINGS DEBT",
    description: () => "AGENT FINDINGS PIPELINE OFFLINE",
  },
  confidence: {
    label: "CONFIDENCE",
    description: (v) =>
      `${Math.round(v.rollingAvg)}/100 ROLLING SIGNAL`,
  },
};

interface Props {
  signal: SignalType;
  value: any;
}

export function SignalCard({ signal, value }: Props) {
  const meta = SIGNAL_META[signal];
  const pct = Math.round(value.normalized * 100);
  const score =
    signal === "confidence" ? pct : 100 - pct;
  const color =
    score >= 75
      ? "var(--neon-lime)"
      : score >= 50
        ? "var(--neon-amber)"
        : "var(--neon-red)";

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="label-mono">{meta.label}</span>
        <span
          className="heading-display text-2xl"
          style={{ color, textShadow: "0 0 8px currentColor" }}
        >
          {score}
        </span>
      </div>
      <div
        className="w-full h-1 mb-3 relative"
        style={{ background: "rgba(0, 240, 255, 0.08)" }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all"
          style={{
            width: `${score}%`,
            background: color,
            boxShadow: `0 0 8px ${color}`,
          }}
        />
      </div>
      <p
        className="text-[10px] leading-relaxed"
        style={{
          color: "var(--text-secondary)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {"> "}
        {meta.description(value)}
      </p>
    </div>
  );
}
