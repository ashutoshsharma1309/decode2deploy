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
      className="card-light p-3 text-xs"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <p style={{ color: "var(--text-secondary)" }} className="mb-1">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: "var(--ink)", fontWeight: 600 }}>
          {"score · "}
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
    <div className="card-light p-6">
      <p className="eyebrow mb-4">90-DAY HEALTH TREND</p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}>
          <CartesianGrid
            stroke="rgba(26, 31, 46, 0.06)"
            strokeDasharray="2 2"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#5b6478" }}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#5b6478" }}
            width={28}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={75} stroke="#00d97f" strokeDasharray="4 2" />
          <ReferenceLine y={50} stroke="#ffb800" strokeDasharray="4 2" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#1a1f2e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#00d97f" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
