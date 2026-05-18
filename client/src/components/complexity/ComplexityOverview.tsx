import type { RepoComplexity } from "../../lib/complexity";
import {
  colorForModule,
  formatScore,
  riskLevelFromScore,
} from "../../lib/complexity";
import { InfoGlyph, InfoTooltip } from "./Tooltip";

interface Props {
  data: RepoComplexity;
}

function HealthRing({ score }: { score: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  const color =
    score >= 75 ? "#00d97f" : score >= 50 ? "#ffb800" : "#ef4444";
  return (
    <svg width="64" height="64" viewBox="0 0 64 64">
      <circle
        cx="32"
        cy="32"
        r={r}
        stroke="rgba(26, 31, 46, 0.08)"
        strokeWidth="5"
        fill="none"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        stroke={color}
        strokeWidth="5"
        fill="none"
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="37"
        textAnchor="middle"
        fontSize="15"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="700"
        fill="#1a1f2e"
      >
        {score}
      </text>
    </svg>
  );
}

interface CardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: string;
  delay?: string;
  tooltip?: React.ReactNode;
  visual?: React.ReactNode;
}

function MetricCard({
  label,
  value,
  sub,
  accent = "#00d97f",
  delay = "scale-in",
  tooltip,
  visual,
}: CardProps) {
  return (
    <div className={`card-light card-light-hover p-6 ${delay}`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center eyebrow"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
          {tooltip && (
            <InfoTooltip content={tooltip}>
              <InfoGlyph />
            </InfoTooltip>
          )}
        </div>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 8px ${accent}66`,
          }}
        />
      </div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div
            className="heading-display"
            style={{ color: "var(--ink)", fontSize: 36, lineHeight: 1 }}
          >
            {value}
          </div>
          {sub && (
            <div
              className="mt-2 text-xs"
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.06em",
              }}
            >
              {sub}
            </div>
          )}
        </div>
        {visual}
      </div>
    </div>
  );
}

export function ComplexityOverview({ data }: Props) {
  const moduleColor = colorForModule(data.highestRiskModule);
  const overallRisk = riskLevelFromScore(100 - data.overallScore);
  const moduleRiskColor =
    overallRisk === "low"
      ? "#00d97f"
      : overallRisk === "medium"
        ? "#ffb800"
        : "#ef4444";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="OVERALL SCORE"
        value={data.overallScore}
        sub={`${overallRisk.toUpperCase()} overall risk`}
        accent={moduleRiskColor}
        delay="scale-in"
        visual={<HealthRing score={data.overallScore} />}
        tooltip={
          <>
            Composite health score derived from cyclomatic complexity, nesting
            depth, file size and churn. Higher is healthier.
          </>
        }
      />
      <MetricCard
        label="COMPLEX FILES"
        value={data.totalComplexFiles}
        sub={`of ${data.files.length} indexed`}
        accent="#ffb800"
        delay="scale-in-d1"
        tooltip={
          <>
            Files with cyclomatic complexity ≥ 20 — they have many branching
            paths and are harder to safely modify.
          </>
        }
      />
      <MetricCard
        label="AVG COMPLEXITY"
        value={formatScore(data.avgComplexityPerFile)}
        sub="per file"
        accent="#5d6bff"
        delay="scale-in-d2"
        tooltip={
          <>
            Average cyclomatic complexity across all indexed files. Industry
            "comfortable" is around 5–10.
          </>
        }
      />
      <MetricCard
        label="HIGHEST RISK MODULE"
        value={
          <span
            style={{
              color: moduleColor,
              textTransform: "capitalize",
            }}
          >
            {data.highestRiskModule}
          </span>
        }
        sub="hot zone"
        accent={moduleColor}
        delay="scale-in-d3"
        tooltip={
          <>
            The module with the highest average complexity. Concentrated risk —
            a good place to schedule refactors.
          </>
        }
      />
    </div>
  );
}
