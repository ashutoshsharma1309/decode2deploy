import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

interface FileDiff {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
}

interface CommitData {
  commitSha: string;
  files: string[];
  pushedAt: string;
  fileDiffs: FileDiff[];
  scoreDelta?: number;
}

interface ParsedLine {
  type: "add" | "remove" | "context" | "header";
  content: string;
  oldLine?: number;
  newLine?: number;
}

function parsePatch(patch: string): ParsedLine[] {
  const lines = patch.split("\n");
  const result: ParsedLine[] = [];
  let oldLine = 1;
  let newLine = 1;
  for (const line of lines) {
    if (line.startsWith("@@")) {
      const m = line.match(/@@ -(\d+),?\d* \+(\d+),?\d* @@/);
      if (m) {
        oldLine = parseInt(m[1]);
        newLine = parseInt(m[2]);
      }
      result.push({ type: "header", content: line });
    } else if (line.startsWith("+")) {
      result.push({ type: "add", content: line.slice(1), newLine: newLine++ });
    } else if (line.startsWith("-")) {
      result.push({ type: "remove", content: line.slice(1), oldLine: oldLine++ });
    } else {
      const content = line.startsWith(" ") ? line.slice(1) : line;
      result.push({
        type: "context",
        content,
        oldLine: oldLine++,
        newLine: newLine++,
      });
    }
  }
  return result;
}

export default function CommitDiff() {
  const { repoId, sha } = useParams<{ repoId: string; sha: string }>();
  const commitSha = sha;
  const navigate = useNavigate();
  const [commit, setCommit] = useState<CommitData | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repoId || !commitSha) return;
    setLoading(true);
    axios
      .get(`/health/${repoId}/commit/${commitSha}`)
      .then(({ data }) => {
        const c =
          data.commit ||
          data.recentPushes?.find((p: CommitData) => p.commitSha === commitSha);
        if (c) {
          setCommit(c);
          if (c.fileDiffs?.length) setSelectedFile(c.fileDiffs[0].filename);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [repoId, commitSha]);

  if (loading) {
    return <p className="label-mono p-6">{"> LOADING COMMIT_"}</p>;
  }

  if (!commit) {
    return <p className="label-mono p-6">{"> COMMIT NOT FOUND"}</p>;
  }

  const sel = commit.fileDiffs.find((f) => f.filename === selectedFile);
  const totalAdds = commit.fileDiffs.reduce((s, f) => s + (f.additions || 0), 0);
  const totalDels = commit.fileDiffs.reduce((s, f) => s + (f.deletions || 0), 0);
  const delta =
    commit.scoreDelta !== undefined
      ? commit.scoreDelta
      : (totalAdds - totalDels) * 0.01;
  const deltaColor =
    delta > 0
      ? "var(--neon-lime)"
      : delta < 0
        ? "var(--neon-red)"
        : "var(--text-secondary)";

  return (
    <div className="-m-6 md:-m-8 h-[calc(100vh-0px)] flex flex-col overflow-hidden">
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{
          borderColor: "var(--border-default)",
          background: "var(--bg-panel)",
        }}
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() =>
              repoId && /^[a-f0-9]{24}$/i.test(repoId)
                ? navigate(`/dashboard/repo-health/${repoId}`)
                : navigate("/dashboard/repos")
            }
            className="btn-neon"
          >
            {"< BACK"}
          </button>
          <div>
            <p className="label-mono">COMMIT</p>
            <p
              className="font-mono text-sm text-glow-cyan"
              style={{ color: "var(--neon-cyan)" }}
            >
              {commitSha?.slice(0, 12)}
            </p>
          </div>
          <div>
            <p className="label-mono">PUSHED</p>
            <p
              className="font-mono text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {new Date(commit.pushedAt).toISOString().slice(0, 19).replace("T", " ")}
            </p>
          </div>
        </div>

        <div className="panel px-4 py-2">
          <p className="label-mono">SCORE Δ</p>
          <p
            className="heading-display text-lg"
            style={{ color: deltaColor, textShadow: "0 0 6px currentColor" }}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className="w-72 overflow-y-auto border-r"
          style={{
            borderColor: "var(--border-default)",
            background: "var(--bg-panel)",
          }}
        >
          <p className="label-mono p-3">
            CHANGED FILES ({commit.fileDiffs.length})
          </p>
          {commit.fileDiffs.map((f) => (
            <button
              key={f.filename}
              onClick={() => setSelectedFile(f.filename)}
              className="w-full text-left px-3 py-2 text-xs font-mono transition-colors hover:bg-[rgba(0,240,255,0.05)]"
              style={{
                color:
                  selectedFile === f.filename
                    ? "var(--neon-cyan)"
                    : "var(--text-secondary)",
                borderLeft:
                  selectedFile === f.filename
                    ? "2px solid var(--neon-cyan)"
                    : "2px solid transparent",
              }}
            >
              <div className="truncate">{f.filename}</div>
              <div className="flex gap-3 mt-1 text-[10px]">
                <span style={{ color: "var(--neon-lime)" }}>+{f.additions}</span>
                <span style={{ color: "var(--neon-red)" }}>-{f.deletions}</span>
              </div>
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-auto">
          {sel?.patch ? (
            <div className="font-mono text-[11px] leading-relaxed">
              {parsePatch(sel.patch).map((line, i) => {
                const bg =
                  line.type === "add"
                    ? "rgba(182, 255, 60, 0.06)"
                    : line.type === "remove"
                      ? "rgba(255, 56, 96, 0.06)"
                      : line.type === "header"
                        ? "rgba(0, 240, 255, 0.06)"
                        : "transparent";
                const borderColor =
                  line.type === "add"
                    ? "var(--neon-lime)"
                    : line.type === "remove"
                      ? "var(--neon-red)"
                      : "transparent";
                const color =
                  line.type === "add"
                    ? "var(--neon-lime)"
                    : line.type === "remove"
                      ? "var(--neon-red)"
                      : line.type === "header"
                        ? "var(--neon-cyan)"
                        : "var(--text-primary)";
                return (
                  <div
                    key={i}
                    className="flex"
                    style={{
                      background: bg,
                      borderLeft: `2px solid ${borderColor}`,
                    }}
                  >
                    <div
                      className="w-12 text-right px-2 select-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {line.oldLine ?? ""}
                    </div>
                    <div
                      className="w-12 text-right px-2 select-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {line.newLine ?? ""}
                    </div>
                    <div className="w-6 text-center select-none" style={{ color }}>
                      {line.type === "add"
                        ? "+"
                        : line.type === "remove"
                          ? "-"
                          : ""}
                    </div>
                    <div
                      className="flex-1 px-2 whitespace-pre"
                      style={{ color }}
                    >
                      {line.content}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="label-mono p-6">{"> NO DIFF DATA"}</p>
          )}
        </main>
      </div>
    </div>
  );
}
