// Combat Memory System — pure functions, no side effects.
// Designed for future AI replacement:
//   deriveMovementTendency → ML style clustering
//   deriveTrends           → temporal pattern analysis
//   getSessionIdentity     → pose-model classification

// ── Session Identity ─────────────────────────────────────────────────────────
// Single source of truth — used in result modal AND stored in Firestore.
export function getSessionIdentity(score, movementEvents = []) {
  const c = {};
  for (const ev of movementEvents) c[ev.type] = (c[ev.type] || 0) + 1;
  const p = c.FORWARD_PRESSURE || 0;
  const l = c.LATERAL_MOVEMENT || 0;
  const h = c.HEAD_MOVEMENT    || 0;
  const g = c.GUARD_UNSTABLE   || 0;
  const b = c.BALANCE_SHIFT    || 0;
  const x = c.OVEREXTENSION    || 0;
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

// ── Session Archive formatting ────────────────────────────────────────────────
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
