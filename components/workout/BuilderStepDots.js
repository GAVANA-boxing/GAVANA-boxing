"use client";

import { RED } from "@/lib/tokens";

const s = {
  stepDots: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: "50%", transition: "background 0.3s" },
};

/**
 * @param {{ step: number, total: number }} props
 */
export default function BuilderStepDots({ step, total = 3 }) {
  return (
    <div style={s.stepDots}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            ...s.dot,
            background: i <= step ? RED : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </div>
  );
}
