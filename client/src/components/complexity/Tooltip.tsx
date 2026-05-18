import type { ReactNode } from "react";

/**
 * Lightweight hover tooltip — pure CSS-driven (.tt-trigger / .tt-bubble).
 * Wraps any trigger element and shows the explanation in a bubble above it.
 */
export function InfoTooltip({
  children,
  content,
}: {
  children: ReactNode;
  content: ReactNode;
}) {
  return (
    <span className="tt-trigger" tabIndex={0}>
      {children}
      <span className="tt-bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}

/** Small "i" glyph used next to metric labels. */
export function InfoGlyph() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ marginLeft: 4, opacity: 0.55 }}
    >
      <circle
        cx="6"
        cy="6"
        r="5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <circle cx="6" cy="3.5" r="0.6" fill="currentColor" />
      <line
        x1="6"
        y1="5.5"
        x2="6"
        y2="8.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
