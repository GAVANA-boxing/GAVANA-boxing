"use client";

import { useState, useEffect, useRef } from "react";
import { GOLD, goldAlpha, redAlpha, RED, RADIUS } from "@/lib/tokens";

const CACHE_KEY = (userId, ym) => `gavana_monthly_report_${ym}_${userId}`;

function getYM() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const MONTH_MN = ["1-р сар","2-р сар","3-р сар","4-р сар","5-р сар","6-р сар","7-р сар","8-р сар","9-р сар","10-р сар","11-р сар","12-р сар"];
const MONTH_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function MonthlyReport({ coachSnapshot, coachContextStr, locale, userId, trainingSessions }) {
  const mn = locale === "mn";
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const fetchedRef = useRef(false);

  const ym = getYM();
  const month = new Date();
  const monthLabel = mn ? MONTH_MN[month.getMonth()] : MONTH_EN[month.getMonth()];

  // Sessions this month
  const thisMonthSessions = (trainingSessions || []).filter((s) => {
    const ts = s.createdAt?.toMillis?.() || (s.createdAt?.seconds || 0) * 1000 || 0;
    const d = new Date(ts);
    return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
  });

  // Only show when enough data and not dismissed
  useEffect(() => {
    if (!userId) return;
    try {
      if (localStorage.getItem(`gavana_monthly_dismissed_${ym}_${userId}`) === "1") {
        setDismissed(true);
      }
    } catch { /* */ }
  }, [userId, ym]);

  // Load cached report
  useEffect(() => {
    if (!userId) return;
    try {
      const cached = localStorage.getItem(CACHE_KEY(userId, ym));
      if (cached) setReport(JSON.parse(cached));
    } catch { /* */ }
  }, [userId, ym]);

  const generate = async () => {
    if (fetchedRef.current || !userId) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const scores = thisMonthSessions.map((s) => Number(s.score)).filter(Number.isFinite);
      const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "N/A";
      const best = scores.length ? Math.max(...scores).toFixed(1) : "N/A";
      const { auth } = await import("@/lib/firebase");
      const token = await auth.currentUser?.getIdToken();
      const prompt = `${coachContextStr ? coachContextStr + "\n\n" : ""}Monthly training data for ${monthLabel}: ${thisMonthSessions.length} sessions, avg score ${avg}/10, best ${best}/10.
Generate a brief monthly progress report as JSON only, no markdown:
{"highlight":"one thing that improved most","gap":"biggest area still needing work","consistency":"one word assessment of training frequency","nextFocus":"single most important focus for next month"}`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ message: prompt, persona: "analyst", locale }),
      });
      const data = await res.json();
      const text = data.reply || data.message || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Bad response");
      const parsed = JSON.parse(match[0]);
      setReport(parsed);
      try { localStorage.setItem(CACHE_KEY(userId, ym), JSON.stringify(parsed)); } catch { /* */ }
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  };

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(`gavana_monthly_dismissed_${ym}_${userId}`, "1"); } catch { /* */ }
  };

  // Don't show if dismissed or less than 3 sessions
  if (dismissed || thisMonthSessions.length < 3) return null;

  return (
    <div style={{
      position: "relative",
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
          {mn ? `${monthLabel} тайлан` : `${monthLabel} Report`}
        </span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontWeight: 700 }}>
          {thisMonthSessions.length} {mn ? "дасгал" : "sessions"}
        </span>
        <button type="button" onClick={dismiss} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.18)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>×</button>
        <button type="button" onClick={() => setCollapsed((c) => !c)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.22)", fontSize: 16, cursor: "pointer", padding: "0 2px", lineHeight: 1 }}>
          {collapsed ? "+" : "−"}
        </button>
      </div>

      {!collapsed && (
        <div style={{ padding: "12px 14px 14px" }}>
          {!report && !loading && (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                {mn ? `${monthLabel}-н дасгалынхаа AI тайланг аваарай.` : `Get your AI-generated training summary for ${monthLabel}.`}
              </p>
              <button
                type="button"
                onClick={generate}
                style={{ width: "100%", padding: "11px 0", borderRadius: 11, background: goldAlpha(0.12), border: `1px solid ${goldAlpha(0.35)}`, color: GOLD, fontSize: 13, fontWeight: 900, cursor: "pointer" }}
              >
                {mn ? "🧠 Тайлан үүсгэх" : "🧠 Generate Report"}
              </button>
            </>
          )}

          {loading && (
            <div style={{ padding: "12px 0", textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
              {mn ? "Шинжилж байна..." : "Analyzing your month..."}
            </div>
          )}

          {report && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { key: "highlight", icon: "📈", labelEn: "Top Improvement", labelMn: "Хамгийн их сайжирсан" },
                { key: "gap",       icon: "🎯", labelEn: "Focus Area",      labelMn: "Анхаарах тал" },
                { key: "consistency", icon: "📅", labelEn: "Consistency",   labelMn: "Тогтмол байдал" },
                { key: "nextFocus", icon: "⚡", labelEn: "Next Month Focus", labelMn: "Дараагийн сарын зорилт" },
              ].map(({ key, icon, labelEn, labelMn }) => (
                <div key={key} style={{
                  display: "flex", gap: 10, padding: "9px 12px",
                  borderRadius: 11,
                  background: key === "nextFocus" ? goldAlpha(0.06) : "rgba(0,0,0,0.25)",
                  border: key === "nextFocus" ? `1px solid ${goldAlpha(0.2)}` : "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 900, color: key === "nextFocus" ? GOLD : "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>
                      {mn ? labelMn : labelEn}
                    </div>
                    <div style={{ fontSize: 12.5, color: key === "nextFocus" ? "#fff" : "rgba(255,255,255,0.65)", lineHeight: 1.45, fontWeight: key === "nextFocus" ? 800 : 600 }}>
                      {report[key]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
