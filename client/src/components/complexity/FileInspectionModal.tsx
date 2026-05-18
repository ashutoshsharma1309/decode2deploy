import { useEffect } from "react";
import type { FileComplexity } from "../../lib/complexity";
import {
  calculateRiskScore,
  classifyComplexity,
  colorForModule,
  colorForRisk,
  riskLevelFromScore,
} from "../../lib/complexity";
import { RiskBadge } from "./Badge";

interface Props {
  file: FileComplexity | null;
  onClose: () => void;
}

function MetricRow({
  label,
  value,
  color = "var(--ink)",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
  hint?: React.ReactNode;
}) {
  return (
    <div
      className="card-light-inset p-4 flex flex-col"
      style={{ minHeight: 78 }}
    >
      <div className="eyebrow">{label}</div>
      <div className="flex items-end justify-between mt-2 gap-2">
        <span
          className="heading-display"
          style={{ color, fontSize: 22, lineHeight: 1 }}
        >
          {value}
        </span>
        {hint && (
          <span
            className="text-[10px]"
            style={{
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
              textAlign: "right",
            }}
          >
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      className="w-full h-1.5 overflow-hidden"
      style={{
        background: "rgba(26, 31, 46, 0.08)",
        borderRadius: 2,
      }}
    >
      <div
        className="h-full transition-all duration-700"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

export function FileInspectionModal({ file, onClose }: Props) {
  useEffect(() => {
    if (!file) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [file, onClose]);

  if (!file) return null;

  const score = calculateRiskScore(file);
  const risk = riskLevelFromScore(score);
  const cycRisk = classifyComplexity(file.cyclomaticComplexity);
  const moduleColor = colorForModule(file.module);

  const explanation = (() => {
    if (risk === "high") {
      const drivers: string[] = [];
      if (file.cyclomaticComplexity >= 20)
        drivers.push("high cyclomatic complexity");
      if (file.churnCount >= 8) drivers.push("frequent churn");
      if (file.nestingDepth >= 5) drivers.push("deep nesting");
      if (file.lineCount >= 500) drivers.push("large file");
      return `This file is a hotspot driven by ${drivers.join(", ") || "compound risk factors"}. Files that change often AND are structurally complex are statistically the most likely place for production regressions to land.`;
    }
    if (risk === "medium") {
      return "Some risk indicators are elevated. Worth keeping under observation — schedule a refactor before this file accumulates more churn.";
    }
    return "Healthy file. Low complexity, low churn, small surface area. No action required.";
  })();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card-light p-7 w-full max-w-3xl mx-4 scale-in"
        style={{ maxHeight: "85vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-3 eyebrow">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: moduleColor,
                }}
              />
              <span style={{ color: moduleColor }}>{file.module}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span>FILE INSPECTION</span>
            </div>
            <h3
              className="heading-display break-all"
              style={{ color: "var(--ink)", fontSize: 20, lineHeight: 1.25 }}
            >
              {file.path}
            </h3>
            <p
              className="text-xs mt-2"
              style={{
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Last modified ·{" "}
              {new Date(file.lastModified).toISOString().slice(0, 10)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3 flex-shrink-0">
            <RiskBadge level={risk} />
            <button
              onClick={onClose}
              className="hex-btn hex-btn-ghost"
              style={{ padding: "6px 14px", fontSize: 11 }}
            >
              Close · esc
            </button>
          </div>
        </div>

        {/* Risk score banner */}
        <div
          className="card-light-inset p-4 mb-5 flex items-center justify-between gap-4"
          style={{ borderColor: `${colorForRisk(risk)}66` }}
        >
          <div>
            <p className="eyebrow mb-1">Compound risk score</p>
            <p
              className="heading-display"
              style={{ color: colorForRisk(risk), fontSize: 28 }}
            >
              {score}
              <span
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  marginLeft: 4,
                }}
              >
                / 100
              </span>
            </p>
          </div>
          <div className="flex-1 ml-4">
            <ProgressBar value={score} color={colorForRisk(risk)} />
          </div>
        </div>

        {/* Metric grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <MetricRow
            label="Cyclomatic"
            value={file.cyclomaticComplexity}
            color={colorForRisk(cycRisk)}
            hint={cycRisk}
          />
          <MetricRow
            label="Nesting depth"
            value={file.nestingDepth}
            color={
              file.nestingDepth >= 5
                ? "#ef4444"
                : file.nestingDepth >= 4
                  ? "#ffb800"
                  : "#00d97f"
            }
          />
          <MetricRow
            label="Avg fn length"
            value={file.avgFunctionLength}
            hint="lines"
          />
          <MetricRow label="Line count" value={file.lineCount} hint="lines" />
          <MetricRow
            label="Churn count"
            value={file.churnCount}
            color={
              file.churnCount >= 10
                ? "#ef4444"
                : file.churnCount >= 5
                  ? "#ffb800"
                  : "#00d97f"
            }
            hint="commits"
          />
          <MetricRow
            label="Dependencies"
            value={file.dependencies}
            hint="imports"
          />
          <MetricRow label="Module" value={file.module} color={moduleColor} />
          <MetricRow
            label="Risk level"
            value={risk.toUpperCase()}
            color={colorForRisk(risk)}
          />
        </div>

        {/* Complexity breakdown */}
        <div className="mb-5">
          <p className="eyebrow mb-3">Risk breakdown</p>
          <div className="space-y-3">
            {[
              {
                label: "Complexity",
                value: Math.min(100, (file.cyclomaticComplexity / 40) * 100),
                weight: "40%",
                color: "#5d6bff",
              },
              {
                label: "Churn",
                value: Math.min(100, (file.churnCount / 20) * 100),
                weight: "25%",
                color: "#ff5fc8",
              },
              {
                label: "Nesting",
                value: Math.min(100, (file.nestingDepth / 7) * 100),
                weight: "20%",
                color: "#ffb800",
              },
              {
                label: "Size",
                value: Math.min(100, (file.lineCount / 1000) * 100),
                weight: "15%",
                color: "#a78bfa",
              },
            ].map((r) => (
              <div key={r.label}>
                <div
                  className="flex items-center justify-between mb-1 text-[10px]"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.14em",
                  }}
                >
                  <span style={{ textTransform: "uppercase" }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 600 }}>
                    {Math.round(r.value)}{" "}
                    <span style={{ opacity: 0.5 }}>× {r.weight}</span>
                  </span>
                </div>
                <ProgressBar value={r.value} color={r.color} />
              </div>
            ))}
          </div>
        </div>

        {/* Hotspots */}
        {file.hotspots && file.hotspots.length > 0 && (
          <div className="mb-5">
            <p className="eyebrow mb-3">Known hotspots</p>
            <ul className="space-y-2">
              {file.hotspots.map((h, i) => (
                <li
                  key={i}
                  className="card-light-inset p-3 text-xs flex gap-3"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.55,
                  }}
                >
                  <span style={{ color: "#ff5fc8", fontWeight: 700 }}>›</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Risk explanation */}
        <div
          className="p-4"
          style={{
            background: `${colorForRisk(risk)}0f`,
            border: `1px solid ${colorForRisk(risk)}40`,
            borderRadius: 4,
          }}
        >
          <p
            className="eyebrow mb-2"
            style={{ color: colorForRisk(risk), fontWeight: 700 }}
          >
            Why this matters
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {explanation}
          </p>
        </div>
      </div>
    </div>
  );
}
