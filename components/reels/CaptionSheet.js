"use client";

import { cleanCaption } from "@/lib/reelHelpers";
import styles from "./reelStyles";

export default function CaptionSheet({ captionSheetReelId, reels, setCaptionSheetReelId, t, currentLocale }) {
  if (!captionSheetReelId) return null;

  const sheetReel = reels.find((r) => r.id === captionSheetReelId);
  const rawCaption = sheetReel ? cleanCaption(sheetReel.description || sheetReel.caption || "") : "";
  const hashtags = rawCaption.match(/#\S+/g) || [];
  const fullCaption = rawCaption.replace(/#\S+\s*/g, "").trim();

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
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 7 }}>
              {sheetReel.contentType && (
                <span style={styles.captionMetaChip}>
                  {sheetReel.contentType === "training" ? `🥊 ${t("ctFilterTraining")}`
                    : sheetReel.contentType === "educational" ? `📚 ${t("ctFilterEducational")}`
                    : sheetReel.contentType === "lifestyle" ? `🎬 ${t("ctFilterLifestyle")}`
                    : sheetReel.contentType === "academy" ? `🎓 ${t("ctFilterAcademy")}`
                    : sheetReel.contentType === "challenge" ? `⚔️ ${t("ctFilterChallenge")}`
                    : sheetReel.contentType === "challenge_response" ? `⚔️ ${t("ctFilterChallengeResponse")}`
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
          {hashtags.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 7 }}>
              {hashtags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    ...styles.captionMetaChip,
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.1,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
