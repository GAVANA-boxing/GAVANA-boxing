"use client";

import DebugSSection from "./DebugSSection";
import DebugSRow from "./DebugSRow";

export default function DebugTrackingSection({ stats, fullPct, upperHipPct }) {
  return (
    <DebugSSection title="3. TRACKING QUALITY">
      <DebugSRow
        label="Avg arm vis"
        value={`${stats.avgVisPct}%`}
        color={
          stats.avgVisPct >= 70 ? "#34D399" :
          stats.avgVisPct >= 45 ? "#F59E0B" : "#F87171"
        }
      />
      <DebugSRow
        label="Full body"
        value={`${fullPct}%`}
        color={fullPct >= 50 ? "#34D399" : "#F59E0B"}
      />
      <DebugSRow label="Upper + hips" value={`${upperHipPct}%`} />
      <DebugSRow
        label="Unstable frames"
        value={`${stats.unstablePct}%`}
        color={
          stats.unstablePct < 15 ? "#34D399" :
          stats.unstablePct < 35 ? "#F59E0B" : "#F87171"
        }
      />
    </DebugSSection>
  );
}
