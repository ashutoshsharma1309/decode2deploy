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

export function ComplexityHeatmap({ files, onFileClick }: Props) {
  const ranked = [...files]
    .map((f) => ({ ...f, score: calculateRiskScore(f) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="card-light p-6 scale-in-d4">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h3
            className="heading-display"
            style={{ color: "var(--ink)", fontSize: 16 }}
          >
            File risk heatmap
          </h3>
          <InfoTooltip
            content={
              <>
                Each tile is one file. Color encodes the compound risk score —
                brighter tiles concentrate the most complexity + churn. Hover
                for path, click to inspect.
              </>
            }
          >
            <InfoGlyph />
          </InfoTooltip>
        </div>
        <div
          className="flex items-center gap-3"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {(["low", "medium", "high"] as const).map((r) => (
            <div key={r} className="flex items-center gap-1.5">
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: colorForRisk(r),
                  borderRadius: 2,
                }}
              />
              <span className="eyebrow" style={{ fontSize: 9 }}>
                {r}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
          gridAutoRows: "70px",
        }}
      >
        {ranked.map((f) => {
          const risk = riskLevelFromScore(f.score);
          const color = colorForRisk(risk);
          const intensity = Math.max(0.18, f.score / 100);
          // Mix the color with white to keep the cream surface feel
          const bg = `${color}${Math.round(intensity * 200)
            .toString(16)
            .padStart(2, "0")}`;
          return (
            <button
              key={f.path}
              onClick={() => onFileClick?.(f)}
              className="relative overflow-hidden text-left transition-transform hover:scale-[1.06]"
              title={`${f.path}\nrisk ${f.score}/100 · cyclomatic ${f.cyclomaticComplexity}`}
              style={{
                background: bg,
                border: `1px solid ${color}66`,
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              <div className="absolute inset-0 flex flex-col justify-between p-1.5">
                <span
                  className="text-[9px] truncate block"
                  style={{
                    color: "var(--ink)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                  }}
                >
                  {f.path.split("/").pop()}
                </span>
                <span
                  className="text-[11px]"
                  style={{
                    color: "var(--ink)",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                  }}
                >
                  {f.score}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
