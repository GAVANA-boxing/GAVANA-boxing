"use client";

const fieldLabelStyle = { fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: 0.5, textTransform: "uppercase", fontWeight: 700 };

export function GymFormField({ label, children, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      <label style={fieldLabelStyle}>{label}</label>
      {children}
    </div>
  );
}
