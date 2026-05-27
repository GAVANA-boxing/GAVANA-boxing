"use client";

import { useState } from "react";
import { FIGHTERS } from "@/lib/fighters";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";
import { GOLD } from "@/lib/tokens";

const DIFF_COLOR = {
  beginner:     "#10B981",
  intermediate: "#F59E0B",
  advanced:     "#F87171",
};

export default function TechniquePicker({ onSelect, locale }) {
  const [open, setOpen] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState(null);

  const fighter = selectedFighter ? FIGHTERS.find((f) => f.id === selectedFighter) : null;
  const techniques = selectedFighter ? (FIGHTER_TECHNIQUES[selectedFighter] || []) : [];

  const label = locale === "mn" ? "⚡ ТЕХНИК СОНГОЖ ДАСГАЛ ХИЙХ" : "⚡ TRAIN A TECHNIQUE";

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 12,
          border: `1px solid ${open ? "rgba(245,196,81,0.35)" : "rgba(255,255,255,0.1)"}`,
          background: open ? "rgba(245,196,81,0.06)" : "rgba(255,255,255,0.04)",
          color: open ? GOLD : "rgba(255,255,255,0.55)",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 1.6,
          textTransform: "uppercase",
          cursor: "pointer",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>{label}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div style={{
          marginTop: 8,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.38)",
          overflow: "hidden",
        }}>
          {/* Fighter row */}
          <div style={{
            display: "flex",
            gap: 7,
            padding: "10px 12px",
            overflowX: "auto",
            borderBottom: selectedFighter ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}>
            {FIGHTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFighter(selectedFighter === f.id ? null : f.id)}
                style={{
                  flexShrink: 0,
                  padding: "5px 11px",
                  borderRadius: 999,
                  border: `1px solid ${selectedFighter === f.id ? f.accent : "rgba(255,255,255,0.12)"}`,
                  background: selectedFighter === f.id ? `${f.accent}18` : "transparent",
                  color: selectedFighter === f.id ? f.accent : "rgba(255,255,255,0.55)",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {selectedFighter === f.id && (
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: f.accent, flexShrink: 0 }} />
                )}
                {f.name.split(" ").slice(-1)[0]}
              </button>
            ))}
          </div>

          {/* Technique list */}
          {fighter && techniques.length > 0 && (
            <div style={{ padding: "8px 12px 12px" }}>
              <div style={{
                fontSize: 8, fontWeight: 900, letterSpacing: 1.8,
                color: fighter.accent, textTransform: "uppercase", marginBottom: 9,
              }}>
                {fighter.name} · {techniques.length} {locale === "mn" ? "техник" : "techniques"}
              </div>
              {techniques.map((lesson, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onSelect({ fighter, lesson });
                    setOpen(false);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "9px 11px",
                    marginBottom: i < techniques.length - 1 ? 5 : 0,
                    borderRadius: 10,
                    border: `1px solid rgba(255,255,255,0.07)`,
                    background: "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", flex: 1 }}>
                    {lesson.title}
                  </span>
                  <span style={{
                    fontSize: 8, fontWeight: 900, letterSpacing: 0.8,
                    color: DIFF_COLOR[lesson.difficulty] || GOLD,
                    background: `${DIFF_COLOR[lesson.difficulty] || GOLD}16`,
                    border: `1px solid ${DIFF_COLOR[lesson.difficulty] || GOLD}28`,
                    borderRadius: 4,
                    padding: "2px 6px",
                    textTransform: "uppercase",
                    flexShrink: 0,
                  }}>
                    {lesson.difficulty}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
