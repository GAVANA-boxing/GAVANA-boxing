"use client";

const SECTION_EMOJIS = ["🥊","⚠️","🎯","📊","🔥","💥","✅","❌","🧘","🏆","💡","📝","⚡","🔑","🩺"];

function startsWithSectionEmoji(line) {
  return SECTION_EMOJIS.some((e) => line.startsWith(e));
}

/**
 * Renders coach AI message text with structured formatting.
 *
 * Props:
 *   text         {string}  — raw message text
 *   isStreaming  {boolean} — show blinking cursor at end
 *   accentColor  {string}  — persona accent color for bullets
 */
export default function CoachBubbleContent({ text, isStreaming, accentColor }) {
  if (!text) return isStreaming ? <span style={{ opacity: 0.5, animation: "blink 0.7s step-end infinite" }}>▋</span> : null;
  const lines = text.split("\n");
  const nodes = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) {
      nodes.push(<div key={i} style={{ height: 8 }} />);
      continue;
    }
    // Bullet line
    if (line.startsWith("•") || line.startsWith("·")) {
      nodes.push(
        <div key={i} style={{ display: "flex", gap: 9, marginBottom: 5, alignItems: "flex-start" }}>
          <span style={{ color: accentColor, flexShrink: 0, fontSize: 15, lineHeight: 1.35, marginTop: 1 }}>•</span>
          <span style={{ fontSize: 14, lineHeight: 1.45, color: "rgba(255,255,255,0.88)" }}>{line.slice(1).trim()}</span>
        </div>
      );
      continue;
    }
    // Section header (emoji-led)
    if (startsWithSectionEmoji(line)) {
      const isWarning = line.startsWith("⚠️");
      const isDrill   = line.startsWith("🎯");
      nodes.push(
        <div key={i} style={{
          fontSize: 13,
          fontWeight: 900,
          color: isWarning ? "#FCA5A5" : isDrill ? "#6EE7B7" : "#fff",
          marginTop: i > 0 ? 4 : 0,
          marginBottom: 4,
          letterSpacing: 0.1,
        }}>
          {line}
        </div>
      );
      continue;
    }
    // Body text
    nodes.push(
      <div key={i} style={{ fontSize: 13.5, lineHeight: 1.5, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>
        {line}
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", whiteSpace: "normal" }}>
      {nodes}
      {isStreaming && <span style={{ opacity: 0.5, animation: "blink 0.7s step-end infinite" }}>▋</span>}
    </div>
  );
}
