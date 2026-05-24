"use client";

import { useMemo } from "react";
import { GOLD } from "@/lib/tokens";

const DAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_MN = ["Ням", "Дав", "Мяг", "Лха", "Пүр", "Баа", "Бям"];

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function analyzePatterns(trainingSessions) {
  if (!trainingSessions || trainingSessions.length < 5) return null;

  const byDay = Array.from({ length: 7 }, () => ({ scores: [], count: 0 }));

  trainingSessions.forEach((s) => {
    const score = Number(s.score);
    if (!Number.isFinite(score)) return;
    const day = new Date(getTs(s.createdAt)).getDay();
    byDay[day].scores.push(score);
    byDay[day].count++;
  });

  const dayStats = byDay.map((d, i) => ({
    day: i,
    count: d.count,
    avg: d.count ? d.scores.reduce((a, b) => a + b, 0) / d.count : null,
  }));

  const withData = dayStats.filter((d) => d.count >= 1);
  if (withData.length < 2) return null;

  const bestDay = [...withData].sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0))[0];
  const mostActive = [...withData].sort((a, b) => b.count - a.count)[0];
  const maxCount = Math.max(...withData.map((d) => d.count));
  const maxAvg = Math.max(...withData.map((d) => d.avg ?? 0));

  return { dayStats, bestDay, mostActive, maxCount, maxAvg };
}

export default function PerformancePattern({ trainingSessions, locale }) {
  const mn = locale === "mn";
  const data = useMemo(() => analyzePatterns(trainingSessions), [trainingSessions]);
  const DAYS = mn ? DAY_MN : DAY_EN;

  if (!data) return null;

  const { dayStats, bestDay, mostActive, maxCount, maxAvg } = data;

  return (
    <div style={{ marginBottom: 20, padding: "13px 14px", borderRadius: 16, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{ margin: "0 0 13px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 2.5, textTransform: "uppercase" }}>
        {mn ? "📅 Гаргамж хэв маяг" : "📅 Performance by Day"}
      </p>

      {/* Bar chart by day */}
      <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 54, marginBottom: 10 }}>
        {dayStats.map(({ day, count, avg }) => {
          const isBest = avg != null && Math.abs(avg - (bestDay.avg ?? 0)) < 0.01 && day === bestDay.day;
          const col = isBest ? GOLD : avg != null ? "#60A5FA" : "rgba(255,255,255,0.07)";
          const barH = avg != null ? Math.max(8, (avg / 10) * 46) : 4;
          return (
            <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: avg != null ? col : "rgba(255,255,255,0.15)" }}>
                {avg != null ? avg.toFixed(1) : ""}
              </div>
              <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "flex-end", height: 40, justifyContent: "center" }}>
                <div style={{
                  width: "80%", height: barH, borderRadius: "3px 3px 1px 1px",
                  background: col, opacity: avg != null ? 0.85 : 0.25,
                  transition: "height 0.4s ease",
                }} />
                {count > 0 && (
                  <div style={{ position: "absolute", top: -2, fontSize: 7, fontWeight: 900, color: "rgba(255,255,255,0.3)" }}>
                    {count}×
                  </div>
                )}
              </div>
              <div style={{ fontSize: 9, fontWeight: 800, color: isBest ? GOLD : "rgba(255,255,255,0.35)" }}>
                {DAYS[day]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, padding: "7px 10px", borderRadius: 9, background: `${GOLD}10`, border: `1px solid ${GOLD}22` }}>
          <div style={{ fontSize: 8, fontWeight: 900, color: GOLD, letterSpacing: 1, marginBottom: 3 }}>
            {mn ? "ХАМГИЙН САЙН ӨДӨР" : "PEAK DAY"}
          </div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>
            {DAYS[bestDay.day]}
            <span style={{ fontSize: 10, color: GOLD, marginLeft: 5 }}>{bestDay.avg?.toFixed(1)}/10</span>
          </div>
        </div>
        {mostActive.day !== bestDay.day && mostActive.count >= 2 && (
          <div style={{ flex: 1, padding: "7px 10px", borderRadius: 9, background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.18)" }}>
            <div style={{ fontSize: 8, fontWeight: 900, color: "#60A5FA", letterSpacing: 1, marginBottom: 3 }}>
              {mn ? "ХАМГИЙН ИДЭВХТЭЙ" : "MOST ACTIVE"}
            </div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#fff" }}>
              {DAYS[mostActive.day]}
              <span style={{ fontSize: 10, color: "#60A5FA", marginLeft: 5 }}>{mostActive.count}×</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
