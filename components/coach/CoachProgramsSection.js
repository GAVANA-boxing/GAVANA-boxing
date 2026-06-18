"use client";

import { GOLD, RED } from "@/lib/tokens";
import styles from "@/components/coach/coachIdStyles";

const LEVEL_COLOR = { beginner: "#34D399", intermediate: GOLD, advanced: RED };

const STRINGS = {
  mn: {
    coachIdTrainingPrograms: "Дасгалжуулалтын хөтөлбөрүүд",
    coachIdDaysUnit: "өдөр",
    coachIdEnrolled: "Бүртгэгдсэн ✓",
    coachIdFollowProgram: "Хөтөлбөр дагах",
  },
  en: {
    coachIdTrainingPrograms: "Training Programs",
    coachIdDaysUnit: "days",
    coachIdEnrolled: "Enrolled ✓",
    coachIdFollowProgram: "Follow Program",
  },
};

function t(locale, key) {
  return (STRINGS[locale] || STRINGS.en)[key] ?? key;
}

export default function CoachProgramsSection({
  locale,
  programs,
  enrolledIds,
  enrolling,
  isOwnProfile,
  onEnroll,
}) {
  if (!programs.length) return null;

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>
        📋 {t(locale, "coachIdTrainingPrograms")}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {programs.map((prog) => {
          const enrolled = enrolledIds.has(prog.id);
          const isBusy = enrolling === prog.id;
          const levelColor = LEVEL_COLOR[prog.level] || "#888";

          return (
            <div
              key={prog.id}
              style={{
                background: "linear-gradient(145deg, #111012, #0a0a0a)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderLeft: `2.5px solid ${levelColor}`,
                borderRadius: "3px 14px 14px 3px",
                padding: "14px 14px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 900,
                      color: "#fff",
                      marginBottom: 4,
                    }}
                  >
                    {prog.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      marginBottom: prog.description ? 6 : 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: levelColor,
                        background: `${levelColor}15`,
                        border: `1px solid ${levelColor}44`,
                        borderRadius: 999,
                        padding: "2px 8px",
                      }}
                    >
                      {prog.level
                        ? prog.level.charAt(0).toUpperCase() + prog.level.slice(1)
                        : ""}
                    </span>
                    {prog.duration && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#888",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 999,
                          padding: "2px 8px",
                        }}
                      >
                        📅 {prog.duration} {t(locale, "coachIdDaysUnit")}
                      </span>
                    )}
                    {prog.enrolledCount > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#888",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 999,
                          padding: "2px 8px",
                        }}
                      >
                        👥 {prog.enrolledCount}
                      </span>
                    )}
                  </div>
                  {prog.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.45)",
                        lineHeight: 1.5,
                      }}
                    >
                      {prog.description.slice(0, 100)}
                      {prog.description.length > 100 ? "…" : ""}
                    </div>
                  )}
                </div>
              </div>

              {!isOwnProfile && (
                <button
                  type="button"
                  onClick={() => onEnroll(prog)}
                  disabled={isBusy}
                  style={{
                    padding: "9px 0",
                    borderRadius: 10,
                    border: enrolled ? `1px solid ${levelColor}44` : "none",
                    background: enrolled
                      ? `${levelColor}12`
                      : `linear-gradient(135deg, ${levelColor}, ${levelColor}bb)`,
                    color: enrolled ? levelColor : "#fff",
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: isBusy ? "wait" : "pointer",
                    opacity: isBusy ? 0.6 : 1,
                  }}
                >
                  {isBusy
                    ? "…"
                    : enrolled
                    ? t(locale, "coachIdEnrolled")
                    : t(locale, "coachIdFollowProgram")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
