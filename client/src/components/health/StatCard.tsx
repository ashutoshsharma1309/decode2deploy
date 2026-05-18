interface Props {
  icon?: any;
  label: string;
  value: string | number;
  color?: string;
  trend?: number;
}

export function StatCard({ label, value, trend }: Props) {
  return (
    <div className="card-light p-5">
      <p className="eyebrow mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <p
          className="heading-display text-3xl"
          style={{ color: "var(--ink)" }}
        >
          {value}
        </p>
        {trend !== undefined && trend !== 0 && (
          <span
            className="text-[11px] mb-1.5"
            style={{
              color: trend > 0 ? "var(--green)" : "var(--red)",
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
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
