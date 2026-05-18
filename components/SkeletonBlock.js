"use client";

/**
 * SkeletonBlock — single shimmer placeholder bar.
 *
 * Props:
 *   height   {number|string} — block height, default 80
 *   radius   {number|string} — border radius, default 14
 *   width    {number|string} — optional explicit width
 */
export default function SkeletonBlock({ height = 80, radius = 14, width }) {
  const style = { height, borderRadius: radius };
  if (width != null) style.width = width;
  return <div className="shimmer" style={style} />;
}
