"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RED, GOLD, redAlpha, goldAlpha, RADIUS } from "@/lib/tokens";

const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};
const AREA_MN = {
  Power: "Хүч", Speed: "Хурд", Timing: "Цаг",
  Footwork: "Хөл", Guard: "Хамгаалалт", Accuracy: "Нарийвчлал",
};
const AREA_DRILL = {
  Power: { en: "Heavy bag 3×3 min max power", mn: "Хүнд уут 3×3 мин хамгийн их хүчтэй" },
  Speed: { en: "Double-end bag 5 min fast combos", mn: "Хоёр тийш уут 5 мин хурдан хослол" },
  Timing: { en: "Mitts: counter after each punch", mn: "Митт: тус бүрийн цохилтын дараа эсрэгцэх" },
  Footwork: { en: "Ladder drill + pivot shadowbox 10 min", mn: "Шат дасгал + пивот сүүдэр 10 мин" },
  Guard: { en: "Defensive shell drill with partner", mn: "Хамгааллын бүрхүүл дасгал хамтрагчтай" },
  Accuracy: { en: "Jab precision: 50 reps on small target", mn: "Шулуун цохилтын нарийвчлал: жижиг бай руу 50 удаа" },
};

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function computeRecs({ goal, coachSnapshot, trainingSessions, locale }) {
  const mn = locale === "mn";
  const radarStats = coachSnapshot?.radarStats || {};
  const weakAreas = coachSnapshot?.weakAreas || [];
  const streak = coachSnapshot?.streakDays || 0;

  const recs = [];

  // ── Rec 1: Goal-based ─────────────────────────────────────────────
  if (goal?.area && goal?.target != null) {
    const current = radarStats[goal.area] ?? 0;
    const reached = current >= goal.target;
    const col = AREA_COLOR[goal.area] || GOLD;
    const areaLabel = mn ? (AREA_MN[goal.area] || goal.area) : goal.area;
    if (reached) {
      recs.push({
        id: "goal-reached",
        icon: "🏆",
        color: GOLD,
        label: mn ? "Зорилго биелсэн!" : "Goal Reached!",
        body: mn
          ? `${areaLabel} зорилго биелсэн (${current.toFixed(1)}/10). Шинэ зорилго тавь.`
          : `${goal.area} goal complete (${current.toFixed(1)}/10). Set a new challenge.`,
        cta: mn ? "Шинэ зорилго" : "New Goal",
        ctaAction: "goal",
      });
    } else {
      const gap = (goal.target - current).toFixed(1);
      const drill = AREA_DRILL[goal.area];
      recs.push({
        id: "goal-focus",
        icon: "🎯",
        color: col,
        label: mn ? `Зорилго: ${areaLabel}` : `Goal: ${goal.area}`,
        body: mn
          ? `${current.toFixed(1)} → ${goal.target}/10 (${gap} оноо хэрэгтэй). Дасгал: ${drill?.mn || ""}`
          : `${current.toFixed(1)} → ${goal.target}/10 (${gap} pts away). Drill: ${drill?.en || ""}`,
        cta: mn ? "Дасгал хийх" : "Start Drills",
        ctaAction: "drills",
        ctaArea: goal.area,
      });
    }
  } else {
    recs.push({
      id: "set-goal",
      icon: "🎯",
      color: GOLD,
      label: mn ? "Зорилго тавь" : "Set a Goal",
      body: mn
        ? "Зорилго тавивал хөгжлөө хянах, төвлөрөл нэмэх боломжтой."
        : "Set a training target to track progress and stay focused.",
      cta: mn ? "Зорилго тавих" : "Set Goal",
      ctaAction: "goal",
    });
  }

  // ── Rec 2: Weakest area drill ─────────────────────────────────────
  const weakest = weakAreas[0];
  if (weakest) {
    const [area, val] = weakest;
    const col = AREA_COLOR[area] || RED;
    const areaLabel = mn ? (AREA_MN[area] || area) : area;
    const drill = AREA_DRILL[area];
    recs.push({
      id: "weak-area",
      icon: "⚡",
      color: col,
      label: mn ? `${areaLabel} сайжруулах` : `Improve ${area}`,
      body: mn
        ? `Хамгийн бага оноотой чиглэл (${val?.toFixed(1)}/10). ${drill?.mn || ""}`
        : `Your lowest area (${val?.toFixed(1)}/10). ${drill?.en || ""}`,
      cta: mn ? "Дасгал" : "Drills",
      ctaAction: "drills",
      ctaArea: area,
    });
  }

  // ── Rec 3: Streak / momentum ──────────────────────────────────────
  const sorted = [...trainingSessions].sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
  const lastTs = getTs(sorted[0]?.createdAt);
  const daysSince = lastTs ? (Date.now() - lastTs) / (24 * 3600 * 1000) : 99;
  const recentScores = sorted.slice(0, 5).map((s) => Number(s.score)).filter(Number.isFinite);
  const trend = recentScores.length >= 2 ? recentScores[0] - recentScores[recentScores.length - 1] : 0;

  if (daysSince >= 2) {
    const days = Math.floor(daysSince);
    recs.push({
      id: "comeback",
      icon: "🔥",
      color: "#FB923C",
      label: mn ? "Буцаж ир!" : "Come Back Strong",
      body: mn
        ? `${days} өдөр болж байна. Streak сэргээхийн тулд өнөөдөр дасгал хий.`
        : `${days} days since your last session. Train today to rebuild momentum.`,
      cta: mn ? "Дасгал хийх" : "Train Now",
      ctaAction: "train",
    });
  } else if (streak >= 5) {
    recs.push({
      id: "streak",
      icon: "🔥",
      color: "#FB923C",
      label: mn ? `${streak} өдрийн streak!` : `${streak}-Day Streak!`,
      body: mn
        ? "Гайхалтай тогтмол байдал. Streakаа хадгалж, шинэ дасгал нэм."
        : "Outstanding consistency. Keep the streak and push your limits.",
      cta: mn ? "Дасгалын хуваарь" : "View Plan",
      ctaAction: "plan",
    });
  } else if (trend > 0.5) {
    recs.push({
      id: "trending-up",
      icon: "📈",
      color: "#34D399",
      label: mn ? "Хурдтай дээшилж байна!" : "You're Trending Up!",
      body: mn
        ? `Сүүлийн 5 сесст +${trend.toFixed(1)} оноо нэмэгдсэн. Хурдаа хадгалаарай.`
        : `+${trend.toFixed(1)} pts over last 5 sessions. Keep this momentum going.`,
      cta: mn ? "Дасгал хийх" : "Train Again",
      ctaAction: "train",
    });
  } else if (trend < -0.5) {
    recs.push({
      id: "trending-down",
      icon: "💪",
      color: "#60A5FA",
      label: mn ? "Тогтмол байдлаа сэргээ" : "Rebuild Consistency",
      body: mn
        ? "Сүүлийн оноо буурсан. Хүч чадлаасаа биш, тогтмол байдалдаа анхаар."
        : "Recent scores dipped. Focus on consistency over intensity right now.",
      cta: mn ? "Хөнгөн дасгал" : "Light Session",
      ctaAction: "train",
    });
  } else {
    recs.push({
      id: "steady",
      icon: "💡",
      color: "#A78BFA",
      label: mn ? "Өсөлтийг нэмэгдүүл" : "Level Up",
      body: mn
        ? "Тогтвортой байна — дараагийн шат руу гарахын тулд техникийн нарийвчлалд анхаар."
        : "You're steady — sharpen technique precision to break to the next level.",
      cta: mn ? "Coach-оос асуух" : "Ask Coach",
      ctaAction: "coach",
    });
  }

  return recs;
}

export default function AdaptiveRecommendations({ coachSnapshot, locale, router, userId, trainingSessions }) {
  const [goal, setGoal] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const mn = locale === "mn";

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getDoc(doc(db, "users", userId)).then((snap) => {
      if (active && snap.exists() && snap.data().goal) setGoal(snap.data().goal);
    }).catch(() => {});
    return () => { active = false; };
  }, [userId]);

  const recs = computeRecs({ goal, coachSnapshot, trainingSessions, locale });

  function handleCta(rec) {
    if (rec.ctaAction === "drills") {
      const q = mn
        ? `Миний ${rec.ctaArea || "хамгийн сул"} чиглэлийн дасгал өг`
        : `Give me drills for my ${rec.ctaArea || "weakest"} area`;
      router.push(`/${locale}/drills`);
    } else if (rec.ctaAction === "coach") {
      const area = coachSnapshot?.weakAreas?.[0]?.[0] || "Guard";
      const q = mn ? `Миний ${area} оноог хэрхэн сайжруулах вэ?` : `How can I improve my ${area}?`;
      router.push(`/${locale}/coach/chat?q=${encodeURIComponent(q)}`);
    } else if (rec.ctaAction === "train") {
      router.push(`/${locale}/train`);
    } else if (rec.ctaAction === "plan") {
      router.push(`/${locale}/train`);
    } else if (rec.ctaAction === "goal") {
      // scroll to goal tracker
      document.getElementById("goal-tracker-section")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "none", border: "none", padding: "0 0 10px",
          cursor: "pointer",
        }}
      >
        <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, textTransform: "uppercase" }}>
          {mn ? "🧠 Өнөөдрийн зөвлөмж" : "🧠 Today's Recommendations"}
        </p>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.25)", lineHeight: 1 }}>{collapsed ? "▸" : "▾"}</span>
      </button>

      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recs.map((rec, i) => (
            <div
              key={rec.id}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 13px",
                borderRadius: "3px 14px 14px 3px",
                background: `${rec.color}08`,
                border: `1px solid ${rec.color}22`,
                borderLeft: `3px solid ${rec.color}`,
                animation: `recFadeIn ${0.15 + i * 0.07}s ease both`,
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{rec.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: rec.color, marginBottom: 2 }}>{rec.label}</div>
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.45, fontWeight: 600 }}>{rec.body}</div>
              </div>
              <button
                type="button"
                onClick={() => handleCta(rec)}
                style={{
                  flexShrink: 0,
                  padding: "7px 11px", borderRadius: 10,
                  background: `${rec.color}18`, border: `1px solid ${rec.color}35`,
                  color: rec.color, fontSize: 10, fontWeight: 900, cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {rec.cta}
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes recFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
