"use client";

import { loc } from "@/lib/loc";
import { BRAND, card, sectionLabel } from "@/components/ui/brand";

// AI coach's short debrief. Errors are not shown here (TrainResultModal hides
// the card) — the deterministic tip above already covers the round.
export default function AIDebriefCard({ debrief, debriefLoading, locale = "en" }) {
  return (
    <div style={{ ...card, margin: "12px 20px 0", padding: "14px 16px", textAlign: "left" }}>
      <p style={sectionLabel}>{loc(locale, "AI дасгалжуулагч", "AI 코치", "AI coach")}</p>
      {debriefLoading ? (
        <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 10 }} aria-label={loc(locale, "Бичиж байна…", "작성 중…", "Writing…")}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND.gold, opacity: 0.6, animation: `dotBounce 1.1s ease-in-out ${i * 0.18}s infinite` }} />
          ))}
        </div>
      ) : (
        <p style={{ margin: "8px 0 0", fontSize: 14, color: BRAND.muted, lineHeight: 1.6 }}>{debrief}</p>
      )}
    </div>
  );
}
