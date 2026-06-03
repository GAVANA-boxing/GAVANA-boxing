"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname } from "@/lib/i18n";
import { useCombatMemory } from "@/hooks/useCombatMemory";
import BottomNav from "@/components/BottomNav";
import CombatMemoryPanel from "@/components/profile/CombatMemoryPanel";
import FighterDNACard from "@/components/profile/FighterDNACard";
import { RED, GOLD, RADIUS, goldAlpha, whiteAlpha, BG, redAlpha } from "@/lib/tokens";
import { computeMovementProfile } from "@/lib/combatMemory";
import { deriveCombatIdentity } from "@/lib/combatIdentity";
import { computeFighterDNA, dnaSnapshot, classifyFighterArchetype, computePreliminarySignals } from "@/lib/fighterDNA";
import { computeCombatProgress, progressSnapshot } from "@/lib/combatProgress";
import CombatProgressCard from "@/components/profile/CombatProgressCard";
import { computeAggregatePunchPattern } from "@/lib/movementInsight";
import { FIGHTERS } from "@/lib/fighters";
import { TRAINING_PRESCRIPTIONS, ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const FP = {
  en: {
    back:            "Back",
    kicker:          "Fighter Intelligence",
    sessions:        "Sessions",
    avgScore:        "Avg Score",
    bestScore:       "Best Score",
    noSessions:      "Train to build your fighter identity.",
    earlyRead:       "Movement Identity · Early Read",
    earlyReadHint:   "Train more sessions to improve confidence.",
    identityEyebrow: "Movement identity",
    signalConf:      "Signal confidence",
    evolutionTitle:  "Movement profile · Evolution tracking",
  },
  mn: {
    back:            "Буцах",
    kicker:          "Тулаанчийн тагнуул",
    sessions:        "Тренинг",
    avgScore:        "Дундаж оноо",
    bestScore:       "Шилдэг оноо",
    noSessions:      "Тулаанчийн мөн чанараа бүрдүүлэхийн тулд бэлтгэл хий.",
    earlyRead:       "Хөдөлгөөний таних — эрт унших",
    earlyReadHint:   "Найдвартай байдлаа сайжруулахын тулд илүү session хий.",
    identityEyebrow: "Хөдөлгөөн дээр суурилсан мөн чанар",
    signalConf:      "Дохионы найдвартай байдал",
    evolutionTitle:  "Хөдөлгөөний профайл · Хөгжлийн хяналт",
  },
  ko: {
    back:            "뒤로",
    kicker:          "파이터 인텔리전스",
    sessions:        "세션",
    avgScore:        "평균 점수",
    bestScore:       "최고 점수",
    noSessions:      "파이터 정체성을 구축하려면 훈련하세요.",
    earlyRead:       "움직임 정체성 · 초기 분석",
    earlyReadHint:   "신뢰도 향상을 위해 더 많은 세션을 훈련하세요.",
    identityEyebrow: "움직임 기반 정체성",
    signalConf:      "신호 신뢰도",
    evolutionTitle:  "움직임 프로필 · 진화 추적",
  },
};

function CombatIdentitySection({ identity, sessionCount, locale }) {
  const s = FP[locale] || FP.en;
  if (sessionCount === 0) {
    return (
      <div style={{
        borderRadius: RADIUS.lg, padding: "16px 18px",
        background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`,
        marginBottom: 4,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: whiteAlpha(0.3), lineHeight: 1.5 }}>
          {s.noSessions}
        </p>
      </div>
    );
  }

  if (sessionCount < 3 || !identity) {
    return (
      <div style={{
        borderRadius: RADIUS.lg, padding: "16px 18px",
        background: whiteAlpha(0.025), border: `1px solid ${whiteAlpha(0.06)}`,
        marginBottom: 4,
      }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 6 }}>
          {s.earlyRead}
        </div>
        {identity && (
          <div style={{ fontSize: 17, fontWeight: 1000, color: whiteAlpha(0.6), letterSpacing: "-0.015em", fontFamily: "var(--font-display, 'Anton', sans-serif)", marginBottom: 6 }}>
            {identity.primary}
          </div>
        )}
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: whiteAlpha(0.3) }}>
          {s.earlyReadHint}
        </p>
      </div>
    );
  }

  const confidencePct = Math.round(identity.confidence * 100);

  return (
    <div style={{
      borderRadius: RADIUS.lg, padding: "18px 18px 14px",
      background: "rgba(255,255,255,0.022)",
      border: `1px solid ${whiteAlpha(0.07)}`,
      marginBottom: 4,
    }}>
      {/* Eyebrow */}
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 6 }}>
        {s.identityEyebrow}
      </div>

      {/* Primary identity */}
      <div style={{ fontSize: 22, fontWeight: 1000, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.0, fontFamily: "var(--font-display, 'Anton', sans-serif)", marginBottom: 10 }}>
        {identity.primary}
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: whiteAlpha(0.3), letterSpacing: 1, textTransform: "uppercase" }}>{(FP[locale] || FP.en).signalConf}</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: confidencePct >= 70 ? GOLD : whiteAlpha(0.45), fontFamily: "monospace" }}>
            {confidencePct}%
          </span>
        </div>
        <div style={{ height: 2, borderRadius: 2, background: whiteAlpha(0.07), overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${confidencePct}%`, borderRadius: 2,
            background: confidencePct >= 70 ? `linear-gradient(90deg, ${GOLD}80, ${GOLD})` : whiteAlpha(0.3),
            transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
          }} />
        </div>
      </div>

      {/* Secondary traits */}
      {identity.secondary.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {identity.secondary.map((trait, i) => (
            <span key={i} style={{
              fontSize: 9.5, fontWeight: 800,
              color: whiteAlpha(0.42),
              background: whiteAlpha(0.04),
              border: `1px solid ${whiteAlpha(0.07)}`,
              borderRadius: RADIUS.full,
              padding: "3px 10px",
            }}>
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCell({ value, label, accent }) {
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: RADIUS.md, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.06)}` }}>
      <div style={{
        fontSize: 20, fontWeight: 1000, lineHeight: 1, marginBottom: 4,
        color: accent || "#fff",
        fontFamily: "var(--font-display, 'Anton', sans-serif)",
      }}>
        {value}
      </div>
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

// ─── DNA Share Card ────────────────────────────────────────────────────────────
const SHARE_L = {
  en: { cta: "Share Your DNA", copied: "Copied!", similarTo: "Similar To" },
  mn: { cta: "ДНХ-гаа хуваалц", copied: "Хуулсан!", similarTo: "Ижил тулаанч" },
  ko: { cta: "DNA 공유", copied: "복사됨!", similarTo: "유사 파이터" },
};

function DNAShareCard({ dna, displayName, locale }) {
  const [copied, setCopied] = useState(false);
  if (dna.building || !dna.archetypeKey) return null;

  const acc = ARCH_TRAINING_COLORS[dna.archetypeKey] || GOLD;
  const L = SHARE_L[locale] || SHARE_L.en;
  const confidencePct = Math.round(dna.confidence * 100);
  const topStyles = Object.entries(dna.styleMix || {}).sort(([, a], [, b]) => b - a).slice(0, 3);
  const similarFighters = dna.recommendedFighters?.slice(0, 3) || [];

  async function handleShare() {
    const shareText = locale === "mn"
      ? `Миний тулаанчийн ДНХ: ${dna.archetype} (${confidencePct}%) — GAVANA 🥊`
      : locale === "ko"
      ? `내 파이터 DNA: ${dna.archetype} (${confidencePct}%) — GAVANA 🥊`
      : `My Fighter DNA: ${dna.archetype} (${confidencePct}% signal) — GAVANA 🥊`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "Fighter DNA — GAVANA", text: shareText }); return; }
      catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* silent */ }
  }

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Fighter DNA card — screenshot-worthy */}
      <div style={{
        borderRadius: 18, overflow: "hidden",
        background: `linear-gradient(155deg, rgba(6,6,8,0.96) 0%, ${acc}18 100%)`,
        border: `1px solid ${acc}40`,
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${acc}, ${acc}44, transparent)` }} />

        <div style={{ padding: "18px 20px 0" }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.25), textTransform: "uppercase" }}>
              GAVANA DNA
            </span>
            <span style={{ padding: "2px 9px", borderRadius: 999, background: `${acc}18`, border: `1px solid ${acc}35`, fontSize: 8, fontWeight: 900, color: acc, letterSpacing: 1 }}>
              {confidencePct}% SIGNAL
            </span>
          </div>

          {/* Fighter name (subtle) */}
          {displayName && (
            <div style={{ fontSize: 9.5, fontWeight: 800, color: whiteAlpha(0.28), letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>
              {displayName}
            </div>
          )}

          {/* BIG archetype name */}
          <div style={{
            fontSize: 36, fontWeight: 1000, color: "#fff", lineHeight: 1.0,
            fontFamily: "var(--font-display,'Anton',sans-serif)",
            textTransform: "uppercase", letterSpacing: "-0.02em",
            textShadow: `0 0 48px ${acc}66`,
            marginBottom: 20,
          }}>
            {dna.archetype}
          </div>

          {/* Style bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
            {topStyles.map(([key, val]) => {
              const c = ARCH_TRAINING_COLORS[key] || whiteAlpha(0.5);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 72, fontSize: 8.5, fontWeight: 900, letterSpacing: 1, color: whiteAlpha(0.3), textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>
                    {dna.styleLabels?.[key] || key}
                  </span>
                  <div style={{ flex: 1, height: 4, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(val / 10) * 100}%`, height: "100%", background: c, borderRadius: 2, boxShadow: `0 0 6px ${c}66` }} />
                  </div>
                  <span style={{ width: 28, textAlign: "right", fontSize: 11, fontWeight: 900, color: c, fontFamily: "monospace", flexShrink: 0 }}>
                    {val.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Similar fighters */}
          {similarFighters.length > 0 && (
            <div style={{ paddingBottom: 14, borderTop: `1px solid ${whiteAlpha(0.05)}`, paddingTop: 12 }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.22), textTransform: "uppercase", marginBottom: 7 }}>
                {L.similarTo}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {similarFighters.map((f) => (
                  <span key={f.id} style={{
                    fontSize: 10.5, fontWeight: 900, padding: "5px 12px", borderRadius: 999,
                    background: `${f.accent || acc}14`, border: `1px solid ${f.accent || acc}30`,
                    color: f.accent || acc,
                  }}>
                    {f.name.split(" ").slice(-1)[0]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GAVANA watermark */}
        <div style={{ padding: "8px 20px 12px", borderTop: `1px solid ${whiteAlpha(0.04)}`, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.15), textTransform: "uppercase" }}>GAVANA.APP</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: whiteAlpha(0.12) }}>{new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Share button */}
      <button type="button" onClick={handleShare} style={{
        width: "100%", marginTop: 8, padding: "12px 0", borderRadius: 12,
        background: copied ? "rgba(52,211,153,0.12)" : `${acc}12`,
        border: `1px solid ${copied ? "rgba(52,211,153,0.35)" : `${acc}35`}`,
        color: copied ? "#34D399" : acc,
        fontSize: 13, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s ease",
      }}>
        {copied
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        }
        {copied ? L.copied : L.cta}
      </button>
    </div>
  );
}

// ─── Identity Journey Map ──────────────────────────────────────────────────────
const JOURNEY_L = {
  en: { title: "IDENTITY JOURNEY", complete: "complete" },
  mn: { title: "МӨН ЧАНАРЫН ЗАМ", complete: "дууссан" },
  ko: { title: "아이덴티티 여정", complete: "완료" },
};

function IdentityJourneyStrip({ sessions, dna, studiedIds, currentExperiment, locale }) {
  const L = JOURNEY_L[locale] || JOURNEY_L.en;
  const expDays = currentExperiment?.startDate?.seconds
    ? Math.floor((Date.now() / 1000 - currentExperiment.startDate.seconds) / 86400)
    : 0;

  const STEPS = [
    {
      emoji: "🥊",
      labels: { en: "First Session", mn: "Анхны тренинг", ko: "첫 훈련" },
      done: sessions.length >= 1,
    },
    {
      emoji: "🔬",
      labels: { en: "DNA Analysis", mn: "ДНХ шинжилгээ", ko: "DNA 분석" },
      done: sessions.length >= 3,
    },
    {
      emoji: "📚",
      labels: { en: "Study Fighter", mn: "Тулаанч судалсан", ko: "파이터 학습" },
      done: studiedIds.length >= 1,
    },
    {
      emoji: "🧬",
      labels: { en: "Archetype Locked", mn: "Archetype баталгаажсан", ko: "아키타입 확정" },
      done: !dna.building && !!dna.archetypeKey,
    },
    {
      emoji: "⚗️",
      labels: { en: "Experiment", mn: "Туршилт эхэлсэн", ko: "실험 시작" },
      done: currentExperiment != null,
    },
    {
      emoji: "📖",
      labels: { en: "Study 3 Fighters", mn: "3 тулаанч судалсан", ko: "3명 학습" },
      done: studiedIds.length >= 3,
    },
    {
      emoji: "🔄",
      labels: { en: "Evolution Revealed", mn: "Хувьсал илэрсэн", ko: "진화 공개" },
      done: currentExperiment != null && expDays >= 7,
    },
    {
      emoji: "⚔️",
      labels: { en: "Study 5 Fighters", mn: "5 тулаанч судалсан", ko: "5명 학습" },
      done: studiedIds.length >= 5,
    },
  ];

  const completedCount = STEPS.filter((s) => s.done).length;
  const pct = Math.round((completedCount / STEPS.length) * 100);
  const currentIdx = STEPS.findIndex((s) => !s.done);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Header + progress bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.25), textTransform: "uppercase" }}>
          {L.title}
        </span>
        <span style={{ fontSize: 9, fontWeight: 900, color: pct >= 100 ? "#34D399" : GOLD }}>
          {pct}% {L.complete}
        </span>
      </div>
      <div style={{ height: 2, borderRadius: 1, background: whiteAlpha(0.06), overflow: "hidden", marginBottom: 10 }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: pct >= 100 ? "#34D399" : `linear-gradient(90deg, ${GOLD}80, ${GOLD})`,
          transition: "width 0.8s cubic-bezier(0.16,1,0.3,1)",
        }} />
      </div>

      {/* Steps — horizontal scroll */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {STEPS.map((step, i) => {
          const isCurrent = i === currentIdx;
          const label = step.labels[locale] || step.labels.en;
          return (
            <div key={i} style={{
              flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
              padding: "8px 10px", borderRadius: 10, minWidth: 66,
              background: step.done ? "rgba(52,211,153,0.07)" : isCurrent ? goldAlpha(0.07) : whiteAlpha(0.025),
              border: step.done
                ? "1px solid rgba(52,211,153,0.22)"
                : isCurrent
                ? `1px solid ${goldAlpha(0.35)}`
                : `1px solid ${whiteAlpha(0.05)}`,
            }}>
              <span style={{ fontSize: 17, lineHeight: 1, filter: step.done || isCurrent ? "none" : "grayscale(1) opacity(0.28)" }}>
                {step.done ? "✅" : step.emoji}
              </span>
              <span style={{
                fontSize: 7.5, fontWeight: 800, textAlign: "center", lineHeight: 1.35,
                color: step.done ? "#34D399" : isCurrent ? GOLD : whiteAlpha(0.22),
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Training Prescription Card ───────────────────────────────────────────────
const PRES_L = {
  en: { eyebrow: "TRAINING PRESCRIPTION", weeklyFocus: "THIS WEEK", trainCta: "Train Now →" },
  mn: { eyebrow: "БЭЛТГЭЛИЙН ЗААВАР", weeklyFocus: "ЭНЭ ДОЛОО ХОНОГ", trainCta: "Бэлтгэл хий →" },
  ko: { eyebrow: "훈련 처방", weeklyFocus: "이번 주", trainCta: "지금 훈련 →" },
};

function TrainingPrescriptionCard({ dna, locale, router }) {
  if (dna.building || !dna.archetypeKey) return null;
  const archKey = dna.archetypeKey;
  const prescription = TRAINING_PRESCRIPTIONS[archKey];
  if (!prescription) return null;
  const P = prescription[locale] || prescription.en;
  const acc = ARCH_TRAINING_COLORS[archKey] || GOLD;
  const L = PRES_L[locale] || PRES_L.en;

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: `1px solid ${acc}30`,
      background: `linear-gradient(135deg, ${acc}08 0%, rgba(0,0,0,0) 60%)`,
      marginBottom: 8,
    }}>
      {/* Header */}
      <div style={{ padding: "13px 16px 10px", borderBottom: `1px solid ${acc}18`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 3 }}>{L.eyebrow}</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{P.title}</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${acc}15`, border: `1px solid ${acc}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
          💊
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* 3 priorities */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {P.priorities.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: `${acc}18`, border: `1px solid ${acc}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 900, color: acc,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.72)", lineHeight: 1.45, paddingTop: 2 }}>
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Weekly focus */}
        <div style={{ padding: "10px 12px", borderRadius: 10, background: `${acc}12`, border: `1px solid ${acc}25`, marginBottom: 10 }}>
          <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 4 }}>
            ⚡ {L.weeklyFocus}
          </div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff", lineHeight: 1.4 }}>{P.weeklyFocus}</p>
        </div>

        {/* Train CTA */}
        <button
          type="button"
          onClick={() => router.push(`/${locale}/train`)}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 11,
            background: acc, border: "none",
            color: "#000", fontSize: 12, fontWeight: 900, letterSpacing: 1,
            textTransform: "uppercase", cursor: "pointer",
            boxShadow: `0 4px 20px ${acc}35`,
          }}
        >
          {L.trainCta}
        </button>
      </div>
    </div>
  );
}

// ─── Studied Fighters Tracker ─────────────────────────────────────────────────
const ARCH_LABELS = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Хөдлөгч", counter: "Тохой", explosive: "Тэсрэмтгий", technician: "Техникийн" },
  ko: { pressure: "압박", outboxer: "아웃복싱", counter: "카운터", explosive: "폭발력", technician: "기술" },
};
const ARCH_COLORS = {
  pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981",
};
const SF_L = {
  en: {
    eyebrow: "FIGHTER STUDY",
    studiedCount: (n) => `${n} fighter${n !== 1 ? "s" : ""} studied`,
    studyPattern: "Study pattern",
    yourDNA: "Your DNA",
    alignedWith: "Aligned ✓",
    gap: "Study gap",
    gapHint: (arch) => `Study more ${arch} fighters to round out your education`,
    noStudied: "Visit fighter profiles to start building your study record.",
    nextUp: "Study next",
    discoverCta: "Discover fighters →",
    unstudied: "unstudied",
  },
  mn: {
    eyebrow: "СУДЛАГДСАН ТУЛААНЧИД",
    studiedCount: (n) => `${n} тулаанч судалсан`,
    studyPattern: "Судлах хэв маяг",
    yourDNA: "Таны ДНХ",
    alignedWith: "Тохирч байна ✓",
    gap: "Судлах орон зай",
    gapHint: (arch) => `${arch} тулаанчдыг судалж бэлтгэлээ гүйцэтгэ`,
    noStudied: "Тулаанчийн профайлыг зочлон судалгааны бичлэгээ эхлүүл.",
    nextUp: "Дараагийнх",
    discoverCta: "Тулаанч хайх →",
    unstudied: "судлаагүй",
  },
  ko: {
    eyebrow: "파이터 스터디",
    studiedCount: (n) => `${n}명의 파이터 학습`,
    studyPattern: "학습 패턴",
    yourDNA: "나의 DNA",
    alignedWith: "일치 ✓",
    gap: "학습 격차",
    gapHint: (arch) => `${arch} 파이터를 더 연구해 학습을 완성하세요`,
    noStudied: "파이터 프로필을 방문하여 학습 기록을 시작하세요.",
    nextUp: "다음 학습",
    discoverCta: "파이터 탐색 →",
    unstudied: "미학습",
  },
};

function StudiedFightersPanel({ studiedIds, dna, locale, router }) {
  const L = SF_L[locale] || SF_L.en;
  const AL = ARCH_LABELS[locale] || ARCH_LABELS.en;

  const studiedFighters = FIGHTERS.filter((f) => studiedIds.includes(f.id));
  const unstudiedFighters = FIGHTERS.filter((f) => !studiedIds.includes(f.id));

  if (studiedFighters.length === 0) {
    return (
      <div style={{ borderRadius: 14, padding: "14px 16px", background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`, marginBottom: 8 }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 8 }}>{L.eyebrow}</div>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: whiteAlpha(0.3), lineHeight: 1.5 }}>{L.noStudied}</p>
      </div>
    );
  }

  // Tally archetype distribution of studied fighters
  const archCounts = { pressure: 0, outboxer: 0, counter: 0, explosive: 0, technician: 0 };
  for (const f of studiedFighters) {
    const arch = classifyFighterArchetype(f);
    archCounts[arch] = (archCounts[arch] || 0) + 1;
  }
  const totalStudied = studiedFighters.length;
  const archEntries = Object.entries(archCounts)
    .filter(([, c]) => c > 0)
    .sort(([, a], [, b]) => b - a);

  // DNA archetype key
  const userArchKey = dna?.building ? null : dna?.archetypeKey;

  // Gap: archetype with zero studied fighters (prefer ones relevant to DNA gaps)
  const allArchKeys = ["pressure", "outboxer", "counter", "explosive", "technician"];
  const gapArch = allArchKeys.find((k) => k !== userArchKey && archCounts[k] === 0);
  const gapFighters = gapArch ? unstudiedFighters.filter((f) => classifyFighterArchetype(f) === gapArch).slice(0, 2) : [];

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${whiteAlpha(0.07)}`, background: whiteAlpha(0.02), marginBottom: 8 }}>
      {/* Header */}
      <div style={{ padding: "13px 16px 10px", borderBottom: `1px solid ${whiteAlpha(0.05)}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.3), textTransform: "uppercase", marginBottom: 3 }}>{L.eyebrow}</div>
            <div style={{ fontSize: 12, fontWeight: 900, color: whiteAlpha(0.7) }}>{L.studiedCount(totalStudied)}</div>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/fighters`)}
            style={{ background: whiteAlpha(0.05), border: `1px solid ${whiteAlpha(0.1)}`, borderRadius: 8, padding: "5px 10px", color: whiteAlpha(0.45), fontSize: 9.5, fontWeight: 900, cursor: "pointer" }}
          >
            {L.discoverCta}
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* Fighter dots row */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          {studiedFighters.map((f) => {
            const arch = classifyFighterArchetype(f);
            const color = ARCH_COLORS[arch] || GOLD;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => router.push(`/${locale}/fighters/${f.id}`)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: `${color}18`, border: `2px solid ${color}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 900, color,
                }}>
                  {f.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <span style={{ fontSize: 8, fontWeight: 800, color: whiteAlpha(0.4), maxWidth: 42, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {f.name.split(" ").slice(-1)[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Archetype distribution bars */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.25), textTransform: "uppercase", marginBottom: 8 }}>{L.studyPattern}</div>
          {archEntries.map(([arch, count]) => {
            const pct = Math.round((count / totalStudied) * 100);
            const color = ARCH_COLORS[arch] || GOLD;
            const isUserArch = arch === userArchKey;
            return (
              <div key={arch} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ width: 64, fontSize: 9, fontWeight: 900, color: isUserArch ? color : whiteAlpha(0.32), textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>
                  {AL[arch]}
                </span>
                <div style={{ flex: 1, height: 4, background: whiteAlpha(0.05), borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: isUserArch ? color : whiteAlpha(0.2), borderRadius: 2, boxShadow: isUserArch ? `0 0 6px ${color}55` : "none" }} />
                </div>
                <span style={{ width: 28, textAlign: "right", fontSize: 9, fontWeight: 900, color: isUserArch ? color : whiteAlpha(0.3), fontFamily: "monospace", flexShrink: 0 }}>{pct}%</span>
                {isUserArch && (
                  <span style={{ fontSize: 8, fontWeight: 900, color, background: `${color}14`, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>{L.alignedWith}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Study gap recommendation */}
        {gapArch && gapFighters.length > 0 && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.07)}` }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.25), textTransform: "uppercase", marginBottom: 5 }}>{L.gap}</div>
            <p style={{ margin: "0 0 8px", fontSize: 11, color: whiteAlpha(0.45), lineHeight: 1.4 }}>
              {L.gapHint(AL[gapArch])}
            </p>
            <div style={{ display: "flex", gap: 6 }}>
              {gapFighters.map((f) => {
                const color = ARCH_COLORS[gapArch] || GOLD;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => router.push(`/${locale}/fighters/${f.id}`)}
                    style={{ flex: 1, padding: "7px 10px", borderRadius: 9, background: `${color}10`, border: `1px solid ${color}30`, color, fontSize: 10, fontWeight: 900, cursor: "pointer", textAlign: "left" }}
                  >
                    {f.name.split(" ").slice(-1)[0]}
                    <span style={{ fontSize: 8, color: whiteAlpha(0.3), display: "block", fontWeight: 700, marginTop: 1 }}>{L.unstudied}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Archetype Tribe Card ─────────────────────────────────────────────────────
const TRIBE_INFO = {
  pressure:   { en: { motto: "Forward. Always.", desc: "Break opponents with relentless pressure and volume." }, mn: { motto: "Урагш. Үргэлж.", desc: "Тасралтгүй дарамт, тооноор дайсныг дарна." }, ko: { motto: "전진. 항상.", desc: "끊임없는 프레셔와 볼륨으로 상대를 압도합니다." } },
  outboxer:   { en: { motto: "Control the distance.", desc: "Win with footwork, angles, and ring generalship." }, mn: { motto: "Зайг эзэмш.", desc: "Хөдөлгөөн, өнцөг, рингийн удирдлагаар ялна." }, ko: { motto: "거리를 지배하라.", desc: "풋워크, 앵글, 링 컨트롤로 승리합니다." } },
  counter:    { en: { motto: "Patient. Precise. Deadly.", desc: "Let them come — and make them pay." }, mn: { motto: "Тэвчээртэй. Нарийн. Аюултай.", desc: "Ирэхийг нь хүлээ — дараа нь шийтгэ." }, ko: { motto: "인내. 정확. 치명적.", desc: "오게 내버려 두고 — 대가를 치르게 하세요." } },
  explosive:  { en: { motto: "One shot. End it.", desc: "Explosive speed and power that changes fights instantly." }, mn: { motto: "Нэг цохилт. Дуусгана.", desc: "Тэсрэмтгий хурд, хүч — тулааныг нэн даруй өөрчилнэ." }, ko: { motto: "한 방. 끝내라.", desc: "폭발적인 스피드와 파워로 경기를 순식간에 바꿉니다." } },
  technician: { en: { motto: "Fundamentals win fights.", desc: "Systematic, precise, always in control." }, mn: { motto: "Үндэс нь тулаан ялна.", desc: "Системтэй, нарийн, үргэлж хяналтдаа." }, ko: { motto: "기본기가 승리를 만든다.", desc: "체계적이고 정확하며 항상 컨트롤 아래 있습니다." } },
};

function TribeCard({ archetypeKey, archetype, tribeCount, locale }) {
  if (!archetypeKey) return null;
  const acc = ARCH_TRAINING_COLORS[archetypeKey] || GOLD;
  const info = (TRIBE_INFO[archetypeKey]?.[locale] || TRIBE_INFO[archetypeKey]?.en) || {};
  const memberLabel = locale === "mn"
    ? `${tribeCount ?? "?"} тулаанч`
    : locale === "ko"
    ? `${tribeCount ?? "?"} 파이터`
    : `${tribeCount ?? "?"} fighter${tribeCount !== 1 ? "s" : ""}`;
  const tribeTitle = locale === "mn" ? "ТАНЫ ОВОГ АЙМАГ" : locale === "ko" ? "당신의 부족" : "YOUR TRIBE";
  const gavanaLabel = locale === "mn" ? "GAVANA дахь" : locale === "ko" ? "GAVANA 내" : "in GAVANA";

  return (
    <div style={{ borderRadius: RADIUS.lg, overflow: "hidden", border: `1px solid ${acc}30`, background: `${acc}08`, marginBottom: 8 }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${acc}88, transparent)` }} />
      <div style={{ padding: "14px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
            {tribeTitle}
          </span>
          <div style={{ padding: "3px 10px", borderRadius: 999, background: `${acc}15`, border: `1px solid ${acc}35`, fontSize: 8.5, fontWeight: 900, color: acc }}>
            {memberLabel} {gavanaLabel}
          </div>
        </div>

        {/* Archetype name + motto */}
        <div style={{ fontSize: 22, fontWeight: 1000, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1.0, marginBottom: 6 }}>
          {archetype}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: acc, marginBottom: 8, fontStyle: "italic" }}>
          "{info.motto}"
        </div>
        <div style={{ fontSize: 11, color: whiteAlpha(0.4), lineHeight: 1.5, fontWeight: 600 }}>
          {info.desc}
        </div>
      </div>
    </div>
  );
}

// ─── Tribe Activity Feed ─────────────────────────────────────────────────────
const TAF_L = {
  en: {
    title:      "TRIBE OVERVIEW",
    total:      (n) => `${n} fighter${n !== 1 ? "s" : ""}`,
    userBadge:  "YOU",
    feed:       "RECENT ACTIVITY",
    acts: [
      (arch, n) => `${n} ${arch} fighters in GAVANA`,
      (arch, n) => `${arch} tribe has ${n} member${n !== 1 ? "s" : ""}`,
      (arch, n) => `${n} ${arch} fighter${n !== 1 ? "s" : ""} building DNA`,
    ],
    growing:  (arch) => `${arch} tribe growing`,
    dominant: (arch) => `${arch} is the largest tribe`,
    empty:    "Be the first fighter in this tribe.",
  },
  mn: {
    title:      "ОВОГ АЙМГИЙН ТОЙМ",
    total:      (n) => `${n} тулаанч`,
    userBadge:  "ТА",
    feed:       "СҮҮЛИЙН ИДЭВХ",
    acts: [
      (arch, n) => `${n} ${arch} тулаанч GAVANA-д`,
      (arch, n) => `${arch} овог ${n} гишүүнтэй`,
      (arch, n) => `${n} ${arch} тулаанч ДНХ бүрдүүлж байна`,
    ],
    growing:  (arch) => `${arch} овог өсч байна`,
    dominant: (arch) => `${arch} хамгийн том овог`,
    empty:    "Энэ овгийн анхны тулаанч бол.",
  },
  ko: {
    title:      "부족 현황",
    total:      (n) => `${n}명`,
    userBadge:  "YOU",
    feed:       "최근 활동",
    acts: [
      (arch, n) => `GAVANA에 ${n}명의 ${arch} 파이터`,
      (arch, n) => `${arch} 부족 ${n}명`,
      (arch, n) => `${n}명의 ${arch}이 DNA 구축 중`,
    ],
    growing:  (arch) => `${arch} 부족 성장 중`,
    dominant: (arch) => `${arch}이 가장 큰 부족`,
    empty:    "이 부족의 첫 파이터가 되세요.",
  },
};

const ARCH_DISPLAY = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Аутбоксер", counter: "Контр", explosive: "Тэсрэлт", technician: "Техникч" },
  ko: { pressure: "프레셔", outboxer: "아웃복서", counter: "카운터", explosive: "폭발적", technician: "테크니션" },
};

function TribeActivityFeed({ allTribeCounts, userArchetype, locale }) {
  if (!allTribeCounts) return null;
  const L  = TAF_L[locale]  || TAF_L.en;
  const AD = ARCH_DISPLAY[locale] || ARCH_DISPLAY.en;
  const ARCH_KEYS = ["pressure", "outboxer", "counter", "explosive", "technician"];

  const total = ARCH_KEYS.reduce((s, k) => s + (allTribeCounts[k] || 0), 0);
  const sorted = [...ARCH_KEYS].sort((a, b) => (allTribeCounts[b] || 0) - (allTribeCounts[a] || 0));
  const maxCount = allTribeCounts[sorted[0]] || 1;
  const dominant = sorted[0];

  // Deterministic activity items using day seed
  const daySeed = Math.floor(Date.now() / 86400000);
  const feedItems = sorted.filter((k) => (allTribeCounts[k] || 0) > 0).slice(0, 3).map((arch, i) => {
    const n = allTribeCounts[arch] || 0;
    const actIdx = (daySeed + i) % L.acts.length;
    return { arch, text: L.acts[actIdx](AD[arch], n) };
  });

  // Dominant tribe notice
  const dominantNote = total > 0 ? (dominant === userArchetype ? L.growing(AD[dominant]) : L.dominant(AD[dominant])) : null;

  return (
    <div style={{ borderRadius: RADIUS.lg, overflow: "hidden", border: `1px solid ${whiteAlpha(0.07)}`, background: whiteAlpha(0.015), marginBottom: 8 }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${whiteAlpha(0.12)}, transparent)` }} />
      <div style={{ padding: "14px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
            {L.title}
          </span>
          <span style={{ fontSize: 9, fontWeight: 900, color: whiteAlpha(0.28), fontFamily: "monospace" }}>
            {total} total
          </span>
        </div>

        {/* Archetype bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          {sorted.map((arch) => {
            const n   = allTribeCounts[arch] || 0;
            const pct = maxCount > 0 ? (n / maxCount) * 100 : 0;
            const acc = ARCH_TRAINING_COLORS[arch] || GOLD;
            const isUser = arch === userArchetype;
            return (
              <div key={arch} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  width: 72, fontSize: 9, fontWeight: 900, letterSpacing: 0.8,
                  textTransform: "uppercase", flexShrink: 0, textAlign: "right",
                  color: isUser ? acc : whiteAlpha(0.32),
                }}>
                  {AD[arch]}
                </span>
                <div style={{ flex: 1, height: 5, background: whiteAlpha(0.05), borderRadius: 3, overflow: "hidden", position: "relative" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%", borderRadius: 3,
                    background: isUser ? acc : whiteAlpha(0.18),
                    boxShadow: isUser ? `0 0 8px ${acc}55` : "none",
                    transition: "width 0.9s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>
                <span style={{ width: 28, textAlign: "right", fontSize: 10, fontWeight: 900, color: isUser ? acc : whiteAlpha(0.3), fontFamily: "monospace", flexShrink: 0 }}>
                  {n}
                </span>
                {isUser && (
                  <span style={{ fontSize: 7.5, fontWeight: 900, color: acc, background: `${acc}18`, border: `1px solid ${acc}35`, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
                    {L.userBadge}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Activity feed */}
        {feedItems.length > 0 && (
          <div style={{ borderTop: `1px solid ${whiteAlpha(0.05)}`, paddingTop: 12 }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.2), textTransform: "uppercase", marginBottom: 8 }}>
              {L.feed}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {feedItems.map(({ arch, text }, i) => {
                const acc = ARCH_TRAINING_COLORS[arch] || GOLD;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: acc, flexShrink: 0, boxShadow: `0 0 5px ${acc}66` }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: whiteAlpha(0.48), lineHeight: 1.3 }}>
                      {text}
                    </span>
                  </div>
                );
              })}
              {dominantNote && (
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, flexShrink: 0, boxShadow: `0 0 5px ${GOLD}55` }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: whiteAlpha(0.38), lineHeight: 1.3 }}>
                    {dominantNote}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {total === 0 && (
          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: whiteAlpha(0.3), textAlign: "center", padding: "8px 0" }}>
            {L.empty}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── DNA Reveal Ceremony ──────────────────────────────────────────────────────
function DNARevealOverlay({ dna, locale, onDismiss }) {
  const [stage, setStage] = useState(0);
  const acc = ARCH_TRAINING_COLORS[dna.archetypeKey] || GOLD;
  const RV = {
    en: { label: "DNA REVEALED", dismiss: "Continue →" },
    mn: { label: "ДНХ ИЛЭРЛЭЭ", dismiss: "Үргэлжлүүл →" },
    ko: { label: "DNA 공개됨", dismiss: "계속 →" },
  };
  const L = RV[locale] || RV.en;

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 400);
    const t2 = setTimeout(() => setStage(2), 1100);
    const t3 = setTimeout(() => setStage(3), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const fade = (s) => ({ opacity: stage >= s ? 1 : 0, transition: "opacity 0.6s ease" });
  const rise = (s) => ({ opacity: stage >= s ? 1 : 0, transform: stage >= s ? "translateY(0)" : "translateY(22px)", transition: "opacity 0.7s ease, transform 0.7s ease" });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ ...fade(1), width: 72, height: 72, borderRadius: "50%", border: `2px solid ${acc}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: `0 0 48px ${acc}44`, fontSize: 32 }}>
        🧬
      </div>
      <div style={{ ...fade(1), fontSize: 9, fontWeight: 900, letterSpacing: 3, color: acc, textTransform: "uppercase", marginBottom: 12 }}>
        {L.label}
      </div>
      <div style={{ ...rise(2), fontSize: 38, fontWeight: 1000, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", fontFamily: "var(--font-display,'Anton',sans-serif)", textAlign: "center", lineHeight: 1.0, marginBottom: 14, textShadow: `0 0 48px ${acc}66` }}>
        {dna.archetype}
      </div>
      <p style={{ ...fade(3), fontSize: 13, color: "rgba(255,255,255,0.4)", textAlign: "center", lineHeight: 1.6, maxWidth: 280, margin: "0 0 40px" }}>
        {dna.summary}
      </p>
      <button type="button" onClick={onDismiss} style={{ ...fade(3), padding: "14px 40px", borderRadius: 14, background: `${acc}22`, border: `1px solid ${acc}55`, color: acc, fontSize: 14, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5 }}>
        {L.dismiss}
      </button>
    </div>
  );
}

// ─── DNA Evolution Card ───────────────────────────────────────────────────────
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

function DNAEvolutionCard({ sessions, locale }) {
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

// ─── DNA Freshness Warning ────────────────────────────────────────────────────
const FRESH_L = {
  en: {
    weak:    { label: "Signal Weakening",  hint: (n) => `${n} days without training. Your DNA signal is fading.` },
    degrade: { label: "Signal Degrading",  hint: (n) => `${n} days without training. DNA confidence is dropping.` },
    lost:    { label: "Signal Lost",       hint: (n) => `${n} days without training. Train to restore your signal.` },
    cta: "Train Now →",
  },
  mn: {
    weak:    { label: "Дохио суларч байна",  hint: (n) => `${n} хоног дасгал хийгээгүй. ДНХ дохио бүдгэрч байна.` },
    degrade: { label: "Дохио буурч байна",   hint: (n) => `${n} хоног дасгал хийгээгүй. ДНХ найдвартай байдал буурч байна.` },
    lost:    { label: "Дохио алдагдлаа",     hint: (n) => `${n} хоног дасгал хийгээгүй. Сэргээхийн тулд дасгал хий.` },
    cta: "Одоо дасгал хий →",
  },
  ko: {
    weak:    { label: "신호 약화 중",  hint: (n) => `${n}일 동안 훈련하지 않았습니다. DNA 신호가 희미해지고 있습니다.` },
    degrade: { label: "신호 저하 중",  hint: (n) => `${n}일 동안 훈련하지 않았습니다. DNA 신뢰도가 떨어지고 있습니다.` },
    lost:    { label: "신호 손실",     hint: (n) => `${n}일 동안 훈련하지 않았습니다. 신호를 복구하려면 훈련하세요.` },
    cta: "지금 훈련하기 →",
  },
};

// ─── DNA Confidence Timeline ──────────────────────────────────────────────────
const TL_L = {
  en: { title: "DNA Confidence · Timeline", sessionStart: "S1", archSwitch: "Archetype shift", current: "Current" },
  mn: { title: "ДНХ найдвартай байдал · Хэлхээ", sessionStart: "T1", archSwitch: "Archetype өөрчлөлт", current: "Одоо" },
  ko: { title: "DNA 신뢰도 · 타임라인", sessionStart: "S1", archSwitch: "아키타입 전환", current: "현재" },
};

const ARCH_NAMES = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт", outboxer: "Аутбоксер", counter: "Контр", explosive: "Тэсрэлт", technician: "Техникч" },
  ko: { pressure: "프레셔", outboxer: "아웃복서", counter: "카운터", explosive: "폭발적", technician: "테크니션" },
};

function DNATimelineCard({ sessions, locale }) {
  const L = TL_L[locale] || TL_L.en;
  const names = ARCH_NAMES[locale] || ARCH_NAMES.en;

  const sorted = [...sessions].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
  if (sorted.length < 3) return null;

  // Sample up to 15 checkpoints
  const MAX = 15;
  const step = Math.max(1, Math.ceil(sorted.length / MAX));
  const indices = [];
  for (let i = step - 1; i < sorted.length; i += step) indices.push(i);
  if (indices[indices.length - 1] !== sorted.length - 1) indices.push(sorted.length - 1);

  const snapshots = indices.map((idx) => {
    const d = computeFighterDNA({ sessions: sorted.slice(0, idx + 1), locale });
    return {
      n: idx + 1,
      conf: d.building ? 0 : Math.round((d.confidence || 0) * 100),
      arch: d.building ? null : d.archetypeKey,
    };
  });

  const last = snapshots[snapshots.length - 1];
  const currentColor = ARCH_TRAINING_COLORS[last?.arch] || GOLD;
  const W = 260, H = 52;

  const pts = snapshots.map((s, i) => {
    const x = snapshots.length < 2 ? W / 2 : (i / (snapshots.length - 1)) * W;
    const y = H - (s.conf / 100) * H;
    return [x, y];
  });
  const polyline = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = [`0,${H}`, ...pts.map(([x, y]) => `${x},${y}`), `${W},${H}`].join(" ");

  // Detect archetype transitions
  const transitions = [];
  let prev = null;
  snapshots.forEach((s, i) => {
    if (s.arch && s.arch !== prev) { transitions.push(i); prev = s.arch; }
  });

  return (
    <div style={{
      borderRadius: RADIUS.lg, overflow: "hidden",
      border: `1px solid ${whiteAlpha(0.07)}`,
      background: whiteAlpha(0.022),
      marginBottom: 8,
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${currentColor}88, transparent)` }} />
      <div style={{ padding: "14px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
            {L.title}
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: currentColor, fontFamily: "monospace" }}>
              {last.conf}%
            </span>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: whiteAlpha(0.3), textTransform: "uppercase" }}>
              {L.current}
            </span>
          </div>
        </div>

        {/* SVG Sparkline */}
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id="tl-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentColor} stopOpacity={0.18} />
              <stop offset="100%" stopColor={currentColor} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          {/* Subtle grid lines at 25/50/75% */}
          {[25, 50, 75].map((pct) => (
            <line key={pct} x1={0} x2={W} y1={H - (pct / 100) * H} y2={H - (pct / 100) * H}
              stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="3 4" />
          ))}
          {/* Area fill */}
          <polyline points={area} fill="url(#tl-fill)" stroke="none" />
          {/* Confidence line */}
          <polyline points={polyline} fill="none" stroke={currentColor} strokeWidth={1.8}
            strokeLinejoin="round" strokeLinecap="round" opacity={0.75} />
          {/* Archetype transition dots */}
          {transitions.map((i) => {
            const [x, y] = pts[i];
            const c = ARCH_TRAINING_COLORS[snapshots[i].arch] || GOLD;
            return <circle key={i} cx={x} cy={y} r={3.5} fill={c} stroke="rgba(0,0,0,0.5)" strokeWidth={1} />;
          })}
          {/* Current (last) dot */}
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]}
            r={4.5} fill={currentColor} stroke="rgba(0,0,0,0.6)" strokeWidth={1.5} />
        </svg>

        {/* X-axis labels */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: whiteAlpha(0.2) }}>{L.sessionStart}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: whiteAlpha(0.2) }}>S{sorted.length}</span>
        </div>

        {/* Archetype shift legend — only show if changed */}
        {transitions.length > 1 && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${whiteAlpha(0.05)}` }}>
            <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.2), textTransform: "uppercase", marginBottom: 6 }}>
              {L.archSwitch}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {transitions.map((i) => {
                const arch = snapshots[i].arch;
                const color = ARCH_TRAINING_COLORS[arch] || GOLD;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 9, fontWeight: 800, color: whiteAlpha(0.45) }}>
                      {names[arch] || arch}
                    </span>
                    <span style={{ fontSize: 8, color: whiteAlpha(0.2), fontWeight: 700 }}>
                      @S{snapshots[i].n}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Evolution Reveal — post-experiment punch pattern comparison ──────────────
const EVO_L = {
  en: {
    eyebrow:       "EXPERIMENT COMPLETE",
    subtitle:      (n) => `${n}-day experiment finished`,
    baseline:      "Before",
    current:       "After",
    jab:           "Jab",
    cross:         "Cross",
    hook:          "Hook",
    noData:        "Train more sessions to see evolution",
    newExp:        "Try New Experiment",
    continueStyle: "Continue This Style",
    viewFighter:   "View Fighter →",
    adoptionLabel: "Style Adoption",
    sessionsIn:    (n) => `${n} session${n !== 1 ? "s" : ""} during experiment`,
    verdict: {
      strong:   { label: "Strong Adoption 🔥",   rec: "This archetype fits you. Keep training with this style." },
      moderate: { label: "Moderate Influence ⚡", rec: "Some shift detected. More sessions will reveal the impact." },
      minimal:  { label: "Minimal Shift 💡",      rec: "No major change yet. Try a different fighter or more sessions." },
    },
    dominantShift: (punch, pct, name) => `Your ${punch} increased ${pct}% — ${name} influence detected`,
    noShift:       (name) => `Style experiment with ${name} complete`,
  },
  mn: {
    eyebrow:       "ТУРШИЛТ ДУУССАН",
    subtitle:      (n) => `${n} өдрийн туршилт дууслаа`,
    baseline:      "Өмнө",
    current:       "Одоо",
    jab:           "Жааб",
    cross:         "Кросс",
    hook:          "Хук",
    noData:        "Хөгжлийг харахын тулд илүү тренинг хий",
    newExp:        "Шинэ туршилт хий",
    continueStyle: "Энэ хэв маягаар үргэлжлүүл",
    viewFighter:   "Тулаанчийг харах →",
    adoptionLabel: "Хэв маягийн нөлөө",
    sessionsIn:    (n) => `Туршилтын ${n} тренинг`,
    verdict: {
      strong:   { label: "Хүчтэй нөлөө 🔥",    rec: "Энэ archetype тантай нийцэж байна. Үргэлжлүүл." },
      moderate: { label: "Дунд зэргийн нөлөө ⚡", rec: "Зарим өөрчлөлт илэрлээ. Илүү тренинг хийгээрэй." },
      minimal:  { label: "Бага зэрэг нөлөө 💡",  rec: "Том өөрчлөлт байхгүй. Өөр тулаанч туршиж үз." },
    },
    dominantShift: (punch, pct, name) => `Таны ${punch} ${pct}%-иар нэмэгдсэн — ${name}-ийн нөлөө илрэв`,
    noShift:       (name) => `${name}-тай хэв маягийн туршилт дууслаа`,
  },
  ko: {
    eyebrow:       "실험 완료",
    subtitle:      (n) => `${n}일 실험 완료`,
    baseline:      "이전",
    current:       "이후",
    jab:           "잽",
    cross:         "크로스",
    hook:          "훅",
    noData:        "진화를 보려면 더 많이 훈련하세요",
    newExp:        "새 실험 시작",
    continueStyle: "이 스타일 계속하기",
    viewFighter:   "파이터 보기 →",
    adoptionLabel: "스타일 흡수도",
    sessionsIn:    (n) => `실험 중 ${n}개 세션`,
    verdict: {
      strong:   { label: "강한 흡수 🔥",     rec: "이 아키타입이 잘 맞습니다. 계속 훈련하세요." },
      moderate: { label: "중간 영향 ⚡",      rec: "일부 변화가 감지됐습니다. 더 많이 훈련해 보세요." },
      minimal:  { label: "미미한 변화 💡",    rec: "아직 큰 변화 없음. 다른 파이터나 더 많은 세션을 시도해 보세요." },
    },
    dominantShift: (punch, pct, name) => `${punch}이 ${pct}% 증가 — ${name} 스타일 영향 감지`,
    noShift:       (name) => `${name} 스타일 실험 완료`,
  },
};

function EvolutionRevealPanel({ experiment, sessions, locale, router, onClearExperiment }) {
  const L = EVO_L[locale] || EVO_L.en;
  const acc = experiment.fighterAccent || "#F5C451";
  const startSec = experiment.startDate?.seconds || 0;
  const daysElapsed = Math.floor((Date.now() / 1000 - startSec) / 86400);

  const expSessions = sessions.filter((s) => (s.createdAt?.seconds || 0) > startSec);
  const currentPattern = computeAggregatePunchPattern(expSessions);
  const baseline = experiment.baselinePunchPct;

  const punches = [
    { key: "jab",   label: L.jab,   color: "#3B82F6", basePct: baseline?.jabPct,   nowPct: currentPattern?.jabPct   },
    { key: "cross", label: L.cross, color: "#EF4444", basePct: baseline?.crossPct, nowPct: currentPattern?.crossPct },
    { key: "hook",  label: L.hook,  color: "#8B5CF6", basePct: baseline?.hookPct,  nowPct: currentPattern?.hookPct  },
  ];

  const shifts = punches.map((p) => ({
    ...p,
    delta: (p.nowPct != null && p.basePct != null) ? p.nowPct - p.basePct : null,
  }));
  const topShift = shifts.filter((s) => s.delta != null).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const insight = topShift?.delta != null && Math.abs(topShift.delta) >= 5
    ? L.dominantShift(topShift.label.toLowerCase(), topShift.delta > 0 ? `+${topShift.delta}` : topShift.delta, experiment.fighterName)
    : L.noShift(experiment.fighterName);

  // Adoption score: avg absolute shift (0–10 per punch * 3 punches) + session bonus
  const validShifts = shifts.filter((s) => s.delta != null);
  const avgAbsShift = validShifts.length > 0
    ? validShifts.reduce((a, s) => a + Math.abs(s.delta), 0) / validShifts.length
    : 0;
  const sessionBonus = Math.min(20, expSessions.length * 4);
  const adoptionScore = Math.min(100, Math.round(avgAbsShift * 3.5 + sessionBonus));
  const verdictKey = adoptionScore >= 65 ? "strong" : adoptionScore >= 35 ? "moderate" : "minimal";
  const verdict = L.verdict[verdictKey];
  const adoptionColor = adoptionScore >= 65 ? "#34D399" : adoptionScore >= 35 ? GOLD : "#94A3B8";

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: `1px solid ${acc}40`,
      background: `linear-gradient(135deg, ${acc}0c 0%, rgba(0,0,0,0) 60%)`,
      marginBottom: 8,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${acc}20` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚗️</span>
            <div>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 2 }}>
                {L.eyebrow}
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{experiment.fighterName}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                {L.subtitle(daysElapsed)} · {L.sessionsIn(expSessions.length)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/fighters/${experiment.fighterId}`)}
            style={{ background: `${acc}18`, border: `1px solid ${acc}35`, borderRadius: 8, padding: "5px 10px", color: acc, fontSize: 9.5, fontWeight: 900, cursor: "pointer" }}
          >
            {L.viewFighter}
          </button>
        </div>

        {/* Adoption score bar */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              {L.adoptionLabel}
            </span>
            <span style={{ fontSize: 16, fontWeight: 900, color: adoptionColor, fontFamily: "monospace" }}>
              {adoptionScore}%
            </span>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${adoptionScore}%`, borderRadius: 4,
              background: `linear-gradient(90deg, ${adoptionColor}88, ${adoptionColor})`,
              boxShadow: `0 0 8px ${adoptionColor}55`,
              transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
          <div style={{ marginTop: 7, fontSize: 11, fontWeight: 800, color: adoptionColor }}>{verdict.label}</div>
          <div style={{ marginTop: 2, fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.38)", lineHeight: 1.4 }}>{verdict.rec}</div>
        </div>
      </div>

      {/* Punch comparison bars */}
      <div style={{ padding: "12px 16px" }}>
        {!currentPattern && (
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{L.noData}</p>
        )}

        {currentPattern && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 36, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>{L.baseline}</span>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>{L.current}</span>
              </div>
              <span style={{ width: 38, flexShrink: 0 }} />
            </div>

            {punches.map(({ key, label, color, basePct, nowPct }) => {
              const delta = (nowPct != null && basePct != null) ? nowPct - basePct : null;
              const deltaStr = delta == null ? "" : delta > 0 ? `+${delta}%` : `${delta}%`;
              const deltaColor = delta == null ? "transparent" : delta > 0 ? "#34D399" : delta < 0 ? "#F87171" : "rgba(255,255,255,0.3)";
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 36, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>
                    {label}
                  </span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    {basePct != null && (
                      <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${basePct}%`, height: "100%", background: "rgba(255,255,255,0.22)", borderRadius: 2 }} />
                      </div>
                    )}
                    {nowPct != null && (
                      <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${nowPct}%`, height: "100%", background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}55` }} />
                      </div>
                    )}
                    {basePct == null && nowPct == null && (
                      <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }} />
                    )}
                  </div>
                  <div style={{ width: 38, textAlign: "right", fontSize: 10, fontWeight: 900, color: deltaColor, fontFamily: "monospace", flexShrink: 0 }}>
                    {deltaStr || (nowPct != null ? `${nowPct}%` : "—")}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Insight line */}
        <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 10, background: `${acc}10`, border: `1px solid ${acc}20` }}>
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>
            {insight}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/fighters/${experiment.fighterId}`)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 10,
              background: `${acc}18`, border: `1px solid ${acc}40`,
              color: acc, fontSize: 11, fontWeight: 900, cursor: "pointer",
            }}
          >
            {L.continueStyle}
          </button>
          <button
            type="button"
            onClick={onClearExperiment}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 900, cursor: "pointer",
            }}
          >
            {L.newExp}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FighterProfilePage() {
  const router   = useRouter();
  const pathname = usePathname();
  const locale   = getLocaleFromPathname(pathname);
  const { user, loading: authLoading } = useAuth();
  const { sessions, tendency, trends, loading } = useCombatMemory({ user });
  const profile  = computeMovementProfile(sessions);
  const identity = profile ? deriveCombatIdentity(profile, sessions) : null;
  const dna      = computeFighterDNA({ sessions, locale });
  const progress = computeCombatProgress({ sessions, streakDays: 0, locale });
  const dnaSavedRef       = useRef(false);
  const progressSavedRef  = useRef(false);
  const [currentExperiment, setCurrentExperiment] = useState(null);
  const [studiedFighterIds, setStudiedFighterIds] = useState([]);
  const [tribeCount, setTribeCount] = useState(null);
  const [allTribeCounts, setAllTribeCounts] = useState(null);
  const [dnaRevealVisible, setDnaRevealVisible] = useState(false);
  const dnaRevealShownRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  // Load currentExperiment + tribe count
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { doc, getDoc, collection, getDocs, query, where } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDoc(doc(db, "users", user.uid));
        if (active && snap.exists()) {
          const data = snap.data();
          setCurrentExperiment(data.currentExperiment || null);
          setStudiedFighterIds(data.studiedFighters || []);
        }
        // Tribe counts — query all 5 archetypes in parallel
        const ARCH_KEYS = ["pressure", "outboxer", "counter", "explosive", "technician"];
        const archSnaps = await Promise.all(
          ARCH_KEYS.map((arch) =>
            getDocs(query(collection(db, "users"), where("fighterDNA.archetypeKey", "==", arch)))
          )
        );
        if (active) {
          const counts = {};
          ARCH_KEYS.forEach((arch, i) => { counts[arch] = archSnaps[i].size; });
          setAllTribeCounts(counts);
          if (!dna.building && dna.archetypeKey) {
            setTribeCount(counts[dna.archetypeKey] ?? 0);
          }
        }
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid, dna.archetypeKey, dna.building]);

  async function clearExperiment() {
    if (!user?.uid) return;
    try {
      const { doc, updateDoc, deleteField } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await updateDoc(doc(db, "users", user.uid), { currentExperiment: deleteField() });
      setCurrentExperiment(null);
    } catch { /* silent */ }
  }

  // DNA Reveal Ceremony — show once, first time archetype confirms
  useEffect(() => {
    if (loading || !user?.uid || dna.building) return;
    if (dnaRevealShownRef.current) return;
    dnaRevealShownRef.current = true;
    const key = `gavana_dna_reveal_${user.uid}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, "1");
      setDnaRevealVisible(true);
    }
  }, [loading, dna.building, user?.uid]);

  // Persist DNA to Firestore once per page load after sessions settle
  useEffect(() => {
    if (loading || dnaSavedRef.current || !user?.uid || dna.building) return;
    dnaSavedRef.current = true;
    const snap = dnaSnapshot(dna);
    if (!snap) return;
    (async () => {
      try {
        const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await setDoc(doc(db, "users", user.uid), { fighterDNA: snap, fighterDnaUpdatedAt: serverTimestamp() }, { merge: true });
      } catch { /* non-critical */ }
    })();
  }, [loading, user?.uid, dna.building]);

  // Persist combat progress to Firestore once per page load
  useEffect(() => {
    if (loading || progressSavedRef.current || !user?.uid || progress.building) return;
    progressSavedRef.current = true;
    const snap = progressSnapshot(progress);
    if (!snap) return;
    (async () => {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await setDoc(doc(db, "users", user.uid), { combatProgress: snap }, { merge: true });
      } catch { /* non-critical */ }
    })();
  }, [loading, user?.uid, progress.building]);

  if (authLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: BG }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${whiteAlpha(0.07)}`, borderTopColor: RED, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }
  if (!user) return null;

  // Aggregate stats from loaded sessions
  const totalSessions = sessions.length;
  const avgScore = totalSessions
    ? (sessions.reduce((a, s) => a + (s.score || 0), 0) / totalSessions).toFixed(1)
    : "—";
  const bestScore = totalSessions
    ? Math.max(...sessions.map((s) => s.score || 0)).toFixed(1)
    : "—";
  const displayName = user.displayName || user.email?.split("@")[0] || "FIGHTER";

  return (
    <main style={{
      minHeight: "100dvh",
      background: BG,
      paddingBottom: "calc(100px + max(env(safe-area-inset-bottom), 16px))",
    }}>

      {/* ── Hero header ─────────────────────────────────────────── */}
      <div style={{
        padding: "0 20px",
        background: `radial-gradient(ellipse at 50% 0%, rgba(255,59,48,0.07) 0%, transparent 65%)`,
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}>
        {/* Back */}
        <div style={{ paddingTop: 16 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "none",
              color: whiteAlpha(0.4), cursor: "pointer",
              padding: "8px 0", fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
            }}
            aria-label="Back"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {(FP[locale] || FP.en).back}
          </button>
        </div>

        {/* Kicker */}
        <p style={{ margin: "20px 0 6px", fontSize: 9, fontWeight: 900, letterSpacing: 2, color: goldAlpha(0.55), textTransform: "uppercase" }}>
          {(FP[locale] || FP.en).kicker}
        </p>

        {/* Name */}
        <h1 style={{
          margin: "0 0 3px", fontSize: 30, fontWeight: 1000,
          letterSpacing: "-0.025em", color: "#fff", lineHeight: 1.0,
          fontFamily: "var(--font-display, 'Anton', sans-serif)",
          textTransform: "uppercase",
        }}>
          {displayName}
        </h1>

        {/* Tendency subtitle — shows once loaded */}
        <p style={{ margin: "0 0 20px", fontSize: 11, color: whiteAlpha(0.3), fontWeight: 700 }}>
          {tendency ? tendency.title : (FP[locale] || FP.en).evolutionTitle}
        </p>

        {/* Stats row */}
        {!loading && (() => { const fp = FP[locale] || FP.en; return (
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <StatCell value={totalSessions || "0"} label={fp.sessions} />
            <StatCell value={avgScore}            label={fp.avgScore} accent={whiteAlpha(0.85)} />
            <StatCell value={bestScore}           label={fp.bestScore} accent={totalSessions ? GOLD : whiteAlpha(0.3)} />
          </div>
        ); })()}

        {/* Divider */}
        <div style={{ height: 1, background: whiteAlpha(0.05), marginBottom: 16 }} />

        {/* Identity Journey Map */}
        {!loading && (
          <IdentityJourneyStrip
            sessions={sessions}
            dna={dna}
            studiedIds={studiedFighterIds}
            currentExperiment={currentExperiment}
            locale={locale}
          />
        )}

        {/* Combat Identity */}
        {!loading && (
          <CombatIdentitySection identity={identity} sessionCount={sessions.length} locale={locale} />
        )}

        {/* Evolution Reveal — shown when experiment is complete (7+ days) */}
        {!loading && currentExperiment && (() => {
          const startSec = currentExperiment.startDate?.seconds || 0;
          const daysElapsed = Math.floor((Date.now() / 1000 - startSec) / 86400);
          if (daysElapsed < 7) return null;
          return (
            <EvolutionRevealPanel
              experiment={currentExperiment}
              sessions={sessions}
              locale={locale}
              router={router}
              onClearExperiment={clearExperiment}
            />
          );
        })()}

        {/* DNA Freshness Warning */}
        {!loading && sessions.length > 0 && (() => {
          const lastSec = Math.max(...sessions.map((s) => s.createdAt?.seconds || 0));
          const days = Math.floor((Date.now() / 1000 - lastSec) / 86400);
          if (days < 5) return null;
          const FL = FRESH_L[locale] || FRESH_L.en;
          const level = days >= 14 ? FL.lost : days >= 8 ? FL.degrade : FL.weak;
          const color = days >= 14 ? "#EF4444" : days >= 8 ? "#FB923C" : "#F59E0B";
          return (
            <div style={{
              borderRadius: RADIUS.lg, padding: "12px 14px", marginBottom: 8,
              background: `${color}0a`, border: `1px solid ${color}30`,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color, marginBottom: 3 }}>
                  {level.label}
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                  {level.hint(days)}
                </div>
              </div>
              <button type="button" onClick={() => router.push(`/${locale}/train`)} style={{
                flexShrink: 0, padding: "7px 12px", borderRadius: 10,
                background: `${color}18`, border: `1px solid ${color}40`,
                color, fontSize: 10.5, fontWeight: 900, cursor: "pointer",
              }}>
                {FL.cta}
              </button>
            </div>
          );
        })()}

        {/* Fighter DNA */}
        {!loading && (
          <div style={{ marginBottom: 4 }}>
            <FighterDNACard dna={{ ...dna, prelim: dna.building ? computePreliminarySignals(sessions) : undefined }} locale={locale} />
          </div>
        )}

        {/* DNA Confidence Timeline */}
        {!loading && sessions.length >= 3 && (
          <DNATimelineCard sessions={sessions} locale={locale} />
        )}

        {/* DNA Evolution — Before vs Now comparison (6+ sessions) */}
        {!loading && sessions.length >= 6 && (
          <DNAEvolutionCard sessions={sessions} locale={locale} />
        )}

        {/* DNA Share Card — shown when archetype is confirmed */}
        {!loading && !dna.building && (
          <DNAShareCard dna={dna} displayName={displayName} locale={locale} />
        )}

        {/* Archetype Tribe */}
        {!loading && !dna.building && (
          <TribeCard
            archetypeKey={dna.archetypeKey}
            archetype={dna.archetype}
            tribeCount={tribeCount}
            locale={locale}
          />
        )}

        {/* Tribe Activity Feed */}
        {!loading && allTribeCounts && (
          <TribeActivityFeed
            allTribeCounts={allTribeCounts}
            userArchetype={dna.building ? null : dna.archetypeKey}
            locale={locale}
          />
        )}

        {/* Combat Progress */}
        {!loading && (
          <CombatProgressCard progress={progress} locale={locale} />
        )}

        {/* Training Prescription — shown when DNA archetype is confirmed */}
        {!loading && !dna.building && (
          <TrainingPrescriptionCard dna={dna} locale={locale} router={router} />
        )}

        {/* Studied Fighters Tracker */}
        {!loading && (
          <StudiedFightersPanel studiedIds={studiedFighterIds} dna={dna} locale={locale} router={router} />
        )}
      </div>

      {/* ── Panel ───────────────────────────────────────────────── */}
      <div style={{ padding: "0 20px" }}>
        <CombatMemoryPanel
          sessions={sessions}
          tendency={tendency}
          trends={trends}
          loading={loading}
          onTrain={() => router.push(`/${locale}/train`)}
        />
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />

      {/* DNA Reveal Ceremony — shown once when archetype first confirms */}
      {dnaRevealVisible && !dna.building && (
        <DNARevealOverlay
          dna={dna}
          locale={locale}
          onDismiss={() => setDnaRevealVisible(false)}
        />
      )}
    </main>
  );
}
