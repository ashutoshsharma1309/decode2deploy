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
    if (mins < 60) return `${mins}M AGO`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}H AGO`;
    return `${Math.floor(hrs / 24)}D AGO`;
  };

  return (
    <div className="panel p-5">
      <p className="label-mono mb-4">COMMIT TIMELINE</p>
      <div
        className="relative pl-6"
        style={{
          borderLeft: "1px solid var(--border-default)",
        }}
      >
        {pushes.map((p) => {
          const adds =
            p.fileDiffs?.reduce((s, f) => s + (f.additions || 0), 0) || 0;
          const dels =
            p.fileDiffs?.reduce((s, f) => s + (f.deletions || 0), 0) || 0;
          return (
            <div key={p.commitSha} className="mb-4 relative">
              <span
                className="absolute -left-[27px] top-2 w-3 h-3 rounded-full"
                style={{
                  background: "var(--neon-cyan)",
                  boxShadow: "0 0 10px var(--neon-cyan)",
                }}
              />
              <div
                onClick={() =>
                  navigate(
                    `/dashboard/commit-diff/${repoId}/${p.commitSha}`,
                  )
                }
                className="panel p-3 cursor-pointer hover:glow-cyan transition-all"
              >
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span style={{ color: "var(--neon-cyan)" }}>
                    {p.commitSha.slice(0, 7)}
                  </span>
                  <span className="label-mono">{formatTime(p.pushedAt)}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span style={{ color: "var(--text-secondary)" }}>
                    {p.files.length} FILE{p.files.length !== 1 ? "S" : ""}
                  </span>
                  {adds > 0 && (
                    <span style={{ color: "var(--neon-lime)" }}>+{adds}</span>
                  )}
                  {dels > 0 && (
                    <span style={{ color: "var(--neon-red)" }}>-{dels}</span>
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
