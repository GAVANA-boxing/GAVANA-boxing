"use client";

import { useState } from "react";
import { GOLD } from "@/lib/tokens";
import { DIFF_COLOR, DIFF_MN } from "./drillsConstants";

/**
 * @param {{ drill: { name: string, difficulty: string, duration?: string, steps: string[] }, index: number, locale: string, accent: string }} props
 */
export default function DrillCard({ drill, index, locale, accent }) {
  const [open, setOpen] = useState(index === 0);
  const mn = locale === "mn";
  const diff = drill.difficulty || "Intermediate";
  const diffColor = DIFF_COLOR[diff] || GOLD;

  return (
    <div style={{
      marginBottom: 10,
      borderRadius: 14,
      background: "rgba(255,255,255,0.025)",
      border: `1px solid ${index === 0 ? accent + "28" : "rgba(255,255,255,0.06)"}`,
      borderLeft: `3px solid ${index === 0 ? accent : "rgba(255,255,255,0.1)"}`,
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", textAlign: "left", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 14px",
          background: "none", border: "none",
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: `${accent}18`,
          border: `1px solid ${accent}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 900, color: accent,
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
            {drill.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: diffColor }}>
              {mn ? (DIFF_MN[diff] || diff) : diff}
            </span>
            {drill.duration && (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                · {drill.duration}
              </span>
            )}
          </div>
        </div>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 200ms ease", flexShrink: 0 }}
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      {open && drill.steps && drill.steps.length > 0 && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 12 }} />
          {drill.steps.map((step, si) => (
            <div key={si} style={{ display: "flex", gap: 10, marginBottom: si < drill.steps.length - 1 ? 10 : 0 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                background: `${accent}15`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 900, color: accent,
              }}>
                {si + 1}
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                {step}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
