import type { RiskLevel } from "../../lib/complexity";

const labels: Record<RiskLevel, string> = {
  low: "Healthy",
  medium: "Moderate",
  high: "Risky",
};

export function RiskBadge({
  level,
  compact = false,
}: {
  level: RiskLevel;
  compact?: boolean;
}) {
  return (
    <span
      className={`risk-badge risk-badge-${level}`}
      style={{ fontSize: compact ? 9 : 10 }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "currentColor",
          boxShadow: "0 0 6px currentColor",
        }}
      />
      {labels[level]}
    </span>
  );
}
