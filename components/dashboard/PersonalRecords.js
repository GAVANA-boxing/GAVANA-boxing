"use client";

import { useMemo } from "react";
import { GOLD, RED, goldAlpha, RADIUS } from "@/lib/tokens";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function computePRs(trainingSessions, radarStats) {
  if (!trainingSessions?.length) return null;

  const scores = trainingSessions.map((s) => Number(s.score)).filter(Number.isFinite);
  const now = Date.now();
  const monthAgo = now - 30 * 24 * 3600 * 1000;
  const thisMonthScores = trainingSessions
    .filter((s) => getTs(s.createdAt) >= monthAgo)
    .map((s) => Number(s.score)).filter(Number.isFinite);

  const bestAllTime = scores.length ? Math.max(...scores) : null;
  const bestThisMonth = thisMonthScores.length ? Math.max(...thisMonthScores) : null;

  // Longest streak: count consecutive days with at least one session
  const daySet = new Set(
    trainingSessions.map((s) => {
      const d = new Date(getTs(s.createdAt));
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  const dayList = [...daySet].sort();
  let maxStreak = 0, curStreak = 1;
  for (let i = 1; i < dayList.length; i++) {
    const [y1, m1, d1] = dayList[i - 1].split("-").map(Number);
    const [y2, m2, d2] = dayList[i].split("-").map(Number);
    const prev = new Date(y1, m1, d1);
    const curr = new Date(y2, m2, d2);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
    else { curStreak = 1; }
  }
  maxStreak = Math.max(maxStreak, curStreak, dayList.length > 0 ? 1 : 0);

  // Most sessions in a single week
  let maxWeekSessions = 0;
  const weekBuckets = {};
  trainingSessions.forEach((s) => {
    const wk = Math.floor(getTs(s.createdAt) / (7 * 24 * 3600 * 1000));
    weekBuckets[wk] = (weekBuckets[wk] || 0) + 1;
  });
  maxWeekSessions = Math.max(...Object.values(weekBuckets), 0);

  return { bestAllTime, bestThisMonth, maxStreak, maxWeekSessions, total: trainingSessions.length };
}

function PRChip({ label, value, unit, color, isNew }) {
  return (
    <div style={{
      flex: "1 1 calc(50% - 5px)", minWidth: 0,
      padding: "10px 12px", borderRadius: 12,
      background: `${color}09`, border: `1px solid ${color}22`,
      position: "relative",
    }}>
      {isNew && (
        <div style={{
          position: "absolute", top: -7, right: 8,
          background: color, color: "#000", fontSize: 7, fontWeight: 900,
          padding: "2px 7px", borderRadius: RADIUS.full, letterSpacing: 1,
        }}>PR</div>
      )}
      <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 1.3, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1, letterSpacing: "-0.03em" }}>
        {value ?? "—"}
        <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", marginLeft: 3 }}>{unit}</span>
      </div>
    </div>
  );
}

export default function PersonalRecords({ trainingSessions, locale }) {
  const mn = locale === "mn";
  const prs = useMemo(() => computePRs(trainingSessions), [trainingSessions]);

  if (!prs || trainingSessions?.length < 3) return null;

  const recentScore = trainingSessions?.[0] ? Number(trainingSessions[0].score) : 0;
  const isNewBest = prs.bestAllTime != null && Math.abs(recentScore - prs.bestAllTime) < 0.01 && trainingSessions.length > 1;

  return (
    <div style={{ marginBottom: 20, padding: "13px 14px", borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{ margin: "0 0 12px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, textTransform: "uppercase" }}>
        {mn ? "🏆 Хувийн рекорд" : "🏆 Personal Records"}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <PRChip
          label={mn ? "Хамгийн өндөр оноо" : "Best Score"}
          value={prs.bestAllTime?.toFixed(1)}
          unit="/10"
          color={GOLD}
          isNew={isNewBest}
        />
        <PRChip
          label={mn ? "Энэ сарын дээд" : "Best This Month"}
          value={prs.bestThisMonth?.toFixed(1)}
          unit="/10"
          color="#34D399"
        />
        <PRChip
          label={mn ? "Хамгийн урт streak" : "Longest Streak"}
          value={prs.maxStreak}
          unit={mn ? "өдөр" : "days"}
          color="#FB923C"
        />
        <PRChip
          label={mn ? "7 хоногт хамгийн их" : "Best Week"}
          value={prs.maxWeekSessions}
          unit={mn ? "дасгал" : "sessions"}
          color="#60A5FA"
        />
      </div>
    </div>
  );
}
