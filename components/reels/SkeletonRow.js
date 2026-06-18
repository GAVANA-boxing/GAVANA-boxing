"use client";
import d from "@/components/reels/reelsDashboardStyles";

export default function SkeletonRow() {
  return (
    <div style={d.skeletonRow}>
      <div style={{ ...d.skeletonPulse, width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ ...d.skeletonPulse, height: 11, width: "65%", borderRadius: 6 }} />
        <div style={{ ...d.skeletonPulse, height: 9, width: "45%", borderRadius: 6 }} />
      </div>
      <div style={{ ...d.skeletonPulse, width: 52, height: 28, borderRadius: 8 }} />
    </div>
  );
}
