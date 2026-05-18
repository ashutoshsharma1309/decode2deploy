import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

interface AvailableRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  isPrivate: boolean;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
  connected: boolean;
}

interface ConnectedRepo {
  _id: string;
  owner: string;
  name: string;
  fullName: string;
  githubRepoId: number;
  createdAt: string;
}

interface ContextStatus {
  indexStatus: "idle" | "indexing" | "ready" | "failed";
  lastIndexedAt: string | null;
  fileCount: number;
}

function StatusPill({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ready: "status-pill-ready",
    indexing: "status-pill-indexing",
    failed: "status-pill-failed",
    idle: "status-pill-idle",
  };
  const label: Record<string, string> = {
    ready: "READY",
    indexing: "INDEXING",
    failed: "FAILED",
    idle: "IDLE",
  };
  return (
    <span className={`status-pill ${cls[status] || cls.idle}`}>
      {status === "indexing" && (
        <span
          className="pulse-dot-anim"
          style={{
            width: 6,
            height: 6,
            background: "#a3007a",
            borderRadius: "50%",
          }}
        />
      )}
      {label[status] || "IDLE"}
    </span>
  );
}

export default function Repos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on } = useSocket(user?._id);
  const [connected, setConnected] = useState<ConnectedRepo[]>([]);
  const [available, setAvailable] = useState<AvailableRepo[]>([]);
  const [contexts, setContexts] = useState<Record<string, ContextStatus>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [needsInstall, setNeedsInstall] = useState<string | null>(null);
  const [installUrl, setInstallUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [availableLoading, setAvailableLoading] = useState(false);
  const fetchedAvailable = useRef(false);

  const fetchConnected = useCallback(async () => {
    try {
      const [{ data: r }, { data: c }] = await Promise.all([
        api.get("/repos"),
        api.get("/repos/context-status"),
      ]);
      setConnected(r.repos || []);
      setContexts(c.contexts || {});
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailable = useCallback(async () => {
    setAvailableLoading(true);
    setNeedsInstall(null);
    try {
      const { data } = await api.get("/repos/available");
      setAvailable(data.repos || []);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.needsInstall) {
        setNeedsInstall(data.error || "GitHub App not installed");
        setInstallUrl(data.installUrl || null);
      }
    } finally {
      setAvailableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnected();
  }, [fetchConnected]);

  useEffect(() => {
    const cleanup = on("context:status", () => fetchConnected());
    return cleanup;
  }, [on, fetchConnected]);

  const openModal = () => {
    setModalOpen(true);
    if (!fetchedAvailable.current) {
      fetchedAvailable.current = true;
      fetchAvailable();
    }
  };

  const connectRepo = async (r: AvailableRepo) => {
    try {
      await api.post("/repos/connect", {
        owner: r.owner,
        name: r.name,
        fullName: r.fullName,
        githubRepoId: r.id,
      });
      await fetchConnected();
      setAvailable((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, connected: true } : x)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const disconnectRepo = async (id: string) => {
    if (!confirm("Disconnect repo?")) return;
    await api.delete(`/repos/${id}`);
    await fetchConnected();
  };

  const reindex = async (id: string) => {
    await api.post(`/repos/${id}/index`).catch(() => {});
    await fetchConnected();
  };

  const filteredAvailable = available.filter((r) =>
    r.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fade-up">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <p className="eyebrow mb-2">/ / CONNECTED REPOSITORIES</p>
          <h1
            className="heading-display text-4xl"
            style={{ color: "var(--ink)" }}
          >
            Repos
          </h1>
        </div>
        <button onClick={openModal} className="hex-btn hex-btn-green">
          + Connect repo
        </button>
      </div>

      {loading ? (
        <p
          className="text-sm"
          style={{
            color: "var(--text-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {"> loading_"}
        </p>
      ) : connected.length === 0 ? (
        <div className="card-light p-12 text-center">
          <p
            className="heading-display text-2xl mb-3"
            style={{ color: "var(--ink)" }}
          >
            No repos connected
          </p>
          <p
            className="text-sm mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            Connect a GitHub repository to begin indexing health signals.
          </p>
          <button onClick={openModal} className="hex-btn hex-btn-green">
            Connect your first repo
          </button>
        </div>
      ) : (
        <div className="card-light p-0 overflow-hidden">
          <div
            className="grid grid-cols-12 gap-4 px-6 py-3 border-b eyebrow"
            style={{ borderColor: "var(--border-ink)" }}
          >
            <div className="col-span-5">REPOSITORY</div>
            <div className="col-span-2">STATUS</div>
            <div className="col-span-2">FILES</div>
            <div className="col-span-3 text-right">ACTIONS</div>
          </div>
          {connected.map((r, idx) => {
            const ctx = contexts[r._id] || {
              indexStatus: "idle",
              lastIndexedAt: null,
              fileCount: 0,
            };
            return (
              <div
                key={r._id}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center text-sm transition-colors"
                style={{
                  borderTop:
                    idx > 0 ? "1px solid var(--border-ink)" : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(0,217,127,0.04)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <div className="col-span-5">
                  <p
                    style={{
                      color: "var(--ink)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                    }}
                  >
                    {r.fullName}
                  </p>
                  <p
                    className="text-[10px] mt-1"
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    ID · {r.githubRepoId}
                  </p>
                </div>
                <div className="col-span-2">
                  <StatusPill status={ctx.indexStatus} />
                </div>
                <div
                  className="col-span-2 text-xs"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {ctx.fileCount}
                </div>
                <div className="col-span-3 flex justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => navigate(`/dashboard/repo-health/${r._id}`)}
                    className="hex-btn hex-btn-dark"
                    style={{ padding: "8px 16px", fontSize: 12 }}
                  >
                    Health
                  </button>
                  <button
                    onClick={() => reindex(r._id)}
                    className="hex-btn hex-btn-ghost"
                    style={{ padding: "8px 16px", fontSize: 12 }}
                  >
                    Resync
                  </button>
                  <button
                    onClick={() => disconnectRepo(r._id)}
                    className="text-[11px]"
                    style={{
                      color: "var(--red)",
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "8px 12px",
                    }}
                  >
                    Drop
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(26, 31, 46, 0.45)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="card-light w-full max-w-2xl max-h-[80vh] flex flex-col p-0 fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border-ink)" }}
            >
              <p
                className="heading-display text-lg"
                style={{ color: "var(--ink)" }}
              >
                Connect repository
              </p>
              <button
                onClick={() => setModalOpen(false)}
                className="eyebrow"
                style={{ color: "var(--text-secondary)" }}
              >
                CLOSE
              </button>
            </div>
            <div
              className="px-6 py-3 border-b"
              style={{ borderColor: "var(--border-ink)" }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="search owner/repo"
                className="input-light w-full"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {needsInstall ? (
                <div className="p-6 text-center">
                  <p
                    className="text-sm mb-4"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {needsInstall}
                  </p>
                  {installUrl && (
                    <a
                      href={installUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hex-btn hex-btn-green"
                    >
                      Install GitHub App
                    </a>
                  )}
                </div>
              ) : availableLoading ? (
                <p
                  className="p-6 text-sm"
                  style={{
                    color: "var(--text-secondary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {"> scanning repositories_"}
                </p>
              ) : (
                filteredAvailable.map((r, idx) => (
                  <div
                    key={r.id}
                    className="px-6 py-3 flex items-center justify-between text-sm"
                    style={{
                      borderTop:
                        idx > 0 ? "1px solid var(--border-ink)" : "none",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          color: "var(--ink)",
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                        }}
                      >
                        {r.fullName}
                      </p>
                      <p
                        className="text-[10px] mt-1"
                        style={{
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-mono)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {r.isPrivate ? "PRIVATE" : "PUBLIC"} ·{" "}
                        {r.language || "—"} · ★ {r.stars}
                      </p>
                    </div>
                    {r.connected ? (
                      <span className="status-pill status-pill-ready">
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() => connectRepo(r)}
                        className="hex-btn hex-btn-green"
                        style={{ padding: "8px 18px", fontSize: 12 }}
                      >
                        Connect
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
