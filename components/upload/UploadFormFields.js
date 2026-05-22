"use client";

import { RED, RADIUS} from "@/lib/tokens";
import S from "./uploadStyles";

export function UField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={S.fieldLabel}>{label}</label>
      {children}
    </div>
  );
}

export function UChips({ options, keyMap, t, selected, onSelect, colorMap }) {
  return (
    <div style={S.chipRow}>
      {options.map((opt) => {
        const active = selected === opt;
        const activeStyle = active ? (colorMap ? colorMap(opt) : S.chipActive) : {};
        return (
          <button key={opt} type="button" style={{ ...S.chip, ...(active ? activeStyle : {}) }} onClick={() => onSelect(opt)}>
            {t(keyMap[opt])}
          </button>
        );
      })}
    </div>
  );
}

export function UToggle({ label, description, value, onChange, locked }) {
  return (
    <div style={S.toggleRow}>
      <div style={{ flex: 1 }}>
        <div style={S.toggleLabel}>{label}</div>
        {description && <div style={S.toggleDesc}>{description}</div>}
      </div>
      <button
        type="button"
        disabled={!!locked}
        onClick={() => !locked && onChange && onChange(!value)}
        aria-checked={value}
        role="switch"
        style={{
          flexShrink: 0,
          width: 46, height: 26, borderRadius: RADIUS.full, border: "none", cursor: locked ? "default" : "pointer",
          background: value ? RED : "rgba(255,255,255,0.12)",
          opacity: locked ? 0.45 : 1,
          position: "relative",
          transition: "background 180ms ease",
          padding: 0,
          outline: "none",
        }}
      >
        <span style={{
          position: "absolute",
          top: 3, left: value ? "calc(100% - 23px)" : 3,
          width: 20, height: 20, borderRadius: "50%",
          background: "#fff", transition: "left 180ms ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
        }} />
      </button>
    </div>
  );
}
