"use client";

import { RED } from "@/lib/tokens";

const STRINGS = {
  kicker: "COMBAT · AI",
};

const s = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "calc(16px + env(safe-area-inset-top))",
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    borderRadius: 10,
    cursor: "pointer",
    padding: 0,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 3,
    color: RED,
    textTransform: "uppercase",
    fontWeight: 900,
  },
  heroSection: { textAlign: "center", padding: "20px 0 24px" },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  title: { margin: "0 0 8px", fontSize: 24, fontWeight: 1000, lineHeight: 1.1 },
  subtitle: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 },
};

/**
 * @param {{ onBack: () => void, title: string, subtitle: string }} props
 */
export default function BuilderHeader({ onBack, title, subtitle }) {
  return (
    <>
      <div style={s.header}>
        <button type="button" style={s.backBtn} onClick={onBack} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div style={s.kicker}>{STRINGS.kicker}</div>
      </div>

      <div style={s.heroSection}>
        <div style={s.heroEmoji}>🤖</div>
        <h1 style={s.title}>{title}</h1>
        <p style={s.subtitle}>{subtitle}</p>
      </div>
    </>
  );
}
