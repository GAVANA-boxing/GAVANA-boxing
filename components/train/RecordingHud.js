"use client";

import { GOLD } from "@/lib/tokens";
import { FOCUS_COLORS } from "@/lib/drillConfig";
import styles from "@/components/train/trainStyles";
import MovementTimeline from "@/components/train/MovementTimeline";

export default function RecordingHud({
  hitCount,
  secondsLeft,
  totalSeconds,
  comboCount,
  drillConfig,
  challengeUserId,
  targetScore,
  liveScore,
  ghostBestScore,
  ghostEnabled,
  ghostScore,
  liveFeedback,
  movementEvents,
  sessionStartTime,
  t,
}) {
  const focusColor = drillConfig?.focusType ? (FOCUS_COLORS[drillConfig.focusType] || "rgba(255,255,255,0.4)") : null;

  return (
    <>
      {/* Recording bar */}
      <div style={styles.recordingHud}>
        <span style={styles.recordDot} />
        <span>{t("trainRecording")}</span>

        {/* Drill focus label */}
        {drillConfig?.focusLabel && focusColor && (
          <span style={{
            fontSize: 8, fontWeight: 900, letterSpacing: 1.2,
            color: focusColor,
            background: `${focusColor}16`,
            border: `1px solid ${focusColor}28`,
            borderRadius: 4, padding: "2px 6px",
            textTransform: "uppercase",
          }}>
            {drillConfig.focusLabel}
          </span>
        )}

        <span style={styles.liveScoreHud}>{liveScore.toFixed(1)}</span>
        <strong style={{ marginLeft: "auto" }}>{Math.ceil(secondsLeft)}s</strong>
      </div>

      {/* Movement counter — no hardcoded max, target from drillConfig only */}
      <div style={styles.hitCounter}>
        {hitCount === 0 ? (
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 0.3 }}>
            AI watching movement
          </span>
        ) : (
          <>
            <span style={styles.hitCountNum}>{hitCount}</span>
            {drillConfig?.targetMovements != null && (
              <>
                <span style={styles.hitCountSep}>/</span>
                <span style={styles.hitCountTarget}>{drillConfig.targetMovements}</span>
              </>
            )}
            <span style={styles.hitCountLabel}>
              {drillConfig?.targetMovements != null ? "hits" : "movements"}
            </span>
          </>
        )}
      </div>

      {/* Combo counter */}
      {comboCount > 0 && (
        <div key={comboCount} style={styles.comboCounter} className="combo-pop">
          <span style={styles.comboLabel}>COMBO</span>
          <span style={styles.comboNum}>{comboCount}</span>
        </div>
      )}

      {/* PvP target */}
      {challengeUserId && targetScore && (
        <div style={styles.ghostHud}>
          <div style={styles.ghostHudRow}>
            <span style={styles.ghostHudYouLabel}>{t("pvpYouLabel")}</span>
            <span style={{ ...styles.ghostHudYouScore, color: liveScore >= targetScore ? "#34D399" : GOLD }}>
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

      {/* Ghost vs You */}
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

      {/* Feedback toast */}
      {liveFeedback && (
        <div key={liveFeedback.id} style={styles.liveFeedbackBox} className="feedback-fade">
          {liveFeedback.text}
        </div>
      )}

      {/* Movement timeline */}
      <MovementTimeline events={movementEvents} sessionStartTime={sessionStartTime} />
    </>
  );
}
