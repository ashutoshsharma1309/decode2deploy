import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Repos", path: "/dashboard/repos" },
  { label: "Repo Health", path: "/dashboard/repo-health" },
  { label: "Complexity", path: "/dashboard/complexity" },
  { label: "Settings", path: "/dashboard/settings" },
];

function BrandMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 3 L27 9 L27 23 L16 29 L5 23 L5 9 Z"
        stroke="#1a1f2e"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M9 16 L12 16 L14 12 L18 20 L20 16 L23 16"
        stroke="#00d97f"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => navigate(path);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "var(--cream)" }}
    >
      <aside
        className="hidden md:flex flex-col"
        style={{
          width: 240,
          background: "var(--paper)",
          borderRight: "1px solid var(--border-ink)",
        }}
      >
        <div
          className="px-6 py-6 flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <BrandMark />
          <span
            className="heading-display text-lg"
            style={{ color: "var(--ink)" }}
          >
            CodePulse
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className="w-full text-left px-4 py-2.5 text-sm transition-all relative"
                style={{
                  color: active ? "var(--ink)" : "var(--text-secondary)",
                  background: active ? "rgba(0, 217, 127, 0.10)" : "transparent",
                  borderLeft: active
                    ? "2px solid var(--green)"
                    : "2px solid transparent",
                  paddingLeft: 14,
                  fontFamily: "var(--font-display)",
                  fontWeight: active ? 600 : 500,
                  borderRadius: 2,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "var(--ink)";
                    e.currentTarget.style.background =
                      "rgba(26, 31, 46, 0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "var(--text-secondary)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div
          className="px-4 py-4 border-t"
          style={{ borderColor: "var(--border-ink)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-8 h-8 rounded-sm"
                style={{ border: "1px solid var(--border-ink-2)" }}
              />
            ) : (
              <div
                className="w-8 h-8 flex items-center justify-center text-xs"
                style={{
                  background: "var(--ink)",
                  color: "#fff",
                  borderRadius: 2,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                }}
              >
                {user?.username?.charAt(0).toUpperCase() || "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="text-xs truncate"
                style={{
                  color: "var(--ink)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                }}
              >
                {user?.username || "—"}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="text-[11px] transition-colors"
            style={{
              color: "var(--red)",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: "var(--border-ink)",
            background: "var(--paper)",
          }}
        >
          <div className="flex items-center gap-2">
            <BrandMark />
            <span
              className="heading-display text-sm"
              style={{ color: "var(--ink)" }}
            >
              CodePulse
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-[10px] eyebrow"
            style={{ color: "var(--red)" }}
          >
            Sign out
          </button>
        </div>
        <div className="p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
