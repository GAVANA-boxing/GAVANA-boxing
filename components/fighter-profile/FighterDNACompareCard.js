"use client";

import { useState } from "react";
import { GOLD, whiteAlpha } from "@/lib/tokens";
import { FIGHTERS } from "@/lib/fighters";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const FIGHTER_DNA_PROFILES = {
  "mike-tyson":       { pressure: 9.2, explosive: 8.8, counter: 3.1, outboxer: 1.5, technician: 6.0 },
  "muhammad-ali":     { pressure: 4.0, outboxer: 9.5, counter: 7.8, explosive: 7.2, technician: 9.0 },
  "naoya-inoue":      { pressure: 7.5, outboxer: 5.5, counter: 8.0, explosive: 9.8, technician: 8.5 },
  "dmitry-bivol":     { pressure: 5.5, outboxer: 8.0, counter: 7.5, explosive: 6.5, technician: 8.5 },
  "vasyl-lomachenko": { pressure: 4.5, outboxer: 9.0, counter: 8.5, explosive: 6.0, technician: 9.8 },
  "canelo-alvarez":   { pressure: 6.5, outboxer: 5.5, counter: 9.2, explosive: 7.8, technician: 8.8 },
  "gennady-golovkin": { pressure: 9.5, outboxer: 3.0, counter: 5.0, explosive: 8.5, technician: 7.0 },
  "floyd-mayweather": { pressure: 2.5, outboxer: 8.2, counter: 9.8, explosive: 3.5, technician: 9.5 },
  "manny-pacquiao":   { pressure: 8.0, outboxer: 6.5, counter: 4.5, explosive: 9.5, technician: 7.5 },
  "roberto-duran":    { pressure: 8.8, outboxer: 5.0, counter: 7.5, explosive: 8.0, technician: 8.0 },
};

const DC_L = {
  en: {
    eyebrow:    "DNA COMPARISON",
    select:     "Compare against",
    you:        "YOU",
    tap:        "Select a fighter to compare DNA",
    similarity: "Overall similarity",
  },
  mn: {
    eyebrow:    "ДНХ ХАРЬЦУУЛАЛТ",
    select:     "Харьцуулах тулаанч",
    you:        "ТА",
    tap:        "Тулаанч сонгоод ДНХ харьцуул",
    similarity: "Нийт тохирол",
  },
  ko: {
    eyebrow:    "DNA 비교",
    select:     "비교 대상",
    you:        "나",
    tap:        "비교할 파이터를 선택하세요",
    similarity: "전체 유사도",
  },
};

const ARCH_ORDER_DC = ["pressure", "outboxer", "counter", "explosive", "technician"];
const ARCH_LABELS_DC = {
  en: { pressure: "Pressure", outboxer: "Outboxer", counter: "Counter", explosive: "Explosive", technician: "Technician" },
  mn: { pressure: "Дарамт",   outboxer: "Аутбоксер", counter: "Контр",  explosive: "Тэсрэмтгий", technician: "Техникийн" },
  ko: { pressure: "압박",     outboxer: "아웃복싱",   counter: "카운터", explosive: "폭발력",      technician: "기술" },
};

export default function FighterDNACompareCard({ dna, locale }) {
  const L  = DC_L[locale] || DC_L.en;
  const AL = ARCH_LABELS_DC[locale] || ARCH_LABELS_DC.en;
  const [selectedId, setSelectedId] = useState(null);

  const fighters = FIGHTERS.filter((f) => FIGHTER_DNA_PROFILES[f.id]);
  const selectedFighter = fighters.find((f) => f.id === selectedId) || null;
  const fighterProfile  = selectedId ? FIGHTER_DNA_PROFILES[selectedId] : null;
  const userMix = dna.styleMix || {};

  const similarity = fighterProfile
    ? Math.round(
        ARCH_ORDER_DC.reduce((sum, k) => {
          const u = (userMix[k] || 0) / 10;
          const fv = (fighterProfile[k] || 0) / 10;
          return sum + (1 - Math.abs(u - fv));
        }, 0) / ARCH_ORDER_DC.length * 100
      )
    : null;

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${whiteAlpha(0.08)}`, background: whiteAlpha(0.015), marginBottom: 8 }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${whiteAlpha(0.1)}, transparent)` }} />
      <div style={{ padding: "14px 16px 16px" }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.25), textTransform: "uppercase", marginBottom: 12 }}>
          ⚔️ {L.eyebrow}
        </div>

        {/* Fighter chip selector */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: whiteAlpha(0.3), marginBottom: 8 }}>{L.select}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {fighters.map((f) => {
              const active = f.id === selectedId;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedId(active ? null : f.id)}
                  style={{
                    padding: "5px 11px", borderRadius: 999,
                    background: active ? `${f.accent}20` : whiteAlpha(0.04),
                    border: `1px solid ${active ? `${f.accent}50` : whiteAlpha(0.09)}`,
                    color: active ? f.accent : whiteAlpha(0.45),
                    fontSize: 11, fontWeight: 900, cursor: "pointer", transition: "all 0.15s ease",
                  }}
                >
                  {f.name.split(" ").slice(-1)[0]}
                </button>
              );
            })}
          </div>
        </div>

        {selectedFighter && fighterProfile ? (
          <>
            {/* Similarity badge */}
            <div style={{ marginBottom: 12, padding: "8px 12px", borderRadius: 10, background: similarity >= 70 ? "rgba(52,211,153,0.07)" : whiteAlpha(0.03), border: `1px solid ${similarity >= 70 ? "rgba(52,211,153,0.2)" : whiteAlpha(0.07)}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: whiteAlpha(0.4) }}>{L.similarity}</span>
              <span style={{ fontSize: 20, fontWeight: 1000, color: similarity >= 70 ? "#34D399" : similarity >= 50 ? GOLD : whiteAlpha(0.45), fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{similarity}%</span>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 12, height: 3, borderRadius: 2, background: whiteAlpha(0.5) }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: whiteAlpha(0.4) }}>{L.you}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 12, height: 3, borderRadius: 2, background: selectedFighter.accent }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: selectedFighter.accent }}>{selectedFighter.name.split(" ").slice(-1)[0]}</span>
              </div>
            </div>

            {/* Per-dimension bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {ARCH_ORDER_DC.map((key) => {
                const userVal  = Math.min(1, (userMix[key] || 0) / 10);
                const fightVal = (fighterProfile[key] || 0) / 10;
                const c = ARCH_TRAINING_COLORS[key] || GOLD;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 70, fontSize: 8, fontWeight: 900, letterSpacing: 0.8, color: whiteAlpha(0.3), textTransform: "uppercase", flexShrink: 0 }}>
                      {AL[key]}
                    </span>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ height: 4, background: whiteAlpha(0.06), borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${userVal * 100}%`, height: "100%", background: whiteAlpha(0.4), borderRadius: 2, transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
                      </div>
                      <div style={{ height: 4, background: whiteAlpha(0.06), borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${fightVal * 100}%`, height: "100%", background: c, borderRadius: 2, boxShadow: `0 0 4px ${c}66`, transition: "width 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
                      </div>
                    </div>
                    <span style={{ width: 28, textAlign: "right", fontSize: 9, fontWeight: 900, color: c, fontFamily: "monospace", flexShrink: 0 }}>
                      {fighterProfile[key].toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: whiteAlpha(0.22), textAlign: "center", padding: "8px 0 4px" }}>
            {L.tap}
          </p>
        )}
      </div>
    </div>
  );
}
