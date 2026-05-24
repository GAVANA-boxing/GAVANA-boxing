"use client";

import { useMemo } from "react";
import { GOLD, RED, goldAlpha } from "@/lib/tokens";
import { computeFighterScore } from "@/lib/dashboardHelpers";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  const sumX = points.reduce((s, [x]) => s + x, 0);
  const sumY = points.reduce((s, [, y]) => s + y, 0);
  const sumXY = points.reduce((s, [x, y]) => s + x * y, 0);
  const sumX2 = points.reduce((s, [x]) => s + x * x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (!denom) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function computeProjection(trainingSessions) {
  if (!trainingSessions || trainingSessions.length < 4) return null;

  const sorted = [...trainingSessions]
    .filter((s) => Number.isFinite(Number(s.score)))
    .sort((a, b) => getTs(a.createdAt) - getTs(b.createdAt));

  if (sorted.length < 4) return null;

  const now = Date.now();
  const points = sorted.map((s) => {
    const daysSince = (getTs(s.createdAt) - now) / (24 * 3600 * 1000);
    return [daysSince, Number(s.score)];
  });

  const reg = linearRegression(points);
  if (!reg) return null;

  const currentScore = reg.slope * 0 + reg.intercept;
  const projectedScore = Math.min(10, Math.max(1, reg.slope * 30 + reg.intercept));
  const delta = projectedScore - currentScore;

  // Fighter score projection (simplified)
  const recentScores = sorted.slice(-5).map((s) => Number(s.score));
  const streak = trainingSessions.length; // proxy
  const currentFS = computeFighterScore(recentScores, 0, Math.min(streak, 14));

  // Project by applying delta proportionally
  const projectedScores = recentScores.map((s) => Math.min(10, s + delta));
  const projectedFS = computeFighterScore(projectedScores, 0, Math.min(streak + 12, 30));

  return {
    currentScore: Math.round(currentScore * 10) / 10,
    projectedScore: Math.round(projectedScore * 10) / 10,
    delta: Math.round(delta * 10) / 10,
    currentFS: Math.round(currentFS),
    projectedFS: Math.round(projectedFS),
    fsDelta: projectedFS - currentFS,
    slope: reg.slope,
  };
}

export default function ScoreProjection({ trainingSessions, locale }) {
  const mn = locale === "mn";
  const proj = useMemo(() => computeProjection(trainingSessions), [trainingSessions]);

  if (!proj || Math.abs(proj.delta) < 0.05) return null;

  const improving = proj.delta > 0;
  const col = improving ? "#34D399" : "#F87171";
  const arrow = improving ? "↑" : "↓";
  const sign = improving ? "+" : "";

  return (
    <div style={{
      marginBottom: 20,
      padding: "13px 14px",
      borderRadius: "3px 14px 14px 3px",
      background: `${col}07`,
      border: `1px solid ${col}20`,
      borderLeft: `3px solid ${col}`,
    }}>
      <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, color: col, letterSpacing: 2.5, textTransform: "uppercase" }}>
        {mn ? "🔮 30 хоногийн таамаглал" : "🔮 30-Day Projection"}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Current → Projected score */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>
              {mn ? "Одоо" : "Now"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
              {proj.currentScore.toFixed(1)}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ fontSize: 18, color: col }}>{arrow}</div>
            <div style={{ fontSize: 8, fontWeight: 900, color: col }}>30d</div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>
              {mn ? "Таамаглал" : "Projected"}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: col, lineHeight: 1 }}>
              {proj.projectedScore.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Fighter score delta */}
        <div style={{ textAlign: "center", padding: "8px 12px", borderRadius: 10, background: `${col}12`, border: `1px solid ${col}25` }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>
            Fighter Score
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: col }}>
            {proj.currentFS} → {proj.projectedFS}
          </div>
          <div style={{ fontSize: 10, fontWeight: 900, color: col }}>
            {sign}{proj.fsDelta}
          </div>
        </div>
      </div>

      <p style={{ margin: "10px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 600, lineHeight: 1.4 }}>
        {improving
          ? (mn
              ? `Одоогийн хурдаар 30 хоногт ${sign}${proj.delta.toFixed(1)} оноо нэмэгдэнэ. Тогтмол байдлаа хадгал.`
              : `At your current pace you'll gain ${sign}${proj.delta.toFixed(1)} pts in 30 days. Keep it consistent.`)
          : (mn
              ? `Одоогийн хандлагаар оноо буурах байна. Тогтмол дасгал хийснээр энэ өөрчлөгдөнө.`
              : `Current trend shows a dip. More consistent training will reverse this.`)}
      </p>
    </div>
  );
}
