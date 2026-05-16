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
    <div className="panel p-3 text-[11px] font-mono">
      <p style={{ color: "var(--text-secondary)" }} className="mb-1">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>
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
    <div className="panel p-5">
      <p className="label-mono mb-4">CODEBASE GROWTH</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={formatted} margin={{ left: -20, right: 8 }}>
          <CartesianGrid stroke="var(--grid-line)" strokeDasharray="2 2" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="definitions"
            name="Definitions"
            stroke="var(--neon-magenta)"
            fill="var(--neon-magenta)"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="files"
            name="Files"
            stroke="var(--neon-cyan)"
            fill="var(--neon-cyan)"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
