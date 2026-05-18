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

const COLORS = {
  coupling: "#1a1f2e",
  churnRisk: "#ff5fc8",
  debt: "#ffb800",
  confidence: "#00d97f",
};

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
          {p.name}: {Math.round(p.value * 100)}%
        </p>
      ))}
    </div>
  );
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
    <div className="card-light p-6">
      <p className="eyebrow mb-4">SIGNAL TRENDS</p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={formatted} margin={{ left: -20, right: 8 }}>
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
            domain={[0, 1]}
            tick={{ fontSize: 10, fill: "#5b6478" }}
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
      <div className="flex items-center justify-center gap-5 mt-4 flex-wrap">
        {Object.entries(COLORS).map(([k, c]) => (
          <div key={k} className="flex items-center gap-2">
            <span
              className="w-2 h-2"
              style={{ background: c, borderRadius: 1 }}
            />
            <span className="eyebrow" style={{ letterSpacing: "0.14em" }}>
              {k}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
