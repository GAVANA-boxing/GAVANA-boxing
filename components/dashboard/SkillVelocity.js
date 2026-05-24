"use client";

import { useMemo } from "react";
import { deriveRadarStats } from "@/lib/dashboardHelpers";
import { GOLD, RED, RADIUS } from "@/lib/tokens";

const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};
const AREA_MN = {
  Power: "Хүч", Speed: "Хурд", Timing: "Цаг",
  Footwork: "Хөл", Guard: "Хамгаалалт", Accuracy: "Нарийвчлал",
};
const AREAS = ["Power", "Speed", "Timing", "Footwork", "Guard", "Accuracy"];

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function computeVelocity(trainingSessions) {
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 24 * 3600 * 1000;
  const fourWeeksAgo = now - 28 * 24 * 3600 * 1000;

  const recent = trainingSessions.filter((s) => getTs(s.createdAt) >= twoWeeksAgo);
  const older  = trainingSessions.filter((s) => {
    const t = getTs(s.createdAt);
    return t >= fourWeeksAgo && t < twoWeeksAgo;
  });

  if (!recent.length || !older.length) return null;

  const toScores = (arr) => arr.map((s) => Number(s.score)).filter(Number.isFinite);
  const recentStreak = recent.length;
  const olderStreak  = older.length;

  const r = deriveRadarStats(toScores(recent), recent, recentStreak);
  const o = deriveRadarStats(toScores(older),  older,  olderStreak);

  return AREAS.map((area) => ({
    area,
    current: r[area] ?? 0,
    previous: o[area] ?? 0,
    delta: (r[area] ?? 0) - (o[area] ?? 0),
  })).sort((a, b) => b.delta - a.delta);
}

export default function SkillVelocity({ trainingSessions, locale }) {
  const mn = locale === "mn";
  const velocity = useMemo(() => computeVelocity(trainingSessions), [trainingSessions]);

  if (!velocity) return null;

  const fastest = velocity[0];
  const slowest = velocity[velocity.length - 1];
  const anyChange = velocity.some((v) => Math.abs(v.delta) > 0.05);
  if (!anyChange) return null;

  return (
    <div style={{ marginBottom: 20, padding: "13px 14px", borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{ margin: "0 0 11px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, textTransform: "uppercase" }}>
        {mn ? "📊 Чадварын хурд (2 долоо хоног)" : "📊 Skill Velocity (2-week trend)"}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {velocity.map(({ area, current, delta }) => {
          const col = AREA_COLOR[area] || GOLD;
          const label = mn ? (AREA_MN[area] || area) : area;
          const absD = Math.abs(delta);
          const sign = delta > 0.05 ? "+" : delta < -0.05 ? "" : "±";
          const arrow = delta > 0.05 ? "↑" : delta < -0.05 ? "↓" : "→";
          const arrowColor = delta > 0.05 ? "#34D399" : delta < -0.05 ? "#F87171" : "rgba(255,255,255,0.3)";
          const barPct = Math.min(100, (current / 10) * 100);

          return (
            <div key={area} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 68, fontSize: 10, fontWeight: 800, color: col, flexShrink: 0 }}>{label}</div>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${barPct}%`, borderRadius: 3, background: col, opacity: 0.7 }} />
              </div>
              <div style={{ width: 28, textAlign: "right", fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                {current.toFixed(1)}
              </div>
              <div style={{ width: 34, textAlign: "right", fontSize: 10, fontWeight: 900, color: arrowColor, flexShrink: 0 }}>
                {arrow} {absD > 0.05 ? `${sign}${absD.toFixed(1)}` : ""}
              </div>
            </div>
          );
        })}
      </div>

      {fastest && slowest && fastest.area !== slowest.area && Math.abs(fastest.delta) > 0.1 && (
        <div style={{ marginTop: 11, display: "flex", gap: 7 }}>
          {fastest.delta > 0.1 && (
            <div style={{ flex: 1, padding: "6px 9px", borderRadius: 9, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.18)" }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: "#34D399", letterSpacing: 1, marginBottom: 2 }}>
                {mn ? "ХАМГИЙН ХУРДАН" : "FASTEST GROWTH"}
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>
                {mn ? (AREA_MN[fastest.area] || fastest.area) : fastest.area}
                <span style={{ color: "#34D399", marginLeft: 4 }}>+{fastest.delta.toFixed(1)}</span>
              </div>
            </div>
          )}
          {slowest.delta < -0.1 && (
            <div style={{ flex: 1, padding: "6px 9px", borderRadius: 9, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.18)" }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: "#F87171", letterSpacing: 1, marginBottom: 2 }}>
                {mn ? "АНХААРАЛ ХЭРЭГТЭЙ" : "NEEDS ATTENTION"}
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>
                {mn ? (AREA_MN[slowest.area] || slowest.area) : slowest.area}
                <span style={{ color: "#F87171", marginLeft: 4 }}>{slowest.delta.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
