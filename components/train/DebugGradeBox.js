"use client";

const GRADE_LABELS = { A: "CLEAN", B: "USABLE", C: "NOISY", D: "UNRELIABLE" };
const GRADE_NOTES = {
  A: "Tracking stable, punches confident. Results reliable.",
  B: "Mostly good — minor noise or confidence gaps.",
  C: "Tracking or confidence degraded. Improve lighting / camera distance.",
  D: "Too much noise or poor visibility. Move closer, better light.",
};

export default function DebugGradeBox({ grade, gradeColor }) {
  return (
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
  );
}
