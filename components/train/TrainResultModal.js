"use client";

import { useEffect, useState, useRef } from "react";
import { GOLD, RED, RADIUS, redAlpha, goldAlpha, whiteAlpha, blackAlpha } from "@/lib/tokens";
import { getChallengeRank } from "@/lib/utils";
import { getChallengeComparisonPercent } from "@/lib/trainHelpers";
import { getSessionIdentity } from "@/lib/combatMemory";
import { cameraQualityScore } from "@/lib/cinematicCoaching";
import dynamic from "next/dynamic";
const MotionChart = dynamic(() => import("@/components/train/MotionChart"), { ssr: false });
import RankBadge from "@/components/RankBadge";
import styles from "@/components/train/trainStyles";

function useCountUp(target, duration = 1000) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (target == null) return;
    setDisplay(0);
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      setDisplay((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return display;
}

// Sub-labels for result modal display
const IDENTITY_SUBS = {
  "PRESSURE INITIATOR": "Forward-dominant pressure style",
  "MOBILE OUTBOXER":    "Strong lateral movement control",
  "REACTIVE COUNTER":   "Movement-reactive defensive reads",
  "GUARD INSTABILITY":  "Guard line needs consolidation",
  "BALANCE BREAKER":    "Dynamic weight transfer detected",
  "NARROW BASE":        "Stance too narrow — widen your base",
  "FORWARD HUNTER":     "Aggressive entry pattern detected",
  "SHARP EXECUTION":    "High-efficiency movement session",
  "SOLID FOUNDATION":   "Consistent movement quality",
  "DEVELOPING STYLE":   "Pattern emerging — keep building",
  "RAW ENERGY":         "Pure intensity — structure coming",
};

function getIdentityWithSub(score, movementEvents, poseMetrics) {
  const title = getSessionIdentity(score, movementEvents, poseMetrics);
  return { title, sub: IDENTITY_SUBS[title] || "" };
}

function computeComparison(curr, prev) {
  if (!curr || !prev || (curr.frameCount ?? 0) < 5) return [];
  const rows = [];

  // Extension angle — higher = more reach
  const cExt = curr.punchExtension?.angleDeg;
  const pExt = prev.punchExtension?.angleDeg;
  if (cExt != null && pExt != null) {
    const d = Math.round(cExt - pExt);
    if (Math.abs(d) >= 3) rows.push({ label: "Extension", value: `${d > 0 ? "+" : ""}${d}°`, improved: d > 0 });
  }

  // Guard — compare dominant status
  const gScore = (s) => s === "good" ? 1 : 0;
  const cG = curr.guardHeight?.status;
  const pG = prev.guardHeight?.status;
  if (cG && pG && cG !== pG) {
    const imp = gScore(cG) > gScore(pG);
    rows.push({ label: "Guard", value: imp ? "Better" : "Dropped more", improved: imp });
  }

  // Hand speed — higher avgSnapVelocity = faster
  const cSnap = curr.velocityStats?.avgSnapVelocity;
  const pSnap = prev.velocityStats?.avgSnapVelocity;
  if (cSnap != null && pSnap != null && pSnap > 0) {
    const pct = Math.round(((cSnap - pSnap) / pSnap) * 100);
    if (Math.abs(pct) >= 8) rows.push({ label: "Hand speed", value: `${pct > 0 ? "+" : ""}${pct}%`, improved: pct > 0 });
  }

  // Punch count
  const cCnt = curr.punchCount;
  const pCnt = prev.punchCount;
  if (cCnt != null && pCnt != null) {
    const d = cCnt - pCnt;
    if (Math.abs(d) >= 3) rows.push({ label: "Punches", value: `${d > 0 ? "+" : ""}${d}`, improved: d > 0 });
  }

  // Guard recovery — lower avgRecoilMs = faster = better
  const cMs = curr.velocityStats?.avgRecoilMs;
  const pMs = prev.velocityStats?.avgRecoilMs;
  if (cMs != null && pMs != null) {
    const d = Math.round(pMs - cMs); // positive = faster
    if (Math.abs(d) >= 40) rows.push({ label: "Recovery", value: `${d > 0 ? "-" : "+"}${Math.abs(d)}ms`, improved: d > 0 });
  }

  return rows;
}

function getBestPunchType(poseMetrics) {
  const pb = poseMetrics?.punchBreakdown;
  if (!pb) return null;
  const types = [
    { key: "jab",   label: "Jab",   count: pb.jab?.count   || 0 },
    { key: "cross", label: "Cross", count: pb.cross?.count || 0 },
    { key: "hook",  label: "Hook",  count: pb.hook?.count  || 0 },
  ];
  const best = types.reduce((a, b) => b.count > a.count ? b : a, types[0]);
  return best.count > 0 ? best.label : null;
}

function getNextFocus(result, poseMetrics) {
  const bd = result?.breakdown;
  if (!bd) return null;
  const lowest = Object.entries(bd).reduce((a, [k, v]) => v < a[1] ? [k, v] : a, ["", 99]);
  const focusMap = {
    accuracy:    "Land cleaner punches next session",
    speed:       "Work on snapping punches faster",
    power:       "Drive through — rotate your hips",
    consistency: "Keep your pace steady throughout",
  };
  return focusMap[lowest[0]] || null;
}

function getMovementSummary(movementEvents = []) {
  const seen = {};
  for (const ev of movementEvents) {
    if (!seen[ev.type]) seen[ev.type] = { label: ev.label, count: 0 };
    seen[ev.type].count++;
  }
  return Object.values(seen).sort((a, b) => b.count - a.count);
}

function fmtTime(ms) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function SectionLabel({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 10px" }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: goldAlpha(0.5), flexShrink: 0 }} />
      <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.32), textTransform: "uppercase" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: whiteAlpha(0.05) }} />
    </div>
  );
}

function TelemetryBar({ label, value }) {
  const pct = Math.min(100, (value / 10) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0" }}>
      <span style={{ width: 72, fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.28), textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 2, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: whiteAlpha(0.42), borderRadius: 2, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
      <span style={{ width: 28, fontSize: 12, fontWeight: 900, color: whiteAlpha(0.6), textAlign: "right", flexShrink: 0, fontFamily: "monospace" }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

export default function TrainResultModal({
  debrief = null,
  debriefLoading = false,
  result,
  activeChallenge,
  challengeUserId,
  challengeSaving,
  challengeSaved,
  rankUpInfo,
  sessionHistory,
  ghostBestScore,
  pvpResult,
  opponentUsername,
  targetScore,
  reelId,
  missionJustCompleted,
  missionStreakBonus,
  missionNewStreak,
  movementEvents,
  sessionStartTime,
  poseMetrics = null,
  prevPoseMetrics = null,
  userStreak = 0,
  error,
  saving,
  saved,
  savedAttemptNumber,
  locale,
  t,
  router,
  onTryAgain,
  onSave,
  onSaveChallengeResult,
  onShareChallenge,
  onShareTraining,
  isGuest = false,
}) {
  const displayScore = useCountUp(result?.score);
  const [sessionTag, setSessionTag] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  if (!result) return null;

  const MIN_PUNCHES = 5;
  const effectivePunchCount = poseMetrics?.punchCount ?? result.hitCount ?? 0;
  const tooFewPunches = effectivePunchCount < MIN_PUNCHES;

  const events = movementEvents || [];
  const identity = tooFewPunches ? null : getIdentityWithSub(result.score, events, poseMetrics);
  const movementSummary = getMovementSummary(events);
  const comparison = computeComparison(poseMetrics, prevPoseMetrics);
  const timelineEvents = events.slice(-8);
  const hasMI = movementSummary.length > 0;
  const hasTimeline = timelineEvents.length > 0;

  const analysisLabel = challengeUserId
    ? "PVP ANALYSIS"
    : activeChallenge
      ? "CHALLENGE ANALYSIS"
      : "COMBAT ANALYSIS";

  return (
    <div style={styles.modalWrap}>
      <style>{`@keyframes dotBounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
      <div style={styles.modalOverlay} />
      <section style={styles.modal}>

        {/* ── HEADER ───────────────────────────────────────────────── */}
        <div style={{ padding: "20px 20px 14px", flexShrink: 0, borderBottom: `1px solid ${whiteAlpha(0.05)}` }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 900, letterSpacing: 3.5, color: goldAlpha(0.65), textTransform: "uppercase" }}>
            {analysisLabel}
          </p>

          {tooFewPunches ? (
            /* ── Not enough data ── */
            <div style={{ margin: "16px 0 10px" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 1000, color: whiteAlpha(0.55), letterSpacing: "-0.01em" }}>
                {locale === "mn" ? "Хангалтгүй өгөгдөл" : "Not Enough Data"}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.35), lineHeight: 1.5 }}>
                {locale === "mn"
                  ? `AI шинжилгээнд хамгийн багадаа ${MIN_PUNCHES} цохилт хэрэгтэй. Та ${effectivePunchCount} цохилт хийсэн.`
                  : `AI analysis needs at least ${MIN_PUNCHES} punches. You threw ${effectivePunchCount}.`}
              </p>
            </div>
          ) : (
            <>
              <h2 style={{
                margin: "8px 0 2px", fontSize: 24, fontWeight: 1000,
                letterSpacing: "-0.02em", color: "#fff", lineHeight: 1.0,
                fontFamily: "var(--font-display, 'Anton', sans-serif)",
              }}>
                {identity.title}
              </h2>
              <p style={{ margin: "0 0 14px", fontSize: 11, color: whiteAlpha(0.35), fontWeight: 700 }}>
                {identity.sub}
              </p>

              {/* Score telemetry bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, height: 3, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(displayScore / 10) * 100}%`,
                    background: `linear-gradient(90deg, ${RED}, ${GOLD})`,
                    borderRadius: 2,
                    transition: "width 0.04s linear",
                  }} />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 32, fontWeight: 1000, lineHeight: 1,
                    fontFamily: "var(--font-display, 'Anton', sans-serif)",
                    letterSpacing: "-0.02em", color: "#fff",
                  }}>
                    {displayScore.toFixed(1)}
                  </span>
                  <span style={{ fontSize: 12, color: whiteAlpha(0.28), fontWeight: 800 }}>/10</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── RETURN SUMMARY ───────────────────────────────────────── */}
        {!tooFewPunches && (() => {
          const lastScore = Array.isArray(sessionHistory) && sessionHistory.length > 0 ? sessionHistory[0] : null;
          const delta = lastScore != null ? result.score - lastScore : null;
          const bestPunch = getBestPunchType(poseMetrics);
          const nextFocus = getNextFocus(result, poseMetrics);
          // Use missionNewStreak (post-save) if higher than the at-mount snapshot
          const effectiveStreak = Math.max(userStreak || 0, missionNewStreak || 0);
          return (
            <div style={{ padding: "12px 20px 0", display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
              {/* Score row */}
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
                  <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>Today</div>
                  <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{result.score.toFixed(1)}</div>
                </div>
                {delta != null && (
                  <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: delta >= 0 ? "rgba(52,211,153,0.04)" : "rgba(248,113,113,0.04)", border: `1px solid ${delta >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"}` }}>
                    <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>vs Last</div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: delta >= 0 ? "#34D399" : "#F87171", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}</div>
                  </div>
                )}
                {ghostBestScore != null && (
                  <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
                    <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>Best</div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: GOLD, fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{Math.max(ghostBestScore, result.score).toFixed(1)}</div>
                  </div>
                )}
              </div>
              {/* Punch info + next focus */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <div style={{ padding: "6px 11px", borderRadius: 8, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.06)}`, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1 }}>Punches</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{effectivePunchCount}</span>
                </div>
                {bestPunch && (
                  <div style={{ padding: "6px 11px", borderRadius: 8, background: "rgba(245,196,81,0.05)", border: `1px solid rgba(245,196,81,0.14)`, display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: goldAlpha(0.55), textTransform: "uppercase", letterSpacing: 1 }}>Best weapon</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: GOLD }}>{bestPunch}</span>
                  </div>
                )}
                {effectiveStreak > 0 && (
                  <div style={{ padding: "6px 11px", borderRadius: 8, background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.16)", display: "flex", gap: 5, alignItems: "center" }}>
                    <span style={{ fontSize: 14 }}>🔥</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#FB923C" }}>{effectiveStreak}d</span>
                  </div>
                )}
              </div>
              {nextFocus && (
                <div style={{ padding: "7px 12px", borderRadius: 9, background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.13)", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(168,85,247,0.65)", textTransform: "uppercase", letterSpacing: 1, flexShrink: 0, paddingTop: 1 }}>Next focus</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: whiteAlpha(0.65), lineHeight: 1.4 }}>{nextFocus}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── AI DEBRIEF ───────────────────────────────────────────── */}
        {!tooFewPunches && (debriefLoading || debrief) && (
          <div style={{
            margin: "0 20px 0",
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(245,196,81,0.04)",
            border: "1px solid rgba(245,196,81,0.14)",
            borderLeft: "3px solid rgba(245,196,81,0.55)",
          }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: goldAlpha(0.55), textTransform: "uppercase", marginBottom: 7 }}>
              AI Debrief
            </div>
            {debriefLoading
              ? (
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: goldAlpha(0.4),
                      animation: `dotBounce 1.1s ease-in-out ${i * 0.18}s infinite`,
                    }} />
                  ))}
                </div>
              )
              : (
                <p style={{ margin: 0, fontSize: 12, color: whiteAlpha(0.72), lineHeight: 1.6, fontStyle: "italic" }}>
                  {debrief}
                </p>
              )
            }
          </div>
        )}

        {/* ── SCROLLABLE ANALYSIS ──────────────────────────────────── */}
        <div style={{ overflowY: "auto", padding: "0 20px", flex: 1 }}>

          {/* vs Last Session */}
          {comparison.length > 0 && (
            <>
              <SectionLabel label="vs Last Session" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {comparison.map((c, i) => (
                  <div key={i} style={{
                    padding: "9px 12px", borderRadius: RADIUS.md,
                    background: c.improved ? "rgba(52,211,153,0.04)" : "rgba(248,113,113,0.04)",
                    border: `1px solid ${c.improved ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"}`,
                  }}>
                    <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 4 }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: c.improved ? "#34D399" : "#F87171", fontFamily: "var(--font-display, 'Anton', sans-serif)", lineHeight: 1 }}>
                      {c.value}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* PvP */}
          {challengeUserId && pvpResult && (
            <>
              <SectionLabel label="Match Result" />
              <div style={{
                borderRadius: RADIUS.md, padding: "14px 16px",
                background: pvpResult === "win" ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)",
                border: `1px solid ${pvpResult === "win" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2.5, color: pvpResult === "win" ? "#34D399" : "#F87171", marginBottom: 12 }}>
                  {pvpResult === "win" ? t("pvpWin") : t("pvpLose")}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)", color: "#fff" }}>{result.score.toFixed(1)}</div>
                    <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>YOU</div>
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

          {/* Ghost */}
          {!challengeUserId && ghostBestScore !== null && (
            <>
              <SectionLabel label={result.score > ghostBestScore ? "New Personal Best" : "vs Personal Best"} />
              <div style={{
                borderRadius: RADIUS.md, padding: "12px 16px",
                background: result.score > ghostBestScore ? "rgba(52,211,153,0.05)" : whiteAlpha(0.025),
                border: `1px solid ${result.score > ghostBestScore ? "rgba(52,211,153,0.16)" : whiteAlpha(0.06)}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)", color: result.score > ghostBestScore ? "#34D399" : "#fff" }}>
                    {result.score.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>SESSION</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: result.score >= ghostBestScore ? "#34D399" : "#F87171" }}>
                  {result.score >= ghostBestScore
                    ? `+${(result.score - ghostBestScore).toFixed(1)}`
                    : (result.score - ghostBestScore).toFixed(1)}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 1000, fontFamily: "var(--font-display, 'Anton', sans-serif)", color: whiteAlpha(0.45) }}>
                    {ghostBestScore.toFixed(1)}
                  </div>
                  <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>BEST</div>
                </div>
              </div>
            </>
          )}

          {/* Challenge rank */}
          {activeChallenge && (
            <>
              <SectionLabel label="Challenge Result" />
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, borderRadius: RADIUS.md, padding: "12px", background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}`, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 800, letterSpacing: 1.5, marginBottom: 5 }}>{t("challengeRank")}</div>
                  <div style={{ fontSize: 18, fontWeight: 1000, color: GOLD }}>{getChallengeRank(result.score)}</div>
                </div>
                <div style={{ flex: 1, borderRadius: RADIUS.md, padding: "12px", background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}`, textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 800, letterSpacing: 1.5, marginBottom: 5 }}>BEAT</div>
                  <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff" }}>{getChallengeComparisonPercent(result.score)}%</div>
                </div>
              </div>
            </>
          )}

          {/* Movement Intelligence */}
          {hasMI && (
            <>
              <SectionLabel label="Movement Intelligence" />
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {movementSummary.map((ev) => (
                  <div key={ev.label} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 14px", borderRadius: RADIUS.md,
                    background: whiteAlpha(0.028), border: `1px solid ${whiteAlpha(0.055)}`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: whiteAlpha(0.62), textTransform: "capitalize" }}>
                      {ev.label}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 900, letterSpacing: 1,
                      color: whiteAlpha(0.3), background: whiteAlpha(0.06),
                      border: `1px solid ${whiteAlpha(0.08)}`,
                      borderRadius: RADIUS.full, padding: "2px 8px",
                    }}>
                      ×{ev.count}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Coaching Notes — cinematic coaching from session analysis */}
          {poseMetrics?.coaching?.length > 0 && (
            <>
              <SectionLabel label="Coaching Notes" />

              {/* Camera quality + punch count header */}
              {(() => {
                const score = cameraQualityScore(poseMetrics.cameraQuality);
                const scoreColor =
                  score === "PERFECT" ? "#34D399" :
                  score === "GOOD"    ? "#34D399" :
                  score === "LIMITED" ? "#F59E0B" : "#F87171";
                return (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10,
                    marginBottom: 8, padding: "5px 0",
                  }}>
                    {score && score !== null && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: scoreColor }}>
                          {score}
                        </span>
                        <span style={{ fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700 }}>CAMERA</span>
                      </div>
                    )}
                    {poseMetrics.punchCount > 0 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 9, color: whiteAlpha(0.22) }}>·</span>
                        <span style={{ fontSize: 9, fontWeight: 900, color: whiteAlpha(0.55) }}>
                          {poseMetrics.punchCount} PUNCHES
                        </span>
                      </div>
                    ) : poseMetrics?.frameCount >= 20 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 9, color: whiteAlpha(0.22) }}>·</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: whiteAlpha(0.28) }}>
                          movement detected, punch unclear
                        </span>
                      </div>
                    ) : null}
                    {poseMetrics.velocityStats?.snapRating && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 9, color: whiteAlpha(0.22) }}>·</span>
                        <span style={{ fontSize: 9, fontWeight: 900, color:
                          poseMetrics.velocityStats.snapRating === "FAST"     ? "#34D399" :
                          poseMetrics.velocityStats.snapRating === "MODERATE" ? "#F59E0B" : "#F87171",
                        }}>
                          {poseMetrics.velocityStats.snapRating}
                        </span>
                        <span style={{ fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700 }}>SNAP</span>
                      </div>
                    )}
                    {poseMetrics.velocityStats?.recoilRating && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 9, color: whiteAlpha(0.22) }}>·</span>
                        <span style={{ fontSize: 9, fontWeight: 900, color:
                          poseMetrics.velocityStats.recoilRating === "QUICK"    ? "#34D399" :
                          poseMetrics.velocityStats.recoilRating === "MODERATE" ? "#F59E0B" : "#F87171",
                        }}>
                          {poseMetrics.velocityStats.recoilRating}
                        </span>
                        <span style={{ fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700 }}>RECOVERY</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Boxing intelligence — style + weakness + tactical identity */}
              {(() => {
                const bi = poseMetrics.boxingIntelligence;
                if (!bi) return null;
                const styleColor =
                  bi.style === "explosive" ? "#F59E0B" :
                  bi.style === "pressure"  ? "#F87171" :
                  bi.style === "outboxer"  ? "#34D399" : "#94A3B8";
                const tactical   = bi.tactical;
                const ringIQ    = bi.ringIQ;
                const dna       = bi.fighterDNA;
                return (
                  <>
                    <div style={{
                      marginBottom: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                    }}>
                      {bi.styleLabel && bi.styleConfidence >= 0.3 && (
                        <div style={{
                          padding: "3px 10px", borderRadius: 20,
                          background: `${styleColor}14`,
                          border: `1px solid ${styleColor}35`,
                          fontSize: 9, fontWeight: 900, letterSpacing: 1.5,
                          color: styleColor, textTransform: "uppercase",
                        }}>
                          {bi.styleLabel}
                        </div>
                      )}
                      {tactical?.profileLabel && (
                        <div style={{
                          padding: "3px 10px", borderRadius: 20,
                          background: "rgba(96,165,250,0.10)",
                          border: "1px solid rgba(96,165,250,0.28)",
                          fontSize: 9, fontWeight: 900, letterSpacing: 1.2,
                          color: "#60A5FA", textTransform: "uppercase",
                        }}>
                          {tactical.profileLabel}
                        </div>
                      )}
                      {bi.weakness && (
                        <div style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 700 }}>
                          Focus: <span style={{ color: "#F59E0B", fontWeight: 900 }}>{bi.weakness.label}</span>
                        </div>
                      )}
                    </div>
                    {/* Tactical cues */}
                    {tactical?.tacticalCues?.length > 0 && (
                      <div style={{
                        marginBottom: 8, padding: "7px 10px", borderRadius: 8,
                        background: "rgba(96,165,250,0.05)",
                        border: "1px solid rgba(96,165,250,0.14)",
                      }}>
                        {tactical.tacticalCues.map((cue, i) => (
                          <div key={i} style={{
                            fontSize: 10, color: whiteAlpha(0.65), lineHeight: 1.55,
                            paddingBottom: i < tactical.tacticalCues.length - 1 ? 4 : 0,
                          }}>
                            → {cue}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Defensive profile — Phase 2 */}
                    {bi.defensive && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                          <div style={{
                            padding: "3px 10px", borderRadius: 20,
                            background: "rgba(167,139,250,0.10)",
                            border: "1px solid rgba(167,139,250,0.28)",
                            fontSize: 9, fontWeight: 900, letterSpacing: 1.2,
                            color: "#A78BFA", textTransform: "uppercase",
                          }}>
                            {bi.defensive.defensiveStyleLabel}
                          </div>
                          <span style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 700 }}>
                            {bi.defensive.slipCount}s {bi.defensive.bobCount}b defensive actions
                          </span>
                        </div>
                        {bi.defensive.defensiveCues?.length > 0 && (
                          <div style={{
                            padding: "7px 10px", borderRadius: 8,
                            background: "rgba(167,139,250,0.05)",
                            border: "1px solid rgba(167,139,250,0.14)",
                          }}>
                            {bi.defensive.defensiveCues.map((cue, i) => (
                              <div key={i} style={{
                                fontSize: 10, color: whiteAlpha(0.65), lineHeight: 1.55,
                                paddingBottom: i < bi.defensive.defensiveCues.length - 1 ? 4 : 0,
                              }}>
                                → {cue}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Ring IQ — Phase 3 */}
                    {ringIQ && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                          <div style={{
                            padding: "3px 10px", borderRadius: 20,
                            background: "rgba(249,168,212,0.10)",
                            border: "1px solid rgba(249,168,212,0.28)",
                            fontSize: 9, fontWeight: 900, letterSpacing: 1.2,
                            color: "#F9A8D4", textTransform: "uppercase",
                          }}>
                            {ringIQ.iqLabel}
                          </div>
                          <span style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 700 }}>
                            IQ {ringIQ.iqScore}/100
                          </span>
                        </div>
                        {ringIQ.cues?.length > 0 && (
                          <div style={{
                            padding: "7px 10px", borderRadius: 8,
                            background: "rgba(249,168,212,0.04)",
                            border: "1px solid rgba(249,168,212,0.14)",
                          }}>
                            {ringIQ.cues.map((cue, i) => (
                              <div key={i} style={{
                                fontSize: 10, color: whiteAlpha(0.65), lineHeight: 1.55,
                                paddingBottom: i < ringIQ.cues.length - 1 ? 4 : 0,
                              }}>
                                → {cue}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {/* Fighter DNA — Phase 4 */}
                    {dna && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                          <div style={{
                            padding: "3px 10px", borderRadius: 20,
                            background: "rgba(252,211,77,0.10)",
                            border: "1px solid rgba(252,211,77,0.28)",
                            fontSize: 9, fontWeight: 900, letterSpacing: 1.2,
                            color: "#FCD34D", textTransform: "uppercase",
                          }}>
                            {dna.archetypeLabel}
                          </div>
                          <span style={{ fontSize: 9, color: whiteAlpha(0.32), fontWeight: 700 }}>
                            {dna.similarity}% match
                          </span>
                        </div>
                        <div style={{
                          padding: "7px 10px", borderRadius: 8,
                          background: "rgba(252,211,77,0.04)",
                          border: "1px solid rgba(252,211,77,0.14)",
                        }}>
                          {dna.archetypeTraits?.map((trait, i) => (
                            <div key={i} style={{
                              fontSize: 10, color: whiteAlpha(0.55), lineHeight: 1.55,
                              paddingBottom: i < dna.archetypeTraits.length - 1 ? 3 : 0,
                            }}>
                              · {trait}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Session confidence indicator */}
              {poseMetrics.sessionConfidence && poseMetrics.sessionConfidence !== "high" && (
                <div style={{
                  marginBottom: 8, display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 10px", borderRadius: RADIUS.md,
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <span style={{
                    fontSize: 8, fontWeight: 900, letterSpacing: 1.5,
                    color: poseMetrics.sessionConfidence === "medium" ? "#F59E0B" : "#F87171",
                  }}>
                    {poseMetrics.sessionConfidence === "medium" ? "MEDIUM" : "LOW"} CONFIDENCE
                  </span>
                  <span style={{ fontSize: 9, color: whiteAlpha(0.28), fontWeight: 700 }}>
                    {poseMetrics.sessionConfidence === "medium"
                      ? "— findings directional, not definitive"
                      : "— session too short or framing limited"}
                  </span>
                </div>
              )}

              {/* When type is uncertain, suppress type-specific coaching */}
              {(() => {
                const hasTypeUncertain = poseMetrics.coaching.some(
                  (c) => c.type === "caution" && c.message.includes("type uncertain")
                );
                if (hasTypeUncertain && poseMetrics.punchCount > 0) {
                  return (
                    <div style={{
                      marginBottom: 8, padding: "8px 12px", borderRadius: RADIUS.md,
                      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)",
                    }}>
                      <span style={{ fontSize: 11, color: whiteAlpha(0.35), fontWeight: 700 }}>
                        {poseMetrics.punchCount} punches detected — type classification uncertain. Punch more directly toward camera for technique feedback.
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {poseMetrics.coaching
                  .filter((c) => c.type !== "caution")
                  .map((c, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    padding: "10px 14px", borderRadius: RADIUS.md,
                    background: c.type === "strength"
                      ? "rgba(52,211,153,0.04)"
                      : "rgba(245,196,81,0.04)",
                    border: `1px solid ${c.type === "strength" ? "rgba(52,211,153,0.14)" : "rgba(245,196,81,0.14)"}`,
                    borderLeft: `3px solid ${c.type === "strength" ? "rgba(52,211,153,0.45)" : "rgba(245,196,81,0.45)"}`,
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1,
                      color: c.type === "strength" ? "rgba(52,211,153,0.8)" : "rgba(245,196,81,0.7)",
                    }}>
                      {c.type === "strength" ? "✓" : "→"}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: 800, lineHeight: 1.45,
                      color: c.type === "strength" ? "rgba(52,211,153,0.8)" : whiteAlpha(0.72),
                    }}>
                      {c.message}
                    </span>
                  </div>
                ))}

                {/* Caution messages — shown only when session confidence warrants it */}
                {poseMetrics.coaching.filter((c) => c.type === "caution").map((c, i) => (
                  <div key={`caution-${i}`} style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    padding: "8px 12px", borderRadius: RADIUS.md,
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <span style={{ fontSize: 9, color: whiteAlpha(0.28), flexShrink: 0, marginTop: 1 }}>⚠</span>
                    <span style={{ fontSize: 10.5, color: whiteAlpha(0.32), fontWeight: 700, lineHeight: 1.45 }}>
                      {c.message}
                    </span>
                  </div>
                ))}
              </div>

              {/* Punch breakdown by type */}
              {(() => {
                const bd = poseMetrics?.punchBreakdown;
                if (!bd || !Object.keys(bd).length) return null;
                const TYPE_LABEL = { jab: "JAB", cross: "CROSS", hook: "HOOK" };
                return (
                  <div style={{
                    marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap",
                  }}>
                    {["jab", "cross", "hook"].filter((t) => bd[t]).map((t) => (
                      <div key={t} style={{
                        flex: 1, minWidth: 64,
                        padding: "7px 10px", borderRadius: RADIUS.md,
                        background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}`,
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.3), marginBottom: 3 }}>
                          {TYPE_LABEL[t]}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
                          {bd[t].count}
                        </div>
                        <div style={{ fontSize: 9, color: whiteAlpha(0.28), fontWeight: 700 }}>
                          avg {bd[t].avgAngle}°
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Framing note — only when key lower-body metrics were completely invisible */}
              {(() => {
                const gaps = poseMetrics?.visibilityGaps || [];
                const lowerGap = gaps.some((k) => ["stanceWidth", "balance"].includes(k));
                if (!lowerGap) return null;
                return (
                  <div style={{
                    marginTop: 6, display: "flex", alignItems: "flex-start", gap: 8,
                    padding: "8px 12px", borderRadius: RADIUS.md,
                    background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.06)}`,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: whiteAlpha(0.3), flexShrink: 0, marginTop: 1 }}>📷</span>
                    <span style={{ fontSize: 10.5, color: whiteAlpha(0.3), fontWeight: 700, lineHeight: 1.45 }}>
                      Stance & balance not analyzed — lower body was outside the frame. Step back next session for full feedback.
                    </span>
                  </div>
                );
              })()}
            </>
          )}

          {/* Motion Analysis — guard timeline + punch event chart */}
          {poseMetrics?.motionHistory && (
            <>
              <SectionLabel label="Motion Analysis" />
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
          {(hasTimeline || (!activeChallenge && result.breakdown) || sessionHistory.length > 0) && (
            <>
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: "8px 0 4px", cursor: "pointer", color: whiteAlpha(0.3), fontSize: 10, fontWeight: 800, letterSpacing: 1 }}
              >
                <span>{showDetails ? "▾" : "▸"}</span>
                {showDetails ? "HIDE DETAILS" : "SESSION DETAILS"}
              </button>
              {showDetails && (
                <>
                  {hasTimeline && (
                    <>
                      <SectionLabel label="Session Timeline" />
                      <div style={{ borderRadius: RADIUS.md, padding: "10px 14px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`, display: "flex", flexDirection: "column", gap: 5 }}>
                        {timelineEvents.map((ev) => (
                          <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 9, fontFamily: "monospace", color: goldAlpha(0.5), fontWeight: 700, flexShrink: 0 }}>
                              [{fmtTime(ev.timestamp - (sessionStartTime || ev.timestamp))}]
                            </span>
                            <span style={{ fontSize: 10, color: whiteAlpha(0.35), fontWeight: 800 }}>{ev.label}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {!activeChallenge && result.breakdown && (
                    <>
                      <SectionLabel label="Combat Telemetry" />
                      <div style={{ borderRadius: RADIUS.md, padding: "10px 14px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}` }}>
                        <TelemetryBar label="Accuracy"    value={result.breakdown.accuracy} />
                        <TelemetryBar label="Speed"       value={result.breakdown.speed} />
                        <TelemetryBar label="Power"       value={result.breakdown.power} />
                        <TelemetryBar label="Consistency" value={result.breakdown.consistency} />
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* Combat Experience */}
          <>
            <SectionLabel label="Combat Experience" />
            <div style={{ borderRadius: RADIUS.md, padding: "12px 16px", background: whiteAlpha(0.025), border: `1px solid ${whiteAlpha(0.06)}` }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 1000, color: GOLD, fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
                  +{result.xpGained}
                </span>
                <span style={{ fontSize: 10, color: whiteAlpha(0.32), fontWeight: 800, letterSpacing: 1 }}>XP EARNED</span>
              </div>
              {!activeChallenge && result.rankProgress > 0 && (
                <>
                  <div style={{ height: 2, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${result.rankProgress}%`, background: goldAlpha(0.55), borderRadius: 2, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
                  </div>
                  <div style={{ fontSize: 10, color: whiteAlpha(0.3), fontWeight: 700 }}>
                    Rank progress — {result.rankProgress}%
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
              <SectionLabel label="Daily Mission" />
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

          {/* Rank Up */}
          {rankUpInfo && (
            <>
              <SectionLabel label="Rank Advancement" />
              <div style={{
                borderRadius: RADIUS.md, padding: "16px 20px", textAlign: "center",
                background: `linear-gradient(135deg, ${rankUpInfo.color}12, ${blackAlpha(0.75)})`,
                border: `1px solid ${rankUpInfo.color}3a`,
                animation: "rankUpPulse 2s ease-in-out infinite",
              }}>
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

        {/* ── ACTIONS ──────────────────────────────────────────────── */}
        <div style={{ padding: "12px 20px 16px", flexShrink: 0, borderTop: `1px solid ${whiteAlpha(0.06)}` }}>
          {error && (
            <div style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 10, background: redAlpha(0.12), border: `1px solid ${redAlpha(0.28)}`, color: "#fca5a5", fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            <button type="button" style={styles.tryAgainButton} onClick={onTryAgain}>
              {activeChallenge ? t("challengeTryAgain") : t("trainTryAgain")}
            </button>
            {!activeChallenge && !saved && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                {["Bag", "Shadow", "Mitts", "Sparring", "Conditioning"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSessionTag((t) => t === tag ? null : tag)}
                    style={{
                      padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, cursor: "pointer",
                      background: sessionTag === tag ? goldAlpha(0.2) : "rgba(255,255,255,0.05)",
                      border: `1px solid ${sessionTag === tag ? goldAlpha(0.5) : "rgba(255,255,255,0.1)"}`,
                      color: sessionTag === tag ? GOLD : "rgba(255,255,255,0.4)",
                      transition: "all 0.15s",
                    }}
                  >{tag}</button>
                ))}
              </div>
            )}
            {!tooFewPunches && !activeChallenge && !isGuest && (
              <button
                type="button"
                style={{ ...styles.saveButton, ...(saved ? styles.saveButtonDone : {}), opacity: saving || saved ? 0.65 : 1, cursor: saving || saved ? "default" : "pointer" }}
                onClick={() => {
                  // Strip heavy frame-by-frame arrays, keep compact weakness list for history
                  const { motionHistory: _mh, punchEvents: _pe, coaching, ...poseMetricsForSave } = poseMetrics || {};
                  const weaknesses = (coaching || []).filter(c => c.type === "improve").map(c => c.message).slice(0, 2);
                  if (weaknesses.length) poseMetricsForSave.weaknesses = weaknesses;
                  onSave({ movementEvents: events, tag: sessionTag, poseMetrics: poseMetrics ? poseMetricsForSave : null });
                }}
                disabled={saving || saved}
              >
                {saving
                  ? t("trainSaving")
                  : saved && savedAttemptNumber
                    ? t("trainAttemptSaved").replace("{n}", savedAttemptNumber)
                    : saved
                      ? t("trainSavedShort")
                      : t("trainSaveProgress")}
              </button>
            )}
            {!tooFewPunches && isGuest && (
              <button
                type="button"
                style={{ ...styles.saveButton, background: "linear-gradient(135deg, #F5C451 0%, #FF3B30 100%)", color: "#000", fontWeight: 900 }}
                onClick={() => router.push(`/${locale}/login?mode=signup&redirect=${encodeURIComponent(`/${locale}/train`)}`)}
              >
                {locale === "mn" ? "Профайл үүсгэж streak болон дэвшлийг хадгал →" : locale === "ko" ? "프로필 생성 — 스트릭과 진행 저장 →" : "Create profile to save streak and progress →"}
              </button>
            )}
            {activeChallenge && (
              <button
                type="button"
                style={{ ...styles.saveButton, ...(challengeSaved ? styles.saveButtonDone : {}), opacity: challengeSaving || challengeSaved ? 0.65 : 1, cursor: challengeSaving || challengeSaved ? "default" : "pointer" }}
                onClick={onSaveChallengeResult}
                disabled={challengeSaving || challengeSaved}
              >
                {challengeSaving ? t("trainSaving") : challengeSaved ? t("challengeResultSaved") : t("challengeSaveResult")}
              </button>
            )}
            <button type="button" style={styles.shareResultButton} onClick={activeChallenge ? onShareChallenge : onShareTraining}>
              {t("share") || "Share"}
            </button>

            {/* Fighter Profile link — shown after saving */}
            {(saved || challengeSaved) && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/fighter-profile`)}
                style={{
                  width: "100%", minHeight: 40,
                  background: "none", border: `1px solid ${whiteAlpha(0.08)}`,
                  borderRadius: RADIUS.md,
                  color: whiteAlpha(0.35), fontSize: 11, fontWeight: 800,
                  cursor: "pointer", letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                View Fighter Profile →
              </button>
            )}
          </div>
        </div>

      </section>
    </div>
  );
}
