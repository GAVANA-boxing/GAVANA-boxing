"use client";

import { useState, useEffect, useCallback } from "react";
import { GOLD, RED } from "@/lib/tokens";
import { loc } from "@/lib/loc";

const DAY_NAMES = {
  mn: ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"],
  ko: ["월", "화", "수", "목", "금", "토", "일"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const AREA_COLOR = {
  Power:    RED,
  Speed:    "#FB923C",
  Timing:   GOLD,
  Footwork: "#60A5FA",
  Guard:    "#A78BFA",
  Accuracy: "#34D399",
};

export default function WeeklyPlanSection({ coachSnapshot, coachContextStr, locale, router, weekNumber, userId }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const cacheKey = `gavana_weekly_plan_W${weekNumber}_${userId}`;
  const days = DAY_NAMES[locale] || DAY_NAMES.en;

  const generatePlan = useCallback(async () => {
    if (!coachSnapshot || loading) return;
    setLoading(true);
    try {
      const { auth } = await import("@/lib/firebase");
      const token = await auth.currentUser?.getIdToken();
      const weakStr = coachSnapshot.weakAreas.slice(0, 3).map(([k, v]) => `${k}(${v.toFixed(1)})`).join(", ");
      const strongStr = coachSnapshot.strongAreas.slice(0, 2).map(([k]) => k).join(", ");
      const prompt =
        `Create a 7-day boxing training plan. ` +
        `Weak areas: ${weakStr}. Strong: ${strongStr || "none yet"}. ` +
        `Return ONLY a JSON array with exactly 7 objects, no extra text. ` +
        `Schema: [{"day":"Mon","area":"Footwork","fighter":"Muhammad Ali","drill":"3×2min lateral movement squares"}, ...] ` +
        `Days: Mon Tue Wed Thu Fri Sat Sun. Weekend can be rest/review. ` +
        `Drill max 8 words. Use real fighter names from boxing history.`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          persona: "analyst",
          locale: "en",
          coachContext: coachContextStr,
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || data.message || "";
      const jsonMatch = text.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length >= 7) {
          setPlan(parsed);
          try { localStorage.setItem(cacheKey, JSON.stringify(parsed)); } catch { /* */ }
        }
      }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [coachSnapshot, coachContextStr, cacheKey, loading]);

  // Load cache or auto-generate on mount
  useEffect(() => {
    if (!coachSnapshot) return;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) { setPlan(JSON.parse(cached)); return; }
    } catch { /* */ }
    generatePlan();
  }, [coachSnapshot, cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const regenerate = () => {
    try { localStorage.removeItem(cacheKey); } catch { /* */ }
    setPlan(null);
    generatePlan();
  };

  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0

  if (!coachSnapshot) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `2.5px solid ${GOLD}`,
      borderRadius: "3px 16px 16px 3px",
      marginBottom: 28,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px 8px",
        borderBottom: collapsed || (!plan && !loading) ? "none" : "1px solid rgba(255,255,255,0.045)",
        background: "rgba(0,0,0,0.18)",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
        <span style={{ fontSize: 10, fontWeight: 900, flex: 1, color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {loc(locale, "7 хоногийн хуваарь", "주간 트레이닝 플랜", "Weekly Training Plan")}
        </span>
        {plan && !loading && (
          <button
            type="button"
            onClick={regenerate}
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 10, fontWeight: 700, cursor: "pointer", padding: "2px 6px" }}
          >
            {locale === "mn" ? "↺ Шинэчлэх" : "↺ Refresh"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}
        >
          {collapsed ? "+" : "−"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: "10px 14px 14px" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>
              <style>{`@keyframes wps{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, animation: `wps 1.1s ease-in-out ${i * 0.18}s infinite` }} />
              ))}
              <span>{locale === "mn" ? "Хуваарь үүсгэж байна..." : "Generating your plan..."}</span>
            </div>
          )}

          {!loading && !plan && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <button
                type="button"
                onClick={generatePlan}
                style={{ padding: "9px 22px", borderRadius: 10, background: `${GOLD}18`, border: `1px solid ${GOLD}40`, color: GOLD, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
              >
                {locale === "mn" ? "⚡ Хуваарь үүсгэх" : "⚡ Generate Plan"}
              </button>
            </div>
          )}

          {plan && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {plan.slice(0, 7).map((item, i) => {
                const isToday = i === todayIdx;
                const acc = AREA_COLOR[item.area] || "rgba(255,255,255,0.4)";
                const isWeekend = i >= 5;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: 9,
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: isToday ? `${acc}10` : "transparent",
                      border: isToday ? `1px solid ${acc}28` : "1px solid transparent",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: isToday ? `${acc}20` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${isToday ? acc + "40" : "rgba(255,255,255,0.07)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 900,
                      color: isToday ? acc : "rgba(255,255,255,0.3)",
                    }}>
                      {days[i]}
                    </div>
                    {isWeekend && !item.drill ? (
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
                        {locale === "mn" ? "Амралт / хөнгөн давталт" : "Rest / light review"}
                      </span>
                    ) : (
                      <>
                        <div style={{
                          padding: "2px 7px", borderRadius: 999, flexShrink: 0,
                          background: `${acc}15`, border: `1px solid ${acc}30`,
                          fontSize: 8.5, fontWeight: 900, color: acc, letterSpacing: 0.5,
                        }}>
                          {item.area}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: isToday ? "#fff" : "rgba(255,255,255,0.65)", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.fighter}
                          </div>
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.drill}
                          </div>
                        </div>
                        {isToday && (
                          <div style={{ fontSize: 8.5, fontWeight: 900, color: acc, letterSpacing: 0.5, flexShrink: 0 }}>
                            {locale === "mn" ? "ӨНӨӨДӨР" : "TODAY"}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
