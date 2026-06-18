"use client";

import { loc } from "@/lib/loc";
import { RED, GOLD } from "@/lib/tokens";
import { RadarChart, StyleDNA, PanelCard } from "@/components/dashboard/DashboardWidgets";

export default function CombatProfilePanels({
  locale,
  radarStats,
  prevRadarStats,
  trainingSessions,
}) {
  return (
    <>
      <PanelCard
        label={loc(locale, "Дайны профайл", "전투 프로필", "Combat Profile")}
        accent={RED}
        tag="6 METRICS"
      >
        <div style={{ background: `radial-gradient(ellipse at center, rgba(255,59,48,0.06) 0%, transparent 70%)`, padding: "4px 0 0" }}>
          <RadarChart stats={radarStats} prevStats={prevRadarStats} locale={locale} sessions={trainingSessions} />
        </div>
      </PanelCard>

      <PanelCard
        label={loc(locale, "Тоглолтын хэв маяг", "스타일 DNA", "Style DNA")}
        accent={GOLD}
        tag="5 ATTRS"
      >
        <StyleDNA radarStats={radarStats} />
      </PanelCard>
    </>
  );
}
