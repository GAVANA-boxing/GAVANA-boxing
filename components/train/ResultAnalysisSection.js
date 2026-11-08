"use client";

import { sectionLabel } from "@/components/ui/brand";
import { useState } from "react";
import { loc } from "@/lib/loc";
import { GOLD, RADIUS, whiteAlpha, goldAlpha, blackAlpha } from "@/lib/tokens";
import { getChallengeRank } from "@/lib/utils";
import { cameraQualityScore } from "@/lib/cinematicCoaching";
import { localizeCoaching } from "@/lib/coachingText";
import { fmtTime } from "@/lib/trainResultHelpers";
import dynamic from "next/dynamic";
const MotionChart = dynamic(() => import("@/components/train/MotionChart"), { ssr: false });
import RankBadge from "@/components/RankBadge";
import styles from "@/components/train/trainStyles";
import { showRoute } from "@/lib/coreRoutes";

function SectionLabel({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 10px" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: goldAlpha(0.7), flexShrink: 0 }} />
      <span style={sectionLabel}>{label}</span>
      <div style={{ flex: 1, height: 1, background: whiteAlpha(0.05) }} />
    </div>
  );
}

const RATING = {
  FAST: { mn: "Хурдан", ko: "빠름", en: "Fast" },
  QUICK: { mn: "Хурдан", ko: "빠름", en: "Quick" },
  MODERATE: { mn: "Дунд", ko: "보통", en: "Moderate" },
  SLOW: { mn: "Удаан", ko: "느림", en: "Slow" },
};

export default function ResultAnalysisSection({
  result,
  comparison,
  movementSummary,
  timelineEvents,
  hasMI,
  hasTimeline,
  poseMetrics,
  ghostBestScore,
  pvpResult,
  challengeUserId,
  challengePostData,
  reelId,
  targetScore,
  opponentUsername,
  activeChallenge,
  sessionStartTime,
  missionJustCompleted,
  missionStreakBonus,
  missionNewStreak,
  streakFreezeUsed,
  rankUpInfo,
  locale,
  t,
  router,
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div style={{ overflowY: "auto", padding: "0 20px", flex: 1 }}>

      {/* vs Last Session */}
      {comparison.length > 0 && (
        <>
          <SectionLabel label={t("trainLabelVsLastSession")} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {comparison.map((c, i) => (
              <div key={i} style={{ padding: "9px 12px", borderRadius: RADIUS.md, background: c.improved ? "rgba(52,211,153,0.04)" : "rgba(248,113,113,0.04)", border: `1px solid ${c.improved ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"}` }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1.5, color: whiteAlpha(0.55), textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                <div style={{ fontSize: 18, fontWeight: 1000, color: c.improved ? "#34D399" : "#F87171", fontFamily: "var(--font-display, 'Anton', sans-serif)", lineHeight: 1 }}>{c.value}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* PvP */}
      {challengeUserId && pvpResult && (
        <>
          <SectionLabel label={t("trainLabelMatchResult")} />
          <div style={{ borderRadius: RADIUS.md, padding: "14px 16px", background: pvpResult === "win" ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${pvpResult === "win" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}` }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1.2, color: pvpResult === "win" ? "#34D399" : "#F87171", marginBottom: 12 }}>
              {pvpResult === "win" ? t("pvpWin") : t("pvpLose")}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)", color: "#fff" }}>{result.score.toFixed(1)}</div>
                <div style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>{loc(locale, "ТА", "나", "YOU")}</div>
              </div>
              <div style={{ fontSize: 12.5, color: whiteAlpha(0.55), fontWeight: 800 }}>VS</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)", color: whiteAlpha(0.5) }}>{targetScore?.toFixed(1)}</div>
                <div style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>@{opponentUsername || "?"}</div>
              </div>
            </div>
            {reelId && showRoute("/reels") && (
              <button type="button" onClick={() => router.push(`/${locale}/reels?id=${reelId}`)} style={{ marginTop: 12, padding: "7px 14px", borderRadius: RADIUS.full, border: "1px solid rgba(168,85,247,0.32)", background: "rgba(168,85,247,0.09)", color: "#C084FC", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                Watch reel
              </button>
            )}
          </div>
        </>
      )}

      {/* Feed Challenge comparison */}
      {challengePostData && (() => {
        const target = typeof challengePostData.challengeTargetScore === "number" ? challengePostData.challengeTargetScore : null;
        if (target == null) return null;
        const beaten = result.score > target;
        const diff = result.score - target;
        return (
          <>
            <SectionLabel label={`⚔️ ${t("trainLabelChallengeResult")}`} />
            <div style={{ borderRadius: RADIUS.md, padding: "14px 16px", background: beaten ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)", border: `1px solid ${beaten ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}` }}>
              {beaten ? (
                <>
                  <div style={{ textAlign: "center", marginBottom: 10 }}>
                    <div style={{ fontSize: 24, letterSpacing: 6, marginBottom: 6 }}>🏆 ⚔️ 🥊</div>
                    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.2, color: "#34D399", textTransform: "uppercase", marginBottom: 4 }}>
                      ✅ {loc(locale, "Тулаан ялсан!", "챌린지 격파!", "Challenge Beaten!")}
                    </div>
                    <div style={{ display: "inline-block", padding: "3px 12px", borderRadius: 999, background: "rgba(245,196,81,0.12)", border: "1px solid rgba(245,196,81,0.35)", fontSize: 12.5, fontWeight: 700, color: GOLD, letterSpacing: 1.5 }}>
                      +50 XP {loc(locale, "ТУЛААНЫ БОНУС", "챌린지 보너스", "CHALLENGE BONUS")}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display,'Anton',sans-serif)", color: "#34D399" }}>{result.score.toFixed(1)}</div>
                      <div style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>{loc(locale, "ТА", "나", "YOU")}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#34D399" }}>{diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}</div>
                      <div style={{ fontSize: 12.5, color: whiteAlpha(0.55), fontWeight: 800 }}>VS</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display,'Anton',sans-serif)", color: whiteAlpha(0.5) }}>{target.toFixed(1)}</div>
                      <div style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>{loc(locale, "ЗОРИЛГО", "목표", "TARGET")}</div>
                    </div>
                  </div>
                  {challengePostData.username && (
                    <div style={{ marginBottom: 10, fontSize: 12.5, color: whiteAlpha(0.55), fontWeight: 700 }}>@{challengePostData.username} · {challengePostData.challengeTitle || ""}</div>
                  )}
                  {showRoute("/leaderboard") && <button type="button" onClick={() => router.push(`/${locale}/leaderboard`)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "linear-gradient(135deg,#34D399,#059669)", border: "none", color: "#000", fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                    ⚔️ {loc(locale, "Дахин тулаан дуудах", "다른 파이터 도전", "Challenge Another")}
                  </button>}
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1.2, color: "#F87171", marginBottom: 12 }}>
                    ❌ {loc(locale, "Тулаан ялагдсан", "챌린지 실패", "Challenge Not Beaten")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display,'Anton',sans-serif)", color: "#fff" }}>{result.score.toFixed(1)}</div>
                      <div style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>{loc(locale, "ТА", "나", "YOU")}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#F87171" }}>{diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}</div>
                      <div style={{ fontSize: 12.5, color: whiteAlpha(0.55), fontWeight: 800 }}>VS</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display,'Anton',sans-serif)", color: whiteAlpha(0.5) }}>{target.toFixed(1)}</div>
                      <div style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>{loc(locale, "ЗОРИЛГО", "목표", "TARGET")}</div>
                    </div>
                  </div>
                  {challengePostData.username && (
                    <div style={{ marginTop: 8, fontSize: 12.5, color: whiteAlpha(0.55), fontWeight: 700 }}>@{challengePostData.username} · {challengePostData.challengeTitle || ""}</div>
                  )}
                </>
              )}
            </div>
          </>
        );
      })()}

      {/* Ghost / PB */}
      {!challengeUserId && ghostBestScore !== null && (
        <>
          <SectionLabel label={result.score > ghostBestScore ? t("trainLabelNewPB") : t("trainLabelVsPB")} />
          <div style={{ borderRadius: RADIUS.md, padding: "12px 16px", background: result.score > ghostBestScore ? "rgba(52,211,153,0.05)" : whiteAlpha(0.025), border: `1px solid ${result.score > ghostBestScore ? "rgba(52,211,153,0.16)" : whiteAlpha(0.06)}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)", color: result.score > ghostBestScore ? "#34D399" : "#fff" }}>{result.score.toFixed(1)}</div>
              <div style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>{loc(locale, "ЭНЭ РАУНД", "이번 라운드", "SESSION")}</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: result.score >= ghostBestScore ? "#34D399" : "#F87171" }}>
              {result.score >= ghostBestScore ? `+${(result.score - ghostBestScore).toFixed(1)}` : (result.score - ghostBestScore).toFixed(1)}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)", color: whiteAlpha(0.45) }}>{ghostBestScore.toFixed(1)}</div>
              <div style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>{loc(locale, "ШИЛДЭГ", "최고", "BEST")}</div>
            </div>
          </div>
        </>
      )}

      {/* Challenge rank */}
      {activeChallenge && (
        <>
          <SectionLabel label={t("trainLabelChallengeResult")} />
          <div style={{ borderRadius: RADIUS.md, padding: "12px", background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}`, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 800, letterSpacing: 1.5, marginBottom: 5 }}>{t("challengeRank")}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: GOLD }}>{getChallengeRank(result.score)}</div>
          </div>
        </>
      )}

      {/* Movement Intelligence */}
      {hasMI && (
        <>
          <SectionLabel label={t("trainLabelMovementIntel")} />
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {movementSummary.map((ev) => (
              <div key={ev.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 14px", borderRadius: RADIUS.md, background: whiteAlpha(0.028), border: `1px solid ${whiteAlpha(0.055)}` }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: whiteAlpha(0.62), textTransform: "capitalize" }}>{ev.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: whiteAlpha(0.55), background: whiteAlpha(0.06), border: `1px solid ${whiteAlpha(0.08)}`, borderRadius: RADIUS.full, padding: "2px 8px" }}>×{ev.count}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Coaching Notes */}
      {poseMetrics?.coaching?.length > 0 && (
        <>
          <SectionLabel label={t("trainLabelCoachingNotes")} />
          {(() => {
            const score = cameraQualityScore(poseMetrics.cameraQuality);
            const scoreColor = score === "PERFECT" || score === "GOOD" ? "#34D399" : score === "LIMITED" ? "#F59E0B" : "#F87171";
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, padding: "5px 0" }}>
                {score && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: scoreColor }}>
                      {score === "PERFECT" ? loc(locale, "ТӨГС", "완벽", "PERFECT")
                       : score === "GOOD"    ? loc(locale, "САЙН", "좋음", "GOOD")
                       : score === "LIMITED" ? loc(locale, "ХЯЗГААРЛАГДМАЛ", "제한적", "LIMITED")
                       : loc(locale, "МУУ", "나쁨", "POOR")}
                    </span>
                    <span style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 700 }}>{loc(locale, "КАМЕР", "카메라", "CAMERA")}</span>
                  </div>
                )}
                {poseMetrics.punchCount > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 12, color: whiteAlpha(0.55) }}>·</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: whiteAlpha(0.6) }}>{loc(locale, `${poseMetrics.punchCount} цохилт`, `펀치 ${poseMetrics.punchCount}`, `${poseMetrics.punchCount} PUNCHES`)}</span>
                  </div>
                ) : poseMetrics?.frameCount >= 20 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 12, color: whiteAlpha(0.55) }}>·</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: whiteAlpha(0.55) }}>{loc(locale, "хөдөлгөөн илэрсэн, цохилт тодорхойгүй", "움직임 감지, 펀치 불분명", "movement detected, punch unclear")}</span>
                  </div>
                ) : null}
                {poseMetrics.velocityStats?.snapRating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 12, color: whiteAlpha(0.55) }}>·</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: poseMetrics.velocityStats.snapRating === "FAST" ? "#34D399" : poseMetrics.velocityStats.snapRating === "MODERATE" ? "#F59E0B" : "#F87171" }}>{RATING[poseMetrics.velocityStats.snapRating]?.[locale] || poseMetrics.velocityStats.snapRating}</span>
                    <span style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 700 }}>{t("trainLabelSnap")}</span>
                  </div>
                )}
                {poseMetrics.velocityStats?.recoilRating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 12, color: whiteAlpha(0.55) }}>·</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: poseMetrics.velocityStats.recoilRating === "QUICK" ? "#34D399" : poseMetrics.velocityStats.recoilRating === "MODERATE" ? "#F59E0B" : "#F87171" }}>{RATING[poseMetrics.velocityStats.recoilRating]?.[locale] || poseMetrics.velocityStats.recoilRating}</span>
                    <span style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 700 }}>{t("trainLabelRecovery")}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {(() => {
            // Round analysis from lib/boxingIntelligence. Its style labels and cue sentences are
            // English-only (and some style names were real boxers), so MN/KO show only the
            // measured, translated parts; the boxer-named archetype and the default-70 "Ring IQ"
            // number are not shown at all.
            const bi = poseMetrics.boxingIntelligence;
            if (!bi) return null;
            const isEn = locale === "en";
            const { tactical, cornerAdvice, roundBreakdown: rounds } = bi;
            const def = bi.defensive;
            const hasDefense = def && ((def.slipCount || 0) + (def.bobCount || 0)) > 0;
            if (!isEn && !hasDefense && !rounds) return null;
            return (
              <>
                {isEn && tactical?.tacticalCues?.length > 0 && (
                  <div style={{ marginBottom: 8, padding: "7px 10px", borderRadius: 8, background: goldAlpha(0.05), border: `1px solid ${goldAlpha(0.14)}` }}>
                    {tactical.tacticalCues.map((cue, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: whiteAlpha(0.65), lineHeight: 1.55, paddingBottom: i < tactical.tacticalCues.length - 1 ? 4 : 0 }}>→ {cue}</div>
                    ))}
                  </div>
                )}
                {hasDefense && (
                  <div style={{ marginBottom: 8, fontSize: 12.5, color: whiteAlpha(0.7), fontWeight: 700 }}>
                    {loc(locale, `Хамгаалалт: мултралт ${def.slipCount || 0} · бөхийлт ${def.bobCount || 0}`, `방어: 슬립 ${def.slipCount || 0} · 밥 ${def.bobCount || 0}`, `Defense: ${def.slipCount || 0} slips · ${def.bobCount || 0} bobs`)}
                  </div>
                )}
                {isEn && cornerAdvice?.length > 0 && (
                  <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "rgba(110,231,183,0.04)", border: "1px solid rgba(110,231,183,0.14)" }}>
                    {cornerAdvice.map((tip, i) => (
                      <div key={i} style={{ fontSize: 12.5, color: whiteAlpha(0.7), lineHeight: 1.6, paddingBottom: i < cornerAdvice.length - 1 ? 5 : 0 }}>▸ {tip}</div>
                    ))}
                  </div>
                )}
                {rounds && (
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    {[{ label: loc(locale, "Эхний хагас", "전반", "1st half"), data: rounds.round1 }, { label: loc(locale, "Сүүлийн хагас", "후반", "2nd half"), data: rounds.round2 }].map(({ label, data }, i) => (
                      <div key={i} style={{ flex: 1, padding: "6px 8px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div style={{ fontSize: 12, color: whiteAlpha(0.6), fontWeight: 700, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 13, color: whiteAlpha(0.85), fontWeight: 700 }}>{loc(locale, `${data.count} цохилт`, `펀치 ${data.count}`, `${data.count} punches`)}</div>
                        <div style={{ fontSize: 12, color: whiteAlpha(0.6), fontWeight: 700 }}>{loc(locale, `${data.pace}/мин`, `${data.pace}/분`, `${data.pace}/min`)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          {poseMetrics.sessionConfidence && poseMetrics.sessionConfidence !== "high" && (
            <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: RADIUS.md, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1.5, color: poseMetrics.sessionConfidence === "medium" ? "#F59E0B" : "#F87171" }}>
                {poseMetrics.sessionConfidence === "medium" ? loc(locale, "Дунд итгэл", "보통 신뢰도", "Medium confidence") : loc(locale, "Бага итгэл", "낮은 신뢰도", "Low confidence")}
              </span>
              <span style={{ fontSize: 12, color: whiteAlpha(0.55), fontWeight: 700 }}>
                {poseMetrics.sessionConfidence === "medium" ? loc(locale, "— чиг хандлага, эцсийн дүгнэлт биш", "— 경향일 뿐 확정 아님", "— findings directional, not definitive") : loc(locale, "— раунд богино эсвэл кадр дутуу", "— 라운드가 짧거나 화면이 부족함", "— session too short or framing limited")}
              </span>
            </div>
          )}

          {(() => {
            const hasTypeUncertain = poseMetrics.coaching.some((c) => c.type === "caution" && c.message.includes("type uncertain"));
            if (hasTypeUncertain && poseMetrics.punchCount > 0) {
              return (
                <div style={{ marginBottom: 8, padding: "8px 12px", borderRadius: RADIUS.md, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontSize: 13, color: whiteAlpha(0.55), fontWeight: 700 }}>
                    {loc(locale,
                      `${poseMetrics.punchCount} цохилт тоологдсон ч төрлийг нь тодорхой ялгаж чадсангүй. Техникийн зөвлөгөө авахын тулд камер руу илүү чигээр цохи.`,
                      `펀치 ${poseMetrics.punchCount}개를 감지했지만 종류를 확실히 구분하지 못했어요. 기술 피드백을 받으려면 카메라 쪽으로 더 곧게 치세요.`,
                      `${poseMetrics.punchCount} punches detected — type classification uncertain. Punch more directly toward camera for technique feedback.`)}
                  </span>
                </div>
              );
            }
            return null;
          })()}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {poseMetrics.coaching.filter((c) => c.type !== "caution").map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: RADIUS.md, background: c.type === "strength" ? "rgba(52,211,153,0.04)" : "rgba(245,196,81,0.04)", border: `1px solid ${c.type === "strength" ? "rgba(52,211,153,0.14)" : "rgba(245,196,81,0.14)"}`, borderLeft: `3px solid ${c.type === "strength" ? "rgba(52,211,153,0.45)" : "rgba(245,196,81,0.45)"}` }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, flexShrink: 0, marginTop: 1, color: c.type === "strength" ? "rgba(52,211,153,0.8)" : "rgba(245,196,81,0.7)" }}>{c.type === "strength" ? "✓" : "→"}</span>
                <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.45, color: c.type === "strength" ? "rgba(52,211,153,0.8)" : whiteAlpha(0.72) }}>{localizeCoaching(c.message, locale)}</span>
              </div>
            ))}
            {poseMetrics.coaching.filter((c) => c.type === "caution").map((c, i) => (
              <div key={`caution-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderRadius: RADIUS.md, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 12, color: whiteAlpha(0.55), flexShrink: 0, marginTop: 1 }}>⚠</span>
                <span style={{ fontSize: 13, color: whiteAlpha(0.55), fontWeight: 700, lineHeight: 1.45 }}>{localizeCoaching(c.message, locale)}</span>
              </div>
            ))}
          </div>

          {(() => {
            const bd = poseMetrics?.punchBreakdown;
            if (!bd || !Object.keys(bd).length) return null;
            const TYPE_LABEL = { jab: loc(locale, "ЖЭБ", "잽", "JAB"), cross: loc(locale, "КРОСС", "크로스", "CROSS"), hook: loc(locale, "ХУК", "훅", "HOOK") };
            return (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["jab", "cross", "hook"].filter((k) => bd[k]).map((k) => (
                  <div key={k} style={{ flex: 1, minWidth: 64, padding: "7px 10px", borderRadius: RADIUS.md, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}`, textAlign: "center" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1.5, color: whiteAlpha(0.55), marginBottom: 3 }}>{TYPE_LABEL[k]}</div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>{bd[k].count}</div>
                    <div style={{ fontSize: 12, color: whiteAlpha(0.6), fontWeight: 700 }}>{loc(locale, "дунд.", "평균", "avg")} {bd[k].avgAngle}°</div>
                  </div>
                ))}
              </div>
            );
          })()}

          {(() => {
            const gaps = poseMetrics?.visibilityGaps || [];
            if (!gaps.some((k) => ["stanceWidth", "balance"].includes(k))) return null;
            return (
              <div style={{ marginTop: 6, display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderRadius: RADIUS.md, background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.06)}` }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: whiteAlpha(0.55), flexShrink: 0, marginTop: 1 }}>📷</span>
                <span style={{ fontSize: 13, color: whiteAlpha(0.55), fontWeight: 700, lineHeight: 1.45 }}>Stance & balance not analyzed — lower body was outside the frame. Step back next session for full feedback.</span>
              </div>
            );
          })()}
        </>
      )}

      {/* Motion Analysis */}
      {poseMetrics?.motionHistory && (
        <>
          <SectionLabel label={t("trainLabelMotionAnalysis")} />
          <MotionChart motionHistory={poseMetrics.motionHistory} />
          <div style={{ display: "flex", gap: 14, marginTop: 6, paddingLeft: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 20, height: 1.5, background: "rgba(255,255,255,0.6)", borderRadius: 2 }} />
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>{loc(locale, "ХАМГААЛАЛТ", "가드", "GUARD")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 2, height: 10, background: "rgba(245,196,81,0.6)", borderRadius: 2 }} />
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>{loc(locale, "БАРУУН ЦОХИЛТ", "오른손 펀치", "RIGHT PUNCH")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 2, height: 10, background: "rgba(148,163,184,0.55)", borderRadius: 2 }} />
              <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>{loc(locale, "ЗҮҮН ЦОХИЛТ", "왼손 펀치", "LEFT PUNCH")}</span>
            </div>
          </div>
        </>
      )}

      {/* Session Details (collapsible) */}
      {(hasTimeline || true) && (
        <>
          <button type="button" onClick={() => setShowDetails((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "8px 0 4px", cursor: "pointer", color: whiteAlpha(0.55), fontSize: 12.5, fontWeight: 800, letterSpacing: 1 }}>
            <span>{showDetails ? "▾" : "▸"}</span>
            {showDetails ? loc(locale, "Дэлгэрэнгүйг хаах", "상세 닫기", "Hide details") : loc(locale, "Раундын дэлгэрэнгүй", "라운드 상세", "Session details")}
          </button>
          {showDetails && (
            <>
              {hasTimeline && (
                <>
                  <SectionLabel label={t("trainLabelSessionTimeline")} />
                  <div style={{ borderRadius: RADIUS.md, padding: "10px 14px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`, display: "flex", flexDirection: "column", gap: 5 }}>
                    {timelineEvents.map((ev) => (
                      <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, fontFamily: "var(--stack-mono)", color: goldAlpha(0.5), fontWeight: 700, flexShrink: 0 }}>[{fmtTime(ev.timestamp - (sessionStartTime || ev.timestamp))}]</span>
                        <span style={{ fontSize: 12.5, color: whiteAlpha(0.55), fontWeight: 800 }}>{ev.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* Combat Experience */}
      <>
        <SectionLabel label={t("trainLabelCombatExp")} />
        <div style={{ borderRadius: RADIUS.md, padding: "12px 16px", background: whiteAlpha(0.025), border: `1px solid ${whiteAlpha(0.06)}` }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 1000, color: GOLD, fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>+{result.xpGained}</span>
            <span style={{ fontSize: 12.5, color: whiteAlpha(0.55), fontWeight: 800, letterSpacing: 1 }}>{loc(locale, "XP ЦУГЛУУЛСАН", "XP 획득", "XP EARNED")}</span>
          </div>
          {!activeChallenge && result.rankProgress > 0 && (
            <>
              <div style={{ height: 2, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${result.rankProgress}%`, background: goldAlpha(0.55), borderRadius: 2, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
              <div style={{ fontSize: 12.5, color: whiteAlpha(0.55), fontWeight: 700 }}>
                {loc(locale, `Цолны ахиц — ${result.rankProgress}%`, `랭크 진행 — ${result.rankProgress}%`, `Rank progress — ${result.rankProgress}%`)}
              </div>
            </>
          )}
          {hasMI && (
            <div style={{ fontSize: 12.5, color: whiteAlpha(0.55), fontWeight: 700, marginTop: 4 }}>
              {movementSummary[0].label.charAt(0).toUpperCase() + movementSummary[0].label.slice(1)} data recorded
            </div>
          )}
        </div>
      </>

      {/* Mission Complete */}
      {missionJustCompleted && (
        <>
          <SectionLabel label={t("trainLabelDailyMission")} />
          <div style={styles.missionCompleteBanner} className={missionStreakBonus > 0 ? "streak-burst" : undefined}>
            <div style={styles.missionCompleteTitle}>🎯 {t("missionDailyComplete")}</div>
            <div style={styles.missionCompleteXP}>
              +50 XP
              {missionStreakBonus > 0 && (
                <span style={styles.missionStreakBonusText}>{" "}+ {missionStreakBonus} XP 🔥{missionNewStreak} {t("missionStreakBonus")}</span>
              )}
            </div>
            {streakFreezeUsed && (
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 800, color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                🧊 {locale === "mn" ? "Дараалал хамгаалалт ашиглагдлаа — дараалал хадгалагдлаа"
                  : locale === "ko" ? "스트릭 프리즈 사용됨 — 연속 기록 유지"
                  : "Streak freeze used — streak saved"}
              </div>
            )}
          </div>
        </>
      )}

      {/* Rank Up */}
      {rankUpInfo && (
        <>
          <SectionLabel label={t("trainLabelRankAdvancement")} />
          <div style={{ borderRadius: RADIUS.md, padding: "16px 20px", textAlign: "center", background: `linear-gradient(135deg, ${rankUpInfo.color}12, ${blackAlpha(0.75)})`, border: `1px solid ${rankUpInfo.color}3a`, animation: "rankUpPulse 2s ease-in-out infinite" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <RankBadge rank={rankUpInfo} size={44} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: rankUpInfo.color, marginBottom: 2 }}>{t("trainRankUp")}</div>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 800 }}>{t(rankUpInfo.key)}</div>
          </div>
        </>
      )}

      <div style={{ height: 10 }} />
    </div>
  );
}
