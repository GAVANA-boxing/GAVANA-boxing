"use client";

import { blackAlpha } from "@/lib/tokens";
/**
 * BottomSheet — reusable bottom-sheet / centered-dialog component.
 *
 * Props:
 *   open       {boolean}    — controls mount/unmount
 *   onClose    {function}   — called when backdrop clicked or ✕ pressed
 *   title      {ReactNode}  — optional header title (left side)
 *   zIndex     {number}     — default 200
 *   accent     {string}     — css color for border tint (e.g. GOLD)
 *   centered   {boolean}    — centers dialog instead of anchoring to bottom
 *   maxWidth   {number}     — max sheet width in px, default 520
 *   children   {ReactNode}
 */
export default function BottomSheet({
  open,
  onClose,
  title,
  zIndex = 200,
  accent,
  centered = false,
  maxWidth = 520,
  children,
}) {
  if (!open) return null;

  const borderColor = accent ? `${accent}28` : "rgba(255,255,255,0.1)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex,
        background: blackAlpha(0.72),
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: centered ? "center" : "flex-end",
        justifyContent: "center",
        padding: centered ? "20px 16px" : 0,
      }}
      onClick={onClose}
    >
      <div
        style={{
          position: "relative",
          width: `min(100%, ${maxWidth}px)`,
          maxHeight: centered ? "85vh" : undefined,
          borderRadius: centered ? 24 : "24px 24px 0 0",
          background: "linear-gradient(180deg, #161616 0%, #0f0f0f 100%)",
          border: `1px solid ${borderColor}`,
          borderBottom: centered ? undefined : "none",
          boxShadow: centered
            ? `0 8px 40px ${blackAlpha(0.6)}`
            : `0 -20px 50px ${blackAlpha(0.5)}`,
          padding: centered
            ? "20px 20px"
            : `12px 20px calc(28px + env(safe-area-inset-bottom))`,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar — bottom sheets only */}
        {!centered && (
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.18)",
              alignSelf: "center",
              marginBottom: 4,
              flexShrink: 0,
            }}
          />
        )}

        {/* Header row */}
        {(title != null || onClose) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            {title != null && (
              <span style={{ fontSize: 17, fontWeight: 1000, color: "#fff" }}>
                {title}
              </span>
            )}
            {onClose && (
              <button
                type="button"
                aria-label="Close"
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 18,
                  cursor: "pointer",
                  padding: 4,
                  marginLeft: "auto",
                }}
                onClick={onClose}
              >
                ✕
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
