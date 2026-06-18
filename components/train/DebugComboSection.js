"use client";

import DebugSSection from "./DebugSSection";
import DebugSRow from "./DebugSRow";

function qualColor(v) {
  return v >= 75 ? "#34D399" : v >= 50 ? "#F59E0B" : "#F87171";
}

export default function DebugComboSection({ comboStats }) {
  if (!comboStats) return null;

  const lc = comboStats.lastCombo;
  const qc = lc?.quality;

  return (
    <DebugSSection title="3B. COMBO SEQUENCING">
      <DebugSRow
        label="Combos"
        value={comboStats.comboCount}
        color={comboStats.comboCount > 0 ? "#34D399" : undefined}
      />
      <DebugSRow
        label="Max length"
        value={comboStats.maxComboLength}
        color={
          comboStats.maxComboLength >= 4 ? "#34D399" :
          comboStats.maxComboLength >= 3 ? "#F59E0B" : undefined
        }
      />
      {lc && (
        <>
          <DebugSRow label="Last" value={`${lc.name} (${lc.length})`} color="#60A5FA" />
          <DebugSRow label="└ avg gap"    value={`${lc.avgGapMs}ms`}
            color={lc.avgGapMs < 380 ? "#34D399" : lc.avgGapMs < 600 ? "#F59E0B" : "#F87171"} />
          <DebugSRow label="└ confidence" value={`${Math.round((lc.confidence ?? 0) * 100)}%`}
            color={qualColor(Math.round((lc.confidence ?? 0) * 100))} />
          {qc && (
            <>
              <DebugSRow label="└ quality"     value={qc.overall}    color={qualColor(qc.overall)} />
              <DebugSRow label="  rhythm"       value={qc.rhythm}     color={qualColor(qc.rhythm)} />
              <DebugSRow label="  smoothness"   value={qc.smoothness} color={qualColor(qc.smoothness)} />
              <DebugSRow label="  recovery"     value={qc.recovery}   color={qualColor(qc.recovery)} />
              <DebugSRow label="  continuity"   value={qc.continuity} color={qualColor(qc.continuity)} />
            </>
          )}
          {lc.validation?.issues?.length > 0 && (
            <DebugSRow label="└ issues" value={lc.validation.issues.join(", ")} color="#F87171" />
          )}
          {lc.coaching?.length > 0 && (
            <DebugSRow label="└ coach" value={lc.coaching[0]} color="#94A3B8" />
          )}
        </>
      )}
    </DebugSSection>
  );
}
