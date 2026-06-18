"use client";

/**
 * Animated "thinking" indicator shown while the AI is generating a response.
 *
 * Props:
 *   persona  {{ emoji: string, color: string }} — active persona config
 */
export default function CoachThinking({ persona }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 14px", width: "100%" }}>
      <div style={{
        height: 2, borderRadius: 99,
        background: `linear-gradient(90deg, transparent 0%, ${persona.color} 50%, transparent 100%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s linear infinite",
        marginBottom: 2,
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: `${persona.color}cc`, letterSpacing: 0.3 }}>
          {persona.emoji} Thinking
        </span>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: "50%",
            background: persona.color,
            animation: `dotBounce 1.1s ease-in-out ${i * 0.18}s infinite`,
          }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {[75, 100, 55].map((w, i) => (
          <div key={i} style={{
            height: 9, width: `${w}%`, borderRadius: 5,
            background: "rgba(255,255,255,0.055)",
            animation: `shimmerFade 1.6s ease-in-out ${i * 0.22}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
