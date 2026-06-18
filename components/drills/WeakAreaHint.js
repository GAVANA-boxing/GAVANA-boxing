"use client";

import { RED, redAlpha } from "@/lib/tokens";
import { AREA_COLOR } from "./drillsConstants";

/**
 * @param {{ weakAreaName: string, locale: string }} props
 */
export default function WeakAreaHint({ weakAreaName, locale }) {
  const mn = locale === "mn";

  if (!weakAreaName) return null;

  return (
    <div style={{
      marginBottom: 16,
      padding: "9px 13px",
      borderRadius: 11,
      background: redAlpha(0.08),
      border: `1px solid ${redAlpha(0.2)}`,
      borderLeft: `3px solid ${RED}`,
    }}>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>
        {mn ? "🎯 Хамгийн сул тал: " : "🎯 Weakest area: "}
      </span>
      <span style={{ fontSize: 11, fontWeight: 900, color: AREA_COLOR[weakAreaName] || RED }}>
        {weakAreaName}
      </span>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>
        {mn ? "— автоматаар сонгогдлоо" : "— auto-selected"}
      </span>
    </div>
  );
}
