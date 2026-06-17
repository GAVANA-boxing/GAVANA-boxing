"use client";

import s from "@/components/fighters/fighterStyles";

// ─── Drills section body ──────────────────────────────────────────────────────
// Props: drills (string[])
export default function FighterDrillsSection({ drills }) {
  return (
    <>
      {drills.map((drill, i) => (
        <div key={i} style={s.drillRow} className="fighter-drill-row">
          <span style={s.drillNum}>{i + 1}</span>
          <span style={s.drillText}>{drill}</span>
        </div>
      ))}
    </>
  );
}
