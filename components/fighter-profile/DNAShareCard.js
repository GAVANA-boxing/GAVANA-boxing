"use client";

import { useState } from "react";
import { GOLD, whiteAlpha } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const SHARE_L = {
  en: { cta: "Share Your DNA", copied: "Copied!", similarTo: "Similar To" },
  mn: { cta: "ДНХ-гаа хуваалц", copied: "Хуулсан!", similarTo: "Ижил тулаанч" },
  ko: { cta: "DNA 공유", copied: "복사됨!", similarTo: "유사 파이터" },
};

export default function DNAShareCard({ dna, displayName, locale }) {
  const [copied, setCopied] = useState(false);
  if (dna.building || !dna.archetypeKey) return null;

  const acc = ARCH_TRAINING_COLORS[dna.archetypeKey] || GOLD;
  const L = SHARE_L[locale] || SHARE_L.en;
  const confidencePct = Math.round(dna.confidence * 100);
  const topStyles = Object.entries(dna.styleMix || {}).sort(([, a], [, b]) => b - a).slice(0, 3);
  const similarFighters = dna.recommendedFighters?.slice(0, 3) || [];

  async function handleShare() {
    const shareText = locale === "mn"
      ? `Миний тулаанчийн ДНХ: ${dna.archetype} (${confidencePct}%) — GAVANA 🥊`
      : locale === "ko"
      ? `내 파이터 DNA: ${dna.archetype} (${confidencePct}%) — GAVANA 🥊`
      : `My Fighter DNA: ${dna.archetype} (${confidencePct}% signal) — GAVANA 🥊`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ title: "Fighter DNA — GAVANA", text: shareText }); return; }
      catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* silent */ }
  }

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Fighter DNA card — screenshot-worthy */}
      <div style={{
        borderRadius: 18, overflow: "hidden",
        background: `linear-gradient(155deg, rgba(6,6,8,0.96) 0%, ${acc}18 100%)`,
        border: `1px solid ${acc}40`,
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${acc}, ${acc}44, transparent)` }} />

        <div style={{ padding: "18px 20px 0" }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.25), textTransform: "uppercase" }}>
              GAVANA DNA
            </span>
            <span style={{ padding: "2px 9px", borderRadius: 999, background: `${acc}18`, border: `1px solid ${acc}35`, fontSize: 8, fontWeight: 900, color: acc, letterSpacing: 1 }}>
              {confidencePct}% SIGNAL
            </span>
          </div>

          {/* Fighter name (subtle) */}
          {displayName && (
            <div style={{ fontSize: 9.5, fontWeight: 800, color: whiteAlpha(0.28), letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>
              {displayName}
            </div>
          )}

          {/* BIG archetype name */}
          <div style={{
            fontSize: 36, fontWeight: 1000, color: "#fff", lineHeight: 1.0,
            fontFamily: "var(--font-display,'Anton',sans-serif)",
            textTransform: "uppercase", letterSpacing: "-0.02em",
            textShadow: `0 0 48px ${acc}66`,
            marginBottom: 20,
          }}>
            {dna.archetype}
          </div>

          {/* Style bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
            {topStyles.map(([key, val]) => {
              const c = ARCH_TRAINING_COLORS[key] || whiteAlpha(0.5);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 72, fontSize: 8.5, fontWeight: 900, letterSpacing: 1, color: whiteAlpha(0.3), textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>
                    {dna.styleLabels?.[key] || key}
                  </span>
                  <div style={{ flex: 1, height: 4, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(val / 10) * 100}%`, height: "100%", background: c, borderRadius: 2, boxShadow: `0 0 6px ${c}66` }} />
                  </div>
                  <span style={{ width: 28, textAlign: "right", fontSize: 11, fontWeight: 900, color: c, fontFamily: "monospace", flexShrink: 0 }}>
                    {val.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Similar fighters */}
          {similarFighters.length > 0 && (
            <div style={{ paddingBottom: 14, borderTop: `1px solid ${whiteAlpha(0.05)}`, paddingTop: 12 }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.22), textTransform: "uppercase", marginBottom: 7 }}>
                {L.similarTo}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {similarFighters.map((f) => (
                  <span key={f.id} style={{
                    fontSize: 10.5, fontWeight: 900, padding: "5px 12px", borderRadius: 999,
                    background: `${f.accent || acc}14`, border: `1px solid ${f.accent || acc}30`,
                    color: f.accent || acc,
                  }}>
                    {f.name.split(" ").slice(-1)[0]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GAVANA watermark */}
        <div style={{ padding: "8px 20px 12px", borderTop: `1px solid ${whiteAlpha(0.04)}`, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.15), textTransform: "uppercase" }}>GAVANA.APP</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: whiteAlpha(0.12) }}>{new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Share button */}
      <button type="button" onClick={handleShare} style={{
        width: "100%", marginTop: 8, padding: "12px 0", borderRadius: 12,
        background: copied ? "rgba(52,211,153,0.12)" : `${acc}12`,
        border: `1px solid ${copied ? "rgba(52,211,153,0.35)" : `${acc}35`}`,
        color: copied ? "#34D399" : acc,
        fontSize: 13, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s ease",
      }}>
        {copied
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        }
        {copied ? L.copied : L.cta}
      </button>
    </div>
  );
}
