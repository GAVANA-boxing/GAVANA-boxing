"use client";

import s from "@/components/coach/coachChatStyles";

/**
 * Top header bar for the coach chat page.
 *
 * Props:
 *   activePersona  {{ color: string, nameKey: string, emoji: string }} — current persona config
 *   personaLabel   {string}  — translated persona name
 *   onBack         {() => void}
 *   onClear        {() => void}
 *   clearLabel     {string}  — translated "Clear chat" label
 */
export default function CoachHeader({ activePersona, personaLabel, onBack, onClear, clearLabel }) {
  return (
    <div style={s.header}>
      <button type="button" style={s.backBtn} onClick={onBack} aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div style={s.headerCenter}>
        <div style={{ ...s.headerDot, background: activePersona.color }} />
        <span style={s.headerTitle}>{personaLabel}</span>
        <span style={{ ...s.headerAiBadge, color: activePersona.color, borderColor: activePersona.color + "44" }}>
          AI
        </span>
      </div>

      <button type="button" style={s.clearBtn} onClick={onClear}>
        {clearLabel}
      </button>
    </div>
  );
}
