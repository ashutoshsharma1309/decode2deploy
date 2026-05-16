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
  const map: Record<string, { color: string; label: string; pulse?: boolean }> = {
    ready: { color: "var(--neon-cyan)", label: "READY" },
    indexing: { color: "var(--neon-magenta)", label: "INDEXING", pulse: true },
    failed: { color: "var(--neon-red)", label: "FAILED" },
    idle: { color: "var(--text-muted)", label: "IDLE" },
  };
  const cfg = map[status] || map.idle;
  return (
    <span className="status-pill" style={{ color: cfg.color }}>
      {cfg.pulse && (
        <span
          className="pulse-dot pulse-dot-magenta"
          style={{ width: 6, height: 6 }}
        />
      )}
      {cfg.label}
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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="label-mono mb-2">/ / CONNECTED REPOSITORIES</p>
          <h1
            className="heading-display text-3xl text-glow-cyan"
            style={{ color: "var(--neon-cyan)" }}
          >
            REPOS
          </h1>
        </div>
        <button onClick={openModal} className="btn-neon">
          {"> CONNECT REPO"}
        </button>
      </div>

      {loading ? (
        <p className="label-mono">{"> LOADING_"}</p>
      ) : connected.length === 0 ? (
        <div className="panel p-12 text-center">
          <p
            className="heading-display text-xl mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            NO REPOS CONNECTED
          </p>
          <p
            className="text-xs mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            / / CONNECT A GITHUB REPOSITORY TO BEGIN INDEXING
          </p>
          <button onClick={openModal} className="btn-neon">
            {"> CONNECT YOUR FIRST REPO"}
          </button>
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <div
            className="grid grid-cols-12 gap-4 px-6 py-3 border-b label-mono"
            style={{ borderColor: "var(--border-default)" }}
          >
            <div className="col-span-5">REPOSITORY</div>
            <div className="col-span-2">STATUS</div>
            <div className="col-span-2">FILES</div>
            <div className="col-span-3 text-right">ACTIONS</div>
          </div>
          {connected.map((r) => {
            const ctx = contexts[r._id] || {
              indexStatus: "idle",
              lastIndexedAt: null,
              fileCount: 0,
            };
            return (
              <div
                key={r._id}
                className="grid grid-cols-12 gap-4 px-6 py-4 border-b items-center text-sm hover:bg-[rgba(0,240,255,0.03)] transition-colors"
                style={{ borderColor: "var(--border-default)" }}
              >
                <div className="col-span-5 font-mono">
                  <p style={{ color: "var(--neon-cyan)" }}>{r.fullName}</p>
                  <p
                    className="text-[10px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ID: {r.githubRepoId}
                  </p>
                </div>
                <div className="col-span-2">
                  <StatusPill status={ctx.indexStatus} />
                </div>
                <div
                  className="col-span-2 font-mono text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {ctx.fileCount}
                </div>
                <div className="col-span-3 flex justify-end gap-2">
                  <button
                    onClick={() => navigate(`/dashboard/repo-health/${r._id}`)}
                    className="text-[10px] label-mono"
                    style={{ color: "var(--neon-cyan)" }}
                  >
                    {"> HEALTH"}
                  </button>
                  <button
                    onClick={() => navigate(`/repos/${r._id}/graph`)}
                    className="text-[10px] label-mono"
                    style={{ color: "var(--neon-magenta)" }}
                  >
                    {"> GRAPH"}
                  </button>
                  <button
                    onClick={() => reindex(r._id)}
                    className="text-[10px] label-mono"
                    style={{ color: "var(--neon-lime)" }}
                  >
                    {"> RESYNC"}
                  </button>
                  <button
                    onClick={() => disconnectRepo(r._id)}
                    className="text-[10px] label-mono"
                    style={{ color: "var(--neon-red)" }}
                  >
                    {"> DROP"}
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
          style={{ background: "rgba(0, 0, 0, 0.7)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="panel w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border-default)" }}
            >
              <p
                className="heading-display text-lg"
                style={{ color: "var(--neon-cyan)" }}
              >
                CONNECT REPOSITORY
              </p>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[10px] label-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                {"> CLOSE"}
              </button>
            </div>
            <div
              className="px-6 py-3 border-b"
              style={{ borderColor: "var(--border-default)" }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="> search owner/repo_"
                className="input-neon w-full"
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
                      className="btn-neon"
                    >
                      {"> INSTALL GITHUB APP"}
                    </a>
                  )}
                </div>
              ) : availableLoading ? (
                <p className="p-6 label-mono">{"> SCANNING REPOSITORIES_"}</p>
              ) : (
                filteredAvailable.map((r) => (
                  <div
                    key={r.id}
                    className="px-6 py-3 border-b flex items-center justify-between text-sm"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    <div>
                      <p
                        className="font-mono"
                        style={{ color: "var(--neon-cyan)" }}
                      >
                        {r.fullName}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {r.isPrivate ? "PRIVATE" : "PUBLIC"} ·{" "}
                        {r.language || "—"} · ★ {r.stars}
                      </p>
                    </div>
                    {r.connected ? (
                      <span className="status-pill" style={{ color: "var(--neon-lime)" }}>
                        CONNECTED
                      </span>
                    ) : (
                      <button
                        onClick={() => connectRepo(r)}
                        className="btn-neon"
                      >
                        {"> CONNECT"}
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
