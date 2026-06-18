"use client";

import DebugGradeBox from "./DebugGradeBox";
import DebugStatusSection from "./DebugStatusSection";
import DebugGatingSection from "./DebugGatingSection";
import DebugPunchSection from "./DebugPunchSection";
import DebugTrackingSection from "./DebugTrackingSection";
import DebugComboSection from "./DebugComboSection";
import DebugBoxingSection from "./DebugBoxingSection";

const GRADE_COLOR = { A: "#34D399", B: "#F59E0B", C: "#F87171", D: "#9B1C1C" };

function computeGrade({ avgConfidencePct = 0, avgVisPct = 0, unstablePct = 100, totalPunches = 0 }) {
  if (avgConfidencePct >= 70 && avgVisPct >= 70 && unstablePct < 15) return "A";
  if (avgConfidencePct >= 55 && avgVisPct >= 55 && unstablePct < 30) return "B";
  if (avgConfidencePct >= 40 || avgVisPct >= 40)                     return "C";
  return "D";
}

export default function DebugSessionPanel({ stats, boxing, debugEnabled }) {
  if (!debugEnabled || !stats) return null;

  const grade        = computeGrade(stats);
  const gradeColor   = GRADE_COLOR[grade] || "#888";
  const r            = stats.rejects || {};
  const totalRejects = Object.values(r).reduce((s, v) => s + (v || 0), 0);
  const cq           = stats.cameraQualityBreakdown || {};
  const totalFrames  = Math.max(stats.frameCount || 1, 1);
  const fullPct      = Math.round(((cq.full_body || 0) / totalFrames) * 100);
  const upperHipPct  = Math.round(((cq.upper_body_hips || 0) / totalFrames) * 100);

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, zIndex: 500,
      width: 210, maxHeight: "100vh", overflowY: "auto",
      background: "rgba(0,0,0,0.97)", borderLeft: "1px solid rgba(255,255,255,0.09)",
      padding: "10px 12px",
      WebkitOverflowScrolling: "touch",
      fontFamily: "monospace",
    }}>

      {/* Header + grade */}
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

      <DebugStatusSection stats={stats} totalRejects={totalRejects} />

      <DebugGatingSection rejects={r} totalRejects={totalRejects} />

      <DebugPunchSection stats={stats} />

      <DebugTrackingSection stats={stats} fullPct={fullPct} upperHipPct={upperHipPct} />

      {stats.comboStats && <DebugComboSection comboStats={stats.comboStats} />}

      {boxing && <DebugBoxingSection boxing={boxing} />}

      <DebugGradeBox grade={grade} gradeColor={gradeColor} />
    </div>
  );
}
