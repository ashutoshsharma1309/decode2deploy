interface Props {
  score: number;
  computedAt: string;
}

export function ScoreGauge({ score, computedAt }: Props) {
  const color =
    score >= 75
      ? "var(--neon-lime)"
      : score >= 50
        ? "var(--neon-amber)"
        : "var(--neon-red)";
  const label = score >= 75 ? "HEALTHY" : score >= 50 ? "WATCH" : "CRITICAL";
  const r = 54;
  const cx = 70;
  const cy = 70;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="panel p-6 flex flex-col items-center gap-3">
      <p className="label-mono">HEALTH SCORE</p>
      <svg viewBox="0 0 140 140" width="160" height="160">
        <defs>
          <filter id="glow-gauge">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(0, 240, 255, 0.08)"
          strokeWidth="8"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          filter="url(#glow-gauge)"
        />
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fontSize="32"
          fontWeight="700"
          fontFamily="var(--font-display)"
          fill={color}
          style={{ filter: "drop-shadow(0 0 6px currentColor)" }}
        >
          {score}
        </text>
        <text
          x={cx}
          y={cy + 28}
          textAnchor="middle"
          fontSize="9"
          fontFamily="var(--font-mono)"
          fill="var(--text-secondary)"
          letterSpacing="2"
        >
          / 100
        </text>
      </svg>
      <p
        className="label-mono"
        style={{ color, letterSpacing: "0.2em", fontSize: 11 }}
      >
        {label}
      </p>
      <p
        className="text-[10px]"
        style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
      >
        UPDATED {new Date(computedAt).toISOString().slice(0, 19).replace("T", " ")}
      </p>
    </div>
  );
}
