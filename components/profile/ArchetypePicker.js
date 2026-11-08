"use client";

import styles from "@/components/profile/editProfileStyles";
import { ARCHETYPE_KEYS, ARCHETYPE_COLORS, ARCHETYPE_EMOJI, archetypeName, normalizeArchetype } from "@/lib/archetypes";


/**
 * ArchetypePicker
 *
 * Props:
 *   value     – string   currently selected archetype value (or "")
 *   onChange  – (value: string) => void   called with the new value (or "" to deselect)
 *   t         – (mn, ko, en) => string
 *   locale    – "mn" | "ko" | "en"
 */
export default function ArchetypePicker({ value, onChange, t, locale = "mn" }) {
  const current = normalizeArchetype(value);
  return (
    <div style={styles.field}>
      <label style={styles.label}>{t("Тулааны стиль", "파이팅 스타일", "Fighting style")}</label>
      <div style={styles.chips}>
        {ARCHETYPE_KEYS.map((v) => {
          const color = ARCHETYPE_COLORS[v];
          const active = current === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => onChange(active ? "" : v)}
              style={{
                ...styles.chip,
                ...(active
                  ? {
                      background: `${color}1a`,
                      border: `1px solid ${color}`,
                      color,
                      fontWeight: 900,
                    }
                  : {}),
              }}
            >
              {ARCHETYPE_EMOJI[v]} {archetypeName(v, locale)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
