"use client";

import DebugSSection from "./DebugSSection";
import DebugSRow from "./DebugSRow";

export default function DebugGatingSection({ rejects, totalRejects }) {
  const r = rejects;
  return (
    <DebugSSection title="1. GATING / NEAR-MISSES">
      <DebugSRow label="Total rejects" value={totalRejects} />
      <DebugSRow
        label="└ no ext/z-fwd"
        value={r.noExt ?? 0}
        color={(r.noExt ?? 0) > 8 ? "#F59E0B" : undefined}
      />
      <DebugSRow
        label="└ phone jerk"
        value={r.jerk ?? 0}
      />
      <DebugSRow
        label="└ low velocity"
        value={r.lowVel ?? 0}
      />
      <DebugSRow
        label="└ rate gate"
        value={r.rate ?? 0}
        color={(r.rate ?? 0) > 8 ? "#F59E0B" : undefined}
      />
      <DebugSRow label="└ cooldown"   value={r.cooldown ?? 0} />
      <DebugSRow label="└ calib wait" value={r.calib    ?? 0} />
      <DebugSRow
        label="└ unstable"
        value={r.unstable ?? 0}
        color={(r.unstable ?? 0) > 3 ? "#F87171" : undefined}
      />
      <DebugSRow label="└ brief pulse" value={r.brief ?? 0} />
    </DebugSSection>
  );
}
