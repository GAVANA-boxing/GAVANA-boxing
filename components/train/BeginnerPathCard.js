"use client";

export default function BeginnerPathCard({
  locale,
  t,
  nextLesson,
  beginnerProg,
  wrappedHandleStart,
}) {
  return (
    <div style={{ borderRadius: 14, border: "2px solid rgba(139,92,246,0.35)", background: "rgba(139,92,246,0.06)", padding: "14px 14px 12px" }}>
      {/* Header row: START HERE + lesson count + dots */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: "#A78BFA", background: "rgba(139,92,246,0.2)", padding: "3px 8px", borderRadius: 20 }}>
            {t("beginnerStartHere")}
          </span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
            {t("beginnerLessonCount").replace("{current}", beginnerProg.completed + 1).replace("{total}", beginnerProg.total)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: beginnerProg.total }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 5, height: 5, borderRadius: "50%",
                background: i < beginnerProg.completed ? "#8B5CF6" : i === beginnerProg.completed ? "#A78BFA" : "rgba(255,255,255,0.1)",
                boxShadow: i === beginnerProg.completed ? "0 0 5px rgba(167,139,250,0.6)" : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Lesson title + why */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{t(nextLesson.titleKey)}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
          {t(nextLesson.whyKey)}
        </div>
      </div>

      {/* Dual CTA */}
      <div style={{ display: "flex", gap: 8 }}>
        <a
          href={`/${locale}/programs${nextLesson.lessonId ? `?lesson=${nextLesson.lessonId}` : ""}`}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 0", borderRadius: 10, background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.45)", color: "#C4B5FD", fontSize: 12, fontWeight: 900, textDecoration: "none" }}
        >
          📖 {t("beginnerCTALesson")}
        </a>
        <button
          type="button"
          onClick={wrappedHandleStart}
          style={{ flex: 1, padding: "10px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
        >
          🎥 {t("beginnerCTARecord")}
        </button>
      </div>
    </div>
  );
}
