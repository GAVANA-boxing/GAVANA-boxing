"use client";

import { GOLD, whiteAlpha } from "@/lib/tokens";
import { TRAINING_PRESCRIPTIONS, ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const PRES_L = {
  en: { eyebrow: "TRAINING PRESCRIPTION", weeklyFocus: "THIS WEEK", trainCta: "Train Now →" },
  mn: { eyebrow: "БЭЛТГЭЛИЙН ЗААВАР", weeklyFocus: "ЭНЭ ДОЛОО ХОНОГ", trainCta: "Бэлтгэл хий →" },
  ko: { eyebrow: "훈련 처방", weeklyFocus: "이번 주", trainCta: "지금 훈련 →" },
};

export default function TrainingPrescriptionCard({ dna, locale, router }) {
  if (dna.building || !dna.archetypeKey) return null;
  const archKey = dna.archetypeKey;
  const prescription = TRAINING_PRESCRIPTIONS[archKey];
  if (!prescription) return null;
  const P = prescription[locale] || prescription.en;
  const acc = ARCH_TRAINING_COLORS[archKey] || GOLD;
  const L = PRES_L[locale] || PRES_L.en;

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: `1px solid ${acc}30`,
      background: `linear-gradient(135deg, ${acc}08 0%, rgba(0,0,0,0) 60%)`,
      marginBottom: 8,
    }}>
      {/* Header */}
      <div style={{ padding: "13px 16px 10px", borderBottom: `1px solid ${acc}18`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 3 }}>{L.eyebrow}</div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{P.title}</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${acc}15`, border: `1px solid ${acc}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
          💊
        </div>
      </div>

      <div style={{ padding: "12px 16px" }}>
        {/* 3 priorities */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {P.priorities.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: `${acc}18`, border: `1px solid ${acc}35`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 900, color: acc,
              }}>
                {i + 1}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.72)", lineHeight: 1.45, paddingTop: 2 }}>
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* Weekly focus */}
        <div style={{ padding: "10px 12px", borderRadius: 10, background: `${acc}12`, border: `1px solid ${acc}25`, marginBottom: 10 }}>
          <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 4 }}>
            ⚡ {L.weeklyFocus}
          </div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff", lineHeight: 1.4 }}>{P.weeklyFocus}</p>
        </div>

        {/* Train CTA */}
        <button
          type="button"
          onClick={() => router.push(`/${locale}/train`)}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 11,
            background: acc, border: "none",
            color: "#000", fontSize: 12, fontWeight: 900, letterSpacing: 1,
            textTransform: "uppercase", cursor: "pointer",
            boxShadow: `0 4px 20px ${acc}35`,
          }}
        >
          {L.trainCta}
        </button>
      </div>
    </div>
  );
}
