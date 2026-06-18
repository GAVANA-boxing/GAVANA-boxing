"use client";

import { useState } from "react";
import { GOLD, RADIUS, whiteAlpha } from "@/lib/tokens";
import { FIGHTERS } from "@/lib/fighters";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";
import PassportStatCell from "@/components/fighter-profile/PassportStatCell";
import PassportShareButton from "@/components/fighter-profile/PassportShareButton";

const PP_L = {
  en: {
    eyebrow:    "GAVANA FIGHTER PASSPORT",
    rank:       "Rank",
    dnaConf:    "DNA",
    signature:  "Signature",
    studies:    "Studies",
    experiment: "Experiment",
    none:       "None yet",
    building:   "Building DNA...",
    streak:     "Streak",
    days:       "days",
  },
  mn: {
    eyebrow:    "GAVANA ТУЛААНЧИЙН ҮНЭМЛЭХ",
    rank:       "Зэрэг",
    dnaConf:    "ДНХ",
    signature:  "Онцлог",
    studies:    "Судалгаа",
    experiment: "Туршилт",
    none:       "Одоохондоо байхгүй",
    building:   "ДНХ бүрдэж байна...",
    streak:     "Давтамж",
    days:       "өдөр",
  },
  ko: {
    eyebrow:    "GAVANA 파이터 패스포트",
    rank:       "랭크",
    dnaConf:    "DNA",
    signature:  "특성",
    studies:    "학습",
    experiment: "실험",
    none:       "아직 없음",
    building:   "DNA 구축 중...",
    streak:     "스트릭",
    days:       "일",
  },
};

const ARCH_DISPLAY_PP = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт",   outboxer: "Аутбоксер", counter: "Контр",  explosive: "Тэсрэлт",  technician: "Техникч"  },
  ko: { pressure: "프레셔",    outboxer: "아웃복서",   counter: "카운터", explosive: "폭발적",    technician: "테크니션" },
};

export default function FighterPassportCard({ dna, displayName, progress, studiedIds, currentExperiment, sessions, locale }) {
  const L   = PP_L[locale]            || PP_L.en;
  const AD  = ARCH_DISPLAY_PP[locale] || ARCH_DISPLAY_PP.en;
  const acc = ARCH_TRAINING_COLORS[dna.archetypeKey] || GOLD;

  const confidencePct = dna.building ? null : Math.round((dna.confidence || 0) * 100);

  // Top 3 signature traits from styleMix
  const topTraits = Object.entries(dna.styleMix || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([k]) => AD[k] || k);

  // Top 3 studied fighters
  const studiedFighters = FIGHTERS.filter((f) => studiedIds.includes(f.id)).slice(0, 3);

  // Rank label
  const rankName = progress?.building ? null : (progress?.level?.[locale] || progress?.level?.en || null);

  // Year
  const year = new Date().getFullYear();

  // Training streak from session timestamps
  const streak = (() => {
    if (!sessions?.length) return 0;
    const DAY = 24 * 60 * 60 * 1000;
    const dayTimes = [...new Set(sessions.map((s) => {
      const ts = s.createdAt;
      if (!ts) return null;
      const ms = typeof ts.toMillis === "function" ? ts.toMillis() : typeof ts.toDate === "function" ? ts.toDate().getTime() : Number(ts) || 0;
      if (!ms) return null;
      const d = new Date(ms);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }).filter(Boolean))].map((s) => {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m, d).getTime();
    }).sort((a, b) => b - a);
    if (!dayTimes.length) return 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (dayTimes[0] < today.getTime() - DAY) return 0;
    let count = 1;
    for (let i = 1; i < dayTimes.length; i++) {
      if (dayTimes[i - 1] - dayTimes[i] === DAY) count++; else break;
    }
    return count;
  })();

  return (
    <div style={{
      borderRadius: 20, overflow: "hidden",
      border: `1px solid ${dna.building ? whiteAlpha(0.08) : `${acc}40`}`,
      background: dna.building
        ? whiteAlpha(0.015)
        : `linear-gradient(155deg, rgba(6,6,8,0.97) 0%, ${acc}14 100%)`,
      marginBottom: 16,
    }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: dna.building ? whiteAlpha(0.06) : `linear-gradient(90deg, ${acc}, ${acc}44, transparent)` }} />

      <div style={{ padding: "16px 18px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>🥊</span>
            <span style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2.5, color: dna.building ? whiteAlpha(0.2) : acc, textTransform: "uppercase" }}>
              {L.eyebrow}
            </span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, color: whiteAlpha(0.18), fontFamily: "monospace" }}>
            {year}
          </span>
        </div>

        {/* Name + archetype */}
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 28, fontWeight: 1000, color: "#fff", lineHeight: 1.0,
            fontFamily: "var(--font-display,'Anton',sans-serif)",
            textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 6,
          }}>
            {displayName}
          </div>
          {dna.building ? (
            <div style={{ fontSize: 11, fontWeight: 700, color: whiteAlpha(0.28) }}>{L.building}</div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: acc, boxShadow: `0 0 8px ${acc}88`, flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 900, color: acc, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {dna.archetype}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: dna.building ? whiteAlpha(0.04) : `${acc}20`, marginBottom: 14 }} />

        {/* Info grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Rank */}
          {rankName && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 76, fontSize: 8.5, fontWeight: 900, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>
                {L.rank}
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: whiteAlpha(0.7) }}>
                {rankName}
              </span>
            </div>
          )}

          {/* DNA confidence */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 76, fontSize: 8.5, fontWeight: 900, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>
              {L.dnaConf}
            </span>
            {confidencePct == null ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: whiteAlpha(0.22) }}>—</span>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 5, background: whiteAlpha(0.06), borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    width: `${confidencePct}%`, height: "100%", borderRadius: 3,
                    background: `linear-gradient(90deg, ${acc}88, ${acc})`,
                    boxShadow: `0 0 8px ${acc}44`,
                    transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 900, color: acc, fontFamily: "monospace", flexShrink: 0 }}>
                  {confidencePct}%
                </span>
              </div>
            )}
          </div>

          {/* Signature traits */}
          {topTraits.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 76, fontSize: 8.5, fontWeight: 900, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>
                {L.signature}
              </span>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {topTraits.map((t, i) => (
                  <span key={i} style={{
                    fontSize: 10, fontWeight: 900, padding: "3px 9px", borderRadius: 999,
                    background: dna.building ? whiteAlpha(0.04) : `${acc}14`,
                    border: `1px solid ${dna.building ? whiteAlpha(0.07) : `${acc}28`}`,
                    color: dna.building ? whiteAlpha(0.3) : acc,
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Studied fighters */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 76, fontSize: 8.5, fontWeight: 900, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>
              {L.studies}
            </span>
            {studiedFighters.length === 0 ? (
              <span style={{ fontSize: 11, fontWeight: 700, color: whiteAlpha(0.2) }}>{L.none}</span>
            ) : (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {studiedFighters.map((f) => (
                  <span key={f.id} style={{
                    fontSize: 10, fontWeight: 900, padding: "3px 9px", borderRadius: 999,
                    background: whiteAlpha(0.04), border: `1px solid ${whiteAlpha(0.09)}`,
                    color: whiteAlpha(0.55),
                  }}>
                    {f.name.split(" ").slice(-1)[0]}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Current experiment */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ width: 76, fontSize: 8.5, fontWeight: 900, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>
              {L.experiment}
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: currentExperiment ? GOLD : whiteAlpha(0.2) }}>
              {currentExperiment ? currentExperiment.fighterName : L.none}
            </span>
          </div>

          {/* Streak */}
          {streak > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ width: 76, fontSize: 8.5, fontWeight: 900, color: whiteAlpha(0.28), textTransform: "uppercase", letterSpacing: 1, flexShrink: 0 }}>
                {L.streak}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#FB923C", fontFamily: "monospace" }}>{streak}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: whiteAlpha(0.3) }}>{L.days}</span>
              </div>
            </div>
          )}
        </div>

        <PassportShareButton dna={dna} sessions={sessions} streak={streak} locale={locale} />
      </div>

      {/* Bottom watermark */}
      <div style={{ padding: "8px 18px 12px", borderTop: `1px solid ${dna.building ? whiteAlpha(0.03) : `${acc}12`}`, display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.1), textTransform: "uppercase" }}>GAVANA.APP</span>
        <span style={{ fontSize: 7.5, fontWeight: 700, color: whiteAlpha(0.08) }}>FIGHTER ID</span>
      </div>
    </div>
  );
}
