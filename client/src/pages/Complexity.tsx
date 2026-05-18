import { useEffect, useState } from "react";
import { ComplexityOverview } from "../components/complexity/ComplexityOverview";
import { ComplexityTrendChart } from "../components/complexity/ComplexityTrendChart";
import { TopComplexFilesChart } from "../components/complexity/TopComplexFilesChart";
import { ComplexityDistributionPie } from "../components/complexity/ComplexityDistributionPie";
import { ComplexityHeatmap } from "../components/complexity/ComplexityHeatmap";
import { RiskyFilesTable } from "../components/complexity/RiskyFilesTable";
import { FileInspectionModal } from "../components/complexity/FileInspectionModal";
import {
  fetchRepoComplexity,
  type FileComplexity,
  type RepoComplexity,
} from "../lib/complexity";

function HeaderSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="card-light p-6">
          <div className="skeleton h-3 w-24 mb-4" />
          <div className="skeleton h-10 w-32" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="card-light p-6">
      <div className="skeleton h-4 w-48 mb-5" />
      <div className="skeleton w-full" style={{ height: tall ? 260 : 200 }} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card-light p-12 text-center">
      <p
        className="heading-display mb-3 text-2xl"
        style={{ color: "var(--ink)" }}
      >
        No complexity data yet
      </p>
      <p
        className="text-sm max-w-md mx-auto"
        style={{ color: "var(--text-secondary)" }}
      >
        Connect a repository and run the indexer — complexity metrics will
        appear here after the next push.
      </p>
    </div>
  );
}

export default function Complexity() {
  const [data, setData] = useState<RepoComplexity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FileComplexity | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRepoComplexity()
      .then((d) => {
        if (cancelled) return;
        setData(d);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message || "Failed to load complexity data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-7xl fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-8 flex-wrap">
        <div>
          <p className="eyebrow mb-2">/ / COMPLEXITY ANALYSIS</p>
          <h1
            className="heading-display text-4xl"
            style={{ color: "var(--ink)" }}
          >
            Complexity insights
          </h1>
          <p
            className="text-sm mt-3 max-w-2xl"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
              lineHeight: 1.6,
            }}
          >
            Cyclomatic complexity, churn, and nesting depth — distilled into a
            single risk score so you know exactly which files deserve a
            refactor.
          </p>
        </div>
        {data && (
          <div className="card-light-inset px-4 py-3">
            <p className="eyebrow mb-1">Repository</p>
            <p
              className="text-sm"
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
              }}
            >
              {data.repoFullName}
            </p>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <>
          <HeaderSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2">
              <ChartSkeleton tall />
            </div>
            <ChartSkeleton />
          </div>
          <ChartSkeleton tall />
        </>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="card-light p-6" style={{ borderColor: "var(--red)" }}>
          <p
            className="eyebrow mb-2"
            style={{ color: "var(--red)" }}
          >
            Error
          </p>
          <p
            className="text-sm"
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && !data && <EmptyState />}

      {/* Loaded */}
      {!loading && !error && data && (
        <div className="space-y-6">
          <ComplexityOverview data={data} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ComplexityTrendChart data={data.trend} />
            </div>
            <ComplexityDistributionPie files={data.files} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopComplexFilesChart
              files={data.files}
              onFileClick={setSelected}
            />
            <ComplexityHeatmap
              files={data.files}
              onFileClick={setSelected}
            />
          </div>

          <RiskyFilesTable files={data.files} onFileClick={setSelected} />
        </div>
      )}

      <FileInspectionModal file={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
