/**
 * MediaPipe Pose Metrics — Foundation Plan
 *
 * Phase 1 goal: define the 5 measurable metrics, their landmark math,
 * and acceptable ranges. No live detection yet — this file establishes
 * the contract for when pose estimation is integrated.
 *
 * MediaPipe Pose landmark indices:
 *   11 = left shoulder   12 = right shoulder
 *   13 = left elbow      14 = right elbow
 *   15 = left wrist      16 = right wrist
 *   23 = left hip        24 = right hip
 *   27 = left ankle      28 = right ankle
 *   0  = nose            7  = left ear   8 = right ear
 */

// ─── Landmark helpers ────────────────────────────────────────────────────────

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
// Good stance width = 1.2–1.5× shoulder width.
// Measured as ankle-to-ankle vs shoulder-to-shoulder ratio.

export function measureStanceWidth(landmarks) {
  const lAnkle  = landmarks[27];
  const rAnkle  = landmarks[28];
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  if (!lAnkle || !rAnkle || !lShoulder || !rShoulder) return null;

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
// Good guard = wrists roughly at chin/cheek level (wrist y ≈ nose y in image coords).
// Using normalized y: smaller y = higher in frame.

export function measureGuardHeight(landmarks) {
  const lWrist = landmarks[15];
  const rWrist = landmarks[16];
  const nose   = landmarks[0];
  if (!lWrist || !rWrist || !nose) return null;

  const leadWrist = lWrist; // assume orthodox (left hand leads); swap for southpaw
  const deltaY = leadWrist.y - nose.y; // positive = hand is BELOW nose in image

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
// Full jab/cross extension = elbow angle 160–175° at full reach.
// Measured as elbow angle: shoulder–elbow–wrist.

export function measurePunchExtension(landmarks, hand = "right") {
  const shoulder = landmarks[hand === "right" ? 12 : 11];
  const elbow    = landmarks[hand === "right" ? 14 : 13];
  const wrist    = landmarks[hand === "right" ? 16 : 15];
  if (!shoulder || !elbow || !wrist) return null;

  const angle = angleDeg(shoulder, elbow, wrist);
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
// On a cross (right hand): right shoulder rotates toward the target.
// Ideal shoulder line angle vs hip line angle = 20–40°.

export function measureRotation(landmarks) {
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  const lHip      = landmarks[23];
  const rHip      = landmarks[24];
  if (!lShoulder || !rShoulder || !lHip || !rHip) return null;

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
// Hip midpoint should stay between the ankles (horizontally).
// Drift > 15% of stance width = off-balance.

export function measureBalance(landmarks) {
  const lAnkle = landmarks[27];
  const rAnkle = landmarks[28];
  const lHip   = landmarks[23];
  const rHip   = landmarks[24];
  if (!lAnkle || !rAnkle || !lHip || !rHip) return null;

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

// ─── Status → score (0–10) ───────────────────────────────────────────────────

export function poseMetricsScore(metrics) {
  if (!metrics) return null;
  const statuses = Object.values(metrics)
    .filter(Boolean)
    .map((m) => m.status);
  const good  = statuses.filter((s) => s === "good").length;
  const total = statuses.length;
  return total ? Math.round((good / total) * 10 * 10) / 10 : null;
}
