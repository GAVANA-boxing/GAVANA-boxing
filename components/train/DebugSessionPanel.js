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

export default function DebugSessionPanel({ stats, debugEnabled }) {
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
