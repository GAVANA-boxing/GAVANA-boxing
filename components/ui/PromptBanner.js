"use client";

import { BRAND, glass } from "@/components/ui/brand";

/**
 * Small glass banner for one-off prompts (install app, allow notifications).
 * Sits above the floating bottom nav.
 */
export default function PromptBanner({ icon, title, sub, actionLabel, onAction, onDismiss, dismissLabel }) {
  return (
    <div role="dialog" aria-label={title} style={{
      ...glass,
      position: "fixed", left: 12, right: 12, zIndex: 9990,
      bottom: "calc(96px + env(safe-area-inset-bottom))",
      maxWidth: 516, margin: "0 auto",
      background: "rgba(20,20,23,0.94)", borderRadius: 20,
      padding: "12px 10px 12px 14px", display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 16px 48px rgba(0,0,0,0.55)", color: BRAND.text,
    }}>
      <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 13, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 20, background: "rgba(255,59,48,0.14)" }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 600 }}>{title}</span>
        <span style={{ display: "block", marginTop: 2, fontSize: 12.5, color: BRAND.muted, lineHeight: 1.35 }}>{sub}</span>
      </span>
      <button type="button" onClick={onAction} style={{ flexShrink: 0, minHeight: 40, padding: "0 14px", borderRadius: 12, border: "none", background: BRAND.red, color: "#fff", fontFamily: "inherit", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
        {actionLabel}
      </button>
      <button type="button" onClick={onDismiss} aria-label={dismissLabel} style={{ flexShrink: 0, width: 36, height: 40, border: "none", background: "none", color: BRAND.faint, fontSize: 18, cursor: "pointer", padding: 0 }}>
        ✕
      </button>
    </div>
  );
}

/** Pages where a prompt would get in the way (camera rounds, sign-up flow). */
export function isFocusPage(pathname = "") {
  return /\/(train|ghost|onboarding|login)(\/|$)/.test(pathname);
}
