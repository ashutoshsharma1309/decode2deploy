import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../api/axios";
import { ScoreGauge } from "../components/health/ScoreGauge";
import { EmptyHealth } from "../components/health/EmptyHealth";
import { SignalCard } from "../components/health/SignalCard";
import { TrendChart } from "../components/health/TrendChart";
import { HotFileList } from "../components/health/HotFileList";
import { StatCard } from "../components/health/StatCard";
import { CommitTimeline } from "../components/health/CommitTimeline";
import { SignalTrendChart } from "../components/health/SignalTrendChart";
import { CodebaseGrowthChart } from "../components/health/CodebaseGrowthChart";

interface Repo {
  _id: string;
  fullName: string;
}

interface HealthSnapshot {
  repoId: string;
  repoFullName: string;
  score: number;
  signals: {
    coupling: { gini: number; normalized: number };
    churnRisk: { hotFileCount: number; normalized: number };
    debt: { weightedTotal: number; avgPerPR: number; normalized: number };
    confidence: { rollingAvg: number; normalized: number };
  };
  hotFiles: string[];
  totalFiles: number;
  totalDefs: number;
  prCount: number;
  computedAt: string;
  recentPushes: Array<{
    commitSha: string;
    files: string[];
    pushedAt: string;
    fileDiffs: Array<{
      filename: string;
      additions: number;
      deletions: number;
      patch?: string;
    }>;
  }>;
  metrics: {
    totalSnapshots: number;
    scoreChange: number;
    daysTracked: number;
  };
}

interface HistoryPoint {
  score: number;
  computedAt: string;
  gini: number;
  hotFileCount: number;
  coupling: number;
  churnRisk: number;
  debt: number;
  confidence: number;
  totalFiles: number;
  totalDefs: number;
}

export default function RepoHealth() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [reposLoading, setReposLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<HealthSnapshot | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapError, setSnapError] = useState<any>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    api
      .get("/repos")
      .then(({ data }) => {
        const list = (data.repos || []).map((r: any) => ({
          _id: r._id,
          fullName: r.fullName,
        }));
        setRepos(list);
        if (list.length === 0) navigate("/dashboard/repos");
      })
      .catch(() => {})
      .finally(() => setReposLoading(false));
  }, [navigate]);

  const activeRepoId =
    params.repoId || searchParams.get("repoId") || repos[0]?._id;
  const activeRepo = repos.find((r) => r._id === activeRepoId);

  useEffect(() => {
    if (!activeRepoId) return;
    setSnapLoading(true);
    setSnapError(null);
    api
      .get(`/health/${activeRepoId}/latest`)
      .then(({ data }) => setSnapshot(data))
      .catch((err) => {
        setSnapError(err);
        setSnapshot(null);
      })
      .finally(() => setSnapLoading(false));
    api
      .get(`/health/${activeRepoId}/history?days=90`)
      .then(({ data }) => setHistory(data.history || []))
      .catch(() => setHistory([]));
  }, [activeRepoId]);

  const switchRepo = (id: string) => {
    setDropdownOpen(false);
    if (params.repoId) navigate(`/dashboard/repo-health/${id}`);
    else setSearchParams({ repoId: id });
  };

  const Header = () => (
    <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
      <div>
        <p className="eyebrow mb-2">/ / HEALTH MONITOR</p>
        <h1
          className="heading-display text-4xl"
          style={{ color: "var(--ink)" }}
        >
          Repo Health
        </h1>
        <p
          className="text-sm mt-2"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {"> "}
          {activeRepo?.fullName || "—"}
        </p>
      </div>

      <div className="relative">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="hex-btn hex-btn-outline"
          style={{ minWidth: 220, justifyContent: "space-between" }}
        >
          <span className="truncate">
            {activeRepo?.fullName || "Select repo"}
          </span>
          <span style={{ fontSize: 10 }}>▾</span>
        </button>
        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-2 card-light py-1 z-50"
            style={{ minWidth: 280, padding: 4 }}
          >
            {repos.map((r) => (
              <button
                key={r._id}
                onClick={() => switchRepo(r._id)}
                className="w-full text-left px-3 py-2 text-sm truncate transition-colors"
                style={{
                  color:
                    r._id === activeRepoId
                      ? "var(--ink)"
                      : "var(--text-secondary)",
                  background:
                    r._id === activeRepoId
                      ? "rgba(0, 217, 127, 0.1)"
                      : "transparent",
                  fontFamily: "var(--font-mono)",
                  borderRadius: 2,
                }}
              >
                {r.fullName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (reposLoading || snapLoading) {
    return (
      <div className="max-w-6xl fade-up">
        <Header />
        <p
          className="text-sm"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {"> scanning repo_"}
        </p>
      </div>
    );
  }

  if (snapError?.response?.status === 404 || !snapshot) {
    return (
      <div className="max-w-6xl fade-up">
        <Header />
        <EmptyHealth repoName={activeRepo?.fullName} />
      </div>
    );
  }

  if (snapError) {
    return (
      <div className="max-w-6xl fade-up">
        <Header />
        <div
          className="card-light p-6"
          style={{ borderColor: "var(--red)" }}
        >
          <p
            className="eyebrow mb-2"
            style={{ color: "var(--red)" }}
          >
            ERROR
          </p>
          <p
            className="text-sm"
            style={{
              color: "var(--text-secondary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {snapError?.response?.data?.error ||
              snapError?.message ||
              "Unknown error."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl fade-up">
      <Header />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="TOTAL FILES" value={snapshot.totalFiles} />
        <StatCard label="DEFINITIONS" value={snapshot.totalDefs} />
        <StatCard label="SNAPSHOTS" value={snapshot.metrics.totalSnapshots} />
        <StatCard label="DAYS TRACKED" value={snapshot.metrics.daysTracked} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-1">
          <ScoreGauge
            score={Math.round(snapshot.score)}
            computedAt={snapshot.computedAt}
          />
        </div>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SignalCard signal="coupling" value={snapshot.signals.coupling} />
          <SignalCard signal="churnRisk" value={snapshot.signals.churnRisk} />
          <SignalCard signal="debt" value={snapshot.signals.debt} />
          <SignalCard signal="confidence" value={snapshot.signals.confidence} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {history.length > 0 && <TrendChart data={history} />}
        {snapshot.recentPushes && snapshot.recentPushes.length > 0 && (
          <CommitTimeline
            pushes={snapshot.recentPushes}
            repoId={activeRepoId!}
          />
        )}
      </div>

      {history.length > 1 && (
        <div className="mb-6">
          <SignalTrendChart data={history} />
        </div>
      )}

      {history.length > 1 && (
        <div className="mb-6">
          <CodebaseGrowthChart data={history} />
        </div>
      )}

      {snapshot.hotFiles.length > 0 && (
        <div className="mb-8">
          <HotFileList files={snapshot.hotFiles} />
        </div>
      )}
    </div>
  );
}
