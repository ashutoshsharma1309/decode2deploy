import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Point {
  score: number;
  computedAt: string;
}

interface Props {
  data: Point[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="panel p-3 text-[11px] font-mono"
      style={{ borderColor: "var(--neon-cyan)" }}
    >
      <p style={{ color: "var(--text-secondary)" }} className="mb-1">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: "var(--neon-cyan)" }}>
          {"> SCORE: "}
          {p.value}
        </p>
      ))}
    </div>
  );
};

export function TrendChart({ data }: Props) {
  const formatted = data.map((d) => ({
    score: d.score,
    date: new Date(d.computedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  if (formatted.length === 0) return null;

  return (
    <div className="panel p-5">
      <p className="label-mono mb-4">90-DAY HEALTH TREND</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}>
          <CartesianGrid stroke="var(--grid-line)" strokeDasharray="2 2" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "var(--text-secondary)" }}
            width={28}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={75}
            stroke="var(--neon-lime)"
            strokeDasharray="4 2"
          />
          <ReferenceLine
            y={50}
            stroke="var(--neon-amber)"
            strokeDasharray="4 2"
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--neon-cyan)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "var(--neon-cyan)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
