"use client";

import { GOLD } from "@/lib/tokens";

const ARCH_COLORS = {
  pressure: "#EF4444",
  outboxer: "#3B82F6",
  counter: "#8B5CF6",
  explosive: "#F59E0B",
  technician: "#10B981",
};

const ARCH_LABELS = {
  pressure:   { en: "Pressure Fighter", mn: "Дарамтын тулаанч", ko: "프레셔 파이터" },
  outboxer:   { en: "Outboxer",          mn: "Аутбоксер",         ko: "아웃복서" },
  counter:    { en: "Counter Fighter",   mn: "Контр тулаанч",     ko: "카운터 파이터" },
  explosive:  { en: "Explosive Fighter", mn: "Тэсрэлтийн тулаанч", ko: "폭발적 파이터" },
  technician: { en: "Technician",        mn: "Техникч",            ko: "테크니션" },
};

const ARCH_LEVELS = {
  pressure: ["intermediate", "advanced"],
  outboxer: ["beginner", "intermediate"],
  counter: ["intermediate", "advanced"],
  explosive: ["beginner", "intermediate"],
  technician: ["beginner", "intermediate"],
};

const SECTION_LABEL = {
  en: (archLabel) => `FOR YOUR DNA · ${archLabel}`,
  mn: (archLabel) => `${archLabel}-Д ТОХИРОХ ХӨТӨЛБӨР`,
  ko: (archLabel) => `${archLabel} 맞춤 프로그램`,
};

const JOIN_LABEL = { en: "Join", mn: "Элсэх", ko: "등록" };
const DAYS_LABEL = { en: "days", mn: "өдөр", ko: "일" };

/**
 * Props:
 *   userArchetype    string   — e.g. "pressure"
 *   discoverPrograms array    — programs not yet enrolled
 *   locale           "en" | "mn" | "ko"
 *   enrolling        string | null   — programId currently enrolling
 *   onEnroll         (program) => void
 */
export default function DnaRecommendation({
  userArchetype,
  discoverPrograms,
  locale,
  enrolling,
  onEnroll,
}) {
  if (!userArchetype || discoverPrograms.length === 0) return null;

  const loc = locale || "en";
  const acc = ARCH_COLORS[userArchetype] || GOLD;
  const archLabel = ARCH_LABELS[userArchetype]?.[loc] || userArchetype;
  const preferredLevels = ARCH_LEVELS[userArchetype] || ["intermediate"];

  const recommended = discoverPrograms
    .filter((p) => preferredLevels.includes(p.level) || !p.level)
    .slice(0, 2);

  if (recommended.length === 0) return null;

  const sectionLabelFn = SECTION_LABEL[loc] ?? SECTION_LABEL.en;

  return (
    <section style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase" }}>
          🧬 {sectionLabelFn(archLabel)}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recommended.map((program) => (
          <div
            key={program.id}
            style={{
              padding: "12px 14px", borderRadius: 14,
              background: `${acc}08`, border: `1px solid ${acc}22`, borderLeft: `3px solid ${acc}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{program.emoji || "🥊"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 2 }}>
                  {program.title}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                  {program.duration || program.durationDays || 30} {DAYS_LABEL[loc] ?? DAYS_LABEL.en}
                </div>
              </div>
              <button
                type="button"
                style={{
                  padding: "7px 14px", borderRadius: 10,
                  background: `${acc}20`, border: `1px solid ${acc}45`,
                  color: acc, fontSize: 11, fontWeight: 900, cursor: "pointer", flexShrink: 0,
                }}
                onClick={() => onEnroll(program)}
                disabled={!!enrolling}
              >
                {enrolling === program.id ? "…" : (JOIN_LABEL[loc] ?? JOIN_LABEL.en)}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
