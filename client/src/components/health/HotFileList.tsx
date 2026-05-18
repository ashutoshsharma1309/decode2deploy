import { useNavigate, useParams } from "react-router-dom";

interface Props {
  files: string[];
}

export function HotFileList({ files }: Props) {
  const navigate = useNavigate();
  const { repoId } = useParams();
  if (files.length === 0) return null;
  return (
    <div className="card-light p-6">
      <div className="flex items-center justify-between mb-5">
        <p
          className="heading-display text-lg"
          style={{ color: "var(--ink)" }}
        >
          Hotspot files
        </p>
        <p className="eyebrow">HIGH CENTRALITY × HIGH CHURN</p>
      </div>
      <div className="space-y-1.5">
        {files.map((f, i) => (
          <div
            key={f}
            onClick={() => repoId && navigate(`/dashboard/repo-health/${repoId}`)}
            className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer transition-colors"
            style={{
              borderLeft: "2px solid var(--pink)",
              background: "rgba(255, 95, 200, 0.06)",
              borderRadius: 2,
              fontFamily: "var(--font-mono)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255, 95, 200, 0.12)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255, 95, 200, 0.06)")
            }
          >
            <span
              style={{ color: "var(--text-muted)", width: 28, fontSize: 11 }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              style={{ color: "var(--ink)" }}
              className="flex-1 truncate"
            >
              {f}
            </span>
            <span
              style={{
                color: "var(--pink)",
                fontSize: 10,
                letterSpacing: "0.16em",
                fontWeight: 600,
              }}
            >
              HOT
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
