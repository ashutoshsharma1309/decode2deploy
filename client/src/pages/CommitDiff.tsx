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
      result.push({
        type: "remove",
        content: line.slice(1),
        oldLine: oldLine++,
      });
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
          data.recentPushes?.find(
            (p: CommitData) => p.commitSha === commitSha,
          );
        if (c) {
          setCommit(c);
          if (c.fileDiffs?.length) setSelectedFile(c.fileDiffs[0].filename);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [repoId, commitSha]);

  if (loading) {
    return (
      <div
        className="surface-night min-h-screen p-10"
        style={{ background: "var(--night)" }}
      >
        <p
          className="text-sm"
          style={{
            color: "var(--text-on-dark-soft)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {"> loading commit_"}
        </p>
      </div>
    );
  }

  if (!commit) {
    return (
      <div
        className="surface-night min-h-screen p-10"
        style={{ background: "var(--night)" }}
      >
        <p
          className="text-sm"
          style={{
            color: "var(--text-on-dark-soft)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {"> commit not found"}
        </p>
      </div>
    );
  }

  const sel = commit.fileDiffs.find((f) => f.filename === selectedFile);
  const totalAdds = commit.fileDiffs.reduce(
    (s, f) => s + (f.additions || 0),
    0,
  );
  const totalDels = commit.fileDiffs.reduce(
    (s, f) => s + (f.deletions || 0),
    0,
  );
  const delta =
    commit.scoreDelta !== undefined
      ? commit.scoreDelta
      : (totalAdds - totalDels) * 0.01;
  const deltaColor =
    delta > 0
      ? "var(--green)"
      : delta < 0
        ? "var(--red)"
        : "var(--text-on-dark-soft)";

  return (
    <div
      className="surface-night h-screen flex flex-col overflow-hidden"
      style={{ background: "var(--night)" }}
    >
      <div
        className="px-6 py-4 flex items-center justify-between flex-wrap gap-4"
        style={{
          background: "var(--night-2)",
          borderBottom: "1px solid var(--border-night-2)",
        }}
      >
        <div className="flex items-center gap-6 flex-wrap">
          <button
            onClick={() =>
              repoId && /^[a-f0-9]{24}$/i.test(repoId)
                ? navigate(`/dashboard/repo-health/${repoId}`)
                : navigate("/dashboard/repos")
            }
            className="hex-btn hex-btn-green"
            style={{ padding: "8px 18px", fontSize: 12 }}
          >
            ← Back
          </button>
          <div>
            <p className="eyebrow-on-dark">COMMIT</p>
            <p
              className="text-sm mt-1"
              style={{
                color: "var(--green)",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
              }}
            >
              {commitSha?.slice(0, 12)}
            </p>
          </div>
          <div>
            <p className="eyebrow-on-dark">PUSHED</p>
            <p
              className="text-xs mt-1"
              style={{
                color: "var(--text-on-dark-soft)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {new Date(commit.pushedAt)
                .toISOString()
                .slice(0, 19)
                .replace("T", " ")}
            </p>
          </div>
        </div>

        <div
          className="px-5 py-2"
          style={{
            background: "var(--night-3)",
            border: "1px solid var(--border-night-2)",
            borderRadius: 2,
          }}
        >
          <p className="eyebrow-on-dark">SCORE Δ</p>
          <p
            className="heading-display text-xl mt-1"
            style={{ color: deltaColor }}
          >
            {delta > 0 ? "+" : ""}
            {delta.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <aside
          className="w-72 overflow-y-auto"
          style={{
            background: "var(--night-2)",
            borderRight: "1px solid var(--border-night-2)",
          }}
        >
          <p className="eyebrow-on-dark p-4">
            CHANGED FILES ({commit.fileDiffs.length})
          </p>
          {commit.fileDiffs.map((f) => (
            <button
              key={f.filename}
              onClick={() => setSelectedFile(f.filename)}
              className="w-full text-left px-4 py-3 text-xs transition-colors"
              style={{
                color:
                  selectedFile === f.filename
                    ? "var(--green)"
                    : "var(--text-on-dark-soft)",
                background:
                  selectedFile === f.filename
                    ? "rgba(0, 217, 127, 0.08)"
                    : "transparent",
                borderLeft:
                  selectedFile === f.filename
                    ? "2px solid var(--green)"
                    : "2px solid transparent",
                fontFamily: "var(--font-mono)",
              }}
            >
              <div className="truncate font-semibold">{f.filename}</div>
              <div className="flex gap-3 mt-1.5" style={{ fontSize: 10 }}>
                <span style={{ color: "var(--green)" }}>+{f.additions}</span>
                <span style={{ color: "var(--red)" }}>-{f.deletions}</span>
              </div>
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-auto">
          {sel?.patch ? (
            <div
              className="text-[12px] leading-relaxed"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {parsePatch(sel.patch).map((line, i) => {
                const cls =
                  line.type === "add"
                    ? "diff-add"
                    : line.type === "remove"
                      ? "diff-remove"
                      : line.type === "header"
                        ? "diff-header"
                        : "";
                const borderColor =
                  line.type === "add"
                    ? "var(--green)"
                    : line.type === "remove"
                      ? "var(--red)"
                      : "transparent";
                return (
                  <div
                    key={i}
                    className={`flex ${cls}`}
                    style={{
                      borderLeft: `2px solid ${borderColor}`,
                    }}
                  >
                    <div
                      className="w-12 text-right px-2 select-none"
                      style={{ color: "var(--text-on-dark-muted)" }}
                    >
                      {line.oldLine ?? ""}
                    </div>
                    <div
                      className="w-12 text-right px-2 select-none"
                      style={{ color: "var(--text-on-dark-muted)" }}
                    >
                      {line.newLine ?? ""}
                    </div>
                    <div className="w-6 text-center select-none">
                      {line.type === "add"
                        ? "+"
                        : line.type === "remove"
                          ? "-"
                          : ""}
                    </div>
                    <div className="flex-1 px-2 whitespace-pre">
                      {line.content}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p
              className="p-6 text-sm"
              style={{
                color: "var(--text-on-dark-soft)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {"> no diff data"}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
