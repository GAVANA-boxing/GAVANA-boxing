"use client";

import { useEffect, useState, useRef } from "react";
import { GOLD, RED, RADIUS, redAlpha, goldAlpha, whiteAlpha, blackAlpha } from "@/lib/tokens";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import { getChallengeRank } from "@/lib/utils";
import { getChallengeComparisonPercent } from "@/lib/trainHelpers";
import { generateTechniqueReview } from "@/lib/techniqueReview";
import { getSessionIdentity } from "@/lib/combatMemory";
import { cameraQualityScore } from "@/lib/cinematicCoaching";
import dynamic from "next/dynamic";
const MotionChart = dynamic(() => import("@/components/train/MotionChart"), { ssr: false });
import RankBadge from "@/components/RankBadge";
import styles from "@/components/train/trainStyles";
import { getBelt } from "@/lib/belts";
import { computeScoreConfidence, CONFIDENCE_TIPS } from "@/lib/scoreConfidence";
import { computePunchPattern } from "@/lib/movementInsight";

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
  "PRESSURE INITIATOR": { en: "Forward-dominant pressure style",      mn: "Урагшлах даралтын хэв маяг",       ko: "앞으로 밀어붙이는 압박 스타일" },
  "MOBILE OUTBOXER":    { en: "Strong lateral movement control",      mn: "Хажуугийн хөдөлгөөний хяналт",      ko: "강한 측면 이동 제어" },
  "REACTIVE COUNTER":   { en: "Movement-reactive defensive reads",    mn: "Хөдөлгөөнд суурилсан хамгаалалт",   ko: "움직임 기반 방어 판단" },
  "GUARD INSTABILITY":  { en: "Guard line needs consolidation",       mn: "Хамгаалалтын шугамаа бэхжүүл",      ko: "가드 라인 강화 필요" },
  "BALANCE BREAKER":    { en: "Dynamic weight transfer detected",     mn: "Динамик жингийн шилжилт илэрсэн",   ko: "동적 체중 이동 감지" },
  "NARROW BASE":        { en: "Stance too narrow — widen your base",  mn: "Зогсоол хэт нарийн — өргөл",        ko: "스탠스 너무 좁음 — 넓혀라" },
  "FORWARD HUNTER":     { en: "Aggressive entry pattern detected",    mn: "Довтолгооны хэв маяг илэрсэн",      ko: "공격적인 진입 패턴 감지" },
  "SHARP EXECUTION":    { en: "High-efficiency movement session",     mn: "Өндөр үр ашигтай хөдөлгөөн",        ko: "고효율 움직임 세션" },
  "SOLID FOUNDATION":   { en: "Consistent movement quality",         mn: "Тогтвортой хөдөлгөөний чанар",      ko: "일관된 움직임 품질" },
  "DEVELOPING STYLE":   { en: "Pattern emerging — keep building",    mn: "Хэв маяг бүрдэж байна — үргэлжлүүл", ko: "패턴 형성 중 — 계속 쌓아라" },
  "RAW ENERGY":         { en: "Pure intensity — structure coming",   mn: "Цэвэр эрч хүч — бүтэц бүрдэж байна", ko: "순수한 강도 — 구조 형성 중" },
};

function getIdentityWithSub(score, movementEvents, poseMetrics, locale = "en") {
  const title = getSessionIdentity(score, movementEvents, poseMetrics);
  const subs = IDENTITY_SUBS[title];
  const sub = subs ? (subs[locale] || subs.en) : "";
  return { title, sub };
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

const REVIEW_LABELS = {
  en: { wellDone: "What went well", mainFix: "Main fix", drill: "Drill", nextGoal: "Next session goal", notEnough: "Not enough data", positionTip: "Tracking tip" },
  mn: { wellDone: "Юу сайн байсан", mainFix: "Гол засах зүйл", drill: "Дасгал", nextGoal: "Дараагийн session-ийн зорилго", notEnough: "Хангалтгүй өгөгдөл", positionTip: "Tracking зөвлөгөө" },
  ko: { wellDone: "잘한 점", mainFix: "주요 개선점", drill: "드릴", nextGoal: "다음 세션 목표", notEnough: "데이터 부족", positionTip: "트래킹 팁" },
};

// ── Punch pattern breakdown — first glimpse of Fighter DNA ───────────────────
function PunchPatternCard({ poseMetrics, t }) {
  const pattern = computePunchPattern(poseMetrics?.punchBreakdown);
  if (!pattern) return null;
  const bars = [
    { key: "punchTypeJab",   pct: pattern.jabPct,   count: pattern.jab,   color: "#3B82F6" },
    { key: "punchTypeCross", pct: pattern.crossPct, count: pattern.cross, color: "#EF4444" },
    { key: "punchTypeHook",  pct: pattern.hookPct,  count: pattern.hook,  color: "#8B5CF6" },
  ];
  return (
    <div style={{ margin: "12px 20px 0", padding: "12px 14px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 10 }}>
        🥊 {t("punchPatternTitle")}
      </div>
      {bars.map((bar) => (
        <div key={bar.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 38, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {t(bar.key)}
          </div>
          <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${bar.pct}%`, background: bar.color, borderRadius: 3, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
          </div>
          <div style={{ width: 30, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.45)", textAlign: "right" }}>
            {bar.pct}%
          </div>
        </div>
      ))}
      <div style={{ marginTop: 10, fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", textAlign: "center", letterSpacing: 0.3 }}>
        {t(pattern.patternKey)}
      </div>
    </div>
  );
}

// ── Quick 3-line coaching summary shown before the detailed analysis ──────────
function ActionSummary({ poseMetrics, result, locale }) {
  const review = generateTechniqueReview({ poseMetrics, result, locale });
  if (review.lowData || (!review.strengths.length && !review.fixes.length && !review.drill)) return null;
  const good = review.strengths[0] || null;
  const fix  = review.fixes[0] || null;
  const next = review.drill || null;
  if (!good && !fix && !next) return null;
  const rows = [
    good && { icon: "✓", label: locale === "mn" ? "САЙН" : locale === "ko" ? "잘한 점" : "GOOD", text: good, color: GOLD },
    fix  && { icon: "✗", label: locale === "mn" ? "ЗАСАХ" : locale === "ko" ? "개선"   : "FIX",  text: fix,  color: "#F87171" },
    next && { icon: "→", label: locale === "mn" ? "ДАРААГИЙН" : locale === "ko" ? "다음"  : "NEXT", text: next, color: "rgba(255,255,255,0.75)" },
  ].filter(Boolean);
  return (
    <div style={{
      margin: "0 20px 8px",
      padding: "10px 14px",
      borderRadius: 12,
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `3px solid ${goldAlpha(0.55)}`,
      display: "flex", flexDirection: "column", gap: 7,
    }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: row.color, textTransform: "uppercase", flexShrink: 0, paddingTop: 2, minWidth: 36 }}>
            {row.icon} {row.label}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.45, fontWeight: 600 }}>{row.text}</span>
        </div>
      ))}
    </div>
  );
}

function CoachReviewCard({ poseMetrics, result, locale }) {
  const review = generateTechniqueReview({ poseMetrics, result, locale });
  const RL = REVIEW_LABELS[locale] || REVIEW_LABELS.en;

  if (review.lowData) {
    return (
      <div style={{
        margin: "0 20px 8px",
        padding: "12px 14px", borderRadius: 12,
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 6 }}>
          {RL.notEnough}
        </div>
        <p style={{ margin: "0 0 6px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
          {review.lowDataReason}
        </p>
        {review.positionAdvice && (
          <div style={{
            marginTop: 8, padding: "7px 10px", borderRadius: 8,
            background: "rgba(245,196,81,0.06)", border: "1px solid rgba(245,196,81,0.16)",
          }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: "rgba(245,196,81,0.65)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 }}>
              📷 {RL.positionTip}
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
              {review.positionAdvice}
            </p>
          </div>
        )}
      </div>
    );
  }

  const toneAccent = review.coachTone === "positive" ? "#34D399" : review.coachTone === "critical" ? "#F87171" : "#F5C451";

  return (
    <div style={{
      margin: "0 20px 8px",
      padding: "12px 14px", borderRadius: 12,
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `3px solid ${toneAccent}55`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: `${toneAccent}bb`, textTransform: "uppercase" }}>
          COACH REVIEW
        </div>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
        <div style={{ fontSize: 8.5, fontWeight: 900, color: "rgba(255,255,255,0.28)", letterSpacing: 1 }}>
          {review.title}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* What went well */}
        {review.strengths.length > 0 && (
          <div style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.14)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: "#6EE7B7", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>
              ✅ {RL.wellDone}
            </div>
            {review.strengths.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.45, paddingBottom: i < review.strengths.length - 1 ? 3 : 0 }}>
                · {s}
              </div>
            ))}
          </div>
        )}

        {/* Main fix */}
        {review.fixes.length > 0 && (
          <div style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(255,80,70,0.06)", border: "1px solid rgba(255,80,70,0.16)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: "#FCA5A5", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>
              ⚠️ {RL.mainFix}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>
              {review.fixes[0]}
            </div>
          </div>
        )}

        {/* Drill */}
        {review.drill && (
          <div style={{ padding: "8px 10px", borderRadius: 9, background: "rgba(245,196,81,0.06)", border: "1px solid rgba(245,196,81,0.16)" }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, color: "#FDE68A", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 5 }}>
              🎯 {RL.drill}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>
              {review.drill}
            </div>
          </div>
        )}

        {/* Next session goal */}
        {review.nextSessionGoal && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 8,
            padding: "7px 10px", borderRadius: 9,
            background: goldAlpha(0.06), border: `1px solid ${goldAlpha(0.16)}`,
          }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, color: GOLD, letterSpacing: 1.2, textTransform: "uppercase", flexShrink: 0, paddingTop: 1 }}>
              🏆 {RL.nextGoal}
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.45, fontWeight: 700 }}>
              {review.nextSessionGoal}
            </span>
          </div>
        )}
      </div>
    </div>
  );
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
  debriefSource = null,
  debriefLoading = false,
  result,
  activeChallenge,
  challengeUserId,
  challengeSaving,
  challengeSaved,
  rankUpInfo,
  beltUpInfo,
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
  onShareToFeed,
  feedSharing  = false,
  feedShared   = false,
  sharedReelId = null,
  onCreateChallengePost,
  challengePosting  = false,
  challengePosted   = false,
  challengePostId   = null,
  isGuest = false,
  academyLesson = null,
  challengePostData = null,
  onPostChallengeResponse,
  challengeResponsePosting = false,
  challengeResponsePosted  = false,
  challengeResponseId      = null,
  recordedBlob     = null,
  thumbnailBlob    = null,
}) {
  // Compute confidence early so we can cap the animated score
  const _punchCount = (poseMetrics?.punchCount ?? result?.hitCount ?? 0);
  const _scoreConf = computeScoreConfidence(_punchCount, poseMetrics?.sessionConfidence ?? null, poseMetrics?.cameraQuality ?? null);
  const _scoreCap = _scoreConf === "low" ? 7.5 : _scoreConf === "medium" ? 8.5 : 10;
  const _cappedScore = result ? Math.min(result.score, _scoreCap) : 0;
  const displayScore = useCountUp(_cappedScore);
  const [sessionTag, setSessionTag] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [clipDuration, setClipDuration] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!recordedBlob) { setBlobUrl(null); setClipDuration(null); return; }
    setClipDuration(null);
    const url = URL.createObjectURL(recordedBlob);
    setBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [recordedBlob]);
  if (!result) return null;

  const MIN_PUNCHES = 5;
  const effectivePunchCount = poseMetrics?.punchCount ?? result.hitCount ?? 0;
  const tooFewPunches = effectivePunchCount < MIN_PUNCHES;

  const scoreConf = _scoreConf;
  const isLowConfidence = scoreConf === "low" || scoreConf === "none";

  const events = movementEvents || [];
  const identity = tooFewPunches ? null : getIdentityWithSub(result.score, events, poseMetrics, locale);
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 900, letterSpacing: 3.5, color: goldAlpha(0.65), textTransform: "uppercase" }}>
              {analysisLabel}
            </p>
            {/* Confidence badge */}
            {!tooFewPunches && (() => {
              const confMap = { high: { label: t("scoreConfidenceHigh"), color: "#34D399", bg: "rgba(52,211,153,0.1)" }, medium: { label: t("scoreConfidenceMedium"), color: "#F5C451", bg: "rgba(245,196,81,0.1)" }, low: { label: t("scoreConfidenceLow"), color: "#FB923C", bg: "rgba(251,146,60,0.1)" } };
              const cm = confMap[scoreConf];
              if (!cm) return null;
              return (
                <span style={{ fontSize: 8, fontWeight: 900, color: cm.color, background: cm.bg, padding: "3px 8px", borderRadius: 20, letterSpacing: 0.5 }}>
                  {cm.label}
                </span>
              );
            })()}
          </div>

          {tooFewPunches ? (
            /* ── Not enough data ── */
            <div style={{ margin: "16px 0 10px" }}>
              <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 1000, color: whiteAlpha(0.55), letterSpacing: "-0.01em" }}>
                {locale === "mn" ? "Хангалтгүй өгөгдөл" : locale === "ko" ? "데이터 부족" : "Not Enough Data"}
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

        {/* ── LOW CONFIDENCE TIPS ──────────────────────────────────── */}
        {isLowConfidence && !tooFewPunches && (
          <div style={{ margin: "0 20px 0", padding: "12px 14px", borderRadius: 12, background: "rgba(251,146,60,0.06)", border: "1px solid rgba(251,146,60,0.2)" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#FB923C", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 8 }}>
              ⚠ {t("confidenceLowNote")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CONFIDENCE_TIPS.map((tip) => (
                <div key={tip.key} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontSize: 12 }}>{tip.icon}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{t(tip.key)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                  <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>{t("trainLabelToday")}</div>
                  <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{result.score.toFixed(1)}</div>
                </div>
                {delta != null && (
                  <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: delta >= 0 ? "rgba(52,211,153,0.04)" : "rgba(248,113,113,0.04)", border: `1px solid ${delta >= 0 ? "rgba(52,211,153,0.12)" : "rgba(248,113,113,0.12)"}` }}>
                    <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>{t("trainLabelVsLast")}</div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: delta >= 0 ? "#34D399" : "#F87171", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{delta >= 0 ? "+" : ""}{delta.toFixed(1)}</div>
                  </div>
                )}
                {ghostBestScore != null && (
                  <div style={{ flex: 1, padding: "8px 10px", borderRadius: 10, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
                    <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 3 }}>{t("trainLabelBest")}</div>
                    <div style={{ fontSize: 18, fontWeight: 1000, color: GOLD, fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{Math.max(ghostBestScore, result.score).toFixed(1)}</div>
                  </div>
                )}
              </div>
              {/* Punch info + next focus */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <div style={{ padding: "6px 11px", borderRadius: 8, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.06)}`, display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 900, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1 }}>{t("trainLabelPunches")}</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{effectivePunchCount}</span>
                </div>
                {bestPunch && (
                  <div style={{ padding: "6px 11px", borderRadius: 8, background: "rgba(245,196,81,0.05)", border: `1px solid rgba(245,196,81,0.14)`, display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: goldAlpha(0.55), textTransform: "uppercase", letterSpacing: 1 }}>{t("trainLabelBestWeapon")}</span>
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
                  <span style={{ fontSize: 9, fontWeight: 900, color: "rgba(168,85,247,0.65)", textTransform: "uppercase", letterSpacing: 1, flexShrink: 0, paddingTop: 1 }}>{t("trainLabelNextFocus")}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: whiteAlpha(0.65), lineHeight: 1.4 }}>{nextFocus}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── PUNCH PATTERN (Fighter DNA seed) ─────────────────────── */}
        {poseMetrics && !tooFewPunches && scoreConf !== "none" && (
          <PunchPatternCard poseMetrics={poseMetrics} t={t} />
        )}

        {/* ── ACTION SUMMARY: GOOD / FIX / NEXT ────────────────────── */}
        {poseMetrics && !tooFewPunches && (
          <ActionSummary poseMetrics={poseMetrics} result={result} locale={locale} />
        )}

        {/* ── COACH REVIEW ─────────────────────────────────────────── */}
        {poseMetrics && (
          <CoachReviewCard poseMetrics={poseMetrics} result={result} locale={locale} />
        )}

        {/* ── ACADEMY LESSON REVIEW ────────────────────────────────── */}
        {academyLesson && !tooFewPunches && (() => {
          const goalMet = (result?.score ?? 0) >= 6.5;
          const acc = academyLesson.accentColor;
          const currentIdx = ACADEMY_LESSONS.findIndex(l => l.id === academyLesson.id);
          const nextLesson = currentIdx >= 0 ? ACADEMY_LESSONS[currentIdx + 1] : null;
          return (
            <div style={{
              margin: "0 20px 8px",
              padding: "12px 14px", borderRadius: 12,
              background: `${acc}07`,
              border: `1px solid ${acc}25`,
              borderLeft: `3px solid ${acc}66`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 14 }}>{academyLesson.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.8, color: acc, textTransform: "uppercase" }}>
                    ACADEMY LESSON · {locale === "mn" ? "Дэвшил хадгаласан ✓" : "Progress tracked ✓"}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#fff", marginTop: 1 }}>
                    {academyLesson.title}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 5,
                    padding: "3px 10px", borderRadius: 20,
                    background: goalMet ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)",
                    border: `1px solid ${goalMet ? "rgba(52,211,153,0.3)" : "rgba(248,113,113,0.3)"}`,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: goalMet ? "#34D399" : "#F87171", letterSpacing: 1 }}>
                      {goalMet ? "✓ COMPLETE" : `${(result?.score ?? 0).toFixed(1)}/6.5`}
                    </span>
                  </div>
                </div>
              </div>
              {!goalMet && (
                <div style={{
                  marginBottom: 8, padding: "7px 10px", borderRadius: 8,
                  background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.14)",
                }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                    {locale === "mn"
                      ? `6.5/10 хүрвэл хичээл дуусна. Одоо ${(result?.score ?? 0).toFixed(1)} байна. Дахин дасгалдана уу.`
                      : `Score 6.5/10 to complete this lesson. You got ${(result?.score ?? 0).toFixed(1)}. Train again to improve.`}
                  </span>
                </div>
              )}
              {nextLesson && (
                <div style={{
                  padding: "8px 10px", borderRadius: 8,
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.2, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 2 }}>
                      {locale === "mn" ? "Дараагийн хичээл" : "Next Lesson"}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.65)" }}>
                      {nextLesson.emoji} {nextLesson.title}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/train?academyLesson=${nextLesson.id}`)}
                    style={{
                      flexShrink: 0, padding: "5px 12px", borderRadius: 8,
                      background: `${nextLesson.accentColor}18`, border: `1px solid ${nextLesson.accentColor}35`,
                      color: nextLesson.accentColor, fontSize: 9, fontWeight: 900,
                      cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
                    }}
                  >
                    Train →
                  </button>
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
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: goldAlpha(0.55), textTransform: "uppercase" }}>
                AI Debrief
              </div>
              {!debriefLoading && debriefSource === "error" && (
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, color: "rgba(255,100,100,0.6)", background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 4, padding: "1px 5px", textTransform: "uppercase" }}>
                  AI ERROR
                </span>
              )}
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
              <SectionLabel label={t("trainLabelVsLastSession")} />
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
              <SectionLabel label={t("trainLabelMatchResult")} />
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

          {/* Feed Challenge comparison */}
          {challengePostData && (() => {
            const target = typeof challengePostData.challengeTargetScore === "number"
              ? challengePostData.challengeTargetScore : null;
            if (target == null) return null;
            const beaten = result.score > target;
            const diff = result.score - target;
            return (
              <>
                <SectionLabel label={`⚔️ ${t("trainLabelChallengeResult")}`} />
                <div style={{
                  borderRadius: RADIUS.md, padding: "14px 16px",
                  background: beaten ? "rgba(52,211,153,0.06)" : "rgba(248,113,113,0.06)",
                  border: `1px solid ${beaten ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}`,
                }}>
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
                          <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>YOU</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: "#34D399" }}>
                            {diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                          </div>
                          <div style={{ fontSize: 10, color: whiteAlpha(0.22), fontWeight: 800 }}>VS</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display,'Anton',sans-serif)", color: whiteAlpha(0.5) }}>{target.toFixed(1)}</div>
                          <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>TARGET</div>
                        </div>
                      </div>
                      {challengePostData.username && (
                        <div style={{ marginBottom: 10, fontSize: 10, color: whiteAlpha(0.3), fontWeight: 700 }}>
                          @{challengePostData.username} · {challengePostData.challengeTitle || ""}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => router.push(`/${locale}/leaderboard`)}
                        style={{
                          width: "100%", padding: "10px 0", borderRadius: 10,
                          background: "linear-gradient(135deg,#34D399,#059669)",
                          border: "none", color: "#000",
                          fontSize: 11, fontWeight: 900, letterSpacing: 1,
                          textTransform: "uppercase", cursor: "pointer",
                        }}
                      >
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
                          <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>YOU</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: "#F87171" }}>
                            {diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                          </div>
                          <div style={{ fontSize: 10, color: whiteAlpha(0.22), fontWeight: 800 }}>VS</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 26, fontWeight: 1000, fontFamily: "var(--font-display,'Anton',sans-serif)", color: whiteAlpha(0.5) }}>{target.toFixed(1)}</div>
                          <div style={{ fontSize: 9, color: whiteAlpha(0.35), fontWeight: 800, letterSpacing: 1.5, marginTop: 2 }}>TARGET</div>
                        </div>
                      </div>
                      {challengePostData.username && (
                        <div style={{ marginTop: 8, fontSize: 10, color: whiteAlpha(0.3), fontWeight: 700 }}>
                          @{challengePostData.username} · {challengePostData.challengeTitle || ""}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            );
          })()}

          {/* Ghost */}
          {!challengeUserId && ghostBestScore !== null && (
            <>
              <SectionLabel label={result.score > ghostBestScore ? t("trainLabelNewPB") : t("trainLabelVsPB")} />
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
              <SectionLabel label={t("trainLabelChallengeResult")} />
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
              <SectionLabel label={t("trainLabelMovementIntel")} />
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
              <SectionLabel label={t("trainLabelCoachingNotes")} />

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
                        <span style={{ fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700 }}>{t("trainLabelSnap")}</span>
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
                        <span style={{ fontSize: 9, color: whiteAlpha(0.22), fontWeight: 700 }}>{t("trainLabelRecovery")}</span>
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
                const tactical      = bi.tactical;
                const ringIQ       = bi.ringIQ;
                const dna          = bi.fighterDNA;
                const cornerAdvice = bi.cornerAdvice;
                const rounds       = bi.roundBreakdown;
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
                          background: goldAlpha(0.10),
                          border: `1px solid ${goldAlpha(0.28)}`,
                          fontSize: 9, fontWeight: 900, letterSpacing: 1.2,
                          color: GOLD, textTransform: "uppercase",
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
                        background: goldAlpha(0.05),
                        border: `1px solid ${goldAlpha(0.14)}`,
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
                    {/* Corner advice — Phase 5 */}
                    {cornerAdvice?.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.2, color: "#6EE7B7", textTransform: "uppercase", marginBottom: 5 }}>
                          Corner Advice
                        </div>
                        <div style={{
                          padding: "8px 10px", borderRadius: 8,
                          background: "rgba(110,231,183,0.04)",
                          border: "1px solid rgba(110,231,183,0.14)",
                        }}>
                          {cornerAdvice.map((tip, i) => (
                            <div key={i} style={{
                              fontSize: 10, color: whiteAlpha(0.7), lineHeight: 1.6,
                              paddingBottom: i < cornerAdvice.length - 1 ? 5 : 0,
                            }}>
                              ▸ {tip}
                            </div>
                          ))}
                        </div>
                        {rounds && (
                          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                            {[
                              { label: "1st half", data: rounds.round1 },
                              { label: "2nd half", data: rounds.round2 },
                            ].map(({ label, data }, i) => (
                              <div key={i} style={{
                                flex: 1, padding: "5px 8px", borderRadius: 7,
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.07)",
                              }}>
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
                      <SectionLabel label={t("trainLabelSessionTimeline")} />
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
                      <SectionLabel label={t("trainLabelCombatTelemetry")} />
                      <div style={{ borderRadius: RADIUS.md, padding: "10px 14px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}` }}>
                        {[
                          { key: "accuracy",    en: "Accuracy",    mn: "Нарийвчлал",  ko: "정확도" },
                          { key: "speed",       en: "Speed",       mn: "Хурд",        ko: "속도" },
                          { key: "power",       en: "Power",       mn: "Хүч",         ko: "파워" },
                          { key: "consistency", en: "Consistency", mn: "Тогтвортой",  ko: "일관성" },
                        ].map(({ key, en, mn, ko }) => (
                          <TelemetryBar
                            key={key}
                            label={locale === "mn" ? mn : locale === "ko" ? ko : en}
                            value={result.breakdown[key]}
                          />
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
                <span style={{ fontSize: 22, fontWeight: 1000, color: GOLD, fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
                  +{result.xpGained}
                </span>
                <span style={{ fontSize: 10, color: whiteAlpha(0.32), fontWeight: 800, letterSpacing: 1 }}>{locale === "mn" ? "XP ЦУГЛУУЛСАН" : locale === "ko" ? "XP 획득" : "XP EARNED"}</span>
              </div>
              {!activeChallenge && result.rankProgress > 0 && (
                <>
                  <div style={{ height: 2, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ height: "100%", width: `${result.rankProgress}%`, background: goldAlpha(0.55), borderRadius: 2, transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)" }} />
                  </div>
                  <div style={{ fontSize: 10, color: whiteAlpha(0.3), fontWeight: 700 }}>
                    {locale === "mn" ? `Ранк дэвшил — ${result.rankProgress}%`
                      : locale === "ko" ? `랭크 진행 — ${result.rankProgress}%`
                      : `Rank progress — ${result.rankProgress}%`}
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
              <div style={{
                borderRadius: RADIUS.md, padding: "20px 20px", textAlign: "center",
                background: `linear-gradient(135deg, ${beltUpInfo.color}14, ${blackAlpha(0.8)})`,
                border: `2px solid ${beltUpInfo.color}55`,
                animation: "rankUpPulse 2s ease-in-out infinite",
              }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🥋</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: beltUpInfo.color, marginBottom: 4 }}>
                  {locale === "mn" ? "БҮС АХИЛЛАА!" : locale === "ko" ? "벨트 승급!" : "BELT PROMOTED!"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: 1 }}>
                  {typeof t === "function" ? t(beltUpInfo.key) : beltUpInfo.key}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                  {locale === "mn" ? "Гайхалтай ахиц дэвшил!" : locale === "ko" ? "엄청난 발전입니다!" : "Incredible progress!"}
                </div>
              </div>
            </>
          )}

          {/* Rank Up */}
          {rankUpInfo && (
            <>
              <SectionLabel label={t("trainLabelRankAdvancement")} />
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

        {/* ── VIDEO PREVIEW ────────────────────────────────────────── */}
        {blobUrl && (
          <div style={{ padding: "0 20px 12px", flexShrink: 0 }}>
            <div style={{
              borderRadius: 12,
              overflow: "hidden",
              background: "#000",
              border: "1px solid rgba(255,255,255,0.08)",
              position: "relative",
            }}>
              <video
                src={blobUrl}
                controls
                playsInline
                muted
                loop
                style={{ width: "100%", maxHeight: 220, display: "block", objectFit: "cover" }}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  if (Number.isFinite(d) && d > 0) setClipDuration(Math.round(d));
                }}
              />
              {clipDuration != null && (
                <div style={{
                  position: "absolute", bottom: 8, right: 10,
                  padding: "2px 8px", borderRadius: 6,
                  background: "rgba(0,0,0,0.7)",
                  fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.8)",
                  fontFamily: "monospace",
                }}>
                  {Math.floor(clipDuration / 60)}:{String(clipDuration % 60).padStart(2, "0")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ACTIONS ──────────────────────────────────────────────── */}
        <div style={{ padding: "12px 20px 16px", flexShrink: 0, borderTop: `1px solid ${whiteAlpha(0.06)}` }}>
          {error && (
            <div style={{ marginBottom: 10, padding: "10px 14px", borderRadius: 10, background: redAlpha(0.12), border: `1px solid ${redAlpha(0.28)}`, color: "#fca5a5", fontSize: 13, fontWeight: 700 }}>
              {error}
            </div>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            <button type="button"
              style={{ ...styles.tryAgainButton, ...(isLowConfidence ? { background: "linear-gradient(135deg,#FB923C,#F59E0B)", color: "#000", fontWeight: 900 } : {}) }}
              onClick={onTryAgain}>
              {isLowConfidence ? t("confidenceTryAgain") : activeChallenge ? t("challengeTryAgain") : t("trainTryAgain")}
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
                style={{ ...styles.saveButton, ...(saved ? styles.saveButtonDone : {}), ...(isLowConfidence && !saved ? { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.45)", fontSize: 11 } : {}), opacity: saving || saved ? 0.65 : 1, cursor: saving || saved ? "default" : "pointer" }}
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
                      : isLowConfidence
                        ? t("confidenceSaveAnyway")
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
            {/* Share to Feed — logged-in users */}
            {!tooFewPunches && !activeChallenge && !isGuest && (
              <>
                <button
                  type="button"
                  disabled={feedSharing || feedShared}
                  onClick={onShareToFeed}
                  style={{
                    ...styles.saveButton,
                    background: feedShared
                      ? "#17664b"
                      : "rgba(255,59,48,0.14)",
                    border: feedShared ? "none" : "1px solid rgba(255,59,48,0.3)",
                    color:  feedShared ? "#34D399" : RED,
                    boxShadow: "none",
                    opacity: feedSharing || feedShared ? 0.75 : 1,
                    cursor:  feedSharing || feedShared ? "default" : "pointer",
                  }}
                >
                  {feedSharing
                    ? (locale === "mn" ? "Нийтэлж байна…" : locale === "ko" ? "공유 중…" : "Sharing…")
                    : feedShared
                      ? (locale === "mn" ? "Feed-д нийтлэгдлээ ✓" : locale === "ko" ? "피드에 공유됨 ✓" : "Shared to Feed ✓")
                      : academyLesson
                        ? (locale === "mn" ? "Academy дэвшлийг хуваалцах" : locale === "ko" ? "아카데미 진행 상황 공유하기" : "Share Academy Progress")
                        : recordedBlob
                          ? (locale === "mn" ? "Видео Feed-д хуваалцах" : locale === "ko" ? "비디오 피드에 공유하기" : "Share Video to Feed")
                          : (locale === "mn" ? "Feed-д хуваалцах" : locale === "ko" ? "피드에 공유하기" : "Share to Feed")}
                </button>
                {feedShared && (
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/feed`)}
                    style={{
                      width: "100%", minHeight: 40,
                      background: "none",
                      border: `1px solid ${whiteAlpha(0.1)}`,
                      borderRadius: RADIUS.md,
                      color: whiteAlpha(0.45), fontSize: 11, fontWeight: 800,
                      cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
                    }}
                  >
                    {locale === "mn" ? "Feed харах →" : locale === "ko" ? "피드 보기 →" : "View Feed →"}
                  </button>
                )}
              </>
            )}
            {/* Share to Feed — guest secondary CTA */}
            {!tooFewPunches && !activeChallenge && isGuest && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/login?mode=signup&redirect=${encodeURIComponent(`/${locale}/train`)}`)}
                style={{
                  width: "100%", minHeight: 38,
                  background: "none",
                  border: `1px solid ${whiteAlpha(0.07)}`,
                  borderRadius: RADIUS.md,
                  color: whiteAlpha(0.3), fontSize: 11, fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {academyLesson
                  ? (locale === "mn"
                      ? "Профайл үүсгэж academy дэвшлийг хуваалцаарай →"
                      : locale === "ko"
                        ? "프로필 생성 후 아카데미 진행 상황 공유 →"
                        : "Create profile to share academy progress →")
                  : (locale === "mn"
                      ? "Профайл үүсгэж өөрийн дэвшлийг хуваалцаарай →"
                      : locale === "ko"
                        ? "프로필 생성 후 진행 상황 공유 →"
                        : "Create profile to share your progress →")}
              </button>
            )}
            {/* Challenge others — logged-in */}
            {!tooFewPunches && !activeChallenge && !isGuest && (
              <>
                <button
                  type="button"
                  disabled={challengePosting || challengePosted}
                  onClick={onCreateChallengePost}
                  style={{
                    ...styles.saveButton,
                    background: challengePosted ? "#17664b" : "rgba(167,139,250,0.12)",
                    border: challengePosted ? "none" : "1px solid rgba(167,139,250,0.28)",
                    color: challengePosted ? "#34D399" : "#C084FC",
                    boxShadow: "none",
                    opacity: challengePosting || challengePosted ? 0.75 : 1,
                    cursor: challengePosting || challengePosted ? "default" : "pointer",
                  }}
                >
                  {challengePosting
                    ? (locale === "mn" ? "Challenge үүсгэж байна…" : locale === "ko" ? "챌린지 생성 중…" : "Creating challenge…")
                    : challengePosted
                      ? (locale === "mn" ? "Challenge үүслээ ✓" : locale === "ko" ? "챌린지 생성됨 ✓" : "Challenge posted ✓")
                      : (locale === "mn" ? "Бусдыг challenge хий" : locale === "ko" ? "다른 사람에게 도전하기" : "Challenge others")}
                </button>
                {challengePosted && (
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/feed`)}
                    style={{
                      width: "100%", minHeight: 40,
                      background: "none",
                      border: `1px solid ${whiteAlpha(0.1)}`,
                      borderRadius: RADIUS.md,
                      color: whiteAlpha(0.45), fontSize: 11, fontWeight: 800,
                      cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
                    }}
                  >
                    {locale === "mn" ? "Feed харах →" : locale === "ko" ? "피드 보기 →" : "View Feed →"}
                  </button>
                )}
              </>
            )}
            {/* Challenge others — guest CTA */}
            {!tooFewPunches && !activeChallenge && isGuest && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/login?mode=signup&redirect=${encodeURIComponent(`/${locale}/train`)}`)}
                style={{
                  width: "100%", minHeight: 38,
                  background: "none",
                  border: `1px solid ${whiteAlpha(0.07)}`,
                  borderRadius: RADIUS.md,
                  color: whiteAlpha(0.3), fontSize: 11, fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {locale === "mn"
                  ? "Профайл үүсгэж бусдыг challenge хийгээрэй →"
                  : locale === "ko"
                    ? "프로필 생성 후 다른 사람에게 도전 →"
                    : "Create profile to challenge others →"}
              </button>
            )}
            {/* Post Challenge Response — logged-in */}
            {challengePostData && !isGuest && (
              <>
                <button
                  type="button"
                  disabled={challengeResponsePosting || challengeResponsePosted}
                  onClick={onPostChallengeResponse}
                  style={{
                    ...styles.saveButton,
                    background: challengeResponsePosted ? "#17664b" : "rgba(167,139,250,0.12)",
                    border: challengeResponsePosted ? "none" : "1px solid rgba(167,139,250,0.28)",
                    color: challengeResponsePosted ? "#34D399" : "#C084FC",
                    boxShadow: "none",
                    opacity: challengeResponsePosting || challengeResponsePosted ? 0.75 : 1,
                    cursor: challengeResponsePosting || challengeResponsePosted ? "default" : "pointer",
                  }}
                >
                  {challengeResponsePosting
                    ? (locale === "mn" ? "Нийтэлж байна…" : locale === "ko" ? "게시 중…" : "Posting…")
                    : challengeResponsePosted
                      ? (locale === "mn" ? "Challenge хариу нийтлэгдлээ ✓" : locale === "ko" ? "챌린지 응답 게시됨 ✓" : "Challenge response posted ✓")
                      : (locale === "mn" ? "Challenge үр дүнг нийтлэх" : locale === "ko" ? "챌린지 결과 게시하기" : "Post Challenge Result")}
                </button>
                {challengeResponsePosted && (
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/feed`)}
                    style={{
                      width: "100%", minHeight: 40,
                      background: "none",
                      border: `1px solid ${whiteAlpha(0.1)}`,
                      borderRadius: RADIUS.md,
                      color: whiteAlpha(0.45), fontSize: 11, fontWeight: 800,
                      cursor: "pointer", letterSpacing: 1, textTransform: "uppercase",
                    }}
                  >
                    {locale === "mn" ? "Feed харах →" : locale === "ko" ? "피드 보기 →" : "View Feed →"}
                  </button>
                )}
              </>
            )}
            {/* Post Challenge Response — guest */}
            {challengePostData && isGuest && (
              <button
                type="button"
                onClick={() => router.push(`/${locale}/login?mode=signup&redirect=${encodeURIComponent(`/${locale}/train`)}`)}
                style={{
                  ...styles.saveButton,
                  background: "linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.08) 100%)",
                  border: "1px solid rgba(167,139,250,0.35)",
                  color: "#C084FC",
                  boxShadow: "none",
                }}
              >
                {locale === "mn" ? "Профайл үүсгэж challenge-д хариулаарай →" : locale === "ko" ? "프로필 생성 후 챌린지 응답 →" : "Create profile to respond to challenge →"}
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
