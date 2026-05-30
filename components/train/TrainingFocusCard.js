"use client";

import { RED, PURPLE, RADIUS, redAlpha, goldAlpha, GOLD } from "@/lib/tokens";

const ORANGE = "#FB923C";

const DIFF = {
  beginner:     { label: "BEGINNER",     color: "#10B981" },
  intermediate: { label: "INTERMEDIATE", color: "#F59E0B" },
  advanced:     { label: "ADVANCED",     color: "#F87171" },
};

function CueRow({ icon, label, color, text, italic = false }) {
  return (
    <div style={{
      padding: "8px 10px",
      background: `${color}09`, border: `1px solid ${color}1e`,
      borderLeft: `2px solid ${color}`,
      borderRadius: "2px 8px 8px 2px",
      marginBottom: 8,
      display: "flex", alignItems: "flex-start", gap: 7,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 7, fontWeight: 900, color, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>
          {label}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, fontStyle: italic ? "italic" : "normal" }}>
          {text}
        </p>
      </div>
    </div>
  );
}

export default function TrainingFocusCard({ fighterName, lesson, academyLesson, accent = RED, locale = "en", router, onStart }) {
  if (!lesson && !academyLesson) return null;

  const diff = DIFF[(academyLesson || lesson)?.difficulty] || DIFF.intermediate;
  const ac = accent;
  const isAcademy = !!academyLesson;

  const sourceLabel = isAcademy ? "GAVANA ACADEMY" : fighterName;
  const title = isAcademy ? academyLesson.title : lesson?.title;
  const commonMistake = isAcademy ? academyLesson.commonMistake : lesson?.commonMistake;
  const drillSteps = isAcademy ? academyLesson.drill?.steps : lesson?.drillSteps;

  return (
    <div style={{
      border: `1px solid ${ac}28`,
      borderLeft: `3px solid ${ac}`,
      borderRadius: RADIUS.lg,
      background: `linear-gradient(160deg, ${ac}0b 0%, rgba(0,0,0,0.18) 100%)`,
      overflow: "hidden",
      marginBottom: 14,
    }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "12px 14px 10px", borderBottom: `1px solid ${ac}16` }}>

        {/* Source label pill */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          background: `${ac}14`, border: `1px solid ${ac}28`,
          borderRadius: RADIUS.full, padding: "2px 10px 2px 7px",
          marginBottom: 9,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: ac, flexShrink: 0, boxShadow: `0 0 6px ${ac}88` }} />
          <span style={{ fontSize: 8, fontWeight: 900, color: ac, letterSpacing: 1, textTransform: "uppercase" }}>
            {sourceLabel}
          </span>
        </div>

        {/* Lesson title + difficulty */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: "#fff", letterSpacing: 0.3, textTransform: "uppercase", flex: 1, lineHeight: 1.1 }}>
            {isAcademy && academyLesson.emoji ? `${academyLesson.emoji} ` : ""}{title}
          </span>
          <span style={{
            fontSize: 7, fontWeight: 900, letterSpacing: 0.8,
            color: diff.color, background: `${diff.color}16`, border: `1px solid ${diff.color}30`,
            borderRadius: 4, padding: "2px 6px", textTransform: "uppercase", flexShrink: 0,
          }}>
            {diff.label}
          </span>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: "12px 14px" }}>

        {/* Key cues (academy) or body cue (fighter technique) */}
        {isAcademy && academyLesson.keyCues?.length > 0 ? (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1.5, color: ac, textTransform: "uppercase", marginBottom: 7 }}>
              Key Cues
            </div>
            {academyLesson.keyCues.map((cue, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: i < academyLesson.keyCues.length - 1 ? 6 : 0 }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: `${ac}18`, border: `1px solid ${ac}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 8, fontWeight: 900, color: ac, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, paddingTop: 1 }}>{cue}</span>
              </div>
            ))}
          </div>
        ) : lesson?.bodyCue ? (
          <CueRow
            label="Feel This" color={PURPLE} italic text={lesson.bodyCue}
            icon={
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={PURPLE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            }
          />
        ) : null}

        {/* Common Mistake */}
        {commonMistake && (
          <CueRow
            label="Common Mistake" color={ORANGE} text={commonMistake}
            icon={
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            }
          />
        )}

        {/* Drill steps */}
        {drillSteps?.length > 0 && (
          <div style={{ marginBottom: onStart ? 14 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>
                {isAcademy ? academyLesson.drill?.title || "Drill" : "Drill Steps"}
              </span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
            </div>
            {drillSteps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, marginBottom: i < drillSteps.length - 1 ? 7 : 0 }}>
                <div style={{
                  width: 17, height: 17, borderRadius: "50%",
                  background: `${ac}18`, border: `1px solid ${ac}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: 8, fontWeight: 900, color: ac,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.68)", lineHeight: 1.5, paddingTop: 1 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Start CTA */}
        {onStart && (
          <button
            type="button"
            onClick={onStart}
            style={{
              width: "100%", padding: "13px",
              background: `linear-gradient(145deg, ${ac}, ${ac}cc)`,
              border: "none", borderRadius: RADIUS.md,
              color: "#fff", fontSize: 11, fontWeight: 900,
              letterSpacing: 1.8, textTransform: "uppercase",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 4px 20px ${ac}40`,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            START THIS DRILL
          </button>
        )}

      </div>
    </div>
  );
}
