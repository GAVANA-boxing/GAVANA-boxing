"use client";

import { GOLD } from "@/lib/tokens";
import styles from "@/components/train/trainStyles";

export default function RecordingHud({
  hitCount,
  secondsLeft,
  totalSeconds,
  comboCount,
  challengeUserId,
  targetScore,
  liveScore,
  ghostBestScore,
  ghostEnabled,
  ghostScore,
  liveFeedback,
  t,
}) {
  return (
    <>
      {/* Recording HUD — top bar */}
      <div style={styles.recordingHud}>
        <span style={styles.recordDot} />
        <span>{t("trainRecording")}</span>
        <span style={styles.liveScoreHud}>{liveScore.toFixed(1)}</span>
        <strong style={{ marginLeft: "auto" }}>{Math.ceil(secondsLeft)}s</strong>
      </div>

      {/* Hit progress counter */}
      <div style={styles.hitCounter}>
        <span style={styles.hitCountNum}>{hitCount}</span>
        <span style={styles.hitCountSep}>/</span>
        <span style={styles.hitCountTarget}>{Math.round(totalSeconds * 1.2)}</span>
        <span style={styles.hitCountLabel}>hits</span>
      </div>

      {/* Combo counter */}
      {comboCount > 0 && (
        <div key={comboCount} style={styles.comboCounter} className="combo-pop">
          <span style={styles.comboLabel}>COMBO</span>
          <span style={styles.comboNum}>{comboCount}</span>
        </div>
      )}

      {/* PvP target HUD */}
      {challengeUserId && targetScore && (
        <div style={styles.ghostHud}>
          <div style={styles.ghostHudRow}>
            <span style={styles.ghostHudYouLabel}>{t("pvpYouLabel")}</span>
            <span style={{
              ...styles.ghostHudYouScore,
              color: liveScore >= targetScore ? "#34D399" : GOLD,
            }}>
              {liveScore.toFixed(1)}
            </span>
          </div>
          <span style={styles.ghostHudSep}>vs</span>
          <div style={styles.ghostHudRow}>
            <span style={styles.ghostHudGhostLabel}>🎯</span>
            <span style={styles.ghostHudGhostScore}>{targetScore.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Ghost vs You HUD */}
      {!challengeUserId && ghostBestScore !== null && ghostEnabled && (
        <div style={styles.ghostHud}>
          <div style={styles.ghostHudRow}>
            <span style={styles.ghostHudYouLabel}>YOU</span>
            <span style={styles.ghostHudYouScore}>{liveScore.toFixed(1)}</span>
          </div>
          <span style={styles.ghostHudSep}>vs</span>
          <div style={styles.ghostHudRow}>
            <span style={styles.ghostHudGhostLabel}>👻</span>
            <span style={styles.ghostHudGhostScore}>{ghostScore.toFixed(1)}</span>
          </div>
          <span style={{
            ...styles.ghostHudState,
            color: liveScore > ghostBestScore ? "#34D399"
              : liveScore >= ghostBestScore - 0.5 ? "#FB923C"
              : liveScore > ghostScore ? GOLD
              : "rgba(255,255,255,0.4)",
          }}>
            {liveScore > ghostBestScore ? "NEW BEST"
              : liveScore >= ghostBestScore - 0.5 ? "ALMOST!"
              : liveScore > ghostScore ? "AHEAD"
              : "BEHIND"}
          </span>
        </div>
      )}

      {/* Floating feedback toast */}
      {liveFeedback && (
        <div key={liveFeedback.id} style={styles.liveFeedbackBox} className="feedback-fade">
          {liveFeedback.text}
        </div>
      )}
    </>
  );
}
