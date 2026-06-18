"use client";

import s from "@/components/coach/coachChatStyles";

/**
 * Horizontal scrollable row of persona selector chips.
 *
 * Props:
 *   personas       {Array<{ id, emoji, color, nameKey }>}
 *   activePersonaId {string}
 *   onSelect       {(id: string) => void}
 *   t              {(key: string) => string} — translate function
 */
export default function CoachPersonaSelector({ personas, activePersonaId, onSelect, t }) {
  return (
    <div style={s.personaRow}>
      {personas.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          style={{
            ...s.personaChip,
            ...(activePersonaId === p.id
              ? { background: p.color + "20", borderColor: p.color + "80", color: "#fff", fontWeight: 900 }
              : {}),
          }}
        >
          {p.emoji} {t(p.nameKey)}
        </button>
      ))}
    </div>
  );
}
