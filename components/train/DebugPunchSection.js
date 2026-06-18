"use client";

import DebugSSection from "./DebugSSection";
import DebugSRow from "./DebugSRow";

export default function DebugPunchSection({ stats }) {
  return (
    <DebugSSection title="2. PUNCH DETECTION">
      <DebugSRow
        label="Total"
        value={stats.totalPunches}
        color={stats.totalPunches > 0 ? "#34D399" : "#F87171"}
      />
      <DebugSRow
        label="Jab / Cross / Hook"
        value={`${stats.jabCount} / ${stats.crossCount} / ${stats.hookCount}`}
      />
      <DebugSRow
        label="Avg confidence"
        value={`${stats.avgConfidencePct}%`}
        color={
          stats.avgConfidencePct >= 70 ? "#34D399" :
          stats.avgConfidencePct >= 45 ? "#F59E0B" : "#F87171"
        }
      />
      <DebugSRow
        label="Low conf (<45%)"
        value={stats.lowConfCount}
        color={(stats.lowConfCount ?? 0) > 0 ? "#F59E0B" : "rgba(255,255,255,0.35)"}
      />
      {stats.accepts && (
        <>
          <DebugSRow label="└ full gate"    value={stats.accepts.full        ?? 0} color="#34D399" />
          <DebugSRow label="└ snap bypass"  value={stats.accepts.snap_bypass ?? 0}
                color={(stats.accepts.snap_bypass ?? 0) > 0 ? "#F59E0B" : "rgba(255,255,255,0.3)"} />
          <DebugSRow label="└ upper body"   value={stats.accepts.upper_body  ?? 0}
                color={(stats.accepts.upper_body ?? 0) > 0 ? "#94A3B8" : "rgba(255,255,255,0.3)"} />
        </>
      )}
      {stats.stanceHint && stats.stanceHint !== "unknown" && (
        <DebugSRow
          label="Stance"
          value={stats.stanceHint.toUpperCase()}
          color="#34D399"
        />
      )}
    </DebugSSection>
  );
}
