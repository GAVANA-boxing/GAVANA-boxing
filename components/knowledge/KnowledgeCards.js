"use client";
import { useState } from "react";
import { RED, GOLD, redAlpha, goldAlpha, blackAlpha, whiteAlpha } from "@/lib/tokens";
import { STYLE_EXAMPLES, TECH_EXAMPLES } from "@/lib/knowledgeData";

// ── Gradient hero placeholder (image-ready slot) ─────────────────────────────
function CardHero({ color, emoji, height = 96, patternAngle = 45 }) {
  return (
    <div style={{
      height,
      position: "relative",
      overflow: "hidden",
      background: `linear-gradient(155deg, ${color}38 0%, ${color}10 55%, transparent 100%), linear-gradient(180deg, #120810 0%, #0b090c 100%)`,
      flexShrink: 0,
    }}>
      {/* Diagonal rule pattern */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `repeating-linear-gradient(${patternAngle}deg, ${color}08 0, ${color}08 1px, transparent 0, transparent 18px)`,
      }} />
      {/* Bottom fade */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 40, background: "linear-gradient(to top, rgba(12,9,11,0.9), transparent)" }} />
      {/* Emoji */}
      <span style={{
        position: "absolute", bottom: 10, left: 14,
        fontSize: 28, lineHeight: 1,
        filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.9))",
      }}>
        {emoji}
      </span>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
export function SectionHeader({ emoji, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <h3 style={{ margin: 0, fontSize: 11, fontWeight: 900, color: GOLD, textTransform: "uppercase", letterSpacing: "0.12em" }}>
        {title}
      </h3>
    </div>
  );
}

// ── Fighter style card ────────────────────────────────────────────────────────
export function StyleCard({ style, onAsk, t }) {
  const examples = STYLE_EXAMPLES[style.key];
  return (
    <div style={{
      flexShrink: 0, scrollSnapAlign: "start",
      width: 260,
      background: "rgba(12,10,11,0.97)",
      border: `1px solid ${style.tagColor}22`,
      borderRadius: 16,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <CardHero color={style.tagColor} emoji={style.emoji} height={96} />
      <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 9, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{style.name}</span>
          <span style={{
            fontSize: 9, fontWeight: 800, color: style.tagColor,
            background: `${style.tagColor}14`, border: `1px solid ${style.tagColor}38`,
            borderRadius: 20, padding: "2px 8px", letterSpacing: "0.05em", flexShrink: 0,
          }}>{style.tag}</span>
        </div>
        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.52)", margin: 0, lineHeight: 1.5 }}>{style.desc}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {style.strengths.slice(0, 2).map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#4ade80", fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.72)" }}>{s}</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
            <span style={{ color: "#f87171", fontSize: 10, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✗</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.52)" }}>{style.weaknesses[0]}</span>
          </div>
        </div>
        <div style={{ background: `${redAlpha(0.07)}`, border: `1px solid ${redAlpha(0.2)}`, borderRadius: 9, padding: "8px 10px" }}>
          <p style={{ fontSize: 9, color: RED, fontWeight: 800, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("libraryPractice")}</p>
          <p style={{ fontSize: 11, color: "#fca5a5", margin: 0, lineHeight: 1.4 }}>{style.practice}</p>
        </div>
        {examples && <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.28)", fontStyle: "italic", lineHeight: 1.3 }}>{examples}</p>}
        <button
          onClick={() => onAsk(`Tell me more about the ${style.name} style and what I should work on`)}
          style={{
            marginTop: "auto", padding: "9px 0", borderRadius: 9,
            background: `${style.tagColor}10`, border: `1px solid ${style.tagColor}38`,
            color: style.tagColor, fontSize: 11, fontWeight: 800, cursor: "pointer",
          }}
        >
          {t("libraryAskCoach")} →
        </button>
      </div>
    </div>
  );
}

// ── Technique card ────────────────────────────────────────────────────────────
export function TechCard({ tech, onAsk, t }) {
  const examples = TECH_EXAMPLES[tech.key];
  return (
    <div style={{
      flexShrink: 0, scrollSnapAlign: "start",
      width: 240,
      background: "rgba(12,10,11,0.97)",
      border: `1px solid ${tech.color}22`,
      borderRadius: 16,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <CardHero color={tech.color} emoji={tech.emoji} height={88} patternAngle={-45} />
      <div style={{ padding: "12px 13px 13px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{tech.name}</span>
        <p style={{ fontSize: 11.5, color: "rgba(255,255,255,0.52)", margin: 0, lineHeight: 1.45 }}>{tech.what}</p>
        <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(127,29,29,0.45)", borderRadius: 9, padding: "7px 10px" }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("libraryMistake")}</p>
          <p style={{ fontSize: 11, color: "#fca5a5", margin: 0, lineHeight: 1.4 }}>{tech.mistake}</p>
        </div>
        <div style={{ background: `${goldAlpha(0.07)}`, border: "1px solid rgba(120,53,15,0.5)", borderRadius: 9, padding: "7px 10px" }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: GOLD, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("libraryDrill")}</p>
          <p style={{ fontSize: 11, color: "#fde68a", margin: 0, lineHeight: 1.4 }}>{tech.drill}</p>
        </div>
        {examples && <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>{examples}</p>}
        <button
          onClick={() => onAsk(`How do I improve my ${tech.name}?`)}
          style={{
            marginTop: "auto", padding: "9px 0", borderRadius: 9,
            background: `${tech.color}10`, border: `1px solid ${tech.color}38`,
            color: tech.color, fontSize: 11, fontWeight: 800, cursor: "pointer",
          }}
        >
          {t("libraryAskCoach")} →
        </button>
      </div>
    </div>
  );
}

// ── Fighter profile card (uses fighters.js data) ──────────────────────────────
export function FighterCard({ fighter, onStudy, locale }) {
  return (
    <div style={{
      flexShrink: 0, scrollSnapAlign: "start",
      width: 200,
      background: "rgba(12,10,11,0.97)",
      border: `1px solid ${fighter.accent}22`,
      borderRadius: 16,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      cursor: "pointer",
    }} onClick={() => onStudy(fighter)}>
      {/* Hero */}
      <div style={{
        height: 108,
        position: "relative",
        background: `linear-gradient(155deg, ${fighter.accent}45 0%, ${fighter.accent}12 50%, transparent 100%), #0d0a0e`,
        overflow: "hidden",
      }}>
        {fighter.imageUrl ? (
          <img src={fighter.imageUrl} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }} alt={fighter.name} />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `repeating-linear-gradient(60deg, ${fighter.accent}09 0, ${fighter.accent}09 1px, transparent 0, transparent 20px)`,
          }} />
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: "linear-gradient(to top, rgba(13,10,14,0.95), transparent)" }} />
        {/* Country flag + initials */}
        <div style={{ position: "absolute", top: 12, right: 12, fontSize: 18 }}>{fighter.country}</div>
        <div style={{
          position: "absolute", bottom: 10, left: 12,
          width: 38, height: 38, borderRadius: "50%",
          background: `${fighter.accent}22`, border: `1.5px solid ${fighter.accent}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 900, color: fighter.accent, letterSpacing: "-0.02em",
        }}>
          {fighter.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
        </div>
      </div>

      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{fighter.name}</p>
          <p style={{ margin: "2px 0 0", fontSize: 10, color: fighter.accent, fontWeight: 700 }}>{fighter.style}</p>
        </div>
        <p style={{ margin: 0, fontSize: 10.5, color: "rgba(255,255,255,0.48)", lineHeight: 1.4 }}>{fighter.keyWeapon}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
          {(fighter.styleIdentity || []).slice(0, 2).map((tag, i) => (
            <span key={i} style={{
              fontSize: 8.5, fontWeight: 800, color: fighter.accent,
              background: `${fighter.accent}12`, border: `1px solid ${fighter.accent}28`,
              borderRadius: 12, padding: "2px 7px",
            }}>{tag}</span>
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onStudy(fighter); }}
          style={{
            marginTop: "auto", padding: "8px 0", borderRadius: 9,
            background: `${fighter.accent}14`, border: `1px solid ${fighter.accent}40`,
            color: fighter.accent, fontSize: 11, fontWeight: 800, cursor: "pointer",
          }}
        >
          {locale === "mn" ? "Судлах →" : locale === "ko" ? "배우기 →" : "Study →"}
        </button>
      </div>
    </div>
  );
}

// ── Country card ──────────────────────────────────────────────────────────────
export function CountryCard({ cs }) {
  return (
    <div style={{
      flexShrink: 0, scrollSnapAlign: "start",
      width: 190,
      background: "rgba(12,10,11,0.97)",
      border: `1px solid ${cs.color}22`,
      borderRadius: 16,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{
        height: 72,
        background: `linear-gradient(155deg, ${cs.color}35 0%, ${cs.color}08 100%), #0d0a0e`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28,
      }}>
        {cs.flag}
      </div>
      <div style={{ padding: "10px 12px 12px", display: "flex", flexDirection: "column", gap: 5 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: "#fff" }}>{cs.name}</p>
        <p style={{ margin: 0, fontSize: 10, color: cs.color, fontWeight: 700 }}>{cs.tagline}</p>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.45 }}>{cs.desc}</p>
      </div>
    </div>
  );
}

// ── Movement card ─────────────────────────────────────────────────────────────
export function MovementCard({ card, t }) {
  return (
    <div style={{
      flexShrink: 0, scrollSnapAlign: "start",
      width: 220,
      background: "rgba(12,10,11,0.97)",
      border: `1px solid ${card.color}22`,
      borderRadius: 16,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <CardHero color={card.color} emoji={card.emoji} height={80} patternAngle={30} />
      <div style={{ padding: "12px 13px 13px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{card.name}</span>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.48)", margin: 0, lineHeight: 1.45 }}>{card.desc}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {card.teaches.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
              <span style={{ color: card.color, fontSize: 10, flexShrink: 0, marginTop: 2 }}>▸</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ background: `${goldAlpha(0.07)}`, border: `1px solid ${goldAlpha(0.15)}`, borderRadius: 8, padding: "7px 9px" }}>
          <p style={{ fontSize: 9, fontWeight: 800, color: GOLD, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("libraryDrill")}</p>
          <p style={{ fontSize: 11, color: "#fde68a", margin: 0, lineHeight: 1.4 }}>{card.drill}</p>
        </div>
      </div>
    </div>
  );
}

// ── Mistake card (grid layout) ────────────────────────────────────────────────
export function MistakeRow({ item }) {
  return (
    <div style={{
      display: "flex", gap: 12, alignItems: "flex-start",
      padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 16,
      }}>
        {item.emoji}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#f87171", lineHeight: 1.3 }}>{item.mistake}</p>
        <p style={{ margin: 0, fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>Fix: {item.fix}</p>
      </div>
    </div>
  );
}
