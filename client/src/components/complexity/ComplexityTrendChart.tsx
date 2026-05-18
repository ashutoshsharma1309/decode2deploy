import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { ComplexityTrendPoint } from "../../lib/complexity";
import { InfoGlyph, InfoTooltip } from "./Tooltip";

interface Props {
  data: ComplexityTrendPoint[];
}

const TooltipBox = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="card-light p-3 text-xs"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <p
        className="mb-1"
        style={{
          color: "var(--text-secondary)",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.value.toFixed(1)}
        </p>
      ))}
    </div>
  );
};

export function ComplexityTrendChart({ data }: Props) {
  return (
    <div className="card-light p-6 scale-in-d2">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3
            className="heading-display"
            style={{ color: "var(--ink)", fontSize: 16 }}
          >
            Complexity over commits
          </h3>
          <InfoTooltip
            content={
              <>
                Average and peak cyclomatic complexity across the last 30
                commits. Sustained upward drift signals creeping technical debt.
              </>
            }
          >
            <InfoGlyph />
          </InfoTooltip>
        </div>
        <span className="eyebrow">LAST 10 COMMITS</span>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 6, left: -16, right: 8 }}>
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
          <Tooltip
            content={<TooltipBox />}
            cursor={{ stroke: "rgba(26,31,46,0.12)" }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
            }}
          />
          <Line
            type="monotone"
            dataKey="avgComplexity"
            name="avg"
            stroke="#1a1f2e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#1a1f2e" }}
          />
          <Line
            type="monotone"
            dataKey="maxComplexity"
            name="max"
            stroke="#ff5fc8"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#ff5fc8" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
