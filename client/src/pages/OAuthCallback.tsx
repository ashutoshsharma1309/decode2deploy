import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function BrandMark() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--cream)" }}
    >
      <div className="card-light w-full max-w-sm p-10 text-center fade-up">
        <div className="flex items-center justify-center gap-3 mb-6">
          <BrandMark />
          <span
            className="heading-display text-xl"
            style={{ color: "var(--ink)" }}
          >
            CodePulse
          </span>
        </div>
        {error ? (
          <>
            <p
              className="eyebrow mb-2"
              style={{ color: "var(--red)" }}
            >
              AUTH FAILED
            </p>
            <p
              className="text-xs mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              {error}
            </p>
            <a href="/login" className="hex-btn hex-btn-dark">
              Back to login
            </a>
          </>
        ) : (
          <p
            style={{
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
            }}
            className="text-sm"
          >
            {"> completing handshake"}
            <span
              className="cursor-blink"
              style={{ color: "var(--green)" }}
            >
              _
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
