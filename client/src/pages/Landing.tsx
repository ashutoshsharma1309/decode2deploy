import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/* ────────────────────────────────────────────────────────────────
 *  Brand mark (small hexagonal logo with EKG glyph)
 * ──────────────────────────────────────────────────────────────── */

function BrandMark({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const stroke = tone === "dark" ? "#1a1f2e" : "#f3e8ff";
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <path
        d="M16 3 L27 9 L27 23 L16 29 L5 23 L5 9 Z"
        stroke={stroke}
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

/* ────────────────────────────────────────────────────────────────
 *  Halftone heart with live EKG sweep — the hero mascot
 * ──────────────────────────────────────────────────────────────── */

function HalftoneHeart() {
  const heartPath =
    "M 300 510 " +
    "C 200 430, 60 320, 60 195 " +
    "C 60 110, 140 65, 200 90 " +
    "C 250 110, 285 155, 300 200 " +
    "C 315 155, 350 110, 400 90 " +
    "C 460 65, 540 110, 540 195 " +
    "C 540 320, 400 430, 300 510 Z";

  const ekgPath =
    "M 0 305 " +
    "L 130 305 L 155 250 L 175 360 L 200 305 " +
    "L 260 305 L 285 200 L 310 410 L 335 305 " +
    "L 400 305 L 425 270 L 450 340 L 600 305";

  const dots: Array<{ x: number; y: number; r: number }> = [];
  const cx = 300;
  const cy = 270;
  const step = 11;
  for (let y = 60; y < 520; y += step) {
    const offset = (Math.floor(y / step) % 2) * (step / 2);
    for (let x = 50 + offset; x < 560; x += step) {
      const dx = (x - cx) / 240;
      const dy = (y - cy) / 230;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1.05) continue;
      const r = Math.max(0.3, 4.2 * (1 - dist) - 0.4);
      dots.push({ x, y, r });
    }
  }

  return (
    <svg
      viewBox="0 0 600 600"
      className="w-full h-auto"
      style={{ maxWidth: 620, overflow: "visible" }}
    >
      <defs>
        <clipPath id="heart-clip">
          <path d={heartPath} />
        </clipPath>
      </defs>

      {/* Heart group — receives the heartbeat scale animation */}
      <g className="heart-beat">
        {/* Halftone fill clipped to heart */}
        <g clipPath="url(#heart-clip)">
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#1a1f2e" />
          ))}
        </g>

        {/* Heart outline */}
        <path
          d={heartPath}
          stroke="#1a1f2e"
          strokeWidth="3"
          fill="none"
          opacity="0.7"
        />
      </g>

      {/* EKG base trace (dim, static) — sits behind the heart */}
      <path
        d={ekgPath}
        stroke="rgba(26,31,46,0.18)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* EKG active sweep — bright, animated */}
      <path
        d={ekgPath}
        stroke="#00d97f"
        strokeWidth="3.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ekg-sweep"
      />

      {/* Endpoint pulse dot */}
      <circle
        cx="600"
        cy="305"
        r="6"
        fill="#00d97f"
        className="pulse-dot-anim"
      />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Live heart-rate line (used in How-It-Works step 2)
 * ──────────────────────────────────────────────────────────────── */

function LiveHeartRate() {
  // Repeated EKG cycles spanning the card width
  const cycle = (x0: number) =>
    `L ${x0 + 12} 70 L ${x0 + 20} 50 L ${x0 + 26} 130 L ${x0 + 34} 30 L ${
      x0 + 42
    } 70 L ${x0 + 70} 70`;
  const fullPath =
    `M 0 70 ` +
    cycle(0) +
    cycle(70) +
    cycle(140) +
    cycle(210) +
    cycle(280) +
    ` L 350 70`;

  return (
    <svg viewBox="0 0 350 140" className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="hr-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0ee07a" stopOpacity="0" />
          <stop offset="30%" stopColor="#0ee07a" stopOpacity="1" />
          <stop offset="100%" stopColor="#0ee07a" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* faint grid */}
      <g opacity="0.15">
        {[20, 40, 60, 80, 100, 120].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="350"
            y2={y}
            stroke="#0ee07a"
            strokeWidth="0.4"
          />
        ))}
      </g>

      {/* baseline (dim) */}
      <path
        d={fullPath}
        stroke="rgba(14,224,122,0.25)"
        strokeWidth="1.5"
        fill="none"
      />

      {/* active sweep */}
      <path
        d={fullPath}
        stroke="url(#hr-fade)"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ekg-sweep"
        style={{ filter: "drop-shadow(0 0 5px rgba(14,224,122,0.6))" }}
      />

      {/* BPM tag */}
      <g transform="translate(14, 20)">
        <rect width="74" height="18" rx="2" fill="#0a0d14" />
        <circle cx="12" cy="9" r="3" fill="#00d97f" className="pulse-dot-anim" />
        <text
          x="22"
          y="13"
          fill="#0ee07a"
          fontSize="10"
          fontFamily="JetBrains Mono, monospace"
          letterSpacing="1.5"
        >
          72 BPM
        </text>
      </g>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  How-it-works step glyphs
 * ──────────────────────────────────────────────────────────────── */

function IndexGlyph() {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full">
      <rect x="110" y="60" width="100" height="80" fill="#5d6bff" />
      {[
        [110, 60],
        [210, 60],
        [110, 140],
        [210, 140],
        [160, 60],
        [110, 100],
        [210, 100],
        [160, 140],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={(x as number) - 4}
          y={(y as number) - 4}
          width="8"
          height="8"
          fill="#ffd700"
        />
      ))}
      {[
        [70, 50],
        [70, 110],
        [250, 80],
        [250, 150],
        [150, 30],
        [180, 170],
      ].map(([x, y], i) => (
        <rect key={`p-${i}`} x={x} y={y} width="10" height="10" fill="#ff5fc8" />
      ))}
    </svg>
  );
}

function LearnGlyph() {
  return (
    <svg viewBox="0 0 320 200" className="w-full h-full">
      <rect x="245" y="35" width="14" height="14" fill="#ff5fc8" />
      <g transform="translate(60, 80)">
        <rect width="200" height="22" fill="#0ee07a" />
        <circle cx="14" cy="11" r="3" fill="#0a1a10" className="pulse-dot-anim" />
        <text
          x="24"
          y="15"
          fill="#0a1a10"
          fontSize="10"
          fontFamily="Space Grotesk, sans-serif"
          fontWeight="700"
        >
          1 new learning
        </text>
      </g>
      <g transform="translate(60, 102)">
        <rect width="200" height="22" fill="#fff" />
      </g>
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Step card
 * ──────────────────────────────────────────────────────────────── */

function StepCard({
  step,
  title,
  desc,
  glyph,
  delay = "",
}: {
  step: string;
  title: string;
  desc: string;
  glyph: React.ReactNode;
  delay?: string;
}) {
  return (
    <div className={`flex flex-col ${delay}`}>
      <div className="step-frame relative aspect-[16/10] mb-5 overflow-hidden">
        {[
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ].map(([cx, cy], i) => (
          <div
            key={i}
            className="absolute w-3 h-3"
            style={{
              borderTop: cy === 0 ? "1px solid rgba(255,255,255,0.4)" : "none",
              borderBottom:
                cy === 1 ? "1px solid rgba(255,255,255,0.4)" : "none",
              borderLeft: cx === 0 ? "1px solid rgba(255,255,255,0.4)" : "none",
              borderRight:
                cx === 1 ? "1px solid rgba(255,255,255,0.4)" : "none",
              left: cx === 0 ? 4 : "auto",
              right: cx === 1 ? 4 : "auto",
              top: cy === 0 ? 4 : "auto",
              bottom: cy === 1 ? 4 : "auto",
            }}
          />
        ))}
        <div className="absolute inset-6 flex items-center justify-center">
          {glyph}
        </div>
      </div>
      <p className="eyebrow-green mb-3">{step}</p>
      <h3
        className="text-2xl mb-3 heading-display"
        style={{ color: "var(--text-on-dark)" }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed"
        style={{ color: "var(--text-on-dark-soft)" }}
      >
        {desc}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
 *  Landing page
 * ──────────────────────────────────────────────────────────────── */

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAuth();
  const howItWorksRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.body.classList.add("landing-page");
    return () => document.body.classList.remove("landing-page");
  }, []);

  const handleCta = () => {
    if (isAuthenticated) navigate("/dashboard/repos");
    else login();
  };

  const scrollToHow = () =>
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <style>{`
        body.landing-page {
          background: var(--cream) !important;
          background-image:
            radial-gradient(circle, rgba(26,31,46,0.18) 1px, transparent 1px) !important;
          background-size: 22px 22px !important;
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
        style={{
          background: "rgba(235,235,229,0.88)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid var(--border-ink)",
        }}
      >
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <BrandMark />
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[
            { l: "EXAMPLES" },
            { l: "PRICING" },
            { l: "FEATURES", onClick: scrollToHow },
            { l: "ENTERPRISE" },
            { l: "BLOG" },
            { l: "RESOURCES" },
          ].map((item) => (
            <button
              key={item.l}
              onClick={item.onClick}
              className="text-xs transition-opacity hover:opacity-100"
              style={{
                color: "var(--ink)",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.1em",
                opacity: 0.8,
                fontWeight: 500,
              }}
            >
              {item.l}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleCta} className="hex-btn hex-btn-dark">
            Contact Sales
          </button>
          <button onClick={handleCta} className="hex-btn hex-btn-green">
            Sign up
          </button>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative px-8 md:px-16 pt-16 pb-24 max-w-[1400px] mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="eyebrow mb-6 fade-up">/ / REPO HEALTH · LIVE</p>
            <h1
              className="text-6xl md:text-7xl lg:text-8xl leading-[0.95] mb-8 heading-display fade-up-d1"
              style={{ color: "var(--ink)" }}
            >
              The AI Repo
              <br />
              Health Monitor.
            </h1>
            <p
              className="text-base md:text-lg mb-10 max-w-md fade-up-d2"
              style={{
                color: "var(--ink)",
                opacity: 0.8,
                fontFamily: "var(--font-mono)",
              }}
            >
              CodePulse indexes your codebase, tracks structural health
              signals, and pinpoints the files that break production at 3am.
            </p>
            <div className="flex flex-wrap gap-4 fade-up-d3">
              <button onClick={handleCta} className="hex-btn hex-btn-dark">
                Contact Sales
              </button>
              <button onClick={handleCta} className="hex-btn hex-btn-green">
                start now
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-end fade-up-d2">
            <HalftoneHeart />
          </div>
        </div>

        {/* Ticker / social proof */}
        <div
          className="mt-20 py-4 overflow-hidden text-center text-xs"
          style={{
            borderTop: "1px dashed var(--border-ink-2)",
            borderBottom: "1px dashed var(--border-ink-2)",
            color: "var(--ink)",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.16em",
          }}
        >
          <div className="marquee-track whitespace-nowrap">
            {[1, 2].map((k) => (
              <span key={k} className="flex items-center gap-12 pr-12">
                <span>OVER 9,000+ DEVS MONITOR REPOS WITH CODEPULSE</span>
                <span style={{ color: "var(--green)" }}>◆</span>
                <span>TREE-SITTER INDEXING · 12+ LANGUAGES</span>
                <span style={{ color: "var(--pink)" }}>◆</span>
                <span>PAGERANK · COUPLING · CHURN</span>
                <span style={{ color: "var(--green)" }}>◆</span>
                <span>BUILT FOR CI · ZERO CONFIG</span>
                <span style={{ color: "var(--pink)" }}>◆</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        ref={howItWorksRef}
        className="surface-night relative px-8 md:px-16 py-24"
      >
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-16">
            <span
              className="inline-block px-3 py-1 mb-6 text-[10px]"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "var(--text-on-dark)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.2em",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              HOW IT WORKS
            </span>
            <h2
              className="text-4xl md:text-6xl mb-6 heading-display"
              style={{ color: "var(--text-on-dark)" }}
            >
              How CodePulse reviews
              <br />
              every PR
            </h2>
            <p
              className="text-sm md:text-base max-w-2xl mx-auto"
              style={{
                color: "var(--text-on-dark-soft)",
                fontFamily: "var(--font-mono)",
              }}
            >
              CodePulse constructs a graph index of your codebase, then runs
              health signals across every commit to catch the risks humans
              miss.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              step="STEP 01"
              title="Indexes your codebase"
              desc="Builds a graph of your repo — files, functions, and dependencies — using tree-sitter parsing across 12+ languages."
              glyph={<IndexGlyph />}
            />
            <StepCard
              step="STEP 02"
              title="Scans health signals"
              desc="Parallel agents measure coupling, churn, and hotspot risk, then synthesize a single score on every push."
              glyph={<LiveHeartRate />}
            />
            <StepCard
              step="STEP 03"
              title="CodePulse learns your repo over time"
              desc="Tracks structural drift across snapshots and surfaces the blast-radius files before they fail."
              glyph={<LearnGlyph />}
            />
          </div>

          <div className="mt-16 text-center">
            <button onClick={handleCta} className="hex-btn hex-btn-green">
              start now
            </button>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer
        className="px-8 md:px-16 py-12"
        style={{
          background: "var(--night)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BrandMark tone="light" />
            <span
              className="heading-display"
              style={{ color: "var(--text-on-dark)" }}
            >
              CodePulse
            </span>
          </div>
          <p className="eyebrow-on-dark">REPO HEALTH INTELLIGENCE © 2026</p>
        </div>
      </footer>
    </div>
  );
}
