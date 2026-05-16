import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    }, 60);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <div className="radial-sweep" />
      <div className="panel relative z-10 p-10 max-w-md w-full">
        <div className="flex items-center gap-3 mb-8">
          <span className="pulse-dot" />
          <span
            className="heading-display text-xl text-glow-cyan"
            style={{ color: "var(--neon-cyan)" }}
          >
            PULSE
          </span>
        </div>
        <p
          className="text-sm mb-8 font-mono"
          style={{ color: "var(--text-primary)" }}
        >
          {line}
          <span className="cursor-blink" style={{ color: "var(--neon-cyan)" }}>
            _
          </span>
        </p>
        <button onClick={login} className="btn-neon w-full justify-center">
          {"> AUTHENTICATE WITH GITHUB"}
        </button>
        <p
          className="text-[10px] mt-6 label-mono"
          style={{ color: "var(--text-muted)" }}
        >
          / / OAUTH HANDSHAKE · NO CREDENTIALS STORED
        </p>
      </div>
    </div>
  );
}
