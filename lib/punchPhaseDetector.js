/**
 * Punch Phase Detector — stateful, frame-by-frame
 *
 * Tracks right-hand punch phases by monitoring elbow angle + wrist velocity.
 * Uses exponential smoothing internally to suppress MediaPipe landmark jitter.
 *
 * States:
 *   guard     — arm at rest, elbow bent
 *   extending — arm driving outward, angle rising
 *   recoiling — arm returning from peak
 *
 * Records a punch event whenever a full extend→recoil cycle completes.
 */

const ALPHA        = 0.35;  // EMA weight — higher = more responsive
const ANGLE_GUARD  = 115;   // elbow angle below this → at rest
const ANGLE_EXTEND = 128;   // elbow angle above this + velocity → punch start
const VEL_MIN      = 0.010; // min wrist displacement per frame (normalized coords)
const MIN_VIS      = 0.45;

function _angleDeg(a, vertex, b) {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.sqrt(v1.x ** 2 + v1.y ** 2) * Math.sqrt(v2.x ** 2 + v2.y ** 2);
  if (!mag) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}

export class PunchPhaseDetector {
  constructor() {
    this._phase     = "guard";
    this._smoothed  = null;   // EMA-smoothed wrist {x, y}
    this._prev      = null;   // previous smoothed wrist (for velocity)
    this._peakAngle = 0;
    this._events    = [];     // completed punch events
  }

  reset() {
    this._phase     = "guard";
    this._smoothed  = null;
    this._prev      = null;
    this._peakAngle = 0;
    this._events    = [];
  }

  /**
   * Feed one frame of MediaPipe landmarks.
   * Returns { phase, elbowAngle, velocity } or null when landmarks insufficient.
   */
  update(landmarks) {
    if (!landmarks || landmarks.length < 17) return null;

    const sh = landmarks[12]; // right shoulder
    const el = landmarks[14]; // right elbow
    const wr = landmarks[16]; // right wrist

    if (
      (sh?.visibility ?? 0) < MIN_VIS ||
      (el?.visibility ?? 0) < MIN_VIS ||
      (wr?.visibility ?? 0) < MIN_VIS
    ) return null;

    // EMA smoothing on wrist position
    this._smoothed = this._smoothed
      ? { x: ALPHA * wr.x + (1 - ALPHA) * this._smoothed.x, y: ALPHA * wr.y + (1 - ALPHA) * this._smoothed.y }
      : { x: wr.x, y: wr.y };

    const sw = this._smoothed;
    const velocity = this._prev
      ? Math.sqrt((sw.x - this._prev.x) ** 2 + (sw.y - this._prev.y) ** 2)
      : 0;
    this._prev = { x: sw.x, y: sw.y };

    const angle = _angleDeg(sh, el, sw);

    switch (this._phase) {
      case "guard":
        if (angle > ANGLE_EXTEND && velocity > VEL_MIN) {
          this._phase     = "extending";
          this._peakAngle = angle;
        }
        break;

      case "extending":
        if (angle > this._peakAngle) this._peakAngle = angle;
        if (this._peakAngle > ANGLE_EXTEND && angle < this._peakAngle - 8) {
          // Arm started recoiling from its peak
          this._phase = "recoiling";
        } else if (angle < ANGLE_GUARD && velocity < VEL_MIN) {
          // Very shallow extension — count as punch attempt, back to guard
          this._recordPunch();
        }
        break;

      case "recoiling":
        if (angle < ANGLE_GUARD) {
          this._recordPunch();
        }
        break;
    }

    return {
      phase:       this._phase,
      elbowAngle:  Math.round(angle),
      velocity:    Math.round(velocity * 1000) / 1000,
    };
  }

  _recordPunch() {
    this._events.push({ peakAngle: Math.round(this._peakAngle), ts: Date.now() });
    if (this._events.length > 100) this._events.shift();
    this._peakAngle = 0;
    this._phase     = "guard";
  }

  get phase()      { return this._phase; }
  get punchCount() { return this._events.length; }

  getPunchEvents() { return [...this._events]; }
}
