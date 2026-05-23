// Pure heuristic movement analysis — no ML dependencies.
// Stable module API: replace analyzeMovement internals when upgrading
// to MediaPipe / MoveNet / YOLO pose detection without touching callers.

const W = 160;
const H = 120;

const HEAD_BOT  = Math.floor(H / 3);      // rows 0–40
const TORSO_BOT = Math.floor(H * 2 / 3);  // rows 40–80
// LOWER zone: rows 80–120

const ZONE_DIFF = 22; // per-pixel grayscale diff to count as "changed"

export const MOVEMENT_EVENTS = {
  LATERAL_MOVEMENT: { label: "lateral movement", cooldown: 1800 },
  FORWARD_PRESSURE: { label: "forward pressure", cooldown: 2500 },
  HEAD_MOVEMENT:    { label: "head movement",     cooldown:  900 },
  GUARD_UNSTABLE:   { label: "guard unstable",    cooldown: 3000 },
  BALANCE_SHIFT:    { label: "balance shift",     cooldown: 2000 },
  OVEREXTENSION:    { label: "overextension",     cooldown: 3500 },
};

export function createAnalyzerState() {
  return {
    lastEventTimes: Object.fromEntries(
      Object.keys(MOVEMENT_EVENTS).map((k) => [k, 0])
    ),
    torsoHistory: [],
    guardHistory: [],
  };
}

function zoneMotion(curr, prev, x0, y0, x1, y1) {
  let changed = 0, sampled = 0;
  for (let y = y0; y < y1; y += 3) {
    for (let x = x0; x < x1; x += 3) {
      const i = (y * W + x) * 4;
      const g1 = (prev[i] * 77 + prev[i + 1] * 150 + prev[i + 2] * 29) >> 8;
      const g2 = (curr[i] * 77 + curr[i + 1] * 150 + curr[i + 2] * 29) >> 8;
      if (Math.abs(g1 - g2) > ZONE_DIFF) changed++;
      sampled++;
    }
  }
  return sampled > 0 ? changed / sampled : 0;
}

// Main analysis function — called once per frame.
// Returns { events: Array<{type, label, timestamp}>, updatedState }
export function analyzeMovement(currData, prevData, state, now = Date.now()) {
  const events = [];
  const s = {
    ...state,
    lastEventTimes: { ...state.lastEventTimes },
    torsoHistory: [...(state.torsoHistory || [])],
    guardHistory: [...(state.guardHistory || [])],
  };

  const canFire = (type) =>
    now - s.lastEventTimes[type] > MOVEMENT_EVENTS[type].cooldown;

  const fire = (type) => {
    events.push({ type, label: MOVEMENT_EVENTS[type].label, timestamp: now });
    s.lastEventTimes[type] = now;
  };

  // Zone motion ratios
  const headM   = zoneMotion(currData, prevData, 0, 0,         W, HEAD_BOT);
  const torsoM  = zoneMotion(currData, prevData, 0, HEAD_BOT,  W, TORSO_BOT);
  const lowerM  = zoneMotion(currData, prevData, 0, TORSO_BOT, W, H);
  const leftM   = zoneMotion(currData, prevData, 0, 0,         Math.floor(W / 2), H);
  const rightM  = zoneMotion(currData, prevData, Math.floor(W / 2), 0, W, H);

  // Guard region: upper slice of torso, split left/right
  const guardMid = HEAD_BOT + 20;
  const guardL  = zoneMotion(currData, prevData, 0,                  HEAD_BOT, Math.floor(W / 2), guardMid);
  const guardR  = zoneMotion(currData, prevData, Math.floor(W / 2),  HEAD_BOT, W,                 guardMid);

  // Extreme edges (overextension — limb exiting frame)
  const edgeL   = zoneMotion(currData, prevData, 0,      0, 20, H);
  const edgeR   = zoneMotion(currData, prevData, W - 20, 0, W,  H);

  // HEAD_MOVEMENT: head zone active, torso relatively still
  if (canFire("HEAD_MOVEMENT") && headM > 0.12 && torsoM < 0.20) {
    fire("HEAD_MOVEMENT");
  }

  // LATERAL_MOVEMENT: lower body moves with left/right asymmetry
  if (canFire("LATERAL_MOVEMENT") && lowerM > 0.06 && Math.abs(leftM - rightM) > 0.05) {
    fire("LATERAL_MOVEMENT");
  }

  // FORWARD_PRESSURE: sustained torso activity across several frames
  s.torsoHistory.push(torsoM);
  if (s.torsoHistory.length > 6) s.torsoHistory.shift();
  const torsoAvg = s.torsoHistory.reduce((a, b) => a + b, 0) / s.torsoHistory.length;
  if (canFire("FORWARD_PRESSURE") && s.torsoHistory.length >= 4 && torsoAvg > 0.09) {
    fire("FORWARD_PRESSURE");
  }

  // GUARD_UNSTABLE: guard zone shows repeated asymmetric motion
  s.guardHistory.push(Math.abs(guardL - guardR));
  if (s.guardHistory.length > 5) s.guardHistory.shift();
  const guardAsym = s.guardHistory.reduce((a, b) => a + b, 0) / Math.max(1, s.guardHistory.length);
  if (canFire("GUARD_UNSTABLE") && s.guardHistory.length >= 3 && guardAsym > 0.07) {
    fire("GUARD_UNSTABLE");
  }

  // BALANCE_SHIFT: strong full-frame left/right imbalance
  const fullAsym = Math.abs(leftM - rightM);
  if (canFire("BALANCE_SHIFT") && fullAsym > 0.08 && leftM + rightM > 0.10) {
    fire("BALANCE_SHIFT");
  }

  // OVEREXTENSION: motion concentrated at frame edges
  if (canFire("OVEREXTENSION") && (edgeL > 0.15 || edgeR > 0.15)) {
    fire("OVEREXTENSION");
  }

  return { events, updatedState: s };
}
