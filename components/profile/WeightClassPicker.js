"use client";

import { WEIGHT_CLASSES } from "@/lib/weightClasses";
import styles from "@/components/profile/editProfileStyles";

/**
 * WeightClassPicker
 *
 * Props:
 *   value     – string   currently selected weight-class value (or "")
 *   onChange  – (value: string) => void   called with the new value (or "" to deselect)
 *   t         – (mn, ko, en) => string
 */
export default function WeightClassPicker({ value, onChange, t }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{t("Жингийн ангилал", "체급", "Weight class")}</label>
      <div style={styles.chips}>
        {WEIGHT_CLASSES.map(({ value: v, label, kg }) => {
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
                      background: "rgba(96,165,250,0.18)",
                      border: "1px solid #60A5FA",
                      color: "#60A5FA",
                      fontWeight: 900,
                    }
                  : {}),
              }}
            >
              {label}
              <span style={{ opacity: 0.55, fontSize: "0.9em", marginLeft: 3 }}>{kg} kg</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
