"use client";

import styles from "@/components/train/trainStyles";
import { GOLD, RED, whiteAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";

const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};
const AREA_MN = {
  Power: "Хүч", Speed: "Хурд", Timing: "Цаг",
  Footwork: "Хөл", Guard: "Хамгаалалт", Accuracy: "Нарийвчлал",
};

export default function PreGameCard({
  phase,
  challengeUserId,
  weeklySessionCount,
  userStreak,
  ghostBestScore,
  sessionHistory,
  targetScore,
  opponentUsername,
  ghostEnabled,
  reelId,
  locale,
  t,
  focusTip,
}) {
  if (phase !== "idle") return null;

  return (
    <div style={styles.contextCard}>
      {!challengeUserId && (
        <div style={styles.preSessionStrip}>
          {(() => {
            const weeklyGoal = 5;
            const pct = Math.min(1, weeklySessionCount / weeklyGoal);
            const r = 22;
            const circ = 2 * Math.PI * r;
            const filled = pct * circ;
            return (
              <div style={styles.weeklyRingWrap}>
                <svg width="56" height="56" viewBox="0 0 56 56" style={{ display: "block" }}>
                  <circle cx="28" cy="28" r={r} fill="none" stroke={whiteAlpha(0.08)} strokeWidth="4" />
                  <circle cx="28" cy="28" r={r} fill="none" stroke={GOLD} strokeWidth="4"
                    strokeDasharray={`${filled} ${circ - filled}`}
                    strokeLinecap="round"
                    transform="rotate(-90 28 28)"
                    style={{ transition: "stroke-dasharray 0.6s ease" }}
                  />
                  <text x="28" y="32" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="900" style={{ fontFamily: "inherit" }}>
                    {weeklySessionCount}/{weeklyGoal}
                  </text>
                </svg>
                <span style={styles.weeklyRingLabel}>{t("trainWeekly")}</span>
              </div>
            );
          })()}

          <div style={styles.preSessionStat}>
            <span style={styles.preSessionStatVal}>
              {userStreak > 0 ? `🔥 ${userStreak}` : "—"}
            </span>
            <span style={styles.preSessionStatLbl}>{t("profileStatStreak")}</span>
          </div>

          {ghostBestScore !== null && (
            <div style={styles.preSessionStat}>
              <span style={styles.preSessionStatVal}>{ghostBestScore.toFixed(1)}</span>
              <span style={styles.preSessionStatLbl}>{t("trainBest")}</span>
            </div>
          )}

          {sessionHistory.length > 0 && (
            <div style={styles.preSessionSparkWrap}>
              <div style={styles.preSessionSparkBars}>
                {[...sessionHistory].reverse().map((s, i, arr) => (
                  <div
                    key={i}
                    style={{
                      ...styles.preSessionSparkBar,
                      height: `${Math.max(12, (s / 10) * 36)}px`,
                      background: i === arr.length - 1 ? RED : whiteAlpha(0.18),
                    }}
                  />
                ))}
              </div>
              <span style={styles.preSessionStatLbl}>{t("trainHistory")}</span>
            </div>
          )}
        </div>
      )}

      {(ghostBestScore !== null || targetScore || (challengeUserId && opponentUsername)) ? (
        <div style={styles.contextStatsRow}>
          {!challengeUserId && ghostBestScore !== null && (
            <div style={styles.contextStat}>
              <span style={styles.contextStatLabel}>👻 {t("trainYourBest")}</span>
              <span style={styles.contextStatValue}>{ghostBestScore.toFixed(1)}<span style={styles.contextStatUnit}>/10</span></span>
            </div>
          )}
          {!challengeUserId && targetScore && (
            <div style={styles.contextStat}>
              <span style={styles.contextStatLabel}>🎯 {t("trainTarget")}</span>
              <span style={{ ...styles.contextStatValue, color: "#FDE68A" }}>{targetScore.toFixed(1)}<span style={styles.contextStatUnit}>/10</span></span>
            </div>
          )}
          {challengeUserId && targetScore && (
            <div style={{ ...styles.contextStat, flex: 1, alignItems: "center" }}>
              <span style={styles.contextStatLabel}>🆚 {t("trainBeat")}</span>
              <span style={{ ...styles.contextStatValue, color: "#93C5FD", fontSize: 17 }}>
                {opponentUsername || "Opponent"} · {targetScore.toFixed(1)}/10
              </span>
            </div>
          )}
        </div>
      ) : (
        !challengeUserId && (
          <div style={styles.contextEmptyMsg}>
            {reelId ? t("trainFirstScore") : t("trainReadyToTrain")}
          </div>
        )
      )}

      {ghostEnabled && ghostBestScore !== null && !challengeUserId && (
        <div style={styles.contextGhostNote}>
          👻 {loc(locale, `Ghost горим идэвхтэй — ${ghostBestScore.toFixed(1)}/10 давах`, `고스트 모드 활성화 — ${ghostBestScore.toFixed(1)}/10 넘기`, `Ghost mode active — beat ${ghostBestScore.toFixed(1)}/10`)}
        </div>
      )}

      {/* ── Pre-session focus tip (14A) ── */}
      {focusTip && !challengeUserId && (() => {
        const { fighter, connection } = focusTip;
        const area = connection?.primaryFocus;
        const col = AREA_COLOR[area] || GOLD;
        const drill = connection?.focusDrills?.[0] || connection?.focusStudy?.[0];
        const areaLabel = locale === "mn" ? (AREA_MN[area] || area) : area;
        return (
          <div style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: "3px 12px 12px 3px",
            background: `${col}0a`,
            border: `1px solid ${col}22`,
            borderLeft: `3px solid ${col}`,
          }}>
            <div style={{ fontSize: 8, fontWeight: 900, color: col, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 5 }}>
              ⚡ {locale === "mn" ? "Өнөөдрийн анхаарал" : "Today's Focus"} · {areaLabel}
            </div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.55)", fontWeight: 700, lineHeight: 1.4 }}>
              {drill || (locale === "mn" ? `${areaLabel} дасгалд анхаарал тавь` : `Focus on ${area} today`)}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
