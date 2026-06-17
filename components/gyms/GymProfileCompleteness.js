"use client";

import { RED, GOLD } from "@/lib/tokens";
import { getCompleteness } from "@/lib/gymConstants";

export default function GymProfileCompleteness({ gym, t }) {
  const pct = getCompleteness(gym);
  const label = t("gymDashProfileComplete");
  const color = pct >= 80 ? "#34D399" : pct >= 50 ? GOLD : RED;

  return (
    <div style={{ marginTop: 12, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
      {pct < 100 && (
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
          {t("gymDashProfileHint")}
        </p>
      )}
    </div>
  );
}
