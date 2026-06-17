"use client";

import { useState } from "react";
import { RED, GOLD, PURPLE, RADIUS, redAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";

const ORANGE = "#FB923C";

// ─── Difficulty ────────────────────────────────────────────────────────────────
const DIFF_COLOR = {
  beginner:     "#10B981",
  intermediate: "#F59E0B",
  advanced:     "#F87171",
};

const DIFF_LABEL = {
  beginner:     { en: "BEGINNER",     mn: "АНХАН",  ko: "초급" },
  intermediate: { en: "INTERMEDIATE", mn: "ДУНД",   ko: "중급" },
  advanced:     { en: "ADVANCED",     mn: "АХИСАН", ko: "고급" },
};

// ─── Teaching block labels ─────────────────────────────────────────────────────
const BLOCK_LABEL = {
  FOOT:   { en: "FOOT POSITION",    mn: "ХӨЛИЙН БАЙРЛАЛ",     ko: "발 위치" },
  WEIGHT: { en: "WEIGHT TRANSFER",  mn: "ЖИНГИЙН ШИЛЖИЛТ",    ko: "체중 이동" },
  ANGLE:  { en: "ANGLE / PATH",     mn: "ӨНЦӨГ / ЗАМ",        ko: "각도 / 경로" },
  GUARD:  { en: "GUARD LINE",       mn: "ХАМГААЛАЛТЫН ШУГАМ",  ko: "가드 라인" },
};

const SECTION_LABELS = {
  whyItWorks:    { en: "Why it works",     mn: "Яагаад ажилладаг вэ", ko: "왜 효과적인가" },
  feelThis:      { en: "Feel This",        mn: "Мэдрэмж",              ko: "느낌" },
  commonMistake: { en: "Common Mistake",   mn: "Нийтлэг алдаа",        ko: "흔한 실수" },
  coachCue:      { en: "Coach Cue",        mn: "Коучийн зөвлөгөө",     ko: "코치 조언" },
  drillSteps:    { en: "Drill Steps",      mn: "Дасгалын алхамууд",    ko: "드릴 단계" },
  drillThis:     { en: "DRILL THIS",       mn: "ДАСГАЛ ХИЙХ",          ko: "드릴 시작" },
};

// ─── Teaching block icons ──────────────────────────────────────────────────────
function BlockIcon({ type, color, size = 12 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "FOOT")   return <svg {...p}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
  if (type === "WEIGHT") return <svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
  if (type === "ANGLE")  return <svg {...p}><polyline points="15 10 20 15 15 20"/><path d="M4 4h7a9 9 0 0 1 9 9v2"/></svg>;
  if (type === "GUARD")  return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
}

// ─── Section divider ──────────────────────────────────────────────────────────
function SectionDivider({ label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
      <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}

// ─── Info block (feel / mistake / coach) ──────────────────────────────────────
function CueBlock({ icon, label, color, italic = false, children }) {
  return (
    <div style={{
      padding: "9px 11px",
      background: `${color}09`, border: `1px solid ${color}1e`,
      borderLeft: `2px solid ${color}`,
      borderRadius: "2px 8px 8px 2px",
      marginBottom: 9,
      display: "flex", alignItems: "flex-start", gap: 8,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 7, fontWeight: 900, color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
          {label}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.62)", lineHeight: 1.55, fontStyle: italic ? "italic" : "normal" }}>
          {children}
        </p>
      </div>
    </div>
  );
}

// ─── Icon constants for cue blocks ────────────────────────────────────────────
const ICON_FEEL = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const ICON_MISTAKE = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const ICON_COACH = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────
export default function TechniqueLessonCard({
  index = 1,
  title,
  difficulty = "intermediate",
  teachingBlocks = [],
  explanation,
  bodyCue,
  commonMistake,
  coachNotes,
  drillSteps = [],
  accent = RED,
  defaultOpen = false,
  locale,
  fighterId,
  router,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const lng = loc(locale, "mn", "ko", "en");
  const L = (key) => SECTION_LABELS[key]?.[lng] || SECTION_LABELS[key]?.en || key;
  const diff = {
    label: DIFF_LABEL[difficulty]?.[lng] || difficulty?.toUpperCase() || "INTERMEDIATE",
    color: DIFF_COLOR[difficulty] || "#F59E0B",
  };

  return (
    <div style={{
      border: `1px solid ${open ? accent + "30" : accent + "18"}`,
      borderLeft: `3px solid ${open ? accent : accent + "55"}`,
      borderRadius: RADIUS.lg,
      overflow: "hidden",
      marginBottom: 8,
      background: open
        ? `linear-gradient(160deg, ${accent}09 0%, rgba(0,0,0,0.18) 100%)`
        : "rgba(255,255,255,0.015)",
      transition: "background 240ms ease, border-color 240ms ease",
    }}>

      {/* ── Header — always visible ───────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", textAlign: "left", padding: "11px 13px 9px", background: "transparent", border: "none", cursor: "pointer" }}
      >
        {/* Row 1: index + title + difficulty + chevron */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
            <span style={{
              fontSize: 9, fontWeight: 900, letterSpacing: 0.3,
              color: accent, background: `${accent}18`, border: `1px solid ${accent}32`,
              borderRadius: 5, padding: "2px 6px", flexShrink: 0,
            }}>
              {String(index).padStart(2, "0")}
            </span>
            <span style={{
              fontSize: 11, fontWeight: 900, letterSpacing: 0.5,
              color: open ? "#fff" : "rgba(255,255,255,0.68)",
              textTransform: "uppercase",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              transition: "color 240ms ease",
            }}>
              {title}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <span style={{
              fontSize: 7, fontWeight: 900, letterSpacing: 0.8,
              color: diff.color, background: `${diff.color}16`, border: `1px solid ${diff.color}30`,
              borderRadius: 4, padding: "2px 6px", textTransform: "uppercase",
            }}>
              {diff.label}
            </span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={open ? accent : "rgba(255,255,255,0.28)"}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: "transform 220ms ease, stroke 220ms ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Row 2: concept tags — always visible */}
        {teachingBlocks.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {teachingBlocks.map(b => (
              <span key={b.type} style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                padding: "2px 6px 2px 5px",
                background: `${accent}0c`, border: `1px solid ${accent}22`,
                borderRadius: 4,
                fontSize: 7, fontWeight: 900, letterSpacing: 0.8, textTransform: "uppercase",
                color: open ? `${accent}cc` : "rgba(255,255,255,0.28)",
                transition: "color 240ms ease",
              }}>
                <BlockIcon type={b.type} color={open ? accent : "rgba(255,255,255,0.28)"} size={9} />
                {BLOCK_LABEL[b.type]?.[lng] || b.type}
              </span>
            ))}
          </div>
        )}
      </button>

      {/* ── Expanded body ────────────────────────────────────────────────────── */}
      {open && (
        <div style={{ padding: "2px 13px 13px" }}>

          {/* Biomechanics grid */}
          {teachingBlocks.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
              {teachingBlocks.map(b => (
                <div key={b.type} style={{
                  padding: "9px 10px",
                  background: `${accent}0a`, border: `1px solid ${accent}1e`,
                  borderRadius: 9,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                    <BlockIcon type={b.type} color={accent} size={11} />
                    <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1.2, color: accent, textTransform: "uppercase" }}>
                      {BLOCK_LABEL[b.type]?.[lng] || BLOCK_LABEL[b.type]?.en || b.type}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.58)", lineHeight: 1.45 }}>
                    {b.value}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Why it works */}
          {explanation && (
            <>
              <SectionDivider label={L("whyItWorks")} />
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.65 }}>
                {explanation}
              </p>
            </>
          )}

          {/* Feel this */}
          {bodyCue && (
            <CueBlock icon={ICON_FEEL} label={L("feelThis")} color={PURPLE} italic>
              {bodyCue}
            </CueBlock>
          )}

          {/* Common mistake */}
          {commonMistake && (
            <CueBlock icon={ICON_MISTAKE} label={L("commonMistake")} color={ORANGE}>
              {commonMistake}
            </CueBlock>
          )}

          {/* Coach cue */}
          {coachNotes && (
            <CueBlock icon={ICON_COACH} label={L("coachCue")} color={GOLD} italic>
              {coachNotes}
            </CueBlock>
          )}

          {/* Drill steps */}
          {drillSteps.length > 0 && (
            <div style={{ marginBottom: router ? 12 : 0 }}>
              <SectionDivider label={L("drillSteps")} />
              {drillSteps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: i < drillSteps.length - 1 ? 7 : 0 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: redAlpha(0.16), border: `1px solid ${redAlpha(0.3)}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, fontSize: 8, fontWeight: 900, color: RED,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, paddingTop: 1 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Drill This CTA */}
          {router && locale && (
            <button
              type="button"
              onClick={() => router.push(`/${locale}/train?fighter=${fighterId || ""}&lesson=${encodeURIComponent(title.toLowerCase().replace(/\s+/g, "-"))}`)}
              style={{
                width: "100%", padding: "11px", marginTop: 12,
                background: `${accent}1a`, border: `1px solid ${accent}38`,
                borderRadius: RADIUS.md,
                color: accent, fontSize: 10, fontWeight: 900,
                letterSpacing: 1.8, textTransform: "uppercase",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              {L("drillThis")}
            </button>
          )}

        </div>
      )}
    </div>
  );
}
