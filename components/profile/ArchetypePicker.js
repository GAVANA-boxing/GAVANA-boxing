"use client";

import styles from "@/components/profile/editProfileStyles";

const ARCHETYPES = [
  { value: "pressure",  emoji: "⚡", label: "Pressure",  color: "#F87171" },
  { value: "counter",   emoji: "🎯", label: "Counter",   color: "#60A5FA" },
  { value: "technical", emoji: "🧠", label: "Technical", color: "#A78BFA" },
  { value: "brawler",   emoji: "🔥", label: "Brawler",   color: "#FB923C" },
];

/**
 * ArchetypePicker
 *
 * Props:
 *   value     – string   currently selected archetype value (or "")
 *   onChange  – (value: string) => void   called with the new value (or "" to deselect)
 *   t         – (mn, ko, en) => string
 */
export default function ArchetypePicker({ value, onChange, t }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{t("Тулааны стиль", "파이팅 스타일", "Fighting style")}</label>
      <div style={styles.chips}>
        {ARCHETYPES.map(({ value: v, emoji, label, color }) => {
          const active = value === v;
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
              {emoji} {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
