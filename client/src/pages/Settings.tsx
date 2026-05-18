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
    <div className="max-w-2xl fade-up">
      <p className="eyebrow mb-2">/ / IDENTITY</p>
      <h1
        className="heading-display text-4xl mb-8"
        style={{ color: "var(--ink)" }}
      >
        Settings
      </h1>

      <div className="card-light p-8">
        <div className="flex items-center gap-4 mb-8">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-16 h-16 rounded-sm"
              style={{ border: "1px solid var(--border-ink-2)" }}
            />
          ) : (
            <div
              className="w-16 h-16 flex items-center justify-center heading-display text-2xl"
              style={{
                background: "var(--ink)",
                color: "#fff",
                borderRadius: 2,
              }}
            >
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div>
            <p
              className="heading-display text-xl"
              style={{ color: "var(--ink)" }}
            >
              {user?.username}
            </p>
            <p className="eyebrow-green">SESSION ACTIVE</p>
          </div>
        </div>

        <div
          className="space-y-2 mb-8 text-sm"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <p>
            <span style={{ color: "var(--text-secondary)" }}>
              {"> handle:"}
            </span>{" "}
            <span style={{ color: "var(--ink)" }}>{user?.username}</span>
          </p>
          <p>
            <span style={{ color: "var(--text-secondary)" }}>
              {"> email:"}
            </span>{" "}
            <span style={{ color: "var(--ink)" }}>{user?.email || "—"}</span>
          </p>
          <p>
            <span style={{ color: "var(--text-secondary)" }}>
              {"> sessions:"}
            </span>{" "}
            <span style={{ color: "var(--green)" }}>1 active</span>
          </p>
        </div>

        <button onClick={handleSignOut} className="hex-btn hex-btn-danger">
          Terminate session
        </button>
      </div>
    </div>
  );
}
