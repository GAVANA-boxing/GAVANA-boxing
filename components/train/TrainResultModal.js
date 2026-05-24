"use client";

import { useEffect, useState, useRef } from "react";
import { GOLD, RED, RADIUS, redAlpha, goldAlpha, whiteAlpha, blackAlpha } from "@/lib/tokens";
import { getChallengeRank } from "@/lib/utils";
import { getChallengeComparisonPercent } from "@/lib/trainHelpers";
import { getSessionIdentity } from "@/lib/combatMemory";
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
  "FORWARD HUNTER":     "Aggressive entry pattern detected",
  "SHARP EXECUTION":    "High-efficiency movement session",
  "SOLID FOUNDATION":   "Consistent movement quality",
  "DEVELOPING STYLE":   "Pattern emerging — keep building",
  "RAW ENERGY":         "Pure intensity — structure coming",
};

function getIdentityWithSub(score, movementEvents) {
  const title = getSessionIdentity(score, movementEvents);
  return { title, sub: IDENTITY_SUBS[title] || "" };
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
}) {
  const displayScore = useCountUp(result?.score);
  const [sessionTag, setSessionTag] = useState(null);
  if (!result) return null;

  const events = movementEvents || [];
  const identity = getIdentityWithSub(result.score, events);
  const movementSummary = getMovementSummary(events);
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
        </div>

        {/* ── AI DEBRIEF ───────────────────────────────────────────── */}
        {(debriefLoading || debrief) && (
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

          {/* Session Timeline */}
          {hasTimeline && (
            <>
              <SectionLabel label="Session Timeline" />
              <div style={{
                borderRadius: RADIUS.md, padding: "10px 14px",
                background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`,
                display: "flex", flexDirection: "column", gap: 5,
              }}>
                {timelineEvents.map((ev) => (
                  <div key={ev.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 9, fontFamily: "monospace", color: goldAlpha(0.5), fontWeight: 700, flexShrink: 0 }}>
                      [{fmtTime(ev.timestamp - (sessionStartTime || ev.timestamp))}]
                    </span>
                    <span style={{ fontSize: 10, color: whiteAlpha(0.35), fontWeight: 800 }}>
                      {ev.label}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Combat Telemetry */}
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

          {/* Session History */}
          {sessionHistory.length > 0 && (
            <>
              <SectionLabel label="Recent Sessions" />
              <div style={{ borderRadius: RADIUS.md, padding: "10px 14px 8px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}` }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 40 }}>
                  {[...sessionHistory].reverse().map((s, i, arr) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end" }}>
                      <div style={{
                        width: "100%",
                        height: `${Math.max(3, (s / 10) * 40)}px`,
                        background: i === arr.length - 1 ? "rgba(255,59,48,0.82)" : whiteAlpha(0.1),
                        borderRadius: "2px 2px 0 0",
                        transition: "height 0.5s ease",
                      }} />
                      <span style={{ fontSize: 8, color: whiteAlpha(0.28), fontWeight: 700, fontFamily: "monospace" }}>
                        {s.toFixed(1)}
                      </span>
                    </div>
                  ))}
                </div>
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
            {!activeChallenge && (
              <button
                type="button"
                style={{ ...styles.saveButton, ...(saved ? styles.saveButtonDone : {}), opacity: saving || saved ? 0.65 : 1, cursor: saving || saved ? "default" : "pointer" }}
                onClick={() => onSave({ movementEvents: events, tag: sessionTag })}
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
