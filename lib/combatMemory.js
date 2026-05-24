// Combat Memory System — pure functions, no side effects.
// Designed for future AI replacement:
//   deriveMovementTendency → ML style clustering
//   deriveTrends           → temporal pattern analysis
//   getSessionIdentity     → pose-model classification

// ── Session Identity ─────────────────────────────────────────────────────────
// Single source of truth — used in result modal AND stored in Firestore.
// poseMetrics (optional): output of computeSessionSummary() from usePoseDetection
export function getSessionIdentity(score, movementEvents = [], poseMetrics = null) {
  const c = {};
  for (const ev of movementEvents) c[ev.type] = (c[ev.type] || 0) + 1;
  const p = c.FORWARD_PRESSURE || 0;
  const l = c.LATERAL_MOVEMENT || 0;
  const h = c.HEAD_MOVEMENT    || 0;
  const g = c.GUARD_UNSTABLE   || 0;
  const b = c.BALANCE_SHIFT    || 0;
  const x = c.OVEREXTENSION    || 0;

  // Pose signals reinforce movement-derived identity when confidence is clear
  if (poseMetrics) {
    const guardDown  = poseMetrics.guardHeight?.status === "too_low";
    const offBalance = poseMetrics.balance?.status === "off_balance";
    const tooNarrow  = poseMetrics.stanceWidth?.status === "too_narrow";
    if (guardDown  && g === 0 && score >= 4) return "GUARD INSTABILITY";
    if (offBalance && b === 0 && score >= 4) return "BALANCE BREAKER";
    if (tooNarrow  && score >= 6)            return "NARROW BASE";
  }

  if (p >= 2 && score >= 6) return "PRESSURE INITIATOR";
  if (l >= 3)               return "MOBILE OUTBOXER";
  if (h >= 3 && score >= 5) return "REACTIVE COUNTER";
  if (g >= 2)               return "GUARD INSTABILITY";
  if (b >= 2)               return "BALANCE BREAKER";
  if (x >= 1 && score >= 5) return "FORWARD HUNTER";
  if (score >= 8)            return "SHARP EXECUTION";
  if (score >= 6)            return "SOLID FOUNDATION";
  if (score >= 4)            return "DEVELOPING STYLE";
  return "RAW ENERGY";
}

// ── Movement Counts ──────────────────────────────────────────────────────────
export function buildMovementCounts(movementEvents = []) {
  const counts = {
    FORWARD_PRESSURE: 0,
    LATERAL_MOVEMENT: 0,
    HEAD_MOVEMENT:    0,
    GUARD_UNSTABLE:   0,
    BALANCE_SHIFT:    0,
    OVEREXTENSION:    0,
  };
  for (const ev of movementEvents) {
    if (ev.type in counts) counts[ev.type]++;
  }
  return counts;
}

// Derived scalar metrics from counts — stored flat on the session document.
export function buildMovementMetrics(counts) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const t = Math.max(1, total);
  return {
    totalMovementEvents: total,
    pressureFrequency:  Number(((counts.FORWARD_PRESSURE) / t).toFixed(3)),
    lateralFrequency:   Number(((counts.LATERAL_MOVEMENT) / t).toFixed(3)),
    movementStability:  Number((1 - Math.min(1, (counts.GUARD_UNSTABLE + counts.BALANCE_SHIFT) / t)).toFixed(3)),
    overextensionCount: counts.OVEREXTENSION,
  };
}

// ── Tendency (aggregate across N sessions) ───────────────────────────────────
export function deriveMovementTendency(sessions = []) {
  const withData = sessions.filter((s) => s.movementCounts);
  if (withData.length === 0) return null;

  const n = withData.length;
  const sum = (key) => withData.reduce((acc, s) => acc + (s.movementCounts[key] || 0), 0);
  const avg = (key) => sum(key) / n;

  const avgScore    = sessions.reduce((a, s) => a + (s.score || 0), 0) / sessions.length;
  const avgPressure = avg("FORWARD_PRESSURE");
  const avgLateral  = avg("LATERAL_MOVEMENT");
  const avgHead     = avg("HEAD_MOVEMENT");
  const avgGuard    = avg("GUARD_UNSTABLE");
  const avgBalance  = avg("BALANCE_SHIFT");
  const avgOverext  = avg("OVEREXTENSION");

  if (avgPressure >= 1.5 && avgScore >= 5)
    return { title: "AGGRESSIVE FORWARD MOVER",  sub: "Consistently initiates pressure" };
  if (avgLateral >= 2)
    return { title: "MOBILE OUTBOXER",            sub: "Strong lateral movement tendency" };
  if (avgHead >= 2 && avgScore >= 5)
    return { title: "REACTIVE COUNTER TENDENCY",  sub: "Movement-reactive defensive style" };
  if (avgGuard >= 1.5 || avgBalance >= 1.5)
    return { title: "HIGH MOVEMENT INSTABILITY",  sub: "Balance and guard consistency variable" };
  if (avgOverext >= 1)
    return { title: "OFFENSIVE OVEREXTENDER",     sub: "Aggressive extension pattern dominant" };
  if (avgScore >= 7)
    return { title: "DISCIPLINED TECHNICIAN",     sub: "Consistent high-efficiency output" };
  if (avgScore >= 5)
    return { title: "DEVELOPING STYLE",           sub: "Movement pattern still forming" };
  return   { title: "DEFENSIVE SHELL",            sub: "Conservative movement preference" };
}

// ── Weekly Trends ────────────────────────────────────────────────────────────
function weekBounds() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const lastMonday = new Date(monday);
  lastMonday.setDate(monday.getDate() - 7);
  return { monday, lastMonday };
}

function sessInWindow(sessions, from, to) {
  return sessions.filter((s) => {
    const ts = s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000) : null;
    return ts && ts >= from && (!to || ts < to);
  });
}

function avgField(sessions, field) {
  const valid = sessions.filter((s) => s[field] != null);
  if (!valid.length) return null;
  return valid.reduce((a, s) => a + s[field], 0) / valid.length;
}

function avgCount(sessions, eventType) {
  const valid = sessions.filter((s) => s.movementCounts);
  if (!valid.length) return null;
  return valid.reduce((a, s) => a + (s.movementCounts[eventType] || 0), 0) / valid.length;
}

function pctDelta(curr, prev) {
  if (prev == null || curr == null) return null;
  if (prev === 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export function deriveTrends(sessions = []) {
  const { monday, lastMonday } = weekBounds();
  const thisWeek = sessInWindow(sessions, monday, null);
  const lastWeek = sessInWindow(sessions, lastMonday, monday);

  if (thisWeek.length === 0 && lastWeek.length === 0) return null;

  const thiScore    = avgField(thisWeek, "score");
  const laScore     = avgField(lastWeek, "score");
  const thiPress    = avgCount(thisWeek, "FORWARD_PRESSURE");
  const laPress     = avgCount(lastWeek, "FORWARD_PRESSURE");
  const thiLat      = avgCount(thisWeek, "LATERAL_MOVEMENT");
  const laLat       = avgCount(lastWeek, "LATERAL_MOVEMENT");
  const thiStab     = avgField(thisWeek, "movementStability");
  const laStab      = avgField(lastWeek, "movementStability");
  const thiBalance  = avgCount(thisWeek, "BALANCE_SHIFT");
  const laBalance   = avgCount(lastWeek, "BALANCE_SHIFT");

  return {
    thisWeekCount:   thisWeek.length,
    lastWeekCount:   lastWeek.length,
    scoreDelta:      thiScore != null && laScore != null ? Number((thiScore - laScore).toFixed(1)) : null,
    pressureDelta:   pctDelta(thiPress, laPress),
    lateralDelta:    pctDelta(thiLat, laLat),
    stabilityDelta:  pctDelta(thiStab, laStab),
    balanceLossDelta: pctDelta(thiBalance, laBalance), // positive = more loss
  };
}

// ── Movement Profile (for UI trait bars) ─────────────────────────────────────
// Computes per-session averages of each movement type from stored session data.
export function computeMovementProfile(sessions = []) {
  const withData = sessions.filter((s) => s.movementCounts);
  if (!withData.length) return null;
  const n = withData.length;
  const avg = (key) => withData.reduce((a, s) => a + (s.movementCounts[key] || 0), 0) / n;
  const avgField = (key) => {
    const valid = withData.filter((s) => s[key] != null);
    return valid.length ? valid.reduce((a, s) => a + s[key], 0) / valid.length : null;
  };
  return {
    pressure:     Number(avg("FORWARD_PRESSURE").toFixed(2)),
    lateral:      Number(avg("LATERAL_MOVEMENT").toFixed(2)),
    headMovement: Number(avg("HEAD_MOVEMENT").toFixed(2)),
    guardUnstable:Number(avg("GUARD_UNSTABLE").toFixed(2)),
    balanceShift: Number(avg("BALANCE_SHIFT").toFixed(2)),
    overextension:Number(avg("OVEREXTENSION").toFixed(2)),
    stability:    avgField("movementStability"),
    sessionCount: withData.length,
  };
}

// Top movement type from a single session's movementCounts
export const MOVEMENT_LABELS = {
  FORWARD_PRESSURE: "forward pressure",
  LATERAL_MOVEMENT: "lateral movement",
  HEAD_MOVEMENT:    "head movement",
  GUARD_UNSTABLE:   "guard unstable",
  BALANCE_SHIFT:    "balance shift",
  OVEREXTENSION:    "overextension",
};

export function topMovementType(movementCounts) {
  if (!movementCounts) return null;
  const entries = Object.entries(movementCounts)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a);
  return entries.length ? { type: entries[0][0], count: entries[0][1] } : null;
}
// ── Human-readable profile interpretation ─────────────────────────────────────
export function interpretMovementProfile(profile) {
  if (!profile) return [];
  const lines = [];
  if (profile.pressure >= 2)       lines.push("Frequently initiates pressure");
  else if (profile.pressure >= 1)  lines.push("Occasional forward pressure");
  if (profile.lateral >= 2)        lines.push("Strong lateral movement control");
  else if (profile.lateral >= 1)   lines.push("Uses lateral exits");
  if (profile.headMovement >= 2)   lines.push("Active head movement");
  else if (profile.headMovement >= 1) lines.push("Some head movement");
  if (profile.guardUnstable >= 2)  lines.push("Guard consistency needs work");
  else if (profile.guardUnstable >= 1) lines.push("Occasional guard breaks");
  if (profile.balanceShift >= 2)   lines.push("Balance needs attention");
  else if (profile.balanceShift >= 1)  lines.push("Some balance shifts");
  if (profile.overextension >= 1)  lines.push("Tends to overextend");
  return lines.slice(0, 3);
}

// ── Session Archive Label ─────────────────────────────────────────────────────
export function deriveArchiveLabel(session) {
  if (session.sessionIdentity) return session.sessionIdentity;
  const mc = session.movementCounts;
  const score = session.score ?? 0;
  if (mc) {
    const p = mc.FORWARD_PRESSURE || 0;
    const l = mc.LATERAL_MOVEMENT || 0;
    const h = mc.HEAD_MOVEMENT    || 0;
    const g = mc.GUARD_UNSTABLE   || 0;
    const b = mc.BALANCE_SHIFT    || 0;
    const x = mc.OVEREXTENSION    || 0;
    if (p >= 2 && score >= 6) return "PRESSURE INITIATOR";
    if (l >= 3)               return "MOBILE OUTBOXER";
    if (h >= 3 && score >= 5) return "REACTIVE COUNTER";
    if (g >= 2)               return "GUARD INSTABILITY";
    if (b >= 2)               return "BALANCE BREAKER";
    if (x >= 1 && score >= 5) return "FORWARD HUNTER";
  }
  if (score >= 8) return "SHARP EXECUTION";
  if (score >= 6) return "SOLID FOUNDATION";
  if (score >= 4) return "DEVELOPING STYLE";
  return "RAW ENERGY";
}

export function formatSessionAge(createdAtSeconds) {
  if (!createdAtSeconds) return "";
  const diff = Date.now() - createdAtSeconds * 1000;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  2) return "just now";
  if (hours <  1) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(createdAtSeconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
