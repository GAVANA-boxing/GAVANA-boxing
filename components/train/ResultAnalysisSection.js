"use client";
import { useState } from "react";
import { GOLD, RADIUS, whiteAlpha, goldAlpha, blackAlpha } from "@/lib/tokens";
import { getChallengeRank } from "@/lib/utils";
import { getChallengeComparisonPercent } from "@/lib/trainHelpers";
import { cameraQualityScore } from "@/lib/cinematicCoaching";
import { fmtTime } from "@/lib/trainResultHelpers";
import dynamic from "next/dynamic";
const MotionChart = dynamic(() => import("@/components/train/MotionChart"), { ssr: false });
import RankBadge from "@/components/RankBadge";
import styles from "@/components/train/trainStyles";

function SectionLabel({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 10px" }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: goldAlpha(0.5), flexShrink: 0 }} />
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.32), textTransform: "uppercase" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: whiteAlpha(0.05) }} />
    </div>
  );
}

function TelemetryBar({ label, value }) {
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
      <span style={{ width: 72, fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.28), textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 2, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: whiteAlpha(0.42), borderRadius: 2, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
      <span style={{ width: 28, fontSize: 12, fontWeight: 900, color: whiteAlpha(0.6), textAlign: "right", flexShrink: 0, fontFamily: "monospace" }}>{value.toFixed(1)}</span>
    </div>
  );
}

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
  beltUpInfo,
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
                <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
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
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2.5, color: pvpResult === "win" ? "#34D399" : "#F87171", marginBottom: 12 }}>
              {pvpResult === "win" ? t("pvpWin") : t("pvpLose")}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)", color: "#fff" }}>{result.score.toFixed(1)}</div>
                <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>{locale === "mn" ? "ТА" : locale === "ko" ? "나" : "YOU"}</div>
              </div>
              <div style={{ fontSize: 10, color: whiteAlpha(0.22), fontWeight: 800 }}>VS</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)", color: whiteAlpha(0.5) }}>{targetScore?.toFixed(1)}</div>
                <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>@{opponentUsername || "?"}</div>
              </div>
            </div>
            {reelId && (
              <button type="button" onClick={() => router.push(`/${locale}/reels?id=${reelId}`)} style={{ marginTop: 12, padding: "7px 14px", borderRadius: RADIUS.full, border: "1px solid rgba(168,85,247,0.32)", background: "rgba(168,85,247,0.09)", color: "#C084FC", fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
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
                    <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 2, color: "#34D399", textTransform: "uppercase", marginBottom: 4 }}>
                      ✅ {locale === "mn" ? "Тулаан ялсан!" : locale === "ko" ? "챌린지 격파!" : "Challenge Beaten!"}
                    </div>
                    <div style={{ display: "inline-block", padding: "3px 12px", borderRadius: 999, background: "rgba(245,196,81,0.12)", border: "1px solid rgba(245,196,81,0.35)", fontSize: 10, fontWeight: 900, color: GOLD, letterSpacing: 1.5 }}>
                      +50 XP {locale === "mn" ? "ТУЛААНЫ БОНУС" : locale === "ko" ? "챌린지 보너스" : "CHALLENGE BONUS"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display,'Anton',sans-serif)", color: "#34D399" }}>{result.score.toFixed(1)}</div>
                      <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>{locale === "mn" ? "ТА" : locale === "ko" ? "나" : "YOU"}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: "#34D399" }}>{diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}</div>
                      <div style={{ fontSize: 10, color: whiteAlpha(0.22), fontWeight: 800 }}>VS</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display,'Anton',sans-serif)", color: whiteAlpha(0.5) }}>{target.toFixed(1)}</div>
                      <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>TARGET</div>
                    </div>
                  </div>
                  {challengePostData.username && (
                    <div style={{ marginBottom: 10, fontSize: 10, color: whiteAlpha(0.3), fontWeight: 700 }}>@{challengePostData.username} · {challengePostData.challengeTitle || ""}</div>
                  )}
                  <button type="button" onClick={() => router.push(`/${locale}/leaderboard`)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "linear-gradient(135deg,#34D399,#059669)", border: "none", color: "#000", fontSize: 11, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                    ⚔️ {locale === "mn" ? "Дахин тулаан дуудах" : locale === "ko" ? "다른 파이터 도전" : "Challenge Another"}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2.5, color: "#F87171", marginBottom: 12 }}>
                    ❌ {locale === "mn" ? "Тулаан ялагдсан" : locale === "ko" ? "챌린지 실패" : "Challenge Not Beaten"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display,'Anton',sans-serif)", color: "#fff" }}>{result.score.toFixed(1)}</div>
                      <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>{locale === "mn" ? "ТА" : locale === "ko" ? "나" : "YOU"}</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: "#F87171" }}>{diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}</div>
                      <div style={{ fontSize: 10, color: whiteAlpha(0.22), fontWeight: 800 }}>VS</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display,'Anton',sans-serif)", color: whiteAlpha(0.5) }}>{target.toFixed(1)}</div>
                      <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>TARGET</div>
                    </div>
                  </div>
                  {challengePostData.username && (
                    <div style={{ marginTop: 8, fontSize: 10, color: whiteAlpha(0.3), fontWeight: 700 }}>@{challengePostData.username} · {challengePostData.challengeTitle || ""}</div>
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
              <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>SESSION</div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 900, color: result.score >= ghostBestScore ? "#34D399" : "#F87171" }}>
              {result.score >= ghostBestScore ? `+${(result.score - ghostBestScore).toFixed(1)}` : (result.score - ghostBestScore).toFixed(1)}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)", color: whiteAlpha(0.45) }}>{ghostBestScore.toFixed(1)}</div>
              <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>BEST</div>
            </div>
          </div>
        </>
      )}

      {/* Challenge rank */}
      {activeChallenge && (
        <>
          <SectionLabel label={t("trainLabelChallengeResult")} />
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, borderRadius: RADIUS.md, padding: "12px", background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}`, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 800, letterSpacing: 1.5, marginBottom: 5 }}>{t("challengeRank")}</div>
              <div style={{ fontSize: 18, fontWeight: 1000, color: GOLD }}>{getChallengeRank(result.score)}</div>
            </div>
            <div style={{ flex: 1, borderRadius: RADIUS.md, padding: "12px", background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}`, textAlign: "center" }}>
              <div style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 800, letterSpacing: 1.5, marginBottom: 5 }}>{locale === "mn" ? "ЯЛСАН" : locale === "ko" ? "이긴 비율" : "BEAT"}</div>
              <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff" }}>{getChallengeComparisonPercent(result.score)}%</div>
            </div>
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
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: whiteAlpha(0.3), background: whiteAlpha(0.06), border: `1px solid ${whiteAlpha(0.08)}`, borderRadius: RADIUS.full, padding: "2px 8px" }}>×{ev.count}</span>
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
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: scoreColor }}>
                      {score === "PERFECT" ? (locale === "mn" ? "ТӨГС" : locale === "ko" ? "완벽" : "PERFECT")
                       : score === "GOOD"    ? (locale === "mn" ? "САЙН" : locale === "ko" ? "좋음" : "GOOD")
                       : score === "LIMITED" ? (locale === "mn" ? "ХЯЗГААРЛАГДМАЛ" : locale === "ko" ? "제한적" : "LIMITED")
                       : (locale === "mn" ? "МУУ" : locale === "ko" ? "나쁨" : "POOR")}
                    </span>
                    <span style={{ fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700 }}>{locale === "mn" ? "КАМЕР" : locale === "ko" ? "카메라" : "CAMERA"}</span>
                  </div>
                )}
                {poseMetrics.punchCount > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 9, color: whiteAlpha(0.22) }}>·</span>
                    <span style={{ fontSize: 9, fontWeight: 900, color: whiteAlpha(0.55) }}>{poseMetrics.punchCount} PUNCHES</span>
                  </div>
                ) : poseMetrics?.frameCount >= 20 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 9, color: whiteAlpha(0.22) }}>·</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: whiteAlpha(0.28) }}>movement detected, punch unclear</span>
                  </div>
                ) : null}
                {poseMetrics.velocityStats?.snapRating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 9, color: whiteAlpha(0.22) }}>·</span>
                    <span style={{ fontSize: 9, fontWeight: 900, color: poseMetrics.velocityStats.snapRating === "FAST" ? "#34D399" : poseMetrics.velocityStats.snapRating === "MODERATE" ? "#F59E0B" : "#F87171" }}>{poseMetrics.velocityStats.snapRating}</span>
                    <span style={{ fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700 }}>{t("trainLabelSnap")}</span>
                  </div>
                )}
                {poseMetrics.velocityStats?.recoilRating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 9, color: whiteAlpha(0.22) }}>·</span>
                    <span style={{ fontSize: 9, fontWeight: 900, color: poseMetrics.velocityStats.recoilRating === "QUICK" ? "#34D399" : poseMetrics.velocityStats.recoilRating === "MODERATE" ? "#F59E0B" : "#F87171" }}>{poseMetrics.velocityStats.recoilRating}</span>
                    <span style={{ fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700 }}>{t("trainLabelRecovery")}</span>
                  </div>
                )}
              </div>
            );
          })()}

          {(() => {
            const bi = poseMetrics.boxingIntelligence;
            if (!bi) return null;
            const styleColor = bi.style === "explosive" ? "#F59E0B" : bi.style === "pressure" ? "#F87171" : bi.style === "outboxer" ? "#34D399" : "#94A3B8";
            const { tactical, ringIQ, fighterDNA: dna, cornerAdvice, roundBreakdown: rounds } = bi;
            return (
              <>
                <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  {bi.styleLabel && bi.styleConfidence >= 0.3 && (
                    <div style={{ padding: "3px 10px", borderRadius: 20, background: `${styleColor}14`, border: `1px solid ${styleColor}35`, fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: styleColor, textTransform: "uppercase" }}>{bi.styleLabel}</div>
                  )}
                  {tactical?.profileLabel && (
                    <div style={{ padding: "3px 10px", borderRadius: 20, background: goldAlpha(0.10), border: `1px solid ${goldAlpha(0.28)}`, fontSize: 9, fontWeight: 900, letterSpacing: 1.2, color: GOLD, textTransform: "uppercase" }}>{tactical.profileLabel}</div>
                  )}
                  {bi.weakness && (
                    <div style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 700 }}>Focus: <span style={{ color: "#F59E0B", fontWeight: 900 }}>{bi.weakness.label}</span></div>
                  )}
                </div>
                {tactical?.tacticalCues?.length > 0 && (
                  <div style={{ marginBottom: 8, padding: "7px 10px", borderRadius: 8, background: goldAlpha(0.05), border: `1px solid ${goldAlpha(0.14)}` }}>
                    {tactical.tacticalCues.map((cue, i) => (
                      <div key={i} style={{ fontSize: 10, color: whiteAlpha(0.65), lineHeight: 1.55, paddingBottom: i < tactical.tacticalCues.length - 1 ? 4 : 0 }}>→ {cue}</div>
                    ))}
                  </div>
                )}
                {bi.defensive && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <div style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(167,139,250,0.10)", border: "1px solid rgba(167,139,250,0.28)", fontSize: 9, fontWeight: 900, letterSpacing: 1.2, color: "#A78BFA", textTransform: "uppercase" }}>{bi.defensive.defensiveStyleLabel}</div>
                      <span style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 700 }}>{bi.defensive.slipCount}s {bi.defensive.bobCount}b defensive actions</span>
                    </div>
                    {bi.defensive.defensiveCues?.length > 0 && (
                      <div style={{ padding: "7px 10px", borderRadius: 8, background: "rgba(167,139,250,0.05)", border: "1px solid rgba(167,139,250,0.14)" }}>
                        {bi.defensive.defensiveCues.map((cue, i) => (
                          <div key={i} style={{ fontSize: 10, color: whiteAlpha(0.65), lineHeight: 1.55, paddingBottom: i < bi.defensive.defensiveCues.length - 1 ? 4 : 0 }}>→ {cue}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {ringIQ && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <div style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(249,168,212,0.10)", border: "1px solid rgba(249,168,212,0.28)", fontSize: 9, fontWeight: 900, letterSpacing: 1.2, color: "#F9A8D4", textTransform: "uppercase" }}>{ringIQ.iqLabel}</div>
                      <span style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 700 }}>IQ {ringIQ.iqScore}/100</span>
                    </div>
                    {ringIQ.cues?.length > 0 && (
                      <div style={{ padding: "7px 10px", borderRadius: 8, background: "rgba(249,168,212,0.04)", border: "1px solid rgba(249,168,212,0.14)" }}>
                        {ringIQ.cues.map((cue, i) => (
                          <div key={i} style={{ fontSize: 10, color: whiteAlpha(0.65), lineHeight: 1.55, paddingBottom: i < ringIQ.cues.length - 1 ? 4 : 0 }}>→ {cue}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {dna && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <div style={{ padding: "3px 10px", borderRadius: 20, background: "rgba(252,211,77,0.10)", border: "1px solid rgba(252,211,77,0.28)", fontSize: 9, fontWeight: 900, letterSpacing: 1.2, color: "#FCD34D", textTransform: "uppercase" }}>{dna.archetypeLabel}</div>
                      <span style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 700 }}>{dna.similarity}% match</span>
                    </div>
                    <div style={{ padding: "7px 10px", borderRadius: 8, background: "rgba(252,211,77,0.04)", border: "1px solid rgba(252,211,77,0.14)" }}>
                      {dna.archetypeTraits?.map((trait, i) => (
                        <div key={i} style={{ fontSize: 10, color: whiteAlpha(0.55), lineHeight: 1.55, paddingBottom: i < dna.archetypeTraits.length - 1 ? 3 : 0 }}>· {trait}</div>
                      ))}
                    </div>
                  </div>
                )}
                {cornerAdvice?.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.2, color: "#6EE7B7", textTransform: "uppercase", marginBottom: 5 }}>Corner Advice</div>
                    <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(110,231,183,0.04)", border: "1px solid rgba(110,231,183,0.14)" }}>
                      {cornerAdvice.map((tip, i) => (
                        <div key={i} style={{ fontSize: 10, color: whiteAlpha(0.7), lineHeight: 1.6, paddingBottom: i < cornerAdvice.length - 1 ? 5 : 0 }}>▸ {tip}</div>
                      ))}
                    </div>
                    {rounds && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                        {[{ label: "1st half", data: rounds.round1 }, { label: "2nd half", data: rounds.round2 }].map(({ label, data }, i) => (
                          <div key={i} style={{ flex: 1, padding: "5px 8px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div style={{ fontSize: 8, color: whiteAlpha(0.35), fontWeight: 700, marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 10, color: whiteAlpha(0.8), fontWeight: 900 }}>{data.count} punches</div>
                            <div style={{ fontSize: 9, color: whiteAlpha(0.45), fontWeight: 700 }}>{data.pace}/min · q{data.avgQuality}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}

          {poseMetrics.sessionConfidence && poseMetrics.sessionConfidence !== "high" && (
            <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: RADIUS.md, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: poseMetrics.sessionConfidence === "medium" ? "#F59E0B" : "#F87171" }}>
                {poseMetrics.sessionConfidence === "medium" ? "MEDIUM" : "LOW"} CONFIDENCE
              </span>
              <span style={{ fontSize: 9, color: whiteAlpha(0.28), fontWeight: 700 }}>
                {poseMetrics.sessionConfidence === "medium" ? "— findings directional, not definitive" : "— session too short or framing limited"}
              </span>
            </div>
          )}

          {(() => {
            const hasTypeUncertain = poseMetrics.coaching.some((c) => c.type === "caution" && c.message.includes("type uncertain"));
            if (hasTypeUncertain && poseMetrics.punchCount > 0) {
              return (
                <div style={{ marginBottom: 8, padding: "8px 12px", borderRadius: RADIUS.md, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontSize: 11, color: whiteAlpha(0.35), fontWeight: 700 }}>
                    {poseMetrics.punchCount} punches detected — type classification uncertain. Punch more directly toward camera for technique feedback.
                  </span>
                </div>
              );
            }
            return null;
          })()}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {poseMetrics.coaching.filter((c) => c.type !== "caution").map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: RADIUS.md, background: c.type === "strength" ? "rgba(52,211,153,0.04)" : "rgba(245,196,81,0.04)", border: `1px solid ${c.type === "strength" ? "rgba(52,211,153,0.14)" : "rgba(245,196,81,0.14)"}`, borderLeft: `3px solid ${c.type === "strength" ? "rgba(52,211,153,0.45)" : "rgba(245,196,81,0.45)"}` }}>
                <span style={{ fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1, color: c.type === "strength" ? "rgba(52,211,153,0.8)" : "rgba(245,196,81,0.7)" }}>{c.type === "strength" ? "✓" : "→"}</span>
                <span style={{ fontSize: 12, fontWeight: 800, lineHeight: 1.45, color: c.type === "strength" ? "rgba(52,211,153,0.8)" : whiteAlpha(0.72) }}>{c.message}</span>
              </div>
            ))}
            {poseMetrics.coaching.filter((c) => c.type === "caution").map((c, i) => (
              <div key={`caution-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 12px", borderRadius: RADIUS.md, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span style={{ fontSize: 9, color: whiteAlpha(0.28), flexShrink: 0, marginTop: 1 }}>⚠</span>
                <span style={{ fontSize: 10.5, color: whiteAlpha(0.32), fontWeight: 700, lineHeight: 1.45 }}>{c.message}</span>
              </div>
            ))}
          </div>

          {(() => {
            const bd = poseMetrics?.punchBreakdown;
            if (!bd || !Object.keys(bd).length) return null;
            const TYPE_LABEL = { jab: "JAB", cross: "CROSS", hook: "HOOK" };
            return (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["jab", "cross", "hook"].filter((k) => bd[k]).map((k) => (
                  <div key={k} style={{ flex: 1, minWidth: 64, padding: "7px 10px", borderRadius: RADIUS.md, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}`, textAlign: "center" }}>
                    <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.3), marginBottom: 3 }}>{TYPE_LABEL[k]}</div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>{bd[k].count}</div>
                    <div style={{ fontSize: 9, color: whiteAlpha(0.28), fontWeight: 700 }}>avg {bd[k].avgAngle}°</div>
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
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: whiteAlpha(0.3), flexShrink: 0, marginTop: 1 }}>📷</span>
                <span style={{ fontSize: 10.5, color: whiteAlpha(0.3), fontWeight: 700, lineHeight: 1.45 }}>Stance & balance not analyzed — lower body was outside the frame. Step back next session for full feedback.</span>
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
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>GUARD</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 2, height: 10, background: "rgba(245,196,81,0.6)", borderRadius: 2 }} />
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>RIGHT PUNCH</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 2, height: 10, background: "rgba(148,163,184,0.55)", borderRadius: 2 }} />
              <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>LEFT PUNCH</span>
            </div>
          </div>
        </>
      )}

      {/* Session Details (collapsible) */}
      {(hasTimeline || (!activeChallenge && result.breakdown) || true) && (
        <>
          <button type="button" onClick={() => setShowDetails((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "8px 0 4px", cursor: "pointer", color: whiteAlpha(0.3), fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>
            <span>{showDetails ? "▾" : "▸"}</span>
            {showDetails ? "HIDE DETAILS" : "SESSION DETAILS"}
          </button>
          {showDetails && (
            <>
              {hasTimeline && (
                <>
                  <SectionLabel label={t("trainLabelSessionTimeline")} />
                  <div style={{ borderRadius: RADIUS.md, padding: "10px 14px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`, display: "flex", flexDirection: "column", gap: 5 }}>
                    {timelineEvents.map((ev) => (
                      <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 9, fontFamily: "monospace", color: goldAlpha(0.5), fontWeight: 700, flexShrink: 0 }}>[{fmtTime(ev.timestamp - (sessionStartTime || ev.timestamp))}]</span>
                        <span style={{ fontSize: 10, color: whiteAlpha(0.35), fontWeight: 800 }}>{ev.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {!activeChallenge && result.breakdown && (
                <>
                  <SectionLabel label={t("trainLabelCombatTelemetry")} />
                  <div style={{ borderRadius: RADIUS.md, padding: "10px 14px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}` }}>
                    {[
                      { key: "accuracy",    en: "Accuracy",    mn: "Нарийвчлал", ko: "정확도" },
                      { key: "speed",       en: "Speed",       mn: "Хурд",       ko: "속도" },
                      { key: "power",       en: "Power",       mn: "Хүч",        ko: "파워" },
                      { key: "consistency", en: "Consistency", mn: "Тогтвортой", ko: "일관성" },
                    ].map(({ key, en, mn, ko }) => (
                      <TelemetryBar key={key} label={locale === "mn" ? mn : locale === "ko" ? ko : en} value={result.breakdown[key]} />
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
            <span style={{ fontSize: 10, color: whiteAlpha(0.32), fontWeight: 800, letterSpacing: 1 }}>{locale === "mn" ? "XP ЦУГЛУУЛСАН" : locale === "ko" ? "XP 획득" : "XP EARNED"}</span>
          </div>
          {!activeChallenge && result.rankProgress > 0 && (
            <>
              <div style={{ height: 2, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${result.rankProgress}%`, background: goldAlpha(0.55), borderRadius: 2, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
              </div>
              <div style={{ fontSize: 10, color: whiteAlpha(0.3), fontWeight: 700 }}>
                {locale === "mn" ? `Ранк дэвшил — ${result.rankProgress}%` : locale === "ko" ? `랭크 진행 — ${result.rankProgress}%` : `Rank progress — ${result.rankProgress}%`}
              </div>
            </>
          )}
          {hasMI && (
            <div style={{ fontSize: 10, color: whiteAlpha(0.25), fontWeight: 700, marginTop: 4 }}>
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
          </div>
        </>
      )}

      {/* Belt Up */}
      {beltUpInfo && (
        <>
          <SectionLabel label={locale === "mn" ? "БҮС ДЭВШИЛТ" : locale === "ko" ? "벨트 승급" : "BELT PROMOTION"} />
          <div style={{ borderRadius: RADIUS.md, padding: "20px 20px", textAlign: "center", background: `linear-gradient(135deg, ${beltUpInfo.color}14, ${blackAlpha(0.8)})`, border: `2px solid ${beltUpInfo.color}55`, animation: "rankUpPulse 2s ease-in-out infinite" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🥋</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: beltUpInfo.color, marginBottom: 4 }}>{locale === "mn" ? "БҮС АХИЛЛАА!" : locale === "ko" ? "벨트 승급!" : "BELT PROMOTED!"}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>{typeof t === "function" ? t(beltUpInfo.key) : beltUpInfo.key}</div>
            <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{locale === "mn" ? "Гайхалтай ахиц дэвшил!" : locale === "ko" ? "엄청난 발전입니다!" : "Incredible progress!"}</div>
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
            <div style={{ fontSize: 13, fontWeight: 900, color: rankUpInfo.color, marginBottom: 2 }}>{t("trainRankUp")}</div>
            <div style={{ fontSize: 11, color: "#fff", fontWeight: 800 }}>{t(rankUpInfo.key)}</div>
          </div>
        </>
      )}

      <div style={{ height: 10 }} />
    </div>
  );
}
