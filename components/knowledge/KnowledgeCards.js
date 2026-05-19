"use client";
import { useState } from "react";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import { STYLE_EXAMPLES, TECH_EXAMPLES } from "@/lib/knowledgeData";

// ─── Sub-components ───────────────────────────────────────────────────────────

export function SectionHeader({ emoji, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 15 }}>{emoji}</span>
      <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, color: GOLD, textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {title}
      </h3>
    </div>
  );
}

export function StyleCard({ style, onAsk, t }) {
  const examples = STYLE_EXAMPLES[style.key];
  const [askHover, setAskHover] = useState(false);
  return (
    <div style={{
      flexShrink: 0,
      scrollSnapAlign: "start",
      width: 224,
      background: "rgba(14,14,14,0.92)",
      border: `1px solid ${style.tagColor}28`,
      borderTop: `3px solid ${style.tagColor}`,
      borderRadius: 14,
      padding: "14px 14px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 9,
      backdropFilter: "blur(6px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>{style.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{style.name}</span>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 800, color: style.tagColor,
          background: `${style.tagColor}14`, border: `1px solid ${style.tagColor}35`,
          borderRadius: 20, padding: "2px 8px", letterSpacing: "0.04em",
        }}>{style.tag}</span>
      </div>
      <p style={{ fontSize: 11, color: "#999", margin: 0, lineHeight: 1.5 }}>{style.desc}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {style.strengths.slice(0, 2).map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
            <span style={{ color: "#4ade80", fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
            <span style={{ fontSize: 11, color: "#ccc" }}>{s}</span>
          </div>
        ))}
        {style.weaknesses.slice(0, 1).map((w, i) => (
          <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
            <span style={{ color: "#f87171", fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✗</span>
            <span style={{ fontSize: 11, color: "#ccc" }}>{w}</span>
          </div>
        ))}
      </div>
      <div style={{ background: `${redAlpha(0.06)}`, border: `1px solid ${redAlpha(0.2)}`, borderRadius: 8, padding: "7px 9px" }}>
        <p style={{ fontSize: 9, color: RED, fontWeight: 800, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("libraryPractice")}
        </p>
        <p style={{ fontSize: 11, color: "#fca5a5", margin: 0, lineHeight: 1.4 }}>{style.practice}</p>
      </div>
      {examples && (
        <p style={{ margin: 0, fontSize: 10, color: "#555", fontStyle: "italic", lineHeight: 1.3 }}>{examples}</p>
      )}
      <button
        onClick={() => onAsk(`Tell me more about the ${style.name} style and what I should work on`)}
        onMouseEnter={() => setAskHover(true)}
        onMouseLeave={() => setAskHover(false)}
        style={{
          marginTop: 2, padding: "8px 0", borderRadius: 9,
          background: askHover ? `${style.tagColor}18` : "rgba(255,255,255,0.04)",
          border: `1px solid ${style.tagColor}${askHover ? "80" : "35"}`,
          color: style.tagColor, fontSize: 11, fontWeight: 800, cursor: "pointer",
          letterSpacing: "0.02em", transition: "background 140ms ease, border-color 140ms ease",
          transform: askHover ? "translateY(-1px)" : "none",
        }}
      >
        {t("libraryAskCoach")} →
      </button>
    </div>
  );
}

export function TechCard({ tech, onAsk, t }) {
  const examples = TECH_EXAMPLES[tech.key];
  const [askHover, setAskHover] = useState(false);
  return (
    <div style={{
      flexShrink: 0,
      scrollSnapAlign: "start",
      width: 204,
      background: "rgba(14,14,14,0.92)",
      border: `1px solid ${tech.color}28`,
      borderTop: `3px solid ${tech.color}`,
      borderRadius: 14,
      padding: "13px 13px 11px",
      display: "flex",
      flexDirection: "column",
      gap: 9,
      backdropFilter: "blur(6px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 18 }}>{tech.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{tech.name}</span>
      </div>
      <p style={{ fontSize: 11, color: "#999", margin: 0, lineHeight: 1.45 }}>{tech.what}</p>
      <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(127,29,29,0.5)", borderRadius: 8, padding: "7px 9px" }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("libraryMistake")}
        </p>
        <p style={{ fontSize: 11, color: "#fca5a5", margin: 0, lineHeight: 1.4 }}>{tech.mistake}</p>
      </div>
      <div style={{ background: `${goldAlpha(0.06)}`, border: "1px solid rgba(120,53,15,0.5)", borderRadius: 8, padding: "7px 9px" }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: GOLD, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("libraryDrill")}
        </p>
        <p style={{ fontSize: 11, color: "#fde68a", margin: 0, lineHeight: 1.4 }}>{tech.drill}</p>
      </div>
      {examples && (
        <p style={{ margin: 0, fontSize: 10, color: "#555", fontStyle: "italic", lineHeight: 1.3 }}>{examples}</p>
      )}
      <button
        onClick={() => onAsk(`How do I improve my ${tech.name}?`)}
        onMouseEnter={() => setAskHover(true)}
        onMouseLeave={() => setAskHover(false)}
        style={{
          padding: "8px 0", borderRadius: 9,
          background: askHover ? `${tech.color}18` : "rgba(255,255,255,0.04)",
          border: `1px solid ${tech.color}${askHover ? "80" : "35"}`,
          color: tech.color, fontSize: 11, fontWeight: 800, cursor: "pointer",
          transition: "background 140ms ease, border-color 140ms ease",
          transform: askHover ? "translateY(-1px)" : "none",
        }}
      >
        {t("libraryAskCoach")} →
      </button>
    </div>
  );
}

export function CountryCard({ cs }) {
  return (
    <div style={{
      flexShrink: 0,
      scrollSnapAlign: "start",
      width: 184,
      background: "rgba(14,14,14,0.92)",
      border: `1px solid ${cs.color}28`,
      borderTop: `3px solid ${cs.color}`,
      borderRadius: 14,
      padding: "13px 13px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 7,
      backdropFilter: "blur(6px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 20 }}>{cs.flag}</span>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 900, color: "#fff" }}>{cs.name}</p>
          <p style={{ margin: 0, fontSize: 10, color: cs.color, fontWeight: 700 }}>{cs.tagline}</p>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#888", margin: 0, lineHeight: 1.5 }}>{cs.desc}</p>
    </div>
  );
}

export function MovementCard({ card, t }) {
  return (
    <div style={{
      flexShrink: 0,
      scrollSnapAlign: "start",
      width: 214,
      background: "rgba(14,14,14,0.92)",
      border: `1px solid ${card.color}28`,
      borderTop: `3px solid ${card.color}`,
      borderRadius: 14,
      padding: "14px 14px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 9,
      backdropFilter: "blur(6px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 20 }}>{card.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{card.name}</span>
      </div>
      <p style={{ fontSize: 11, color: "#888", margin: 0, lineHeight: 1.5 }}>{card.desc}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {card.teaches.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
            <span style={{ color: card.color, fontSize: 10, flexShrink: 0, marginTop: 2 }}>▸</span>
            <span style={{ fontSize: 11, color: "#ccc" }}>{item}</span>
          </div>
        ))}
      </div>
      <div style={{ background: `${goldAlpha(0.06)}`, border: `1px solid ${goldAlpha(0.15)}`, borderRadius: 8, padding: "7px 9px" }}>
        <p style={{ fontSize: 9, fontWeight: 800, color: GOLD, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("libraryDrill")}
        </p>
        <p style={{ fontSize: 11, color: "#fde68a", margin: 0, lineHeight: 1.4 }}>{card.drill}</p>
      </div>
    </div>
  );
}

export function MistakeRow({ item }) {
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      padding: "10px 0", borderBottom: "1px solid #1f1f1f",
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{item.emoji}</span>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#f87171" }}>{item.mistake}</p>
        <p style={{ margin: 0, fontSize: 12, color: "#aaa", lineHeight: 1.4 }}>Fix: {item.fix}</p>
      </div>
    </div>
  );
}

