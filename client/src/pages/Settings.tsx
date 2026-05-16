import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="max-w-2xl">
      <p className="label-mono mb-2">/ / IDENTITY</p>
      <h1
        className="heading-display text-3xl mb-8 text-glow-cyan"
        style={{ color: "var(--neon-cyan)" }}
      >
        SETTINGS
      </h1>

      <div className="panel p-8">
        <div className="flex items-center gap-4 mb-6">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-16 h-16 rounded-sm border"
              style={{ borderColor: "var(--border-strong)" }}
            />
          ) : (
            <div
              className="w-16 h-16 flex items-center justify-center heading-display text-2xl"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--neon-cyan)",
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div>
            <p
              className="heading-display text-xl"
              style={{ color: "var(--text-primary)" }}
            >
              {user?.username}
            </p>
            <p
              className="label-mono"
              style={{ color: "var(--text-secondary)" }}
            >
              SESSION ACTIVE
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-8 font-mono text-sm">
          <p>
            <span style={{ color: "var(--text-secondary)" }}>{"> handle:"}</span>{" "}
            <span style={{ color: "var(--neon-cyan)" }}>{user?.username}</span>
          </p>
          <p>
            <span style={{ color: "var(--text-secondary)" }}>{"> email:"}</span>{" "}
            <span style={{ color: "var(--neon-cyan)" }}>
              {user?.email || "—"}
            </span>
          </p>
          <p>
            <span style={{ color: "var(--text-secondary)" }}>
              {"> sessions:"}
            </span>{" "}
            <span style={{ color: "var(--neon-lime)" }}>1 active</span>
          </p>
        </div>

        <button onClick={handleSignOut} className="btn-neon btn-neon-danger">
          {"> TERMINATE SESSION"}
        </button>
      </div>
    </div>
  );
}
