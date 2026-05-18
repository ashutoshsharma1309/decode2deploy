import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  computedAt: string;
  totalFiles: number;
  totalDefs: number;
}

interface Props {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="card-light p-3 text-xs"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <p style={{ color: "var(--text-secondary)" }} className="mb-1">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function CodebaseGrowthChart({ data }: Props) {
  const formatted = data.map((d) => ({
    date: new Date(d.computedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    files: d.totalFiles,
    definitions: d.totalDefs,
  }));

  if (formatted.length === 0) return null;

  return (
    <div className="card-light p-6">
      <p className="eyebrow mb-4">CODEBASE GROWTH</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted} margin={{ left: -20, right: 8 }}>
          <CartesianGrid
            stroke="rgba(26, 31, 46, 0.06)"
            strokeDasharray="2 2"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#5b6478" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#5b6478" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="definitions"
            name="Definitions"
            stroke="#5d6bff"
            fill="#5d6bff"
            fillOpacity={0.18}
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="files"
            name="Files"
            stroke="#00d97f"
            fill="#00d97f"
            fillOpacity={0.18}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
