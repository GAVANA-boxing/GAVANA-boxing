"use client";

import { RADIUS } from "@/lib/tokens";
import { DNA_ATTRS } from "@/lib/dashboardHelpers";
import ScrollRow from "@/components/ScrollRow";

const DNA_CARD_INFO = {
  Pressure: {
    icon: "🔥",
    desc: "Offense output — speed meets power. High pressure fighters dominate through volume and forward energy.",
    traits: ["High punch output", "Combination chains", "Forward momentum"],
  },
  Technical: {
    icon: "🎯",
    desc: "Timing and accuracy define technical fighters. Every shot lands with purpose and clean mechanics.",
    traits: ["Sharp timing", "Accurate shots", "Clean mechanics"],
  },
  Counter: {
    icon: "👁",
    desc: "Counter specialists read attacks and punish gaps. Timing over volume — quality over quantity.",
    traits: ["Reactive timing", "Guard-first entry", "Exploit openings"],
  },
  Footwork: {
    icon: "👟",
    desc: "Movement is your weapon. Angle creation, distance control, and ring generalship.",
    traits: ["Angle creation", "Distance control", "Elusive positioning"],
  },
  Defense: {
    icon: "🛡",
    desc: "Guard strength and head movement reduce incoming damage and force opponents to reset.",
    traits: ["Tight guard", "Head movement", "Absorb and counter"],
  },
};

function _ratingLabel(pct) {
  return pct >= 80 ? "Elite" : pct >= 60 ? "Strong" : pct >= 40 ? "Developing" : "Building";
}

/**
 * @param {{ radarStats: object }} props
 */
export function StyleDNA({ radarStats }) {
  const items = DNA_ATTRS.map((a) => ({
    key: a.key,
    color: a.color,
    pct: Math.round(Math.max(1, Math.min(10, a.fn(radarStats))) * 10),
    info: DNA_CARD_INFO[a.key] ?? { icon: "•", desc: "", traits: [] },
  }));

  return (
    <div style={{ margin: "0 -14px" }}>
      <ScrollRow cardWidth={210} gap={10}>
        {items.map((item) => (
          <div key={item.key} style={{
            flexShrink: 0,
            width: 210,
            scrollSnapAlign: "start",
            background: `linear-gradient(160deg, ${item.color}14 0%, rgba(0,0,0,0) 60%)`,
            border: `1px solid ${item.color}35`,
            borderRadius: 14,
            padding: "14px 14px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 20 }}>{item.info.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.92)", letterSpacing: 0.5 }}>
                  {item.key}
                </span>
              </div>
              <div style={{
                padding: "2px 9px", borderRadius: 20,
                background: `${item.color}20`, border: `1px solid ${item.color}45`,
                fontSize: 9, fontWeight: 900, color: item.color, letterSpacing: 1,
              }}>
                {_ratingLabel(item.pct)}
              </div>
            </div>

            {/* Score bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: item.color, lineHeight: 1 }}>
                  {item.pct}%
                </span>
              </div>
              <div style={{ height: 5, borderRadius: RADIUS.full, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: RADIUS.full,
                  width: `${item.pct}%`,
                  background: `linear-gradient(90deg, ${item.color}88, ${item.color})`,
                  boxShadow: `0 0 10px ${item.color}55`,
                  animation: "rankFill 850ms cubic-bezier(0.16,1,0.3,1) both",
                }} />
              </div>
            </div>

            {/* Description */}
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>
              {item.info.desc}
            </p>

            {/* Traits */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {item.info.traits.map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 8, color: item.color, fontWeight: 900, flexShrink: 0 }}>›</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.62)", fontWeight: 700 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </ScrollRow>
    </div>
  );
}
