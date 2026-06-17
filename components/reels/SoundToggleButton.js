"use client";

import { SpeakerIcon } from "@/components/reels/ReelIcons";
import styles from "@/components/reels/reelStyles";

/**
 * Floating mute/unmute button overlaid on the reels feed.
 *
 * Props:
 *   soundEnabled — boolean
 *   toggleMute   — () => void
 *   t            — translate(key) helper
 */
export default function SoundToggleButton({ soundEnabled, toggleMute, t }) {
  return (
    <button
      type="button"
      style={{
        ...styles.soundToggleButton,
        ...(!soundEnabled
          ? {
              width: "auto",
              borderRadius: 20,
              paddingLeft: 10,
              paddingRight: 12,
              gap: 6,
              display: "flex",
              flexDirection: "row",
              background: "rgba(0,0,0,0.65)",
              border: "1px solid rgba(255,255,255,0.2)",
            }
          : {}),
      }}
      onClick={toggleMute}
      aria-label={soundEnabled ? t("soundOn") : t("tapForSound")}
      title={soundEnabled ? t("soundOn") : t("tapForSound")}
    >
      <SpeakerIcon muted={!soundEnabled} />
      {!soundEnabled && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 900,
            letterSpacing: 0.8,
            whiteSpace: "nowrap",
            textTransform: "uppercase",
          }}
        >
          {t("tapForSound")}
        </span>
      )}
    </button>
  );
}
