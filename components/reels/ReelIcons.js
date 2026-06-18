"use client";

import { blackAlpha, GOLD, goldAlpha } from "@/lib/tokens";
import styles from "./reelStyles";

export function LikeIcon({ filled }) {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20.8 4.9c-2-2-5.2-1.8-7 .4L12 7.1l-1.8-1.8c-1.8-2.2-5-2.4-7-.4-2.2 2.2-2 5.7.4 8.1l8.4 7.8 8.4-7.8c2.4-2.4 2.6-5.9.4-8.1Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GloveIcon({ filled }) {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      {/* Main glove body */}
      <path
        d="M5 11C5 7.7 7.7 5 11 5h2c3.3 0 6 2.7 6 6v2.5c0 2.2-1.8 4-4 4H9c-2.2 0-4-1.8-4-4V11Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wrist strap */}
      <path d="M5 17.5h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      {/* Cuff */}
      <path d="M6.5 20h11" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" />
    </svg>
  );
}

export function BackArrowIcon() {
  return (
    <svg style={styles.backArrowSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 5 8 12l7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SpeakerIcon({ muted }) {
  return (
    <svg style={styles.soundSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 9.2h3.4l4.8-4v13.6l-4.8-4H4.5V9.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {muted ? (
        <path d="m17 9 4 4M21 9l-4 4" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
      ) : (
        <>
          <path d="M16.2 8.2c1.1 1 1.7 2.3 1.7 3.8s-.6 2.8-1.7 3.8" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
          <path d="M18.7 5.8c1.8 1.6 2.8 3.8 2.8 6.2s-1 4.6-2.8 6.2" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.8 5.4h14.4v10.1H9.5L5 19.2v-3.7H4.8V5.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 12.5 18.5 5l-3 14-3.9-4.3-4.6-2.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ViewIcon() {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M2.8 12s3.4-5.5 9.2-5.5 9.2 5.5 9.2 5.5-3.4 5.5-9.2 5.5S2.8 12 2.8 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.45" />
    </svg>
  );
}

export function BookmarkIcon({ filled }) {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 4.5h10v15l-5-3.2-5 3.2v-15Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RobotIcon() {
  return (
    <svg style={styles.actionSvg} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="8" width="14" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.45" />
      <path
        d="M12 5v3M8.5 12h.1M15.5 12h.1M9 15h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AISparkIcon() {
  return (
    <svg style={{ ...styles.actionSvg, width: 18, height: 18 }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9.5 3 4 13h7l-1.5 8L20 11h-7L14.5 3z"
        fill="none" stroke="currentColor" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export function CenterPlayIcon() {
  return (
    <div style={{
      width: 72, height: 72, borderRadius: "50%",
      background: blackAlpha(0.55),
      border: "2px solid rgba(255,255,255,0.32)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    }}>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="white" aria-hidden="true">
        <path d="M8 5.5v13l11-6.5-11-6.5Z" />
      </svg>
    </div>
  );
}

export function DemoReelVisual() {
  return (
    <div style={styles.demoReel}>
      <div style={styles.demoVignette} />
    </div>
  );
}

export function ReelFallbackVisual({ reel }) {
  const hasNoVideo = !reel?.videoUrl;
  const score = reel?.sessionScore ?? reel?.sourceSessionScore ?? null;

  // Text-only training reel — no video was ever recorded. Show a clean card.
  if (hasNoVideo) {
    return (
      <div style={styles.reelFallback}>
        <div style={styles.reelFallbackLight} />
        <div style={styles.reelFallbackContent}>
          <span style={styles.reelFallbackKicker}>GAVANA BOXING</span>
          <strong style={styles.reelFallbackTitle}>
            {reel?.caption || "Training complete"}
          </strong>
          {typeof score === "number" && score > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 18, fontWeight: 900, color: GOLD,
              background: goldAlpha(0.12), border: `1px solid ${goldAlpha(0.28)}`,
              borderRadius: 8, padding: "4px 12px", marginTop: 4,
            }}>
              ⭐ {score.toFixed(1)}/10
            </span>
          )}
        </div>
      </div>
    );
  }

  // Had a video URL but failed to load — show error.
  return (
    <div style={styles.reelFallback}>
      <div style={styles.reelFallbackLight} />
      <div style={styles.reelFallbackContent}>
        <span style={styles.reelFallbackKicker}>GAVANA BOXING</span>
        <strong style={styles.reelFallbackTitle}>
          {reel?.description || reel?.caption || "Training reel unavailable"}
        </strong>
        <span style={styles.reelFallbackText}>
          Video could not load. Try refreshing or opening the reel again.
        </span>
      </div>
    </div>
  );
}
