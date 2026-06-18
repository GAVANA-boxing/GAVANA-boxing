"use client";

import styles from "@/components/aiCoachStyles";

export default function SectionTabRow({ activeSection, onSelect, tabs }) {
  return (
    <div style={styles.sectionTabRow}>
      {tabs.map(({ key, label, emoji }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          style={activeSection === key ? styles.sectionTabActive : styles.sectionTabInactive}
        >
          <span>{emoji}</span> {label}
        </button>
      ))}
    </div>
  );
}
