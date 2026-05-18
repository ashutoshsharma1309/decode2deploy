import { useState, useMemo } from "react";
import type { FileComplexity } from "../../lib/complexity";
import {
  calculateRiskScore,
  riskLevelFromScore,
  colorForModule,
} from "../../lib/complexity";
import { RiskBadge } from "./Badge";
import { InfoGlyph, InfoTooltip } from "./Tooltip";

interface Props {
  files: FileComplexity[];
  onFileClick?: (f: FileComplexity) => void;
}

type SortKey = "risk" | "complexity" | "churn";

export function RiskyFilesTable({ files, onFileClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("risk");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const enriched = files.map((f) => {
      const score = calculateRiskScore(f);
      return { ...f, risk: riskLevelFromScore(score), score };
    });
    const filtered = query
      ? enriched.filter((f) =>
          f.path.toLowerCase().includes(query.toLowerCase()),
        )
      : enriched;
    return [...filtered].sort((a, b) => {
      if (sortKey === "risk") return b.score - a.score;
      if (sortKey === "complexity")
        return b.cyclomaticComplexity - a.cyclomaticComplexity;
      return b.churnCount - a.churnCount;
    });
  }, [files, sortKey, query]);

  return (
    <div className="card-light p-6 scale-in-d4">
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <h3
            className="heading-display"
            style={{ color: "var(--ink)", fontSize: 16 }}
          >
            Top risky files
          </h3>
          <InfoTooltip
            content={
              <>
                Compound risk = complexity × churn × nesting × size. Files high
                here are the ones most likely to break production at 3am.
              </>
            }
          >
            <InfoGlyph />
          </InfoTooltip>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="filter path…"
            className="input-light"
            style={{ minWidth: 200 }}
          />
          {(["risk", "complexity", "churn"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className="hex-btn"
              style={{
                padding: "8px 14px",
                fontSize: 11,
                background:
                  sortKey === k ? "var(--ink)" : "rgba(26,31,46,0.04)",
                color: sortKey === k ? "#fff" : "var(--text-secondary)",
              }}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="eyebrow">
              <th className="text-left py-3 px-3 font-normal">File</th>
              <th className="text-right py-3 px-3 font-normal">Complexity</th>
              <th className="text-right py-3 px-3 font-normal">Churn</th>
              <th className="text-right py-3 px-3 font-normal">Score</th>
              <th className="text-right py-3 px-3 font-normal">Risk</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-sm"
                  style={{
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {"> no files match this filter"}
                </td>
              </tr>
            ) : (
              rows.slice(0, 30).map((f) => {
                const moduleColor = colorForModule(f.module);
                return (
                  <tr
                    key={f.path}
                    onClick={() => onFileClick?.(f)}
                    className="cursor-pointer transition-colors"
                    style={{ borderTop: "1px solid var(--border-ink)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(0, 217, 127, 0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: moduleColor,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            color: "var(--ink)",
                            fontFamily: "var(--font-mono)",
                          }}
                          className="truncate"
                        >
                          {f.path}
                        </span>
                      </div>
                    </td>
                    <td
                      className="py-3 px-3 text-right"
                      style={{
                        color: "var(--ink)",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                      }}
                    >
                      {f.cyclomaticComplexity}
                    </td>
                    <td
                      className="py-3 px-3 text-right"
                      style={{
                        color: "var(--text-secondary)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {f.churnCount}
                    </td>
                    <td
                      className="py-3 px-3 text-right"
                      style={{
                        color: "#5d6bff",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                      }}
                    >
                      {f.score}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <RiskBadge level={f.risk} compact />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
