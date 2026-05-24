/**
 * MediaPipe Pose Metrics — visibility-gated
 *
 * MediaPipe always returns all 33 landmarks. Landmarks outside the camera
 * frame get low `visibility` scores but are never null. Every metric must
 * gate on visibility before computing, otherwise off-screen joints produce
 * garbage values (e.g. stance "too_narrow" when feet aren't visible).
 *
 * Landmark indices:
 *   0  = nose
 *   11 = left shoulder   12 = right shoulder
 *   13 = left elbow      14 = right elbow
 *   15 = left wrist      16 = right wrist
 *   23 = left hip        24 = right hip
 *   25 = left knee       26 = right knee
 *   27 = left ankle      28 = right ankle
 */

const MIN_VIS = 0.5; // landmark must have visibility >= this to be trusted

// Returns true only if every listed landmark index is sufficiently visible
function vis(lm, ...indices) {
  return indices.every((i) => (lm[i]?.visibility ?? 0) >= MIN_VIS);
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

function dist2d(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function angleDeg(a, vertex, b) {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.sqrt(v1.x ** 2 + v1.y ** 2) * Math.sqrt(v2.x ** 2 + v2.y ** 2);
  if (!mag) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

// ─── Metric 1: Stance Width ───────────────────────────────────────────────────
// Requires: both shoulders (11,12) + both ankles (27,28) — lower body must be visible.
// Ratio: ankle-to-ankle / shoulder-to-shoulder. Good = 1.2–1.5×.

export function measureStanceWidth(landmarks) {
  // Gate: shoulders + ankles must be visible
  if (!vis(landmarks, 11, 12, 27, 28)) return null;

  const lAnkle    = landmarks[27];
  const rAnkle    = landmarks[28];
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];

  const ankleWidth    = dist2d(lAnkle, rAnkle);
  const shoulderWidth = dist2d(lShoulder, rShoulder);
  if (!shoulderWidth) return null;

  const ratio = ankleWidth / shoulderWidth;
  return {
    ratio: Math.round(ratio * 100) / 100,
    status: ratio < 1.1 ? "too_narrow" : ratio > 1.7 ? "too_wide" : "good",
    ideal: "1.2–1.5× shoulder width",
    cue: ratio < 1.1
      ? "Widen your base — feet shoulder-width plus"
      : ratio > 1.7
        ? "Feet too wide — reduce for better mobility"
        : "Solid stance width",
  };
}

// ─── Metric 2: Guard Height ───────────────────────────────────────────────────
// Requires: nose (0) + both shoulders (11,12) + both wrists (15,16).
// Upper body only — visible in most camera setups.

export function measureGuardHeight(landmarks) {
  // Gate: nose + shoulders + wrists must be visible
  if (!vis(landmarks, 0, 11, 12, 15, 16)) return null;

  const nose      = landmarks[0];
  const leadWrist = landmarks[15]; // orthodox: left wrist leads

  const deltaY = leadWrist.y - nose.y; // positive = hand is below nose

  return {
    deltaY: Math.round(deltaY * 1000) / 1000,
    status: deltaY > 0.08 ? "too_low" : deltaY < -0.1 ? "too_high" : "good",
    ideal: "Wrists near chin/cheek level",
    cue: deltaY > 0.08
      ? "Raise your guard — hands up, protect the chin"
      : deltaY < -0.1
        ? "Guard slightly high — relax shoulders"
        : "Guard height looks solid",
  };
}

// ─── Metric 3: Punch Extension ────────────────────────────────────────────────
// Requires: shoulder + elbow + wrist for the punching hand (all three visible).
// Measures elbow angle at full reach. Good = 160–175°.

export function measurePunchExtension(landmarks, hand = "right") {
  const sIdx = hand === "right" ? 12 : 11; // shoulder
  const eIdx = hand === "right" ? 14 : 13; // elbow
  const wIdx = hand === "right" ? 16 : 15; // wrist

  // Gate: shoulder + elbow + wrist must be visible
  if (!vis(landmarks, sIdx, eIdx, wIdx)) return null;

  const angle = angleDeg(landmarks[sIdx], landmarks[eIdx], landmarks[wIdx]);
  return {
    angleDeg: Math.round(angle),
    status: angle < 140 ? "under_extended" : angle > 178 ? "hyper_extended" : "good",
    ideal: "160–175° at full reach",
    cue: angle < 140
      ? "Extend fully through the punch — snap it out"
      : angle > 178
        ? "Don't lock the elbow — slight bend protects the joint"
        : "Good extension",
  };
}

// ─── Metric 4: Shoulder/Hip Rotation ─────────────────────────────────────────
// Requires: both shoulders (11,12) + both hips (23,24) — torso must be visible.
// Measures shoulder-line angle vs hip-line angle. Good = 20–40° separation.

export function measureRotation(landmarks) {
  // Gate: shoulders + hips must be visible
  if (!vis(landmarks, 11, 12, 23, 24)) return null;

  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lHip      = landmarks[23];
  const rHip      = landmarks[24];

  const shoulderAngle = Math.atan2(rShoulder.y - lShoulder.y, rShoulder.x - lShoulder.x) * (180 / Math.PI);
  const hipAngle      = Math.atan2(rHip.y - lHip.y, rHip.x - lHip.x) * (180 / Math.PI);
  const rotation      = Math.abs(shoulderAngle - hipAngle);

  return {
    rotationDeg: Math.round(rotation),
    status: rotation < 15 ? "under_rotated" : rotation > 50 ? "over_rotated" : "good",
    ideal: "20–40° shoulder-hip separation on cross",
    cue: rotation < 15
      ? "Rotate your hips and shoulder into the punch — generate power from the base"
      : rotation > 50
        ? "Too much rotation — you're leaving yourself open"
        : "Good hip-shoulder rotation",
  };
}

// ─── Metric 5: Balance Center ─────────────────────────────────────────────────
// Requires: both hips (23,24) + both ankles (27,28) — full lower body must be visible.
// Hip midpoint should stay between ankles. Drift > 20% = off-balance.

export function measureBalance(landmarks) {
  // Gate: hips + ankles must be visible
  if (!vis(landmarks, 23, 24, 27, 28)) return null;

  const lAnkle = landmarks[27];
  const rAnkle = landmarks[28];
  const lHip   = landmarks[23];
  const rHip   = landmarks[24];

  const hipCenter   = midpoint(lHip, rHip);
  const ankleCenter = midpoint(lAnkle, rAnkle);
  const stanceWidth = dist2d(lAnkle, rAnkle);
  const drift       = stanceWidth > 0 ? Math.abs(hipCenter.x - ankleCenter.x) / stanceWidth : 0;

  return {
    drift: Math.round(drift * 100) / 100,
    status: drift > 0.2 ? "off_balance" : "good",
    ideal: "Hip center within ±15% of stance width",
    cue: drift > 0.2
      ? "Centre your weight — hips over base, not leaning"
      : "Weight distribution looks balanced",
  };
}

// ─── Full snapshot ────────────────────────────────────────────────────────────
// Returns null for any metric whose required landmarks aren't visible.

export function computePoseMetrics(landmarks) {
  if (!landmarks || landmarks.length < 29) return null;
  return {
    stanceWidth:    measureStanceWidth(landmarks),
    guardHeight:    measureGuardHeight(landmarks),
    punchExtension: measurePunchExtension(landmarks, "right"),
    rotation:       measureRotation(landmarks),
    balance:        measureBalance(landmarks),
  };
}

// ─── Convenience: which landmarks govern lower-body metrics ──────────────────
// Used by usePoseDetection to show the "step back" setup cue.
export function lowerBodyVisible(landmarks) {
  if (!landmarks || landmarks.length < 29) return false;
  // hips + at least one ankle visible
  return vis(landmarks, 23, 24) && (
    (landmarks[27]?.visibility ?? 0) >= MIN_VIS ||
    (landmarks[28]?.visibility ?? 0) >= MIN_VIS
  );
}

// ─── Status → score (0–10) — only counts metrics that had data ───────────────

export function poseMetricsScore(metrics) {
  if (!metrics) return null;
  const statuses = Object.values(metrics)
    .filter(Boolean)
    .map((m) => m.status);
  const good  = statuses.filter((s) => s === "good").length;
  const total = statuses.length;
  return total ? Math.round((good / total) * 10 * 10) / 10 : null;
}
