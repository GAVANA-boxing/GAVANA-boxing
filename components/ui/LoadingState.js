"use client";

import { BG, whiteAlpha, FONT_SIZE } from "@/lib/tokens";
import Spinner from "./Spinner";

/**
 * Centered loading state. `fullScreen` fills the viewport on the page background
 * (the canonical route-`loading.js` look); otherwise it fills its container for
 * inline section loading. Optional label underneath.
 */
export default function LoadingState({
  fullScreen = true,
  size = 30,
  label,
  color,
  style,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        minHeight: fullScreen ? "100dvh" : 180,
        background: fullScreen ? BG : "transparent",
        ...style,
      }}
    >
      <Spinner size={size} color={color} />
      {label && (
        <p style={{ margin: 0, fontSize: FONT_SIZE.base, color: whiteAlpha(0.4) }}>{label}</p>
      )}
    </div>
  );
}
