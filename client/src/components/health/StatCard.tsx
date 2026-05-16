interface Props {
  icon?: any;
  label: string;
  value: string | number;
  color?: string;
  trend?: number;
}

export function StatCard({ label, value, trend }: Props) {
  return (
    <div className="panel p-4">
      <p className="label-mono mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p
          className="heading-display text-2xl text-glow-cyan"
          style={{ color: "var(--neon-cyan)" }}
        >
          {value}
        </p>
        {trend !== undefined && trend !== 0 && (
          <span
            className="text-[10px] mb-1 font-mono"
            style={{
              color: trend > 0 ? "var(--neon-lime)" : "var(--neon-red)",
            }}
          >
            {trend > 0 ? "+" : ""}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
