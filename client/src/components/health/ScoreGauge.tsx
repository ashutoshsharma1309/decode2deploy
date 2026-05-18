interface Props {
  score: number;
  computedAt: string;
}

export function ScoreGauge({ score, computedAt }: Props) {
  const color =
    score >= 75 ? "#00d97f" : score >= 50 ? "#ffb800" : "#ef4444";
  const label = score >= 75 ? "HEALTHY" : score >= 50 ? "WATCH" : "CRITICAL";
  const r = 54;
  const cx = 70;
  const cy = 70;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="card-light flex flex-col items-center gap-4 p-8">
      <p className="eyebrow">HEALTH SCORE</p>
      <svg viewBox="0 0 140 140" width="180" height="180">
        <defs>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="1.5" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(26, 31, 46, 0.08)"
          strokeWidth="9"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            transition: "stroke-dasharray 600ms ease",
          }}
          filter="url(#gauge-glow)"
        />
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontSize="34"
          fontWeight="700"
          fontFamily="Space Grotesk, sans-serif"
          fill="#1a1f2e"
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 26}
          textAnchor="middle"
          fontSize="9"
          fontFamily="JetBrains Mono, monospace"
          fill="#5b6478"
          letterSpacing="2"
        >
          / 100
        </text>
      </svg>
      <span
        className="status-pill"
        style={{
          color,
          borderColor: color,
          background: "transparent",
          border: `1px solid ${color}`,
        }}
      >
        {label}
      </span>
      <p
        className="text-[10px]"
        style={{
          color: "var(--text-muted)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.1em",
        }}
      >
        UPDATED{" "}
        {new Date(computedAt).toISOString().slice(0, 19).replace("T", " ")}
      </p>
    </div>
  );
}
