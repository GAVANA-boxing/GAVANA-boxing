"use client";

import { RED } from "@/lib/tokens";

// ─── Shared icon style ────────────────────────────────────────────────────────
export const ic = {
  width: 22,
  height: 22,
  display: "block",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  transition: "color 160ms ease",
};

export function FeedIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="13" rx="1.5"/>
      <rect x="14" y="8" width="7" height="13" rx="1.5"/>
    </svg>
  );
}

export function FightersIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5" r="2.5"/>
      <path d="M8 22v-6l-2-4h12l-2 4v6"/>
      <path d="M8 14h8"/>
    </svg>
  );
}

export function CoachIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6l-.7 2H9l-.7-2A7 7 0 0 1 12 2Z"/>
      <path d="M9 17v1a3 3 0 0 0 6 0v-1"/>
      <path d="M9.5 9.5 12 12l2.5-2.5"/>
    </svg>
  );
}

export function SparringIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z"/>
    </svg>
  );
}

export function ChallengesIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
      <path d="M4 22h16"/>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
    </svg>
  );
}

export function ExploreIcon({ active }) {
  return (
    <svg style={{ ...ic, color: active ? RED : "rgba(255,255,255,0.38)" }} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  );
}

export function TrainIcon() {
  return (
    <svg style={{ width: 20, height: 20, display: "block", fill: "#fff", strokeWidth: 0 }} viewBox="0 0 24 24" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ display: "block" }}>
      <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
    </svg>
  );
}
