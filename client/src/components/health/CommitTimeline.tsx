import { useNavigate } from "react-router-dom";

interface Push {
  commitSha: string;
  files: string[];
  pushedAt: string;
  fileDiffs?: Array<{
    filename: string;
    additions: number;
    deletions: number;
    patch?: string;
  }>;
}

interface Props {
  pushes: Push[];
  repoId: string;
}

export function CommitTimeline({ pushes, repoId }: Props) {
  const navigate = useNavigate();
  if (pushes.length === 0) return null;

  const formatTime = (date: string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="card-light p-6">
      <p className="eyebrow mb-5">COMMIT TIMELINE</p>
      <div
        className="relative pl-6"
        style={{ borderLeft: "1px solid var(--border-ink-2)" }}
      >
        {pushes.map((p) => {
          const adds =
            p.fileDiffs?.reduce((s, f) => s + (f.additions || 0), 0) || 0;
          const dels =
            p.fileDiffs?.reduce((s, f) => s + (f.deletions || 0), 0) || 0;
          return (
            <div key={p.commitSha} className="mb-4 relative">
              <span
                className="absolute top-2 w-3 h-3 rounded-full"
                style={{
                  left: -32,
                  background: "var(--green)",
                  boxShadow: "0 0 0 4px rgba(0, 217, 127, 0.18)",
                }}
              />
              <div
                onClick={() =>
                  navigate(`/dashboard/commit-diff/${repoId}/${p.commitSha}`)
                }
                className="card-light p-4 cursor-pointer transition-all"
                style={{
                  background: "var(--paper-soft)",
                  border: "1px solid var(--border-ink)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 217, 127, 0.06)";
                  e.currentTarget.style.borderColor = "var(--green)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--paper-soft)";
                  e.currentTarget.style.borderColor = "var(--border-ink)";
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    style={{
                      color: "var(--ink)",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {p.commitSha.slice(0, 7)}
                  </span>
                  <span className="eyebrow" style={{ fontSize: 10 }}>
                    {formatTime(p.pushedAt)}
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 text-xs"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>
                    {p.files.length} file{p.files.length !== 1 ? "s" : ""}
                  </span>
                  {adds > 0 && (
                    <span style={{ color: "var(--green)", fontWeight: 600 }}>
                      +{adds}
                    </span>
                  )}
                  {dels > 0 && (
                    <span style={{ color: "var(--red)", fontWeight: 600 }}>
                      -{dels}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
