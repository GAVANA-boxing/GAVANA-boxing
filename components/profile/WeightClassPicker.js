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
      {/* 2-column grid: 15 classes used to wrap into ~15 rows of chips */}
      <div role="radiogroup" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {WEIGHT_CLASSES.map(({ value: v, label, kg }) => {
          const active = value === v;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(active ? "" : v)}
              style={{
                minHeight: 44, padding: "6px 10px", borderRadius: 12, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                border: active ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.08)",
                background: active ? "rgba(96,165,250,0.16)" : "rgba(255,255,255,0.03)",
                color: active ? "#93C5FD" : "rgba(255,255,255,0.8)",
              }}
            >
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{label}</span>
              <span style={{ display: "block", fontSize: 11.5, color: active ? "#93C5FD" : "rgba(255,255,255,0.5)", marginTop: 1 }}>{kg} kg</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
