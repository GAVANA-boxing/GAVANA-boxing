"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GOLD, RED, goldAlpha, redAlpha, RADIUS } from "@/lib/tokens";

const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};
const AREA_MN = {
  Power: "Хүч", Speed: "Хурд", Timing: "Цаг",
  Footwork: "Хөл", Guard: "Хамгаалалт", Accuracy: "Нарийвчлал",
};

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function currentWeekKey() {
  return `W${Math.floor(Date.now() / (7 * 24 * 3600 * 1000))}`;
}

// Generate a challenge based on user data
function generateChallenge(coachSnapshot, trainingSessions, weekKey) {
  const weakArea = coachSnapshot?.weakAreas?.[0]?.[0] || "Guard";
  const streak = coachSnapshot?.streakDays || 0;

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const lastWeekCount = trainingSessions.filter((s) => getTs(s.createdAt) >= weekAgo).length;

  // Rotate challenge types by week number
  const weekNum = parseInt(weekKey.replace("W", ""), 10);
  const type = weekNum % 3;

  if (type === 0) {
    // Session count challenge
    const target = Math.max(3, Math.min(5, lastWeekCount + 1));
    return {
      type: "sessions",
      area: null,
      target,
      xpReward: target * 50,
      en: `Complete ${target} training sessions this week`,
      mn: `Энэ долоо хоногт ${target} дасгал хий`,
      enProgress: (cur) => `${cur}/${target} sessions`,
      mnProgress: (cur) => `${cur}/${target} дасгал`,
    };
  } else if (type === 1) {
    // Score threshold challenge
    const scores = trainingSessions.slice(0, 10).map((s) => Number(s.score)).filter(Number.isFinite);
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 5;
    const target = Math.min(9.5, Math.round((avgScore + 0.5) * 2) / 2);
    return {
      type: "score",
      area: null,
      target,
      xpReward: 150,
      en: `Score ${target}+ in any session this week`,
      mn: `Энэ долоо хоногт ${target}+ оноо авах`,
      enProgress: (cur) => cur >= target ? "Achieved!" : `Best: ${cur > 0 ? cur.toFixed(1) : "—"}`,
      mnProgress: (cur) => cur >= target ? "Биелсэн!" : `Хамгийн дээд: ${cur > 0 ? cur.toFixed(1) : "—"}`,
    };
  } else {
    // Weak area focus challenge — train 3 times
    return {
      type: "focus",
      area: weakArea,
      target: 3,
      xpReward: 120,
      en: `Focus on ${weakArea} — train 3 sessions this week`,
      mn: `${AREA_MN[weakArea] || weakArea}-д анхаарал тавь — 3 дасгал хий`,
      enProgress: (cur) => `${cur}/3 sessions`,
      mnProgress: (cur) => `${cur}/3 дасгал`,
    };
  }
}

function computeProgress(challenge, trainingSessions) {
  if (!challenge) return 0;
  const now = Date.now();
  // Find start of this week (Monday)
  const d = new Date();
  const day = d.getDay() || 7;
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - day + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartMs = weekStart.getTime();

  const thisWeek = trainingSessions.filter((s) => getTs(s.createdAt) >= weekStartMs);

  if (challenge.type === "sessions" || challenge.type === "focus") {
    return thisWeek.length;
  }
  if (challenge.type === "score") {
    const scores = thisWeek.map((s) => Number(s.score)).filter(Number.isFinite);
    return scores.length ? Math.max(...scores) : 0;
  }
  return 0;
}

export default function WeeklyChallenge({ coachSnapshot, trainingSessions, locale, userId }) {
  const [challenge, setChallenge] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const mn = locale === "mn";
  const weekKey = currentWeekKey();

  useEffect(() => {
    if (!userId || !coachSnapshot) return;
    let active = true;

    async function load() {
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref).catch(() => null);
      if (!active) return;

      const saved = snap?.data()?.weeklyChallenge;
      if (saved?.weekKey === weekKey) {
        setChallenge(saved);
        return;
      }
      // Generate new challenge for this week
      const newChallenge = {
        ...generateChallenge(coachSnapshot, trainingSessions, weekKey),
        weekKey,
        completed: false,
      };
      setChallenge(newChallenge);
      // Persist
      await setDoc(ref, { weeklyChallenge: newChallenge }, { merge: true }).catch(() => {});
    }

    load();
    return () => { active = false; };
  }, [userId, coachSnapshot, weekKey]);

  if (!challenge) return null;

  const progress = computeProgress(challenge, trainingSessions);
  const isScore = challenge.type === "score";
  const completed = isScore ? progress >= challenge.target : progress >= challenge.target;
  const pct = isScore
    ? Math.min(100, (progress / challenge.target) * 100)
    : Math.min(100, (progress / challenge.target) * 100);

  const col = challenge.area ? (AREA_COLOR[challenge.area] || GOLD) : GOLD;
  const descText = mn ? challenge.mn : challenge.en;
  const progressText = mn ? challenge.mnProgress(progress) : challenge.enProgress(progress);

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "none", border: "none", padding: "0 0 10px", cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, textTransform: "uppercase" }}>
            {mn ? "🏅 7 хоногийн challenge" : "🏅 Weekly Challenge"}
          </p>
          {completed && (
            <span style={{ fontSize: 9, fontWeight: 900, color: "#34D399", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: RADIUS.full, padding: "2px 7px" }}>
              {mn ? "БИЕЛСЭН" : "DONE"}
            </span>
          )}
        </div>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", lineHeight: 1 }}>{collapsed ? "▸" : "▾"}</span>
      </button>

      {!collapsed && (
        <div style={{
          padding: "14px",
          borderRadius: 16,
          background: completed ? "rgba(52,211,153,0.05)" : `${col}07`,
          border: `1px solid ${completed ? "rgba(52,211,153,0.2)" : col + "25"}`,
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: completed ? "#34D399" : "#fff", lineHeight: 1.35 }}>
                {completed ? (mn ? "✅ " : "✅ ") : ""}{descText}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: GOLD }}>+{challenge.xpReward} XP</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                {mn ? "урамшуулал" : "reward"}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 7 }}>
            <div style={{
              height: "100%", width: `${pct}%`, borderRadius: 3,
              background: completed ? "#34D399" : col,
              transition: "width 0.6s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: completed ? "#34D399" : "rgba(255,255,255,0.45)" }}>
              {progressText}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>
              {mn ? `${Math.round(pct)}% биелсэн` : `${Math.round(pct)}% complete`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
