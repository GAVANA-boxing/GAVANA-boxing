"use client";

function SRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "1.5px 0" }}>
      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: 700, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 8, color: color || "rgba(255,255,255,0.85)", fontWeight: 900, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function SSection({ title, children }) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.22)", marginBottom: 5 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Check({ ok, text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "1.5px 0" }}>
      <span style={{ fontSize: 9, color: ok ? "#34D399" : "#F87171", fontWeight: 900, flexShrink: 0 }}>{ok ? "✔" : "✗"}</span>
      <span style={{ fontSize: 8, color: ok ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>{text}</span>
    </div>
  );
}

const GRADE_LABELS = { A: "CLEAN", B: "USABLE", C: "NOISY", D: "UNRELIABLE" };
const GRADE_NOTES  = {
  A: "Tracking stable, punches confident. Results reliable.",
  B: "Mostly good — minor noise or confidence gaps.",
  C: "Tracking or confidence degraded. Improve lighting / camera distance.",
  D: "Too much noise or poor visibility. Move closer, better light.",
};
const GRADE_COLOR  = { A: "#34D399", B: "#F59E0B", C: "#F87171", D: "#9B1C1C" };

function computeGrade({ avgConfidencePct = 0, avgVisPct = 0, unstablePct = 100, totalPunches = 0 }) {
  // Grade considers: detection confidence, tracking visibility, instability
  if (avgConfidencePct >= 70 && avgVisPct >= 70 && unstablePct < 15) return "A";
  if (avgConfidencePct >= 55 && avgVisPct >= 55 && unstablePct < 30) return "B";
  if (avgConfidencePct >= 40 || avgVisPct >= 40)                     return "C";
  return "D";
}

const STYLE_COLOR = {
  pressure:  "#F87171",
  outboxer:  "#34D399",
  explosive: "#F59E0B",
  counter:   "#94A3B8",
};

export default function DebugSessionPanel({ stats, boxing, debugEnabled }) {
  if (!debugEnabled || !stats) return null;

  const grade      = computeGrade(stats);
  const gradeColor = GRADE_COLOR[grade] || "#888";
  const r          = stats.rejects || {};
  const totalRejects = Object.values(r).reduce((s, v) => s + (v || 0), 0);
  const cq         = stats.cameraQualityBreakdown || {};
  const totalFrames = Math.max(stats.frameCount || 1, 1);
  const fullPct     = Math.round(((cq.full_body || 0) / totalFrames) * 100);
  const upperHipPct = Math.round(((cq.upper_body_hips || 0) / totalFrames) * 100);

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, zIndex: 500,
      width: 210, maxHeight: "100vh", overflowY: "auto",
      background: "rgba(0,0,0,0.97)", borderLeft: "1px solid rgba(255,255,255,0.09)",
      padding: "10px 12px",
      WebkitOverflowScrolling: "touch",
      fontFamily: "monospace",
    }}>

      {/* ── Header + grade ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.22)", marginBottom: 2 }}>
            DEBUG REPORT
          </div>
          <div style={{ fontSize: 7, color: "rgba(255,255,255,0.4)" }}>
            {stats.frameCount} frames · {stats.estimatedFps} fps
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: gradeColor, lineHeight: 1 }}>{grade}</div>
          <div style={{ fontSize: 6, color: "rgba(255,255,255,0.22)", marginTop: 1 }}>RELIABILITY</div>
        </div>
      </div>

      {/* ── Quick status ── */}
      <SSection title="STATUS">
        <Check ok={stats.avgVisPct >= 55}        text="MediaPipe sees you" />
        <Check ok={stats.totalPunches > 0}        text="Punches counted" />
        <Check ok={stats.avgConfidencePct >= 55}  text="Confidence OK" />
        <Check ok={totalRejects > 0}              text="Gates active (filtering)" />
        <Check ok={stats.unstablePct < 25}        text="Tracking stable" />
      </SSection>

      {/* ── Gating / near-misses ── */}
      <SSection title="1. GATING / NEAR-MISSES">
        <SRow label="Total rejects" value={totalRejects} />
        <SRow
          label="└ no ext/z-fwd"
          value={r.noExt ?? 0}
          color={(r.noExt ?? 0) > 8 ? "#F59E0B" : undefined}
        />
        <SRow
          label="└ phone jerk"
          value={r.jerk ?? 0}
        />
        <SRow
          label="└ low velocity"
          value={r.lowVel ?? 0}
        />
        <SRow
          label="└ rate gate"
          value={r.rate ?? 0}
          color={(r.rate ?? 0) > 8 ? "#F59E0B" : undefined}
        />
        <SRow label="└ cooldown"   value={r.cooldown ?? 0} />
        <SRow label="└ calib wait" value={r.calib    ?? 0} />
        <SRow
          label="└ unstable"
          value={r.unstable ?? 0}
          color={(r.unstable ?? 0) > 3 ? "#F87171" : undefined}
        />
        <SRow label="└ brief pulse" value={r.brief ?? 0} />
      </SSection>

      {/* ── Punch quality ── */}
      <SSection title="2. PUNCH DETECTION">
        <SRow
          label="Total"
          value={stats.totalPunches}
          color={stats.totalPunches > 0 ? "#34D399" : "#F87171"}
        />
        <SRow
          label="Jab / Cross / Hook"
          value={`${stats.jabCount} / ${stats.crossCount} / ${stats.hookCount}`}
        />
        <SRow
          label="Avg confidence"
          value={`${stats.avgConfidencePct}%`}
          color={
            stats.avgConfidencePct >= 70 ? "#34D399" :
            stats.avgConfidencePct >= 45 ? "#F59E0B" : "#F87171"
          }
        />
        <SRow
          label="Low conf (<45%)"
          value={stats.lowConfCount}
          color={(stats.lowConfCount ?? 0) > 0 ? "#F59E0B" : "rgba(255,255,255,0.35)"}
        />
        {stats.accepts && (
          <>
            <SRow label="└ full gate"    value={stats.accepts.full        ?? 0} color="#34D399" />
            <SRow label="└ snap bypass"  value={stats.accepts.snap_bypass ?? 0}
                  color={(stats.accepts.snap_bypass ?? 0) > 0 ? "#F59E0B" : "rgba(255,255,255,0.3)"} />
            <SRow label="└ upper body"   value={stats.accepts.upper_body  ?? 0}
                  color={(stats.accepts.upper_body ?? 0) > 0 ? "#94A3B8" : "rgba(255,255,255,0.3)"} />
          </>
        )}
        {stats.stanceHint && stats.stanceHint !== "unknown" && (
          <SRow
            label="Stance"
            value={stats.stanceHint.toUpperCase()}
            color="#34D399"
          />
        )}
      </SSection>

      {/* ── Tracking ── */}
      <SSection title="3. TRACKING QUALITY">
        <SRow
          label="Avg arm vis"
          value={`${stats.avgVisPct}%`}
          color={
            stats.avgVisPct >= 70 ? "#34D399" :
            stats.avgVisPct >= 45 ? "#F59E0B" : "#F87171"
          }
        />
        <SRow
          label="Full body"
          value={`${fullPct}%`}
          color={fullPct >= 50 ? "#34D399" : "#F59E0B"}
        />
        <SRow label="Upper + hips" value={`${upperHipPct}%`} />
        <SRow
          label="Unstable frames"
          value={`${stats.unstablePct}%`}
          color={
            stats.unstablePct < 15 ? "#34D399" :
            stats.unstablePct < 35 ? "#F59E0B" : "#F87171"
          }
        />
      </SSection>

      {/* ── Combo sequencing ── */}
      {stats.comboStats && (
        <SSection title="3B. COMBO SEQUENCING">
          <SRow
            label="Combos"
            value={stats.comboStats.comboCount}
            color={stats.comboStats.comboCount > 0 ? "#34D399" : undefined}
          />
          <SRow
            label="Max length"
            value={stats.comboStats.maxComboLength}
            color={
              stats.comboStats.maxComboLength >= 4 ? "#34D399" :
              stats.comboStats.maxComboLength >= 3 ? "#F59E0B" : undefined
            }
          />
          {(() => {
            const lc = stats.comboStats.lastCombo;
            if (!lc) return null;
            const qc = lc.quality;
            const qualColor = (v) => v >= 75 ? "#34D399" : v >= 50 ? "#F59E0B" : "#F87171";
            return (
              <>
                <SRow label="Last" value={`${lc.name} (${lc.length})`} color="#60A5FA" />
                <SRow label="└ avg gap"    value={`${lc.avgGapMs}ms`}
                  color={lc.avgGapMs < 380 ? "#34D399" : lc.avgGapMs < 600 ? "#F59E0B" : "#F87171"} />
                <SRow label="└ confidence" value={`${Math.round((lc.confidence ?? 0) * 100)}%`}
                  color={qualColor(Math.round((lc.confidence ?? 0) * 100))} />
                {qc && (
                  <>
                    <SRow label="└ quality"     value={qc.overall}    color={qualColor(qc.overall)} />
                    <SRow label="  rhythm"       value={qc.rhythm}     color={qualColor(qc.rhythm)} />
                    <SRow label="  smoothness"   value={qc.smoothness} color={qualColor(qc.smoothness)} />
                    <SRow label="  recovery"     value={qc.recovery}   color={qualColor(qc.recovery)} />
                    <SRow label="  continuity"   value={qc.continuity} color={qualColor(qc.continuity)} />
                  </>
                )}
                {lc.validation?.issues?.length > 0 && (
                  <SRow label="└ issues" value={lc.validation.issues.join(", ")} color="#F87171" />
                )}
                {lc.coaching?.length > 0 && (
                  <SRow label="└ coach" value={lc.coaching[0]} color="#94A3B8" />
                )}
              </>
            );
          })()}
        </SSection>
      )}

      {/* ── Boxing intelligence ── */}
      {boxing && (
        <SSection title="4. BOXING INTELLIGENCE">
          {/* Style */}
          <SRow
            label="Style"
            value={boxing.styleLabel ?? "—"}
            color={STYLE_COLOR[boxing.style] ?? "rgba(255,255,255,0.85)"}
          />
          <SRow
            label="└ confidence"
            value={boxing.styleConfidence != null ? `${Math.round(boxing.styleConfidence * 100)}%` : "—"}
            color={
              (boxing.styleConfidence ?? 0) >= 0.55 ? "#34D399" :
              (boxing.styleConfidence ?? 0) >= 0.3  ? "#F59E0B" : "#F87171"
            }
          />
          {/* Weakness */}
          <SRow
            label="Weakness"
            value={boxing.weakness?.label ?? "—"}
            color="#F59E0B"
          />
          {boxing.weakness?.score != null && (
            <SRow
              label="└ score"
              value={boxing.weakness.score}
              color={boxing.weakness.score < 35 ? "#F87171" : "#F59E0B"}
            />
          )}
          {/* Scores */}
          <SRow
            label="Guard recovery"
            value={boxing.scores?.guardRecovery != null ? `${boxing.scores.guardRecovery.score} (${boxing.scores.guardRecovery.rating})` : "—"}
            color={
              (boxing.scores?.guardRecovery?.score ?? 0) >= 70 ? "#34D399" :
              (boxing.scores?.guardRecovery?.score ?? 0) >= 40 ? "#F59E0B" : "#F87171"
            }
          />
          <SRow
            label="Rhythm"
            value={boxing.scores?.comboRhythm != null ? `${boxing.scores.comboRhythm.score} (${boxing.scores.comboRhythm.rating})` : "—"}
            color={
              (boxing.scores?.comboRhythm?.score ?? 0) >= 65 ? "#34D399" :
              (boxing.scores?.comboRhythm?.score ?? 0) >= 38 ? "#F59E0B" : "#F87171"
            }
          />
          <SRow
            label="Jab quality"
            value={boxing.scores?.jabQuality != null ? `${boxing.scores.jabQuality.score} (ext:${boxing.scores.jabQuality.extension} snap:${boxing.scores.jabQuality.snap})` : "—"}
            color={
              (boxing.scores?.jabQuality?.score ?? 0) >= 65 ? "#34D399" :
              (boxing.scores?.jabQuality?.score ?? 0) >= 40 ? "#F59E0B" : "#F87171"
            }
          />
          <SRow
            label="Cross quality"
            value={boxing.scores?.crossQuality != null ? `${boxing.scores.crossQuality.score} (ext:${boxing.scores.crossQuality.extension} snap:${boxing.scores.crossQuality.snap})` : "—"}
            color={
              (boxing.scores?.crossQuality?.score ?? 0) >= 65 ? "#34D399" :
              (boxing.scores?.crossQuality?.score ?? 0) >= 40 ? "#F59E0B" : "#F87171"
            }
          />
          <SRow
            label="Hook quality"
            value={boxing.scores?.hookQuality != null ? `${boxing.scores.hookQuality.score} (elbow:${boxing.scores.hookQuality.elbowAngle} arc:${boxing.scores.hookQuality.arc})` : "—"}
            color={
              (boxing.scores?.hookQuality?.score ?? 0) >= 65 ? "#34D399" :
              (boxing.scores?.hookQuality?.score ?? 0) >= 40 ? "#F59E0B" : "#F87171"
            }
          />
          <SRow
            label="Balance"
            value={boxing.scores?.balance != null ? `${boxing.scores.balance.score} (${boxing.scores.balance.status})` : "—"}
            color={(boxing.scores?.balance?.score ?? 0) >= 65 ? "#34D399" : "#F59E0B"}
          />
          <SRow
            label="Hip rotation"
            value={boxing.scores?.hipRotation != null ? `${boxing.scores.hipRotation.score} (${boxing.scores.hipRotation.status})` : "—"}
            color={(boxing.scores?.hipRotation?.score ?? 0) >= 65 ? "#34D399" : "#F59E0B"}
          />
          {/* Top coaching reasons */}
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

          {/* Defensive Intelligence — Phase 2 */}
          {boxing.defensive && (
            <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.22)", marginBottom: 4 }}>
                6. DEFENSIVE INTELLIGENCE
              </div>
              <SRow label="Style" value={boxing.defensive.defensiveStyleLabel} color="#A78BFA" />
              <SRow label="Slips" value={boxing.defensive.slipCount} />
              <SRow label="Bobs"  value={boxing.defensive.bobCount} />
              <SRow label="Total defensive" value={boxing.defensive.defensiveTotal} />
              <SRow label="Freq /min" value={boxing.defensive.defensiveFreqPerMin} />
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
              <SRow
                label="Profile"
                value={boxing.tactical.profileLabel}
                color="#60A5FA"
              />
              <SRow label="Single shot %" value={`${boxing.tactical.singleShotPct}%`}
                color={boxing.tactical.singleShotPct > 65 ? "#F59E0B" : "#34D399"} />
              <SRow label="Pressure chain %" value={`${boxing.tactical.pressureChainPct}%`} />
              <SRow label="Counter %"         value={`${boxing.tactical.counterPct}%`} />
              <SRow label="Rhythm aggression" value={boxing.tactical.rhythmAggression}
                color={boxing.tactical.rhythmAggression >= 65 ? "#34D399" : boxing.tactical.rhythmAggression >= 35 ? "#F59E0B" : undefined} />
              {boxing.tactical.entryPreference && (
                <SRow
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
        </SSection>
      )}

      {/* ── Grade explanation ── */}
      <div style={{
        padding: "7px 9px",
        background: `${gradeColor}12`,
        borderRadius: 6,
        border: `1px solid ${gradeColor}35`,
      }}>
        <div style={{ fontSize: 8, fontWeight: 900, color: gradeColor, marginBottom: 3 }}>
          {grade} — {GRADE_LABELS[grade]}
        </div>
        <div style={{ fontSize: 7, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
          {GRADE_NOTES[grade]}
        </div>
      </div>
    </div>
  );
}
