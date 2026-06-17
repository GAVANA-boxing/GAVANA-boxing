"use client";

import { useEffect, useState } from "react";
import { GOLD } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS, ARCH_IMAGES } from "@/lib/archetypeTraining";

export default function DNARevealOverlay({ dna, locale, onDismiss }) {
  const [stage, setStage] = useState(0);
  const acc = ARCH_TRAINING_COLORS[dna.archetypeKey] || GOLD;
  const imgUrl = ARCH_IMAGES[dna.archetypeKey] || "";
  const RV = {
    en: { label: "DNA REVEALED", dismiss: "Continue →" },
    mn: { label: "ДНХ ИЛЭРЛЭЭ", dismiss: "Үргэлжлүүл →" },
    ko: { label: "DNA 공개됨", dismiss: "계속 →" },
  };
  const L = RV[locale] || RV.en;

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 400);
    const t2 = setTimeout(() => setStage(2), 1100);
    const t3 = setTimeout(() => setStage(3), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const fade = (s) => ({ opacity: stage >= s ? 1 : 0, transition: "opacity 0.6s ease" });
  const rise = (s) => ({ opacity: stage >= s ? 1 : 0, transform: stage >= s ? "translateY(0)" : "translateY(22px)", transition: "opacity 0.7s ease, transform 0.7s ease" });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
      {/* Background — HD image or dark fallback */}
      {imgUrl ? (
        <>
          <img src={imgUrl} alt={dna.archetype} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%", filter: "brightness(0.35)" }} />
          <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 50%, ${acc}22 0%, rgba(0,0,0,0.85) 70%)` }} />
        </>
      ) : (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.97)" }} />
      )}

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {!imgUrl && (
          <div style={{ ...fade(1), width: 72, height: 72, borderRadius: "50%", border: `2px solid ${acc}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: `0 0 48px ${acc}44`, fontSize: 32 }}>
            🧬
          </div>
        )}
        <div style={{ ...fade(1), fontSize: 9, fontWeight: 900, letterSpacing: 3, color: acc, textTransform: "uppercase", marginBottom: 12 }}>
          {L.label}
        </div>
        <div style={{ ...rise(2), fontSize: 42, fontWeight: 1000, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", fontFamily: "var(--font-display,'Anton',sans-serif)", textAlign: "center", lineHeight: 1.0, marginBottom: 14, textShadow: `0 0 64px ${acc}88` }}>
          {dna.archetype}
        </div>
        <p style={{ ...fade(3), fontSize: 13, color: "rgba(255,255,255,0.5)", textAlign: "center", lineHeight: 1.6, maxWidth: 280, margin: "0 0 40px" }}>
          {dna.summary}
        </p>
        <button type="button" onClick={onDismiss} style={{ ...fade(3), padding: "14px 40px", borderRadius: 14, background: `${acc}22`, border: `1px solid ${acc}55`, color: acc, fontSize: 14, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5, backdropFilter: "blur(8px)" }}>
          {L.dismiss}
        </button>
      </div>
    </div>
  );
}
