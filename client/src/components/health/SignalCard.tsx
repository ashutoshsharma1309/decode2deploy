type SignalType = "coupling" | "churnRisk" | "debt" | "confidence";

const SIGNAL_META: Record<
  SignalType,
  { label: string; description: (v: any) => string }
> = {
  coupling: {
    label: "Coupling",
    description: (v) =>
      v.normalized < 0.2
        ? "Modular — dependencies well distributed."
        : v.normalized < 0.5
          ? "Some centralization detected."
          : "High coupling — god-files present.",
  },
  churnRisk: {
    label: "Churn Risk",
    description: (v) =>
      v.hotFileCount === 0
        ? "No blast-radius files detected."
        : `${v.hotFileCount} high-centrality file${
            v.hotFileCount > 1 ? "s" : ""
          } changing frequently.`,
  },
  debt: {
    label: "Findings Debt",
    description: () => "Findings pipeline offline for this hackathon build.",
  },
  confidence: {
    label: "Confidence",
    description: (v) => `${Math.round(v.rollingAvg)}/100 rolling signal.`,
  },
};

interface Props {
  signal: SignalType;
  value: any;
}

export function SignalCard({ signal, value }: Props) {
  const meta = SIGNAL_META[signal];
  const pct = Math.round(value.normalized * 100);
  const score = signal === "confidence" ? pct : 100 - pct;
  const color = score >= 75 ? "#00d97f" : score >= 50 ? "#ffb800" : "#ef4444";

  return (
    <div className="card-light p-5">
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-sm"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
          }}
        >
          {meta.label}
        </span>
        <span
          className="heading-display text-3xl"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <div
        className="w-full h-1.5 mb-3 relative overflow-hidden"
        style={{ background: "rgba(26, 31, 46, 0.08)", borderRadius: 1 }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all duration-700"
          style={{
            width: `${score}%`,
            background: color,
          }}
        />
      </div>
      <p
        className="text-xs leading-relaxed"
        style={{ color: "var(--text-secondary)" }}
      >
        {meta.description(value)}
      </p>
    </div>
  );
}
