"use client";

import Image from "next/image";
import styles from "@/components/coach/coachIdStyles";

const STRINGS = {
  mn: { reels: "Видео клипүүд" },
  en: { reels: "Reels" },
};

function t(locale, key) {
  return (STRINGS[locale] || STRINGS.en)[key] ?? key;
}

export default function CoachReelsSection({ locale, reels, onReelClick }) {
  if (!reels.length) return null;

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{t(locale, "reels")}</h2>
      <div style={styles.reelsGrid}>
        {reels.slice(0, 6).map((reel) => (
          <button
            key={reel.id}
            type="button"
            style={styles.reelThumb}
            onClick={() => onReelClick(reel.id)}
          >
            {reel.thumbnailUrl ? (
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <Image src={reel.thumbnailUrl} alt="" fill style={{ objectFit: "cover" }} />
              </div>
            ) : (
              <div style={styles.reelThumbPlaceholder}>▶</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
