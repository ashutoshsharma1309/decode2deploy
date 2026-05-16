import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";

const NAV_ITEMS = [
  { label: "REPOS", path: "/dashboard/repos" },
  { label: "REPO HEALTH", path: "/dashboard/repo-health" },
  { label: "KNOWLEDGE GRAPH", path: "__graph__" },
  { label: "SETTINGS", path: "/dashboard/settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [firstRepoId, setFirstRepoId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/repos")
      .then(({ data }) => {
        const first = (data.repos || [])[0];
        if (first) setFirstRepoId(first._id);
      })
      .catch(() => {});
  }, []);

  const handleNav = (path: string) => {
    if (path === "__graph__") {
      if (firstRepoId) navigate(`/repos/${firstRepoId}/graph`);
      else navigate("/dashboard/repos");
    } else {
      navigate(path);
    }
  };

  const isActive = (path: string) => {
    if (path === "__graph__") return location.pathname.includes("/graph");
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      <aside
        className="hidden md:flex flex-col"
        style={{
          width: "240px",
          background: "var(--bg-panel)",
          borderRight: "1px solid var(--border-strong)",
        }}
      >
        <div className="px-6 py-6 flex items-center gap-3">
          <span className="pulse-dot" />
          <span
            className="heading-display text-xl text-glow-cyan cursor-pointer"
            style={{ color: "var(--neon-cyan)" }}
            onClick={() => navigate("/")}
          >
            PULSE
          </span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="w-full text-left px-4 py-2 text-xs label-mono transition-all flex items-center gap-2 relative"
                style={{
                  color: active ? "var(--neon-cyan)" : "var(--text-secondary)",
                  background: active
                    ? "rgba(0, 240, 255, 0.06)"
                    : "transparent",
                  borderLeft: active
                    ? "2px solid var(--neon-cyan)"
                    : "2px solid transparent",
                  paddingLeft: "14px",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.color = "var(--neon-cyan)";
                }}
                onMouseLeave={(e) => {
                  if (!active)
                    e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                {"> "}
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          className="px-4 py-4 border-t"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-8 h-8 rounded-sm"
                style={{ border: "1px solid var(--border-strong)" }}
              />
            ) : (
              <div
                className="w-8 h-8 flex items-center justify-center text-xs"
                style={{
                  background: "var(--bg-elevated)",
                  color: "var(--neon-cyan)",
                  border: "1px solid var(--border-strong)",
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="text-xs font-mono truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.username || "—"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-[10px] label-mono"
            style={{ color: "var(--neon-red)" }}
          >
            {"> SIGN OUT"}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: "var(--border-default)",
            background: "var(--bg-panel)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="pulse-dot" />
            <span
              className="heading-display text-sm"
              style={{ color: "var(--neon-cyan)" }}
            >
              PULSE
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-[10px] label-mono"
            style={{ color: "var(--neon-red)" }}
          >
            {"> SIGN OUT"}
          </button>
        </div>
        <div className="p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
