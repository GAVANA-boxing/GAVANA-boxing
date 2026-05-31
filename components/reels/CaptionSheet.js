"use client";

import { cleanCaption } from "@/lib/reelHelpers";
import styles from "./reelStyles";

export default function CaptionSheet({ captionSheetReelId, reels, setCaptionSheetReelId, t, currentLocale }) {
  if (!captionSheetReelId) return null;

  const sheetReel = reels.find((r) => r.id === captionSheetReelId);
  const fullCaption = sheetReel ? cleanCaption(sheetReel.description || sheetReel.caption || "") : "";

  return (
    <div
      style={styles.captionSheetOverlay}
      onClick={() => setCaptionSheetReelId(null)}
    >
      <div
        style={styles.captionSheet}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.captionSheetHandle} />
        <div style={styles.captionSheetHeader}>
          <span style={styles.captionSheetTitle}>{t("captionSheetTitle")}</span>
          <button
            type="button"
            style={styles.captionSheetClose}
            onClick={() => setCaptionSheetReelId(null)}
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>
        <div style={styles.captionSheetBody}>
          {fullCaption ? (
            <p style={styles.captionSheetText}>{fullCaption}</p>
          ) : (
            <p style={{ ...styles.captionSheetText, opacity: 0.35 }}>—</p>
          )}
          {sheetReel && (sheetReel.contentType || sheetReel.difficulty) && (
            <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sheetReel.contentType && (
                <span style={styles.captionMetaChip}>
                  {sheetReel.contentType === "training" ? `🥊 ${t("ctFilterTraining")}`
                    : sheetReel.contentType === "educational" ? `📚 ${t("ctFilterEducational")}`
                    : sheetReel.contentType === "lifestyle" ? `🎬 ${t("ctFilterLifestyle")}`
                    : sheetReel.contentType === "academy" ? `🎓 ${t("ctFilterAcademy")}`
                    : sheetReel.contentType === "challenge" ? `⚔️ ${t("ctFilterChallenge")}`
                    : sheetReel.contentType}
                </span>
              )}
              {sheetReel.difficulty && (
                <span style={styles.captionMetaChip}>
                  {sheetReel.difficulty === "beginner" ? `🟢 ${t("diffBeginner")}` : sheetReel.difficulty}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
