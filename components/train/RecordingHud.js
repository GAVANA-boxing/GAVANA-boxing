"use client";

import { GOLD } from "@/lib/tokens";
import { FOCUS_COLORS } from "@/lib/drillConfig";
import styles from "@/components/train/trainStyles";
import { loc } from "@/lib/loc";

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
  t,
  locale = "en",
}) {
  const focusColor = drillConfig?.focusType ? (FOCUS_COLORS[drillConfig.focusType] || "rgba(255,255,255,0.4)") : null;

  // Elapsed time counting up — user controls stop, timer shows progress
  const elapsed    = Math.max(0, totalSeconds - Math.ceil(secondsLeft));
  const eMin       = Math.floor(elapsed / 60);
  const eSec       = elapsed % 60;
  const maxMin     = Math.floor(totalSeconds / 60);
  const maxSec     = totalSeconds % 60;
  const elapsedStr = `${eMin}:${String(eSec).padStart(2, "0")}`;
  const maxStr     = `${maxMin}:${String(maxSec).padStart(2, "0")}`;

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

        <span style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 3 }}>
          <strong style={{ fontFamily: "var(--stack-mono)", letterSpacing: 0.5 }}>{elapsedStr}</strong>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>/ {maxStr}</span>
        </span>
      </div>

      {/* Movement counter — hidden for punch-target drills (LivePunchCounter handles those) */}
      {!drillConfig?.punchTarget && (
        <div style={styles.hitCounter}>
          {hitCount === 0 ? (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", letterSpacing: 0.3 }}>
              {loc(locale, "AI хөдөлгөөнийг чинь харж байна", "AI가 움직임을 보고 있어요", "AI is watching your movement")}
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
                {loc(locale, "хөдөлгөөн", "동작", "moves")}
              </span>
            </>
          )}
        </div>
      )}

      {/* Combo counter */}
      {comboCount > 0 && (
        <div key={comboCount} style={styles.comboCounter} className="combo-pop">
          <span style={styles.comboLabel}>{loc(locale, "КОМБО", "콤보", "COMBO")}</span>
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
            <span style={styles.ghostHudYouLabel}>{loc(locale, "ТА", "나", "YOU")}</span>
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
            {liveScore > ghostBestScore ? loc(locale, "ШИНЭ ДЭЭД", "신기록", "NEW BEST")
              : liveScore >= ghostBestScore - 0.5 ? loc(locale, "БАРАГ!", "거의!", "ALMOST!")
              : liveScore > ghostScore ? loc(locale, "ТҮРҮҮЛЖ БАЙНА", "앞서는 중", "AHEAD")
              : loc(locale, "ХОЦОРЧ БАЙНА", "뒤처지는 중", "BEHIND")}
          </span>
        </div>
      )}

      {/* Feedback toast */}
      {liveFeedback && (
        <div key={liveFeedback.id} style={styles.liveFeedbackBox} className="feedback-fade">
          {liveFeedback.text}
        </div>
      )}

    </>
  );
}
