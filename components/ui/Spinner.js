"use client";

import { whiteAlpha } from "@/lib/tokens";

/**
 * The one spinner ring. Replaces the copy-pasted inline rings scattered across
 * route `loading.js` files and hardcoded-color spinners. Colours come from
 * tokens; the `spin` keyframe lives in globals.css.
 */
export default function Spinner({
  size = 28,
  thickness = 2,
  color = whiteAlpha(0.55),
  track = whiteAlpha(0.1),
  style,
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        border: `${thickness}px solid ${track}`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.75s linear infinite",
        ...style,
      }}
    />
  );
}
