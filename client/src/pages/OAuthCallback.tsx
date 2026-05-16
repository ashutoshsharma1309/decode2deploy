import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setError("Missing tokens from GitHub callback.");
      return;
    }

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);

    refreshUser()
      .then(() => navigate("/dashboard/repos", { replace: true }))
      .catch(() => setError("Failed to load profile."));
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div className="radial-sweep" />
      <div className="panel relative z-10 p-10 max-w-sm w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="pulse-dot" />
          <span
            className="heading-display text-xl text-glow-cyan"
            style={{ color: "var(--neon-cyan)" }}
          >
            PULSE
          </span>
        </div>
        {error ? (
          <>
            <p
              className="label-mono mb-2"
              style={{ color: "var(--neon-red)" }}
            >
              AUTH FAILED
            </p>
            <p
              className="text-xs mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              {error}
            </p>
            <a href="/login" className="btn-neon">
              {"< BACK TO LOGIN"}
            </a>
          </>
        ) : (
          <>
            <p className="label-mono">
              {"> COMPLETING HANDSHAKE"}
              <span
                className="cursor-blink"
                style={{ color: "var(--neon-cyan)" }}
              >
                _
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
