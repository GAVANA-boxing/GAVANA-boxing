"use client";

import DebugSSection from "./DebugSSection";
import DebugSRow from "./DebugSRow";

const STYLE_COLOR = {
  pressure:  "#F87171",
  outboxer:  "#34D399",
  explosive: "#F59E0B",
  counter:   "#94A3B8",
};

export default function DebugBoxingSection({ boxing }) {
  if (!boxing) return null;

  return (
    <DebugSSection title="4. BOXING INTELLIGENCE">
      {/* Style */}
      <DebugSRow
        label="Style"
        value={boxing.styleLabel ?? "—"}
        color={STYLE_COLOR[boxing.style] ?? "rgba(255,255,255,0.85)"}
      />
      <DebugSRow
        label="└ confidence"
        value={boxing.styleConfidence != null ? `${Math.round(boxing.styleConfidence * 100)}%` : "—"}
        color={
          (boxing.styleConfidence ?? 0) >= 0.55 ? "#34D399" :
          (boxing.styleConfidence ?? 0) >= 0.3  ? "#F59E0B" : "#F87171"
        }
      />
      {/* Weakness */}
      <DebugSRow
        label="Weakness"
        value={boxing.weakness?.label ?? "—"}
        color="#F59E0B"
      />
      {boxing.weakness?.score != null && (
        <DebugSRow
          label="└ score"
          value={boxing.weakness.score}
          color={boxing.weakness.score < 35 ? "#F87171" : "#F59E0B"}
        />
      )}
      {/* Scores */}
      <DebugSRow
        label="Guard recovery"
        value={boxing.scores?.guardRecovery != null ? `${boxing.scores.guardRecovery.score} (${boxing.scores.guardRecovery.rating})` : "—"}
        color={
          (boxing.scores?.guardRecovery?.score ?? 0) >= 70 ? "#34D399" :
          (boxing.scores?.guardRecovery?.score ?? 0) >= 40 ? "#F59E0B" : "#F87171"
        }
      />
      <DebugSRow
        label="Rhythm"
        value={boxing.scores?.comboRhythm != null ? `${boxing.scores.comboRhythm.score} (${boxing.scores.comboRhythm.rating})` : "—"}
        color={
          (boxing.scores?.comboRhythm?.score ?? 0) >= 65 ? "#34D399" :
          (boxing.scores?.comboRhythm?.score ?? 0) >= 38 ? "#F59E0B" : "#F87171"
        }
      />
      <DebugSRow
        label="Jab quality"
        value={boxing.scores?.jabQuality != null ? `${boxing.scores.jabQuality.score} (ext:${boxing.scores.jabQuality.extension} snap:${boxing.scores.jabQuality.snap})` : "—"}
        color={
          (boxing.scores?.jabQuality?.score ?? 0) >= 65 ? "#34D399" :
          (boxing.scores?.jabQuality?.score ?? 0) >= 40 ? "#F59E0B" : "#F87171"
        }
      />
      <DebugSRow
        label="Cross quality"
        value={boxing.scores?.crossQuality != null ? `${boxing.scores.crossQuality.score} (ext:${boxing.scores.crossQuality.extension} snap:${boxing.scores.crossQuality.snap})` : "—"}
        color={
          (boxing.scores?.crossQuality?.score ?? 0) >= 65 ? "#34D399" :
          (boxing.scores?.crossQuality?.score ?? 0) >= 40 ? "#F59E0B" : "#F87171"
        }
      />
      <DebugSRow
        label="Hook quality"
        value={boxing.scores?.hookQuality != null ? `${boxing.scores.hookQuality.score} (elbow:${boxing.scores.hookQuality.elbowAngle} arc:${boxing.scores.hookQuality.arc})` : "—"}
        color={
          (boxing.scores?.hookQuality?.score ?? 0) >= 65 ? "#34D399" :
          (boxing.scores?.hookQuality?.score ?? 0) >= 40 ? "#F59E0B" : "#F87171"
        }
      />
      <DebugSRow
        label="Balance"
        value={boxing.scores?.balance != null ? `${boxing.scores.balance.score} (${boxing.scores.balance.status})` : "—"}
        color={(boxing.scores?.balance?.score ?? 0) >= 65 ? "#34D399" : "#F59E0B"}
      />
      <DebugSRow
        label="Hip rotation"
        value={boxing.scores?.hipRotation != null ? `${boxing.scores.hipRotation.score} (${boxing.scores.hipRotation.status})` : "—"}
        color={(boxing.scores?.hipRotation?.score ?? 0) >= 65 ? "#34D399" : "#F59E0B"}
      />

      {/* Coaching */}
      {boxing.coaching?.length > 0 && (
        <div style={{ marginTop: 5 }}>
          <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>
            COACHING
          </div>
          {boxing.coaching.slice(0, 3).map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 5, padding: "2px 0", alignItems: "flex-start" }}>
              <span style={{ fontSize: 8, flexShrink: 0, color: c.type === "strength" ? "#34D399" : "#F59E0B", fontWeight: 900 }}>
                {c.type === "strength" ? "✓" : "→"}
              </span>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
                {c.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Combat System — Phase 5 */}
      {(boxing.roundBreakdown || boxing.cornerAdvice?.length > 0) && (
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>
            9. COMBAT SYSTEM
          </div>
          {boxing.roundBreakdown && (() => {
            const rb = boxing.roundBreakdown;
            return (
              <>
                <DebugSRow label="1st half" value={`${rb.round1.count}p  q${rb.round1.avgQuality}  ${rb.round1.pace}/min`} />
                <DebugSRow label="2nd half" value={`${rb.round2.count}p  q${rb.round2.avgQuality}  ${rb.round2.pace}/min`} />
                <DebugSRow label="Pace trend"    value={rb.paceTrend}
                  color={rb.paceTrend === "accelerating" ? "#34D399" : rb.paceTrend === "decelerating" ? "#F87171" : undefined} />
                <DebugSRow label="Quality trend" value={rb.qualityTrend}
                  color={rb.qualityTrend === "fading" ? "#F87171" : rb.qualityTrend === "improving" ? "#34D399" : undefined} />
              </>
            );
          })()}
          {boxing.cornerAdvice?.map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: 5, padding: "2px 0", alignItems: "flex-start", marginTop: 2 }}>
              <span style={{ fontSize: 8, flexShrink: 0, color: "#6EE7B7", fontWeight: 900 }}>▸</span>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{tip}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fighter DNA — Phase 4 */}
      {boxing.fighterDNA && (
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>
            8. FIGHTER DNA
          </div>
          <DebugSRow label="Archetype" value={boxing.fighterDNA.archetypeLabel} color="#FCD34D" />
          <DebugSRow label="Similarity" value={`${boxing.fighterDNA.similarity}%`}
            color={boxing.fighterDNA.similarity >= 60 ? "#34D399" : boxing.fighterDNA.similarity >= 40 ? "#F59E0B" : "#F87171"} />
          {boxing.fighterDNA.archetypeTraits?.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 5, padding: "1.5px 0", alignItems: "flex-start" }}>
              <span style={{ fontSize: 8, flexShrink: 0, color: "#FCD34D", fontWeight: 900 }}>·</span>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ring IQ — Phase 3 */}
      {boxing.ringIQ && (
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>
            7. RING IQ
          </div>
          <DebugSRow label="IQ Score" value={boxing.ringIQ.iqScore}
            color={boxing.ringIQ.iqScore >= 80 ? "#34D399" : boxing.ringIQ.iqScore >= 60 ? "#F59E0B" : "#F87171"} />
          <DebugSRow label="Label" value={boxing.ringIQ.iqLabel} color="#F9A8D4" />
          <DebugSRow label="Panic flurries" value={boxing.ringIQ.panicFlurries.length}
            color={boxing.ringIQ.panicFlurries.length > 0 ? "#F87171" : undefined} />
          <DebugSRow label="Calm pacing" value={boxing.ringIQ.calmPacing ? "yes" : "no"}
            color={boxing.ringIQ.calmPacing ? "#34D399" : undefined} />
          <DebugSRow label="Overcommit %" value={`${boxing.ringIQ.overcommitRate}%`}
            color={boxing.ringIQ.overcommitRate >= 20 ? "#F87171" : undefined} />
          <DebugSRow label="Predictable rhythm" value={boxing.ringIQ.predictableRhythm ? "yes" : "no"}
            color={boxing.ringIQ.predictableRhythm ? "#F59E0B" : undefined} />
          {boxing.ringIQ.repeatedCombos.length > 0 && (
            <DebugSRow label="Repeated combo" value={`${boxing.ringIQ.repeatedCombos[0].sequence} ×${boxing.ringIQ.repeatedCombos[0].count}`} />
          )}
          {boxing.ringIQ.cues?.map((cue, i) => (
            <div key={i} style={{ display: "flex", gap: 5, padding: "2px 0", alignItems: "flex-start", marginTop: 2 }}>
              <span style={{ fontSize: 8, flexShrink: 0, color: "#F9A8D4", fontWeight: 900 }}>→</span>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{cue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Defensive Intelligence — Phase 2 */}
      {boxing.defensive && (
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>
            6. DEFENSIVE INTELLIGENCE
          </div>
          <DebugSRow label="Style" value={boxing.defensive.defensiveStyleLabel} color="#A78BFA" />
          <DebugSRow label="Slips" value={boxing.defensive.slipCount} />
          <DebugSRow label="Bobs"  value={boxing.defensive.bobCount} />
          <DebugSRow label="Total defensive" value={boxing.defensive.defensiveTotal} />
          <DebugSRow label="Freq /min" value={boxing.defensive.defensiveFreqPerMin} />
          {boxing.defensive.defensiveCues?.map((cue, i) => (
            <div key={i} style={{ display: "flex", gap: 5, padding: "2px 0", alignItems: "flex-start", marginTop: 2 }}>
              <span style={{ fontSize: 8, flexShrink: 0, color: "#A78BFA", fontWeight: 900 }}>→</span>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{cue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tactical Identity — Phase 1 */}
      {boxing.tactical && (
        <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>
            5. TACTICAL IDENTITY
          </div>
          <DebugSRow
            label="Profile"
            value={boxing.tactical.profileLabel}
            color="#60A5FA"
          />
          <DebugSRow label="Single shot %" value={`${boxing.tactical.singleShotPct}%`}
            color={boxing.tactical.singleShotPct > 65 ? "#F59E0B" : "#34D399"} />
          <DebugSRow label="Pressure chain %" value={`${boxing.tactical.pressureChainPct}%`} />
          <DebugSRow label="Counter %"         value={`${boxing.tactical.counterPct}%`} />
          <DebugSRow label="Rhythm aggression" value={boxing.tactical.rhythmAggression}
            color={boxing.tactical.rhythmAggression >= 65 ? "#34D399" : boxing.tactical.rhythmAggression >= 35 ? "#F59E0B" : undefined} />
          {boxing.tactical.entryPreference && (
            <DebugSRow
              label="Entry pref"
              value={`J${boxing.tactical.entryPreference.jab}% C${boxing.tactical.entryPreference.cross}% H${boxing.tactical.entryPreference.hook}%`}
            />
          )}
          {boxing.tactical.tacticalCues?.map((cue, i) => (
            <div key={i} style={{ display: "flex", gap: 5, padding: "2px 0", alignItems: "flex-start", marginTop: 2 }}>
              <span style={{ fontSize: 8, flexShrink: 0, color: "#60A5FA", fontWeight: 900 }}>→</span>
              <span style={{ fontSize: 7, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{cue}</span>
            </div>
          ))}
        </div>
      )}
    </DebugSSection>
  );
}
