"use client";

import { loc } from "@/lib/loc";

/**
 * FilterTabBar
 *
 * Props:
 *   tabs          – array of { key, mn, ko, en }
 *   activeFilter  – string key of the currently active tab
 *   setActiveFilter – (key: string) => void
 *   locale        – "mn" | "ko" | "en"
 */
export default function FilterTabBar({ tabs, activeFilter, setActiveFilter, locale }) {
  if (tabs.length <= 1) return null;
  return (
    <div style={{
      position: "fixed",
      top: "max(env(safe-area-inset-top), 14px)",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 50,
      display: "flex",
      gap: 4,
      background: "rgba(0,0,0,0.55)",
      backdropFilter: "blur(12px)",
      borderRadius: 20,
      padding: "4px 5px",
      border: "1px solid rgba(255,255,255,0.1)",
    }}>
      {tabs.map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => setActiveFilter(f.key)}
          style={{
            padding: "5px 13px",
            borderRadius: 16,
            border: "none",
            background: activeFilter === f.key ? "rgba(255,255,255,0.18)" : "transparent",
            color: activeFilter === f.key ? "#fff" : "rgba(255,255,255,0.45)",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            WebkitTapHighlightColor: "transparent",
            transition: "background 160ms ease, color 160ms ease",
            whiteSpace: "nowrap",
          }}
        >
          {loc(locale, f.mn, f.ko, f.en)}
        </button>
      ))}
    </div>
  );
}
