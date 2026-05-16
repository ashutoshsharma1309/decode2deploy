import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

function NodeGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="10" cy="14" r="3" fill="var(--neon-cyan)" />
      <circle cx="38" cy="14" r="3" fill="var(--neon-cyan)" />
      <circle cx="24" cy="36" r="3" fill="var(--neon-cyan)" />
      <line x1="10" y1="14" x2="24" y2="36" stroke="var(--neon-cyan)" strokeWidth="1" opacity="0.6" />
      <line x1="38" y1="14" x2="24" y2="36" stroke="var(--neon-cyan)" strokeWidth="1" opacity="0.6" />
      <line x1="10" y1="14" x2="38" y2="14" stroke="var(--neon-cyan)" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}

function WaveGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <path
        d="M2 24 L8 24 L11 12 L14 36 L18 18 L22 30 L26 14 L30 32 L34 22 L37 26 L46 26"
        stroke="var(--neon-cyan)"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
  );
}

function HeatmapGlyph() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3].map((c) => {
          const intensity = Math.abs(Math.sin((r + 1) * (c + 1) * 0.7));
          return (
            <rect
              key={`${r}-${c}`}
              x={4 + c * 10}
              y={4 + r * 10}
              width="9"
              height="9"
              fill="var(--neon-cyan)"
              opacity={intensity * 0.9 + 0.1}
            />
          );
        }),
      )}
    </svg>
  );
}

function FeatureCard({
  title,
  desc,
  glyph,
}: {
  title: string;
  desc: string;
  glyph: React.ReactNode;
}) {
  return (
    <div className="panel p-6 hover:glow-cyan transition-all duration-200">
      <div className="mb-4">{glyph}</div>
      <h3
        className="heading-display text-lg text-glow-cyan mb-2"
        style={{ color: "var(--neon-cyan)" }}
      >
        {title}
      </h3>
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {desc}
      </p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const [indexedCount, setIndexedCount] = useState<string>("--");
  const [now, setNow] = useState(new Date().toISOString().slice(11, 19));

  useEffect(() => {
    const t = setInterval(
      () => setNow(new Date().toISOString().slice(11, 19)),
      1000,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get("/repos")
      .then(({ data }) => setIndexedCount(String((data.repos || []).length)))
      .catch(() => setIndexedCount("--"));
  }, [isAuthenticated]);

  const handleCta = () => {
    if (isAuthenticated) navigate("/dashboard/repos");
    else login();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="radial-sweep" />

      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <span className="pulse-dot" />
          <span
            className="heading-display text-2xl text-glow-cyan"
            style={{ color: "var(--neon-cyan)" }}
          >
            PULSE
          </span>
        </div>
        <button onClick={handleCta} className="btn-neon">
          {isAuthenticated ? "> ENTER DASHBOARD" : "> AUTHENTICATE"}
        </button>
      </header>

      <main className="relative z-10 px-8 pt-16 pb-32 max-w-6xl mx-auto">
        <div className="mb-20">
          <p className="label-mono mb-6">/ / SYSTEM ONLINE</p>
          <h1
            className="heading-display text-6xl md:text-8xl mb-8 text-glow-cyan"
            style={{ color: "var(--text-primary)" }}
          >
            REPO HEALTH
            <br />
            <span style={{ color: "var(--neon-cyan)" }}>INTELLIGENCE</span>
          </h1>
          <p
            className="text-sm md:text-base mb-10 max-w-2xl"
            style={{ color: "var(--text-secondary)" }}
          >
            / / SEE YOUR CODEBASE'S VITALS IN REAL TIME. INDEX EVERY MODULE.
            SURFACE HOTSPOTS. WATCH HEALTH SIGNALS PULSE WITH EVERY COMMIT.
          </p>
          <button onClick={handleCta} className="btn-neon">
            {isAuthenticated ? "> ENTER DASHBOARD" : "> AUTHENTICATE WITH GITHUB"}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-20">
          <FeatureCard
            title="KNOWLEDGE GRAPH"
            desc="Force-directed map of every module, function, and dependency. PageRank-weighted."
            glyph={<NodeGlyph />}
          />
          <FeatureCard
            title="HEALTH SIGNALS"
            desc="Coupling, churn, and confidence — distilled into one score that updates on every push."
            glyph={<WaveGlyph />}
          />
          <FeatureCard
            title="HOTSPOT MAP"
            desc="Files with high centrality and high churn — the ones that break production at 3am."
            glyph={<HeatmapGlyph />}
          />
        </div>
      </main>

      <footer
        className="fixed bottom-0 left-0 right-0 z-10 border-t flex justify-between items-center px-8 py-3 text-[10px]"
        style={{
          borderColor: "var(--border-default)",
          background: "rgba(5, 6, 10, 0.85)",
          backdropFilter: "blur(8px)",
          color: "var(--text-secondary)",
        }}
      >
        <span className="label-mono">
          STATUS: <span style={{ color: "var(--neon-lime)" }}>ONLINE</span>
        </span>
        <span className="label-mono">
          INDEXED REPOS:{" "}
          <span style={{ color: "var(--neon-cyan)" }}>{indexedCount}</span>
        </span>
        <span className="label-mono">
          LAST PULSE: <span style={{ color: "var(--neon-cyan)" }}>{now}</span>
        </span>
      </footer>
    </div>
  );
}
