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
