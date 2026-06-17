"use client";

import { GOLD, whiteAlpha } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";
import { computeFighterDNA } from "@/lib/fighterDNA";

const EVO_EV_L = {
  en: {
    title:   "DNA EVOLUTION",
    before:  "Before",
    now:     "Now",
    sessions: (n) => `${n} sessions`,
    insight: {
      archChange: (from, to) => `Evolving: ${from} → ${to}`,
      rising:     (trait)    => `${trait} emerging fast`,
      steady:     (trait)    => `${trait} growing steadily`,
      stable:                  "Your style is consolidating",
    },
  },
  mn: {
    title:   "ДНХ ХӨГЖИЛ",
    before:  "Өмнө",
    now:     "Одоо",
    sessions: (n) => `${n} тренинг`,
    insight: {
      archChange: (from, to) => `Хөгжиж байна: ${from} → ${to}`,
      rising:     (trait)    => `${trait} хурдтай гарч ирж байна`,
      steady:     (trait)    => `${trait} тогтвортой өсч байна`,
      stable:                  "Таны хэв маяг бататгагдаж байна",
    },
  },
  ko: {
    title:   "DNA 진화",
    before:  "이전",
    now:     "현재",
    sessions: (n) => `${n}세션`,
    insight: {
      archChange: (from, to) => `진화: ${from} → ${to}`,
      rising:     (trait)    => `${trait} 빠르게 성장 중`,
      steady:     (trait)    => `${trait} 꾸준히 성장`,
      stable:                  "스타일이 굳어지고 있습니다",
    },
  },
};

const ARCH_KEYS_EV = ["pressure", "outboxer", "counter", "explosive", "technician"];

const ARCH_NAMES = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Аутбоксер", counter: "Контр", explosive: "Тэсрэлт", technician: "Техникч" },
  ko: { pressure: "프레셔", outboxer: "아웃복서", counter: "카운터", explosive: "폭발적", technician: "테크니션" },
};

export default function DNAEvolutionCard({ sessions, locale }) {
  const L     = EVO_EV_L[locale] || EVO_EV_L.en;
  const NAMES = ARCH_NAMES[locale] || ARCH_NAMES.en;

  const sorted = [...sessions].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  if (sorted.length < 6) return null;

  // Split: first 40% vs last 40% (min 3 each)
  const splitN      = Math.max(3, Math.floor(sorted.length * 0.4));
  const beforeSess  = sorted.slice(0, splitN);
  const nowSess     = sorted.slice(-splitN);

  const beforeDNA   = computeFighterDNA({ sessions: beforeSess, locale });
  const nowDNA      = computeFighterDNA({ sessions: nowSess, locale });

  const beforeMix   = beforeDNA.styleMix || {};
  const nowMix      = nowDNA.styleMix || {};

  // Convert styleMix (0–10) to percentages
  function toPercent(mix) {
    const total = ARCH_KEYS_EV.reduce((s, k) => s + (mix[k] || 0), 0);
    if (total === 0) return {};
    const out = {};
    ARCH_KEYS_EV.forEach((k) => { out[k] = Math.round(((mix[k] || 0) / total) * 100); });
    return out;
  }

  const bPct = toPercent(beforeMix);
  const nPct = toPercent(nowMix);

  // Deltas sorted by absolute change
  const deltas = ARCH_KEYS_EV.map((k) => ({
    key:    k,
    before: bPct[k] || 0,
    now:    nPct[k] || 0,
    delta:  (nPct[k] || 0) - (bPct[k] || 0),
  })).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const topDeltas = deltas.slice(0, 4);
  const topChange = deltas[0];

  // Skip if no meaningful change
  if (!topChange || Math.abs(topChange.delta) < 2) return null;

  const archChanged = !beforeDNA.building && !nowDNA.building && beforeDNA.archetypeKey && nowDNA.archetypeKey && beforeDNA.archetypeKey !== nowDNA.archetypeKey;
  const currentColor = ARCH_TRAINING_COLORS[nowDNA.archetypeKey || topDeltas[0]?.key] || GOLD;

  let insightText;
  if (archChanged) {
    insightText = L.insight.archChange(NAMES[beforeDNA.archetypeKey], NAMES[nowDNA.archetypeKey]);
  } else if (Math.abs(topChange.delta) >= 10) {
    insightText = L.insight.rising(NAMES[topChange.key]);
  } else if (Math.abs(topChange.delta) >= 5) {
    insightText = L.insight.steady(NAMES[topChange.key]);
  } else {
    insightText = L.insight.stable;
  }

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${currentColor}30`, background: `${currentColor}08`, marginBottom: 8 }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${currentColor}88, transparent)` }} />
      <div style={{ padding: "14px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: currentColor, textTransform: "uppercase" }}>
            {L.title}
          </span>
          {archChanged && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: ARCH_TRAINING_COLORS[beforeDNA.archetypeKey] || GOLD, textTransform: "uppercase" }}>
                {NAMES[beforeDNA.archetypeKey]}
              </span>
              <span style={{ fontSize: 9, color: whiteAlpha(0.3) }}>→</span>
              <span style={{ fontSize: 9, fontWeight: 900, color: currentColor, textTransform: "uppercase" }}>
                {NAMES[nowDNA.archetypeKey]}
              </span>
            </div>
          )}
        </div>

        {/* Column labels */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ width: 76, flexShrink: 0 }} />
          <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.22), textTransform: "uppercase" }}>
              {L.before} · {L.sessions(splitN)}
            </span>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.22), textTransform: "uppercase" }}>
              {L.now} · {L.sessions(splitN)}
            </span>
          </div>
          <span style={{ width: 40, flexShrink: 0 }} />
        </div>

        {/* Delta rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {topDeltas.map(({ key, before, now, delta }) => {
            const acc        = ARCH_TRAINING_COLORS[key] || GOLD;
            const deltaColor = delta > 2 ? "#34D399" : delta < -2 ? "#F87171" : whiteAlpha(0.3);
            const deltaStr   = delta > 0 ? `+${delta}%` : `${delta}%`;
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 76, fontSize: 9, fontWeight: 900, color: acc, textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0, textAlign: "right" }}>
                  {NAMES[key]}
                </span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Before bar */}
                  <div style={{ height: 4, background: whiteAlpha(0.05), borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${before}%`, height: "100%", background: whiteAlpha(0.2), borderRadius: 2 }} />
                  </div>
                  {/* Now bar */}
                  <div style={{ height: 4, background: whiteAlpha(0.05), borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${now}%`, height: "100%", background: acc, borderRadius: 2, boxShadow: `0 0 6px ${acc}55` }} />
                  </div>
                </div>
                <span style={{ width: 40, textAlign: "right", fontSize: 11, fontWeight: 900, color: deltaColor, fontFamily: "monospace", flexShrink: 0 }}>
                  {deltaStr}
                </span>
              </div>
            );
          })}
        </div>

        {/* Insight */}
        <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: `${currentColor}10`, border: `1px solid ${currentColor}20` }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.72)", lineHeight: 1.4 }}>
            {insightText}
          </p>
        </div>
      </div>
    </div>
  );
}
