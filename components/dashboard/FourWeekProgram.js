"use client";

import { useMemo, useState } from "react";
import { GOLD, RED } from "@/lib/tokens";
import { FIGHTERS } from "@/lib/fighters";
import { getPersonalConnection } from "@/lib/fighterPersonalConnection";

const WEEK_THEMES = [
  { labelMn: "1-р долоо хоног · Суурь", label: "Week 1 · Foundation",   desc: "Address your weakest area head-on" },
  { labelMn: "2-р долоо хоног · Ахиц",  label: "Week 2 · Build",        desc: "Strengthen your second gap" },
  { labelMn: "3-р долоо хоног · Нэгтгэх", label: "Week 3 · Integrate", desc: "Combine skills, add a new fighter" },
  { labelMn: "4-р долоо хоног · Оргил",  label: "Week 4 · Peak",        desc: "Push your strongest area higher" },
];

const AREA_COLOR = {
  Power: RED, Speed: "#FB923C", Timing: GOLD,
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};

function buildProgram(coachSnapshot) {
  if (!coachSnapshot) return null;
  const { weakAreas, strongAreas, radarStats } = coachSnapshot;

  const miniSnap = { weakAreas, radarStats };
  const fighterMap = {};
  FIGHTERS.forEach((f) => {
    const conn = getPersonalConnection(miniSnap, f);
    if (conn) fighterMap[f.id] = { fighter: f, connection: conn };
  });

  const topByArea = (area) => {
    return Object.values(fighterMap)
      .filter((x) => x.connection.teaches.includes(area))
      .sort((a, b) => (b.connection.relevantWeak?.length || 0) - (a.connection.relevantWeak?.length || 0))[0];
  };

  const area1 = weakAreas[0]?.[0];
  const area2 = weakAreas[1]?.[0] || weakAreas[0]?.[0];
  const area3 = weakAreas[2]?.[0] || area1;
  const area4 = strongAreas[0]?.[0] || area1;

  const f1 = topByArea(area1);
  const f2 = topByArea(area2);
  const f3 = topByArea(area3);
  const f4 = topByArea(area4);

  return [
    { area: area1, fighter: f1?.fighter, drill: f1?.connection.focusDrills?.[0] || f1?.connection.focusStudy?.[0], targetScore: Math.min(10, (radarStats[area1] || 3) + 1.5) },
    { area: area2, fighter: f2?.fighter, drill: f2?.connection.focusDrills?.[0] || f2?.connection.focusStudy?.[0], targetScore: Math.min(10, (radarStats[area2] || 3) + 1.5) },
    { area: area3, fighter: f3?.fighter, drill: f3?.connection.focusDrills?.[0] || f3?.connection.focusStudy?.[0], targetScore: Math.min(10, (radarStats[area3] || 3) + 1.0) },
    { area: area4, fighter: f4?.fighter, drill: f4?.connection.focusDrills?.[0] || f4?.connection.focusStudy?.[0], targetScore: Math.min(10, (radarStats[area4] || 5) + 1.0) },
  ];
}

export default function FourWeekProgram({ coachSnapshot, locale, router }) {
  const [collapsed, setCollapsed] = useState(false);
  const [openWeek, setOpenWeek] = useState(0);

  const program = useMemo(() => buildProgram(coachSnapshot), [coachSnapshot]);

  if (!coachSnapshot || !program) return null;

  const currentWeekIdx = Math.min(3, Math.floor((coachSnapshot.totalSessions || 0) / 5));

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `2.5px solid #A78BFA`,
      borderRadius: "3px 16px 16px 3px",
      marginBottom: 28,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px 8px",
        borderBottom: collapsed ? "none" : "1px solid rgba(255,255,255,0.045)",
        background: "rgba(0,0,0,0.18)",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#A78BFA", boxShadow: "0 0 7px #A78BFA" }} />
        <span style={{ fontSize: 10, fontWeight: 900, flex: 1, color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {locale === "mn" ? "4 долоо хоногийн хөтөлбөр" : "4-Week Program"}
        </span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontWeight: 700 }}>
          {locale === "mn" ? `${currentWeekIdx + 1}-р долоо` : `Week ${currentWeekIdx + 1}`}
        </span>
        <button type="button" onClick={() => setCollapsed((c) => !c)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>
          {collapsed ? "+" : "−"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: "10px 14px 14px" }}>
          {program.map((week, i) => {
            const theme = WEEK_THEMES[i];
            const acc = AREA_COLOR[week.area] || "#fff";
            const isActive = i === currentWeekIdx;
            const isPast = i < currentWeekIdx;
            const isOpen = openWeek === i;

            return (
              <div key={i} style={{ marginBottom: i < 3 ? 6 : 0 }}>
                <button
                  type="button"
                  onClick={() => setOpenWeek(isOpen ? -1 : i)}
                  style={{
                    width: "100%", textAlign: "left", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 11px",
                    borderRadius: 11,
                    background: isActive ? `${acc}10` : isPast ? "rgba(255,255,255,0.02)" : "transparent",
                    border: `1px solid ${isActive ? acc + "28" : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                    background: isPast ? "rgba(52,211,153,0.15)" : isActive ? `${acc}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isPast ? "rgba(52,211,153,0.4)" : isActive ? acc + "40" : "rgba(255,255,255,0.07)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 900,
                    color: isPast ? "#34D399" : isActive ? acc : "rgba(255,255,255,0.3)",
                  }}>
                    {isPast ? "✓" : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 900, color: isActive ? "#fff" : "rgba(255,255,255,0.5)", lineHeight: 1.2 }}>
                      {locale === "mn" ? theme.labelMn : theme.label}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                      {locale === "mn" ? `${week.area} · 목표 ${week.targetScore?.toFixed(1)}` : `${week.area} · target ${week.targetScore?.toFixed(1)}`}
                    </div>
                  </div>
                  {isActive && (
                    <span style={{ fontSize: 8.5, fontWeight: 900, color: acc, letterSpacing: 0.5 }}>
                      {locale === "mn" ? "ОДОО" : "NOW"}
                    </span>
                  )}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(180deg)" : "none", flexShrink: 0 }}>
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                {isOpen && (
                  <div style={{ padding: "10px 11px 4px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {week.fighter && (
                      <button
                        type="button"
                        onClick={() => router.push(`/${locale}/fighters/${week.fighter.id}`)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                          padding: "9px 11px", borderRadius: 10,
                          background: `${acc}08`, border: `1px solid ${acc}20`, cursor: "pointer",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>🥊</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11.5, fontWeight: 900, color: "#fff" }}>{week.fighter.name}</div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{week.area} specialist</div>
                        </div>
                        <span style={{ fontSize: 10, color: acc, fontWeight: 800 }}>Study →</span>
                      </button>
                    )}
                    {week.drill && (
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "7px 11px", borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <svg width="9" height="11" viewBox="0 0 13 16" fill={acc} style={{ marginTop: 1.5, flexShrink: 0 }}>
                          <path d="M7 0L0 9h6l-1 7 7-9H6L7 0z"/>
                        </svg>
                        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.4 }}>{week.drill}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
