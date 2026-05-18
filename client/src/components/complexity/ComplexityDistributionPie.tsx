import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { FileComplexity, RiskLevel } from "../../lib/complexity";
import {
  colorForRisk,
  distributionByRisk,
} from "../../lib/complexity";
import { InfoGlyph, InfoTooltip } from "./Tooltip";

interface Props {
  files: FileComplexity[];
}

const LABELS: Record<RiskLevel, string> = {
  low: "Healthy",
  medium: "Moderate",
  high: "Risky",
};

const TooltipBox = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as { risk: RiskLevel; count: number };
  return (
    <div
      className="card-light p-3 text-xs"
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <p style={{ color: colorForRisk(d.risk), fontWeight: 600 }}>
        {LABELS[d.risk]}: {d.count} files
      </p>
    </div>
  );
};

export function ComplexityDistributionPie({ files }: Props) {
  const data = distributionByRisk(files);
  const total = data.reduce((s, d) => s + d.count, 0) || 1;

  return (
    <div className="card-light p-6 scale-in-d3 h-full">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3
            className="heading-display"
            style={{ color: "var(--ink)", fontSize: 16 }}
          >
            Risk distribution
          </h3>
          <InfoTooltip
            content={
              <>
                Share of files in each risk bucket — combines complexity, churn,
                nesting and file size into a compound score.
              </>
            }
          >
            <InfoGlyph />
          </InfoTooltip>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Tooltip content={<TooltipBox />} />
          <Pie
            data={data}
            dataKey="count"
            nameKey="risk"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={78}
            paddingAngle={2}
            stroke="var(--paper)"
            strokeWidth={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={colorForRisk(d.risk)} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 space-y-2">
        {data.map((d) => {
          const pct = Math.round((d.count / total) * 100);
          return (
            <div
              key={d.risk}
              className="flex items-center justify-between text-xs"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: colorForRisk(d.risk),
                  }}
                />
                <span style={{ color: "var(--text-primary)" }}>
                  {LABELS[d.risk]}
                </span>
              </div>
              <span style={{ color: "var(--ink)", fontWeight: 600 }}>
                {d.count} · {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
