"use client";

import styles from "@/components/aiCoachStyles";

export default function QuickActions({ actions, color, loading, onAction }) {
  return (
    <div style={styles.quickActions}>
      {actions.map((action) => (
        <button
          key={action}
          type="button"
          onClick={() => onAction(action)}
          disabled={loading}
          style={{
            ...styles.quickAction,
            borderColor: `${color}30`,
            opacity: loading ? 0.45 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {action}
        </button>
      ))}
    </div>
  );
}
