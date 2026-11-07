"use client";

import { useCallback, useEffect, useState } from "react";
import { GOLD } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS, ARCH_IMAGES } from "@/lib/archetypeTraining";

/**
 * DNARevealOverlay — cinematic Fighter DNA reveal ceremony.
 * Staged: glow → archetype slam-in → style-mix bars fill → stats + actions.
 * Replayable. Honors prefers-reduced-motion (shows final state instantly).
 */
export default function DNARevealOverlay({ dna, locale, onDismiss }) {
  const acc    = ARCH_TRAINING_COLORS[dna.archetypeKey] || GOLD;
  const imgUrl = ARCH_IMAGES[dna.archetypeKey] || "";

  const RV = {
    en: { label: "DNA REVEALED", dismiss: "Continue →", replay: "Replay", weapon: "Signature weapon", conf: "Confidence", mix: "Style mix" },
    mn: { label: "ДНХ ИЛЭРЛЭЭ",  dismiss: "Үргэлжлүүл →", replay: "Дахин үзэх", weapon: "Онцлох зэвсэг", conf: "Итгэл", mix: "Хэв маягийн холимог" },
    ko: { label: "DNA 공개됨",    dismiss: "계속 →",       replay: "다시 보기", weapon: "시그니처 무기", conf: "신뢰도", mix: "스타일 믹스" },
  };
  const L = RV[locale] || RV.en;

  const reduce = typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Top style-mix dimensions (0–10) → percentage bars
  const bars = Object.entries(dna.styleMix || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k, v]) => ({ key: k, label: dna.styleLabels?.[k] || k, pct: Math.round((v / 10) * 100) }));

  const confidencePct = Math.round((dna.confidence || 0) * 100);

  const [stage, setStage] = useState(reduce ? 5 : 0);

  const run = useCallback(() => {
    if (reduce) { setStage(5); return; }
    setStage(0);
    const timers = [
      setTimeout(() => setStage(1), 300),   // eyebrow + glow
      setTimeout(() => setStage(2), 900),   // archetype slam
      setTimeout(() => setStage(3), 1700),  // style bars
      setTimeout(() => setStage(4), 2600),  // stats
      setTimeout(() => setStage(5), 3200),  // actions
    ];
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  useEffect(() => { const cleanup = run(); return cleanup; }, [run]);

  const fade = (s) => ({ opacity: stage >= s ? 1 : 0, transition: "opacity 0.6s ease" });
  const rise = (s) => ({
    opacity: stage >= s ? 1 : 0,
    transform: stage >= s ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
    transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1)",
  });
  const slam = (s) => ({
    opacity: stage >= s ? 1 : 0,
    transform: stage >= s ? "scale(1)" : "scale(1.35)",
    transition: "opacity 0.5s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)",
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 28 }}>
      {/* Background */}
      {imgUrl ? (
        <>
          <img src={imgUrl} alt={dna.archetype} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", filter: "brightness(0.32)", transform: stage >= 1 ? "scale(1.04)" : "scale(1.12)", transition: "transform 2.4s ease" }} />
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 42%, ${acc}2b 0%, rgba(0,0,0,0.88) 68%)` }} />
        </>
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.97)" }} />
      )}

      {/* Pulsing glow ring behind title */}
      <div style={{
        position: "absolute", top: "32%", width: 260, height: 260, borderRadius: "50%",
        background: `radial-gradient(circle, ${acc}33 0%, transparent 70%)`,
        opacity: stage >= 1 ? 1 : 0,
        filter: "blur(8px)",
        transition: "opacity 1s ease",
        animation: stage >= 1 && !reduce ? "dnaGlowPulse 2.4s ease-in-out infinite" : "none",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 340 }}>
        <div style={{ ...fade(1), fontSize: 9, fontWeight: 900, letterSpacing: 3.5, color: acc, textTransform: "uppercase", marginBottom: 12 }}>
          {L.label}
        </div>

        <div style={{ ...slam(2), fontSize: 44, fontWeight: 1000, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", fontFamily: "var(--font-display,'Anton',sans-serif)", textAlign: "center", lineHeight: 0.98, marginBottom: 18, textShadow: `0 0 70px ${acc}` }}>
          {dna.archetype}
        </div>

        {/* Style-mix bars */}
        <div style={{ ...fade(3), width: "100%", marginBottom: 18 }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 8 }}>
            {L.mix}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {bars.map((b, i) => (
              <div key={b.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 82, fontSize: 10, fontWeight: 800, color: i === 0 ? acc : "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.5, flexShrink: 0, textAlign: "right" }}>
                  {b.label}
                </span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    width: stage >= 3 ? `${b.pct}%` : "0%",
                    background: i === 0 ? `linear-gradient(90deg, ${acc}, ${acc}aa)` : "rgba(255,255,255,0.28)",
                    boxShadow: i === 0 ? `0 0 10px ${acc}66` : "none",
                    transition: `width 0.9s cubic-bezier(0.16,1,0.3,1) ${reduce ? 0 : i * 0.12}s`,
                  }} />
                </div>
                <span style={{ width: 30, fontSize: 10, fontWeight: 900, fontFamily: "var(--stack-mono)", color: i === 0 ? acc : "rgba(255,255,255,0.35)", flexShrink: 0 }}>
                  {b.pct}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ ...rise(4), display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ padding: "6px 12px", borderRadius: 999, background: `${acc}1c`, border: `1px solid ${acc}44` }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{L.conf} </span>
            <span style={{ fontSize: 11, fontWeight: 900, color: acc, fontFamily: "var(--stack-mono)" }}>{confidencePct}%</span>
          </div>
          {dna.bestWeaponLabel && (
            <div style={{ padding: "6px 12px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{L.weapon} </span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#fff" }}>{dna.bestWeaponLabel}</span>
            </div>
          )}
        </div>

        <p style={{ ...fade(4), fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.6, maxWidth: 290, margin: "0 0 28px" }}>
          {dna.summary}
        </p>

        {/* Actions */}
        <div style={{ ...fade(5), display: "flex", alignItems: "center", gap: 12 }}>
          {!reduce && (
            <button type="button" onClick={run} style={{ padding: "13px 20px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 800, cursor: "pointer", backdropFilter: "blur(8px)" }}>
              ↻ {L.replay}
            </button>
          )}
          <button type="button" onClick={onDismiss} style={{ padding: "13px 40px", borderRadius: 14, background: `${acc}26`, border: `1px solid ${acc}66`, color: acc, fontSize: 14, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5, backdropFilter: "blur(8px)" }}>
            {L.dismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
