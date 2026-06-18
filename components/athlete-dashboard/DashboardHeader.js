"use client";

import { GOLD, goldAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";

export default function DashboardHeader({
  locale,
  isDesktop,
  username,
  displayName,
  sessionsReady,
  sessionCount,
  onShareClick,
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 900, color: "#FF3B30", letterSpacing: 2, textTransform: "uppercase" }}>
          COMBAT · OS
        </p>
        <h1 style={{ margin: 0, fontSize: isDesktop ? 28 : 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
          {username || displayName || loc(locale, "Тамирчны ахиц", "선수 현황", "My Progress")}
        </h1>
      </div>
      {sessionsReady && sessionCount >= 3 && (
        <button
          type="button"
          onClick={onShareClick}
          style={{
            marginTop: 4, padding: "7px 12px", borderRadius: 10,
            background: goldAlpha(0.1), border: `1px solid ${goldAlpha(0.3)}`,
            color: GOLD, fontSize: 11, fontWeight: 900, cursor: "pointer",
            letterSpacing: 0.3, whiteSpace: "nowrap",
          }}
        >
          📤 Share
        </button>
      )}
    </div>
  );
}
