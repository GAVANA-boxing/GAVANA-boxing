"use client";

import { useState } from "react";
import s from "@/components/fighters/fighterStyles";

// ─── Tap-to-expand section wrapper ───────────────────────────────────────────
export default function FighterSection({ title, icon, accent, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ ...s.section, borderLeftColor: open ? accent : "rgba(255,255,255,0.08)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={s.sectionBtn}
      >
        <span style={{ ...s.sectionTitle, color: open ? accent : "#888", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: open ? accent : "#555", display: "flex", alignItems: "center", flexShrink: 0 }}>
            {icon}
          </span>
          {title}
        </span>
        <svg
          style={{
            ...s.chevron,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: open ? accent : "#444",
          }}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div style={s.sectionBody}>{children}</div>}
    </div>
  );
}
