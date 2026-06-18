"use client";

import DebugSSection from "./DebugSSection";
import DebugCheck from "./DebugCheck";

export default function DebugStatusSection({ stats, totalRejects }) {
  return (
    <DebugSSection title="STATUS">
      <DebugCheck ok={stats.avgVisPct >= 55}        text="MediaPipe sees you" />
      <DebugCheck ok={stats.totalPunches > 0}        text="Punches counted" />
      <DebugCheck ok={stats.avgConfidencePct >= 55}  text="Confidence OK" />
      <DebugCheck ok={totalRejects > 0}              text="Gates active (filtering)" />
      <DebugCheck ok={stats.unstablePct < 25}        text="Tracking stable" />
    </DebugSSection>
  );
}
