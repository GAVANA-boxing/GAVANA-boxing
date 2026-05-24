"use client";

import { useState, useMemo } from "react";
import { GOLD, RED, goldAlpha, redAlpha, RADIUS } from "@/lib/tokens";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

const DAY_LABELS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DAY_LABELS_MN = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"];

const MONTH_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_MN = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"];

export default function TrainingCalendar({ trainingSessions, locale }) {
  const mn = locale === "mn";
  const [collapsed, setCollapsed] = useState(false);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Build a set of "YYYY-MM-DD" keys for session days + score map
  const sessionDayMap = useMemo(() => {
    const map = {}; // "YYYY-MM-DD" → { count, bestScore }
    for (const s of (trainingSessions || [])) {
      const ts = getTs(s.createdAt);
      if (!ts) continue;
      const d = new Date(ts);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = { count: 0, bestScore: 0 };
      map[key].count++;
      const sc = Number(s.score);
      if (sc > map[key].bestScore) map[key].bestScore = sc;
    }
    return map;
  }, [trainingSessions]);

  const totalThisMonth = useMemo(() => {
    return Object.keys(sessionDayMap).filter((k) => {
      const [y, m] = k.split("-").map(Number);
      return y === viewYear && m === viewMonth + 1;
    }).length;
  }, [sessionDayMap, viewYear, viewMonth]);

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };
  const canGoNext = viewYear < today.getFullYear() || (viewYear === today.getFullYear() && viewMonth < today.getMonth());

  const dayLabels = mn ? DAY_LABELS_MN : DAY_LABELS_EN;
  const monthLabel = mn ? MONTH_MN[viewMonth] : MONTH_EN[viewMonth];

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `2.5px solid ${GOLD}`,
      borderRadius: "3px 16px 16px 3px",
      marginBottom: 20,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px 8px",
        borderBottom: collapsed ? "none" : "1px solid rgba(255,255,255,0.045)",
        background: "rgba(0,0,0,0.18)",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
        <span style={{ fontSize: 10, fontWeight: 900, flex: 1, color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {mn ? "Дасгалын хуанли" : "Training Calendar"}
        </span>
        {!collapsed && (
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>
            {totalThisMonth} {mn ? "өдөр" : "days"}
          </span>
        )}
        <button type="button" onClick={() => setCollapsed((c) => !c)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>
          {collapsed ? "+" : "−"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: "10px 12px 14px" }}>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16, padding: "2px 6px", lineHeight: 1 }}>‹</button>
            <span style={{ fontSize: 12, fontWeight: 900, color: "rgba(255,255,255,0.65)" }}>
              {monthLabel} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} disabled={!canGoNext} style={{ background: "none", border: "none", color: canGoNext ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.1)", cursor: canGoNext ? "pointer" : "default", fontSize: 16, padding: "2px 6px", lineHeight: 1 }}>›</button>
          </div>

          {/* Day labels */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px 2px", marginBottom: 4 }}>
            {dayLabels.map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.22)", paddingBottom: 4 }}>{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px 2px" }}>
            {cells.map((day, i) => {
              if (!day) return <div key={`e${i}`} />;
              const cellKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const sess = sessionDayMap[cellKey];
              const isToday = cellKey === todayKey;
              const hasSess = !!sess;
              const isFuture = new Date(viewYear, viewMonth, day) > today;

              let dotColor = null;
              if (hasSess) {
                const sc = sess.bestScore;
                dotColor = sc >= 8 ? "#4ade80" : sc >= 6 ? GOLD : RED;
              }

              return (
                <div key={cellKey} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  height: 36, borderRadius: 8,
                  background: isToday ? "rgba(255,255,255,0.07)" : hasSess ? `${dotColor}12` : "transparent",
                  border: isToday ? "1px solid rgba(255,255,255,0.12)" : hasSess ? `1px solid ${dotColor}28` : "1px solid transparent",
                  position: "relative",
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: isToday ? 900 : hasSess ? 800 : 600,
                    color: isToday ? "#fff" : hasSess ? dotColor : isFuture ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.35)",
                    lineHeight: 1,
                  }}>
                    {day}
                  </span>
                  {hasSess && (
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: dotColor, marginTop: 2, boxShadow: `0 0 4px ${dotColor}` }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 12, marginTop: 12, justifyContent: "center" }}>
            {[["#4ade80", "8+"], [GOLD, "6-7"], [RED, "<6"]].map(([col, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: col }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
