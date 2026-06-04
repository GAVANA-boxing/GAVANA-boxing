// Punch pattern analysis — first step toward Fighter DNA
export function computePunchPattern(punchBreakdown) {
  if (!punchBreakdown) return null;
  const jab   = punchBreakdown.jab?.count   || 0;
  const cross = punchBreakdown.cross?.count || 0;
  const hook  = punchBreakdown.hook?.count  || 0;
  const total = jab + cross + hook;
  if (total < 3) return null;

  const jabPct   = Math.round((jab   / total) * 100);
  const crossPct = Math.round((cross / total) * 100);
  const hookPct  = 100 - jabPct - crossPct;

  let patternKey;
  if (jabPct >= 55)       patternKey = "patternJabDominant";
  else if (crossPct >= 45) patternKey = "patternPowerHeavy";
  else if (hookPct  >= 40) patternKey = "patternHookHeavy";
  else                     patternKey = "patternBalanced";

  return { jabPct, crossPct, hookPct, patternKey, jab, cross, hook, total };
}

// Aggregate punch pattern across multiple sessions (for experiment comparison)
export function computeAggregatePunchPattern(sessions) {
  let totalJab = 0, totalCross = 0, totalHook = 0;
  for (const s of sessions) {
    const pb = s.poseMetrics?.punchBreakdown;
    if (!pb) continue;
    totalJab   += pb.jab?.count   || 0;
    totalCross += pb.cross?.count || 0;
    totalHook  += pb.hook?.count  || 0;
  }
  return computePunchPattern({ jab: { count: totalJab }, cross: { count: totalCross }, hook: { count: totalHook } });
}
