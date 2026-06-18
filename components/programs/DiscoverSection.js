"use client";

import s from "@/components/programs/programsStyles";
import { RED } from "@/lib/tokens";

const LEVEL_COLOR = { beginner: "#34D399", intermediate: "#F59E0B", advanced: RED };

/**
 * Props:
 *   discoverPrograms  array
 *   t                 (key: string) => string
 *   enrolling         string | null
 *   onEnroll          (program) => void
 */
export default function DiscoverSection({ discoverPrograms, t, enrolling, onEnroll }) {
  if (discoverPrograms.length === 0) return null;

  return (
    <section style={s.section}>
      <h2 style={s.sectionTitle}>{t("programsDiscover")}</h2>
      {discoverPrograms.map((program) => {
        const color = program.color || LEVEL_COLOR[program.level] || RED;
        const levelKeyMap = { beginner: "levelBeginner", intermediate: "levelIntermediate", advanced: "levelAdvanced" };
        const levelLabel = program.level ? t(levelKeyMap[program.level] || program.level) : "";
        return (
          <div key={program.id} style={{ ...s.discoverCard, borderLeft: `3px solid ${color}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ ...s.programEmoji, background: color + "22" }}>{program.emoji || "🥊"}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>{program.title}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "5px 0" }}>
                  {levelLabel && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: color,
                      background: color + "22", border: `1px solid ${color}44`,
                      padding: "2px 8px", borderRadius: 999,
                    }}>
                      {levelLabel}
                    </span>
                  )}
                  {program.category && (
                    <span style={s.metaChip}>{program.category}</span>
                  )}
                  <span style={s.metaChip}>
                    📅 {program.duration || program.durationDays || 30} {t("programsDayShort")}
                  </span>
                </div>
                {program.description && (
                  <p style={{ margin: 0, fontSize: 12, color: "#666", lineHeight: 1.4 }}>
                    {program.description.slice(0, 90)}{program.description.length > 90 ? "…" : ""}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              style={{ ...s.enrollBtn, background: color, opacity: enrolling === program.id ? 0.6 : 1 }}
              onClick={() => onEnroll(program)}
              disabled={!!enrolling}
            >
              {enrolling === program.id ? "…" : t("programsEnroll")}
            </button>
          </div>
        );
      })}
    </section>
  );
}
