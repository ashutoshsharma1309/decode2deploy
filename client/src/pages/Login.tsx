import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

export default function Login() {
  const { isAuthenticated, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [line, setLine] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/dashboard/repos");
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    const full = "> awaiting auth handshake";
    let i = 0;
    const t = setInterval(() => {
      i++;
      setLine(full.slice(0, i));
      if (i >= full.length) clearInterval(t);
    }, 55);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--cream)" }}
    >
      <div className="card-light w-full max-w-md p-10 fade-up">
        <div className="flex items-center gap-3 mb-8">
          <BrandMark />
          <span
            className="heading-display text-xl"
            style={{ color: "var(--ink)" }}
          >
            CodePulse
          </span>
        </div>
        <p
          className="text-sm mb-8"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {line}
          <span className="cursor-blink" style={{ color: "var(--green)" }}>
            _
          </span>
        </p>
        <button
          onClick={login}
          className="hex-btn hex-btn-green w-full justify-center"
        >
          Sign in with GitHub
        </button>
        <p className="eyebrow mt-6">/ / OAUTH HANDSHAKE · NO CREDENTIALS STORED</p>
      </div>
    </div>
  );
}
