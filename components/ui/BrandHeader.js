"use client";

import { BRAND, displayTitle, glass, kickerDot, kickerPill } from "@/components/ui/brand";

/**
 * Page header in the landing style: optional round glass back button and a
 * right-hand slot on top, then a pill kicker and a display-font title.
 * @param {{ kicker: string, title: React.ReactNode, sub?: React.ReactNode, onBack?: () => void, backLabel?: string, right?: React.ReactNode }} props
 */
export default function BrandHeader({ kicker, title, sub, onBack, backLabel = "Back", right }) {
  const hasBar = onBack || right;
  return (
    <header style={{ padding: "calc(16px + env(safe-area-inset-top)) 0 18px" }}>
      {hasBar && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 42, marginBottom: 14 }}>
          {onBack ? <GlassIconButton label={backLabel} onClick={onBack}><path d="M15 18l-6-6 6-6" /></GlassIconButton> : <span />}
          {right || <span />}
        </div>
      )}
      <p style={kickerPill}><span style={kickerDot} />{kicker}</p>
      <h1 style={{ ...displayTitle, fontSize: 38, marginTop: 14 }}>{title}</h1>
      {sub && <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.5, color: BRAND.muted }}>{sub}</p>}
    </header>
  );
}

/** Round frosted icon button; children are SVG path elements (24×24 box). */
export function GlassIconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{ ...glass, width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: BRAND.text, cursor: "pointer", padding: 0, flexShrink: 0 }}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
    </button>
  );
}
