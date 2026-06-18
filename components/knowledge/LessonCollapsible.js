"use client";

import { useState } from "react";
import LessonSubHeader from "@/components/knowledge/LessonSubHeader";

/**
 * Props:
 *   label       – section heading string
 *   acc         – accent color string
 *   defaultOpen – boolean (default false)
 *   children    – React children
 */
export default function LessonCollapsible({ label, acc, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 14 }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", background: "none", border: "none", padding: "0 0 6px", cursor: "pointer",
        }}
      >
        <LessonSubHeader label={label} acc={acc} asSpan />
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={acc || "rgba(255,255,255,0.3)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms", flexShrink: 0, marginBottom: 8 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && children}
    </div>
  );
}
