import { useNavigate, useParams } from "react-router-dom";

interface Props {
  files: string[];
}

export function HotFileList({ files }: Props) {
  const navigate = useNavigate();
  const { repoId } = useParams();
  if (files.length === 0) return null;
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="label-mono">HOTSPOT FILES</p>
        <p className="text-[10px] label-mono">
          HIGH CENTRALITY × HIGH CHURN
        </p>
      </div>
      <div className="space-y-1">
        {files.map((f, i) => (
          <div
            key={f}
            onClick={() => repoId && navigate(`/dashboard/repo-health/${repoId}`)}
            className="flex items-center gap-3 px-3 py-2 text-xs font-mono cursor-pointer hover:bg-[rgba(255,43,214,0.05)] transition-colors"
            style={{ borderLeft: "2px solid var(--neon-magenta)" }}
          >
            <span style={{ color: "var(--text-muted)", width: 24 }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ color: "var(--neon-cyan)" }} className="flex-1 truncate">
              {f}
            </span>
            <span style={{ color: "var(--neon-magenta)" }}>HOT</span>
          </div>
        ))}
      </div>
    </div>
  );
}
