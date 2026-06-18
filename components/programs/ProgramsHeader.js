"use client";

import s from "@/components/programs/programsStyles";

/**
 * Props:
 *   onBack   () => void
 *   title    string   — translated page title
 */
export default function ProgramsHeader({ onBack, title }) {
  return (
    <header style={s.header}>
      <button type="button" style={s.backBtn} onClick={onBack} aria-label="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div>
        <p style={s.kicker}>COMBAT · PROGRAMS</p>
        <h1 style={s.title}>{title}</h1>
      </div>
    </header>
  );
}
