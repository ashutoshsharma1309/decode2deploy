import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { FileComplexity } from "../../lib/complexity";
import {
  calculateRiskScore,
  colorForRisk,
  riskLevelFromScore,
} from "../../lib/complexity";
import { InfoGlyph, InfoTooltip } from "./Tooltip";

interface Props {
  files: FileComplexity[];
  onFileClick?: (f: FileComplexity) => void;
}

const TooltipBox = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const f = payload[0].payload as FileComplexity & { risk: string };
  return (
    <div
      className="card-light p-3 text-xs"
      style={{ fontFamily: "var(--font-mono)", maxWidth: 280 }}
    >
      <p
        style={{ color: "var(--ink)", fontWeight: 600 }}
        className="mb-1 truncate"
      >
        {f.path}
      </p>
      <p style={{ color: "var(--text-secondary)" }}>
        Cyclomatic: {f.cyclomaticComplexity} · Nesting: {f.nestingDepth}
      </p>
    </div>
  );
};

export function TopComplexFilesChart({ files, onFileClick }: Props) {
  const top = [...files]
    .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
    .slice(0, 10)
    .map((f) => ({
      ...f,
      short: f.path.split("/").pop() || f.path,
      risk: riskLevelFromScore(calculateRiskScore(f)),
    }));

  return (
    <div className="card-light p-6 scale-in-d3">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3
            className="heading-display"
            style={{ color: "var(--ink)", fontSize: 16 }}
          >
            Top 10 most complex files
          </h3>
          <InfoTooltip
            content={
              <>
                Files ranked by cyclomatic complexity — every distinct branching
                path counts as one. High values mean many possible execution
                states to reason about.
              </>
            }
          >
            <InfoGlyph />
          </InfoTooltip>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(260, top.length * 28)}>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#5b6478" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="short"
            width={170}
            tick={{ fontSize: 11, fill: "#1a1f2e" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<TooltipBox />}
            cursor={{ fill: "rgba(26, 31, 46, 0.04)" }}
          />
          <Bar
            dataKey="cyclomaticComplexity"
            radius={[0, 4, 4, 0]}
            onClick={(d: any) => onFileClick?.(d as FileComplexity)}
            style={{ cursor: "pointer" }}
          >
            {top.map((f, i) => (
              <Cell key={i} fill={colorForRisk(f.risk)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
