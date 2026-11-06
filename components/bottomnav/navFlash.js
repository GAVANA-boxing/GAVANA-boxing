"use client";

import { useEffect, useState } from "react";

// Icon-only bottom nav: tapping a tab shows its name for ~1 s, then it fades.
// Every page mounts its own BottomNav, so the "which label is showing" state
// lives at module level and survives the client-side page change.

export const FLASH_MS = 1000;
let flash = null; // { key, until }
const listeners = new Set();

export function flashNavLabel(key) {
  flash = { key, until: Date.now() + FLASH_MS };
  listeners.forEach((fn) => fn());
}

/** The tab key whose label should be showing right now, or null. */
export function useNavFlash() {
  const [, tick] = useState(0);
  useEffect(() => {
    let timer = null;
    const update = () => {
      tick((n) => n + 1);
      clearTimeout(timer);
      // Re-render once more when the label should disappear.
      if (flash && flash.until > Date.now()) timer = setTimeout(() => tick((n) => n + 1), flash.until - Date.now() + 20);
    };
    listeners.add(update);
    update();
    return () => { listeners.delete(update); clearTimeout(timer); };
  }, []);
  return flash && flash.until > Date.now() ? flash.key : null;
}

/** The label pill above an icon. */
export function NavFlashLabel({ text }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: "calc(100% + 8px)",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "5px 10px",
        borderRadius: 999,
        background: "rgba(20,20,23,0.96)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
        pointerEvents: "none",
        fontFamily: "var(--stack-sans)",
        animation: `navFlash ${FLASH_MS}ms ease both`,
      }}
    >
      {text}
      <style>{"@keyframes navFlash{0%{opacity:0;transform:translate(-50%,4px)}12%{opacity:1;transform:translate(-50%,0)}75%{opacity:1}100%{opacity:0;transform:translate(-50%,-2px)}}@media (prefers-reduced-motion:reduce){@keyframes navFlash{0%,80%{opacity:1}100%{opacity:0}}}"}</style>
    </span>
  );
}
