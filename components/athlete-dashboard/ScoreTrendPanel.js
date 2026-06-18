"use client";

import { loc } from "@/lib/loc";
import { RED } from "@/lib/tokens";
import { ScoreChart, PanelCard } from "@/components/dashboard/DashboardWidgets";

export default function ScoreTrendPanel({ locale, chronoScores, t }) {
  return (
    <PanelCard
      label={loc(locale, "Оноогийн чиглэл", "점수 추세", "Score Trend")}
      accent={RED}
      tag={`${chronoScores.length} SESS`}
    >
      <div style={{ padding: "2px 0 0" }}>
        <ScoreChart scores={chronoScores} t={t} />
      </div>
    </PanelCard>
  );
}
