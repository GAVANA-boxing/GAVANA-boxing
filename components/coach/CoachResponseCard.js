"use client";

const LABELS = {
  en: { cues: "Key Cues", mistake: "⚠️ Common Mistake", drill: "🎯 Drill", next: "✅ Next Action" },
  mn: { cues: "Гол зааварчилгаа", mistake: "⚠️ Алдаа", drill: "🎯 Дасгал", next: "✅ Дараагийн алхам" },
  ko: { cues: "핵심 포인트", mistake: "⚠️ 흔한 실수", drill: "🎯 드릴", next: "✅ 다음 액션" },
};

// ── Conversational: plain flowing text ────────────────────────────────────────
function ConversationalBubble({ message }) {
  return (
    <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.88)", whiteSpace: "pre-wrap" }}>
      {message}
    </div>
  );
}

// ── Short: title + numbered cues only ─────────────────────────────────────────
function ShortCard({ title, keyCues = [], accentColor }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, whiteSpace: "normal" }}>
      {title && (
        <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
          {title}
        </div>
      )}
      {keyCues.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {keyCues.map((cue, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <span style={{
                flexShrink: 0,
                width: 20, height: 20,
                borderRadius: "50%",
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}44`,
                color: accentColor,
                fontSize: 10, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 2,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 13.5, lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
                {cue}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Full: title + cues + mistake + drill + next action ────────────────────────
function FullCard({ title, keyCues = [], commonMistake, drill, nextAction, accentColor, locale }) {
  const L = LABELS[locale] || LABELS.en;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, whiteSpace: "normal" }}>
      {title && (
        <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
          {title}
        </div>
      )}
      {keyCues.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: `${accentColor}99`, textTransform: "uppercase", marginBottom: 5 }}>
            {L.cues}
          </div>
          {keyCues.map((cue, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <span style={{
                flexShrink: 0,
                width: 20, height: 20,
                borderRadius: "50%",
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}44`,
                color: accentColor,
                fontSize: 10, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: 1,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 13.5, lineHeight: 1.45, color: "rgba(255,255,255,0.88)" }}>
                {cue}
              </span>
            </div>
          ))}
        </div>
      )}
      {commonMistake && (
        <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(255,80,70,0.08)", border: "1px solid rgba(255,80,70,0.2)" }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: "#FCA5A5", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
            {L.mistake}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.75)" }}>{commonMistake}</div>
        </div>
      )}
      {drill && (
        <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(245,196,81,0.07)", border: "1px solid rgba(245,196,81,0.2)" }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: "#FDE68A", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
            {L.drill}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.75)" }}>{drill}</div>
        </div>
      )}
      {nextAction && (
        <div style={{ padding: "9px 12px", borderRadius: 10, background: "rgba(52,211,153,0.07)", border: "1px solid rgba(52,211,153,0.2)" }}>
          <div style={{ fontSize: 9, fontWeight: 900, color: "#6EE7B7", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
            {L.next}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.45, color: "rgba(255,255,255,0.75)" }}>{nextAction}</div>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function CoachResponseCard({ structured, accentColor, locale = "en" }) {
  const { variant = "full", title, keyCues = [], commonMistake, drill, nextAction, message } = structured;

  if (variant === "conversational") {
    return <ConversationalBubble message={message || title || ""} />;
  }
  if (variant === "short") {
    return <ShortCard title={title} keyCues={keyCues} accentColor={accentColor} />;
  }
  return (
    <FullCard
      title={title}
      keyCues={keyCues}
      commonMistake={commonMistake}
      drill={drill}
      nextAction={nextAction}
      accentColor={accentColor}
      locale={locale}
    />
  );
}
