/**
 * MediaPipe Pose Metrics — boxing-calibrated with visibility gating
 *
 * Key principle: MediaPipe returns all 33 landmarks on every frame.
 * Landmarks outside the camera frame are NOT null — they have low visibility
 * scores. Every metric gates on visibility before computing.
 *
 * Landmark indices:
 *   0  = nose
 *   11 = left shoulder   12 = right shoulder
 *   13 = left elbow      14 = right elbow
 *   15 = left wrist      16 = right wrist
 *   23 = left hip        24 = right hip
 *   25 = left knee       26 = right knee
 *   27 = left ankle      28 = right ankle
 *
 * Threshold philosophy:
 *   - Be conservative: only flag clear, sustained issues
 *   - Thresholds are wider than "ideal" to account for camera angle variation
 *   - Per-frame status is instantaneous; session summary uses appropriate
 *     aggregation (avg for stance/guard/balance; MAX for extension/rotation)
 */

const MIN_VIS = 0.5;

// All listed landmark indices must have visibility >= MIN_VIS
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

// ─── Camera Setup Quality ─────────────────────────────────────────────────────
// Classifies frame quality so the system can report "could not analyze" instead
// of computing metrics from invisible landmarks.
//
// Returns one of:
//   "full_body"       — shoulders + hips + ankles all visible → all metrics valid
//   "upper_body_hips" — shoulders + hips visible, ankles not  → rotation valid, stance skipped
//   "upper_body_only" — only shoulders visible                → guard + extension only
//   "too_close"       — person too close, shoulder span > 45% of frame width
//   "unknown"         — no shoulders detected

export function getCameraSetupQuality(landmarks) {
  if (!landmarks || landmarks.length < 29) return "unknown";

  const shoulderVis = vis(landmarks, 11, 12);
  if (!shoulderVis) return "unknown";

  // Too close: shoulder span occupies more than 45% of normalized frame width
  const shoulderSpan = dist2d(landmarks[11], landmarks[12]);
  if (shoulderSpan > 0.45) return "too_close";

  const hipVis   = vis(landmarks, 23, 24);
  const ankleVis = vis(landmarks, 27, 28);

  if (hipVis && ankleVis) return "full_body";
  if (hipVis)             return "upper_body_hips";
  return "upper_body_only";
}

// ─── Metric 1: Guard Height ───────────────────────────────────────────────────
// Requires: nose(0) + both shoulders(11,12) + both wrists(15,16)
// Guards up in close camera setups.
//
// deltaY = leadWrist.y − nose.y (in normalized [0,1] coords; y increases downward)
//   − Positive = hand is below the nose
//   − Negative = hand is above the nose
//
// Calibrated range (conservative — wider than textbook to handle camera variation):
//   too_low  > 0.20  → wrist at chin/shoulder level or lower
//   too_high < −0.12 → wrist raised above forehead
//   good     between

export function measureGuardHeight(landmarks) {
  if (!vis(landmarks, 0, 11, 12, 15, 16)) return null;

  const nose      = landmarks[0];
  const leadWrist = landmarks[15]; // orthodox: left wrist leads

  const deltaY = leadWrist.y - nose.y;

  return {
    deltaY: Math.round(deltaY * 1000) / 1000,
    status: deltaY > 0.20 ? "too_low" : deltaY < -0.12 ? "too_high" : "good",
    ideal: "Wrists near chin/cheek level",
    cue: deltaY > 0.20
      ? "Raise your guard — hands up, protect the chin"
      : deltaY < -0.12
        ? "Guard slightly high — relax shoulders"
        : "Guard height looks solid",
  };
}

// ─── Metric 2: Stance Width ───────────────────────────────────────────────────
// Requires: both shoulders(11,12) + both ankles(27,28)
// Lower body must be visible — skip entirely if not.
//
// ratio = ankleWidth / shoulderWidth
//
// Note: from a front-facing camera an orthodox boxing stance appears narrower
// than the true lateral distance because one foot is forward. Thresholds are
// calibrated accordingly (more permissive than a side-view measurement).
//
//   too_narrow < 0.85 — feet close together, no base
//   too_wide   > 2.00 — overcorrected, limits mobility
//   good       0.85–2.00

export function measureStanceWidth(landmarks) {
  if (!vis(landmarks, 11, 12, 27, 28)) return null;

  const ankleWidth    = dist2d(landmarks[27], landmarks[28]);
  const shoulderWidth = dist2d(landmarks[11], landmarks[12]);
  if (!shoulderWidth) return null;

  const ratio = ankleWidth / shoulderWidth;
  return {
    ratio: Math.round(ratio * 100) / 100,
    status: ratio < 0.85 ? "too_narrow" : ratio > 2.00 ? "too_wide" : "good",
    ideal: "1.2–1.6× shoulder width from front camera",
    cue: ratio < 0.85
      ? "Widen your base — feet shoulder-width or wider"
      : ratio > 2.00
        ? "Feet too wide — reduce for better lateral mobility"
        : "Solid stance width",
  };
}

// ─── Metric 3: Punch Extension ────────────────────────────────────────────────
// Requires: shoulder + elbow + wrist for the punching hand
//
// Measures elbow angle (shoulder→elbow→wrist).
// IMPORTANT: This is an instantaneous reading. Between punches the elbow is
// naturally bent in guard position (~90–120°). Session summary uses MAX angle
// (peak reach) rather than average to capture the actual punch extension.
//
// Per-frame thresholds (for real-time display only):
//   under_extended < 100° — arm never extends; only meaningful if sustained
//   hyper_extended > 178° — elbow locked out
//   good           100–178°

export function measurePunchExtension(landmarks, hand = "right") {
  const sIdx = hand === "right" ? 12 : 11;
  const eIdx = hand === "right" ? 14 : 13;
  const wIdx = hand === "right" ? 16 : 15;
  if (!vis(landmarks, sIdx, eIdx, wIdx)) return null;

  const angle = angleDeg(landmarks[sIdx], landmarks[eIdx], landmarks[wIdx]);
  return {
    angleDeg: Math.round(angle),
    // Per-frame status is intentionally permissive — session uses MAX
    status: angle < 100 ? "under_extended" : angle > 178 ? "hyper_extended" : "good",
    ideal: "160–175° at full reach",
    cue: angle < 100
      ? "Extend fully through the punch — snap it out"
      : angle > 178
        ? "Don't lock the elbow — slight bend protects the joint"
        : "Good extension",
  };
}

// ─── Metric 4: Shoulder/Hip Rotation ─────────────────────────────────────────
// Requires: both shoulders(11,12) + both hips(23,24)
//
// Measures the angle difference between the shoulder line and hip line.
// Between punches this is naturally low (boxer stands square to camera).
// Session summary uses MAX rotation to capture peak hip drive on a cross.
//
// Per-frame thresholds (permissive for standing pose):
//   under_rotated < 8°  — standing completely square (no rotation seen)
//   over_rotated  > 55° — overcommitting, leaving opening
//   good          8–55°

export function measureRotation(landmarks) {
  if (!vis(landmarks, 11, 12, 23, 24)) return null;

  const shoulderAngle = Math.atan2(
    landmarks[12].y - landmarks[11].y,
    landmarks[12].x - landmarks[11].x,
  ) * (180 / Math.PI);
  const hipAngle = Math.atan2(
    landmarks[24].y - landmarks[23].y,
    landmarks[24].x - landmarks[23].x,
  ) * (180 / Math.PI);
  const rotation = Math.abs(shoulderAngle - hipAngle);

  return {
    rotationDeg: Math.round(rotation),
    status: rotation < 8 ? "under_rotated" : rotation > 55 ? "over_rotated" : "good",
    ideal: "20–40° shoulder-hip separation on cross",
    cue: rotation < 8
      ? "Drive your hip into the punch — rotate for power"
      : rotation > 55
        ? "Too much rotation — you're leaving yourself open"
        : "Good hip-shoulder rotation",
  };
}

// ─── Metric 5: Balance Center ─────────────────────────────────────────────────
// Requires: both hips(23,24) + both ankles(27,28)
//
// Hip midpoint should stay horizontally centred between the ankles.
// Drift > 22% of stance width = detectable lean.

export function measureBalance(landmarks) {
  if (!vis(landmarks, 23, 24, 27, 28)) return null;

  const hipCenter   = midpoint(landmarks[23], landmarks[24]);
  const ankleCenter = midpoint(landmarks[27], landmarks[28]);
  const stanceWidth = dist2d(landmarks[27], landmarks[28]);
  const drift       = stanceWidth > 0
    ? Math.abs(hipCenter.x - ankleCenter.x) / stanceWidth
    : 0;

  return {
    drift: Math.round(drift * 100) / 100,
    status: drift > 0.22 ? "off_balance" : "good",
    ideal: "Hip centre within ±20% of stance width",
    cue: drift > 0.22
      ? "Centre your weight — hips over base, not leaning"
      : "Weight distribution looks balanced",
  };
}

// ─── Full snapshot ────────────────────────────────────────────────────────────

export function computePoseMetrics(landmarks) {
  if (!landmarks || landmarks.length < 29) return null;
  return {
    guardHeight:    measureGuardHeight(landmarks),
    stanceWidth:    measureStanceWidth(landmarks),
    punchExtension: measurePunchExtension(landmarks, "right"),
    rotation:       measureRotation(landmarks),
    balance:        measureBalance(landmarks),
    _cameraQuality: getCameraSetupQuality(landmarks),
  };
}

// ─── Convenience: lower-body visible check ───────────────────────────────────

export function lowerBodyVisible(landmarks) {
  if (!landmarks || landmarks.length < 29) return false;
  return vis(landmarks, 23, 24) && (
    (landmarks[27]?.visibility ?? 0) >= MIN_VIS ||
    (landmarks[28]?.visibility ?? 0) >= MIN_VIS
  );
}

// ─── Score (0–10) — only counts metrics that had real data ───────────────────

export function poseMetricsScore(metrics) {
  if (!metrics) return null;
  const statuses = Object.values(metrics)
    .filter((v) => v && typeof v === "object" && v.status)
    .map((m) => m.status);
  const good  = statuses.filter((s) => s === "good").length;
  const total = statuses.length;
  return total ? Math.round((good / total) * 10 * 10) / 10 : null;
}
