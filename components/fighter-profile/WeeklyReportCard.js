"use client";

import { GOLD, whiteAlpha } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const WR_L = {
  en: {
    eyebrow:   "WEEKLY REPORT",
    sessions:  "Sessions",
    avgScore:  "Avg Score",
    best:      "Best",
    vsLast:    "vs prev week",
    noData:    "Train this week to generate your report.",
    arch:      "Dominant style",
    trainCta:  "Train now →",
  },
  mn: {
    eyebrow:   "7 ХОНОГИЙН ТАЙЛАН",
    sessions:  "Тренинг",
    avgScore:  "Дундаж оноо",
    best:      "Шилдэг",
    vsLast:    "өмнөх 7 хоноготой харьцуулбал",
    noData:    "7 хоногийн тайлан харахын тулд бэлтгэл хий.",
    arch:      "Давамгайлсан хэв маяг",
    trainCta:  "Бэлтгэл хий →",
  },
  ko: {
    eyebrow:   "주간 리포트",
    sessions:  "세션",
    avgScore:  "평균 점수",
    best:      "최고",
    vsLast:    "지난 주 대비",
    noData:    "주간 리포트를 보려면 이번 주 훈련하세요.",
    arch:      "주요 스타일",
    trainCta:  "지금 훈련 →",
  },
};

export default function WeeklyReportCard({ sessions, locale, dna, router }) {
  const L = WR_L[locale] || WR_L.en;
  const acc = ARCH_TRAINING_COLORS[dna.archetypeKey] || GOLD;
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  function getMs(s) {
    const ts = s.createdAt;
    if (!ts) return 0;
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.toDate === "function") return ts.toDate().getTime();
    return Number(ts) || 0;
  }

  const thisWeek = sessions.filter((s) => { const t = getMs(s); return t > 0 && t >= now - WEEK; });
  const lastWeek = sessions.filter((s) => { const t = getMs(s); return t > 0 && t >= now - 2 * WEEK && t < now - WEEK; });

  const thisCount = thisWeek.length;
  const lastCount = lastWeek.length;
  const thisAvg   = thisCount ? thisWeek.reduce((a, s) => a + (s.score || 0), 0) / thisCount : 0;
  const lastAvg   = lastCount ? lastWeek.reduce((a, s) => a + (s.score || 0), 0) / lastCount : 0;
  const thisBest  = thisCount ? Math.max(...thisWeek.map((s) => s.score || 0)) : 0;

  const sessionDelta = thisCount - lastCount;
  const avgDelta     = +(thisAvg - lastAvg).toFixed(1);

  function TrendBadge({ delta }) {
    if (Math.abs(delta) < 0.05) return <span style={{ fontSize: 9, color: whiteAlpha(0.25), fontFamily: "monospace" }}>—</span>;
    const pos = delta > 0;
    return (
      <span style={{ fontSize: 9, fontWeight: 900, color: pos ? "#34D399" : "#F87171", fontFamily: "monospace" }}>
        {pos ? "+" : ""}{typeof delta === "number" && delta % 1 !== 0 ? delta.toFixed(1) : delta}
      </span>
    );
  }

  if (thisCount === 0) {
    return (
      <div style={{ borderRadius: 14, padding: "18px 16px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.06)}`, marginBottom: 8, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
        <p style={{ margin: "0 0 12px", fontSize: 11.5, fontWeight: 700, color: whiteAlpha(0.3), lineHeight: 1.5 }}>{L.noData}</p>
        <button type="button" onClick={() => router.push(`/${locale}/train`)} style={{ padding: "8px 20px", borderRadius: 10, background: `${GOLD}12`, border: `1px solid ${GOLD}30`, color: GOLD, fontSize: 11, fontWeight: 900, cursor: "pointer" }}>
          {L.trainCta}
        </button>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", background: `linear-gradient(155deg, rgba(6,6,8,0.96) 0%, ${acc}0c 100%)`, border: `1px solid ${acc}22`, marginBottom: 8 }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${acc}88, transparent)` }} />
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: acc, textTransform: "uppercase", marginBottom: 12 }}>
          📊 {L.eyebrow}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { val: thisCount, label: L.sessions, delta: sessionDelta, color: "#fff" },
            { val: thisAvg.toFixed(1), label: L.avgScore, delta: avgDelta, color: "#fff" },
            { val: thisBest.toFixed(1), label: L.best, delta: null, color: GOLD },
          ].map(({ val, label, delta, color }) => (
            <div key={label} style={{ padding: "10px 0", borderRadius: 10, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.06)}`, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 1000, color, fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase", marginTop: 3 }}>{label}</div>
              <div style={{ marginTop: 3 }}>{delta !== null ? <TrendBadge delta={delta} /> : <span style={{ fontSize: 9, color: whiteAlpha(0.18), fontFamily: "monospace" }}>{L.vsLast.slice(0, 8)}</span>}</div>
            </div>
          ))}
        </div>
        {!dna.building && dna.archetypeKey && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>{L.arch}:</span>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: acc, boxShadow: `0 0 5px ${acc}88` }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: acc }}>{dna.archetype}</span>
          </div>
        )}
      </div>
    </div>
  );
}
