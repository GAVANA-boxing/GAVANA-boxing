"use client";

import { loc } from "@/lib/loc";

/**
 * FilterTabBar — top feed filters (For You / Following / My Style).
 * Chrome-free: type only, the active tab is larger, white and underlined;
 * the rest sit faint beside it. Legible over the clip via text shadow.
 *
 * Props:
 *   tabs            – array of { key, mn, ko, en }
 *   activeFilter    – string key of the currently active tab
 *   setActiveFilter – (key: string) => void
 *   locale          – "mn" | "ko" | "en"
 */
export default function FilterTabBar({ tabs, activeFilter, setActiveFilter, locale }) {
  if (tabs.length <= 1) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: "max(env(safe-area-inset-top), 14px)",
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        gap: 20,
        justifyContent: "center",
        alignItems: "baseline",
        pointerEvents: "none",
      }}
    >
      {tabs.map((f) => {
        const on = activeFilter === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            style={{
              pointerEvents: "auto",
              position: "relative",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 2px 7px",
              color: on ? "#fff" : "rgba(255,255,255,0.5)",
              fontFamily: "var(--font-condensed, 'Barlow Condensed', sans-serif)",
              fontSize: on ? 19 : 16,
              fontWeight: on ? 700 : 600,
              letterSpacing: 0.3,
              textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              whiteSpace: "nowrap",
              WebkitTapHighlightColor: "transparent",
              transition: "color 160ms ease",
            }}
          >
            {loc(locale, f.mn, f.ko, f.en)}
            {on && (
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  margin: "0 auto",
                  width: 22,
                  height: 2.5,
                  borderRadius: 2,
                  background: "#fff",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
