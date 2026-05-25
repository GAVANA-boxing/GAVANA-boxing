/**
 * Punch Phase Detector — dual-hand, stateful, frame-by-frame.
 *
 * Calibrated for front-facing laptop/mobile camera at ~10fps (MediaPipe lite).
 * Incoming landmarks are already EMA-smoothed by usePoseDetection.js — no
 * additional internal smoothing is applied here to avoid double-smoothing.
 *
 * Each completed punch event:
 *   hand            — "left" | "right"
 *   type            — "jab" | "cross" | "hook"
 *   peakAngle       — max 3D elbow angle during punch (degrees)
 *   snapVelocity    — peak 3D wrist velocity during extending
 *   recoilVelocity  — peak 3D wrist velocity during recoiling
 *   recoilMs        — ms from peak to guard return (null if not a genuine peak)
 *   confidence      — 0.0–1.0 reliability score
 *   confidenceLabel — "high" | "medium" | "low"
 *   lateralRatio    — % lateral wrist path (high = hook-like arc)
 *   ts              — timestamp (ms)
 */

// Thresholds calibrated for pre-smoothed MediaPipe lite output.
// Previous values (ANGLE_EXTEND=128, VEL_MIN=0.010, FRAMES_MIN=2) were
// too strict: double EMA + fast jabs caused them to never trigger.
const ANGLE_GUARD        = 100;   // must drop below this to complete recoil
const ANGLE_EXTEND       = 110;   // must exceed this (+ velocity) to start extending
const VEL_MIN            = 0.006; // min 3D wrist velocity to trigger extending
const MIN_VIS            = 0.40;  // min landmark visibility
const STRAIGHT_ANGLE     = 135;   // jab/cross (>=) vs hook (<) boundary
const GENUINE_PEAK_DELTA = 5;     // peakAngle must exceed ANGLE_EXTEND+this for recoilMs
const EXTEND_TIMEOUT_MS  = 1200;  // max ms stuck in extending before force-recording
const RECOIL_TIMEOUT_MS  = 900;   // max ms stuck in recoiling before force-recording

// ── Geometry helpers ──────────────────────────────────────────────────────────

function _dist3D(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 3D elbow angle — more accurate than 2D for front-facing camera jabs
// where z (depth toward camera) is the primary extension axis.
function _angleDeg3D(a, vertex, b) {
  const ax = a.x - vertex.x, ay = a.y - vertex.y, az = (a.z ?? 0) - (vertex.z ?? 0);
  const bx = b.x - vertex.x, by = b.y - vertex.y, bz = (b.z ?? 0) - (vertex.z ?? 0);
  const dot = ax * bx + ay * by + az * bz;
  const magA = Math.sqrt(ax * ax + ay * ay + az * az);
  const magB = Math.sqrt(bx * bx + by * by + bz * bz);
  if (!magA || !magB) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / (magA * magB)))) * 180) / Math.PI;
}

// ── Single-hand state machine ─────────────────────────────────────────────────

class _HandTracker {
  constructor(hand, sIdx, eIdx, wIdx) {
    this.hand = hand;
    this.sIdx = sIdx;
    this.eIdx = eIdx;
    this.wIdx = wIdx;
    this._events  = [];
    this._live    = this._emptyLive();
    this._reset();
  }

  _emptyLive() {
    return { phase: "guard", wristX: 0, wristY: 0, velocity: 0, zDelta: 0, elbowAngle: 0, shoulderWristDist: 0 };
  }

  _reset() {
    this._phase          = "guard";
    this._prev           = null;       // previous wrist { x, y, z }
    this._peakAngle      = 0;
    this._snapVelocity   = 0;
    this._recoilVelocity = 0;
    this._peakTs         = null;
    this._phaseStartMs   = null;
    this._extendStartPos = null;       // wrist { x, y } at extend start
    this._extendMaxX     = 0;
    this._extendMaxY     = 0;
  }

  resetSession() {
    this._reset();
    this._events = [];
    this._live   = this._emptyLive();
  }

  getLiveData() { return { ...this._live }; }

  /** Returns { phase, elbowAngle, velocity } or null if landmarks insufficient. */
  update(landmarks) {
    if (!landmarks || landmarks.length < this.wIdx + 1) return null;

    const sh = landmarks[this.sIdx];
    const el = landmarks[this.eIdx];
    const wr = landmarks[this.wIdx]; // already EMA-smoothed by usePoseDetection.js

    if (
      (sh?.visibility ?? 0) < MIN_VIS ||
      (el?.visibility ?? 0) < MIN_VIS ||
      (wr?.visibility ?? 0) < MIN_VIS
    ) return null;

    // 3D velocity — includes z (depth) for reliable jab/cross detection
    // toward a front-facing camera. x,y are pre-smoothed; z may be noisier
    // but the 3D signal captures forward punches that barely move in 2D.
    const velocity = this._prev ? _dist3D(wr, this._prev) : 0;
    const zDelta   = this._prev ? (wr.z ?? 0) - (this._prev.z ?? 0) : 0;
    this._prev     = { x: wr.x, y: wr.y, z: wr.z ?? 0 };

    // 3D elbow angle — captures full extension even when punching toward camera
    const angle  = _angleDeg3D(sh, el, wr);
    const shDist = _dist3D(sh, wr);
    const now    = Date.now();

    // Keep live data up to date for debug overlay
    this._live = {
      phase:             this._phase,
      wristX:            Math.round(wr.x * 1000) / 1000,
      wristY:            Math.round(wr.y * 1000) / 1000,
      velocity:          Math.round(velocity * 1000) / 1000,
      zDelta:            Math.round(zDelta * 1000) / 1000,
      elbowAngle:        Math.round(angle),
      shoulderWristDist: Math.round(shDist * 1000) / 1000,
    };

    switch (this._phase) {
      case "guard":
        // Single-frame detection — no hysteresis. At 10fps, fast jabs may
        // only clear the threshold for 1 frame, so require just 1 qualifying frame.
        if (angle > ANGLE_EXTEND && velocity > VEL_MIN) {
          this._phase          = "extending";
          this._phaseStartMs   = now;
          this._peakAngle      = angle;
          this._snapVelocity   = velocity;
          this._extendStartPos = { x: wr.x, y: wr.y };
          this._extendMaxX     = 0;
          this._extendMaxY     = 0;
        }
        break;

      case "extending": {
        if (angle    > this._peakAngle)    this._peakAngle    = angle;
        if (velocity > this._snapVelocity) this._snapVelocity = velocity;

        // Track wrist path for hook arc validation
        if (this._extendStartPos) {
          const dx = Math.abs(wr.x - this._extendStartPos.x);
          const dy = Math.abs(wr.y - this._extendStartPos.y);
          if (dx > this._extendMaxX) this._extendMaxX = dx;
          if (dy > this._extendMaxY) this._extendMaxY = dy;
        }

        const extMs = now - (this._phaseStartMs ?? now);

        if (this._peakAngle > ANGLE_EXTEND && angle < this._peakAngle - 8) {
          // Normal peak-then-drop: transition to recoiling
          this._phase          = "recoiling";
          this._phaseStartMs   = now;
          this._peakTs         = this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA ? now : null;
          this._recoilVelocity = 0;
        } else if (angle < ANGLE_GUARD) {
          // Very fast return skipping recoiling phase entirely
          this._recordPunch();
        } else if (extMs > EXTEND_TIMEOUT_MS && this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA) {
          // Arm stayed extended: slow deliberate punch or missed single frame
          this._recordPunch();
        }
        break;
      }

      case "recoiling": {
        if (velocity > this._recoilVelocity) this._recoilVelocity = velocity;
        const recoilMs = now - (this._phaseStartMs ?? now);

        if (angle < ANGLE_GUARD) {
          this._recordPunch();
        } else if (recoilMs > RECOIL_TIMEOUT_MS && this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA) {
          // Arm returned but didn't quite hit ANGLE_GUARD (held position, loose guard)
          this._recordPunch();
        }
        break;
      }
    }

    this._live.phase = this._phase;
    return { phase: this._phase, elbowAngle: Math.round(angle), velocity: Math.round(velocity * 1000) / 1000 };
  }

  _recordPunch() {
    const recoilMs = this._peakTs ? Date.now() - this._peakTs : null;
    const type     = this._classifyType();
    const { confidence, confidenceLabel, lateralRatio } = this._computeConfidence(type);
    this._events.push({
      hand:           this.hand,
      type,
      peakAngle:      Math.round(this._peakAngle),
      snapVelocity:   Math.round(this._snapVelocity   * 1000) / 1000,
      recoilVelocity: Math.round(this._recoilVelocity * 1000) / 1000,
      recoilMs,
      confidence,
      confidenceLabel,
      lateralRatio,
      ts: Date.now(),
    });
    if (this._events.length > 100) this._events.shift();
    this._reset();
  }

  _classifyType() {
    if (this.hand === "left") return this._peakAngle >= STRAIGHT_ANGLE ? "jab" : "hook";
    return this._peakAngle >= STRAIGHT_ANGLE ? "cross" : "hook";
  }

  _computeConfidence(type) {
    let score = 1.0;

    // Velocity too low — likely slow raise, not a punch
    if (this._snapVelocity < VEL_MIN * 1.5)     score -= 0.30;
    else if (this._snapVelocity < VEL_MIN * 2.0) score -= 0.10;

    // Peak barely above threshold
    if (this._peakAngle < ANGLE_EXTEND + GENUINE_PEAK_DELTA) score -= 0.30;

    // Borderline classification — within 8° of STRAIGHT_ANGLE
    const gap = type !== "hook"
      ? this._peakAngle - STRAIGHT_ANGLE
      : STRAIGHT_ANGLE - this._peakAngle;
    if (gap >= 0 && gap < 8) score -= 0.20;

    // Hook must have lateral arc
    const lateralTotal = this._extendMaxX + this._extendMaxY;
    const lateralRatio = lateralTotal > 0
      ? Math.round((this._extendMaxX / lateralTotal) * 100)
      : 0;
    if (type === "hook" && lateralRatio < 35) score -= 0.25;

    score = Math.max(0, Math.min(1, score));
    const confidenceLabel = score >= 0.70 ? "high" : score >= 0.45 ? "medium" : "low";
    return { confidence: Math.round(score * 100) / 100, confidenceLabel, lateralRatio };
  }

  get phase()    { return this._phase; }
  getEvents()    { return [...this._events]; }
}

// ── Public API ────────────────────────────────────────────────────────────────

export class PunchPhaseDetector {
  constructor() {
    // Orthodox: left = jab (11,13,15), right = cross/hook (12,14,16)
    this._left  = new _HandTracker("left",  11, 13, 15);
    this._right = new _HandTracker("right", 12, 14, 16);
  }

  reset() {
    this._left.resetSession();
    this._right.resetSession();
  }

  /** Feed one frame. Returns { leftPhase, rightPhase, leftElbow, rightElbow, velocity }. */
  update(landmarks) {
    const L = this._left.update(landmarks);
    const R = this._right.update(landmarks);
    if (!L && !R) return null;

    return {
      leftPhase:  L?.phase       || "guard",
      rightPhase: R?.phase       || "guard",
      leftElbow:  L?.elbowAngle  ?? null,
      rightElbow: R?.elbowAngle  ?? null,
      velocity:   Math.max(L?.velocity || 0, R?.velocity || 0),
    };
  }

  /** All completed punch events sorted by time. */
  getPunchEvents() {
    return [...this._left.getEvents(), ...this._right.getEvents()]
      .sort((a, b) => a.ts - b.ts);
  }

  /** Per-hand live debug data: { left: {...}, right: {...} }. */
  getHandLiveData() {
    return { left: this._left.getLiveData(), right: this._right.getLiveData() };
  }

  get punchCount() {
    return this._left.getEvents().length + this._right.getEvents().length;
  }

  get phase() {
    const L = this._left.phase, R = this._right.phase;
    if (L === "extending" || R === "extending") return "extending";
    if (L === "recoiling" || R === "recoiling") return "recoiling";
    return "guard";
  }
}
