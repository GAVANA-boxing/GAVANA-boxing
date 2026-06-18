"use client";

import { SpeakerIcon } from "@/components/reels/ReelIcons";

/**
 * FeedSoundToggle
 *
 * Fixed-position mute/unmute button rendered in the top-right corner of the
 * feed. Uses SpeakerIcon from ReelIcons.
 *
 * Props:
 *   soundEnabled    – boolean
 *   onToggle        – () => void
 */
export default function FeedSoundToggle({ soundEnabled, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={soundEnabled ? "Mute" : "Unmute"}
      style={{
        position:       "fixed",
        top:            "max(env(safe-area-inset-top), 16px)",
        right:          16,
        zIndex:         50,
        padding:        "6px 8px",
        borderRadius:   8,
        background:     "rgba(0,0,0,0.45)",
        backdropFilter: "blur(8px)",
        color:          soundEnabled ? "#fff" : "rgba(255,255,255,0.55)",
        display:        "flex",
        alignItems:     "center",
        border:         "none",
        cursor:         "pointer",
      }}
    >
      <SpeakerIcon muted={!soundEnabled} />
    </button>
  );
}
