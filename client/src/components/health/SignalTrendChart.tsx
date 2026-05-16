import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  computedAt: string;
  coupling: number;
  churnRisk: number;
  debt: number;
  confidence: number;
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
          {p.name}: {Math.round(p.value * 100)}%
        </p>
      ))}
    </div>
  );
};

const COLORS = {
  coupling: "var(--neon-cyan)",
  churnRisk: "var(--neon-magenta)",
  debt: "var(--neon-amber)",
  confidence: "var(--neon-lime)",
};

export function SignalTrendChart({ data }: Props) {
  const formatted = data.map((d) => ({
    date: new Date(d.computedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    coupling: d.coupling,
    churnRisk: d.churnRisk,
    debt: d.debt,
    confidence: d.confidence,
  }));

  if (formatted.length === 0) return null;

  return (
    <div className="panel p-5">
      <p className="label-mono mb-4">SIGNAL TRENDS</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ left: -20, right: 8 }}>
          <CartesianGrid stroke="var(--grid-line)" strokeDasharray="2 2" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 1]}
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="coupling"
            name="Coupling"
            stroke={COLORS.coupling}
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="churnRisk"
            name="Churn"
            stroke={COLORS.churnRisk}
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="debt"
            name="Debt"
            stroke={COLORS.debt}
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="confidence"
            name="Confidence"
            stroke={COLORS.confidence}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
        {Object.entries(COLORS).map(([k, c]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2"
              style={{ background: c, boxShadow: `0 0 6px ${c}` }}
            />
            <span className="text-[10px] label-mono">{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
