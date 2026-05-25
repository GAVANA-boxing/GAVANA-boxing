/**
 * Punch Phase Detector — dual-hand, stateful, frame-by-frame
 *
 * Tracks both hands independently. Each completed punch is tagged with:
 *   hand    — "left" | "right"
 *   type    — "jab" | "cross" | "hook"  (hook = bent-arm punch, peakAngle < 135°)
 *   peakAngle      — max elbow extension (degrees)
 *   snapVelocity   — peak wrist velocity during extending
 *   recoilVelocity — peak wrist velocity during recoiling
 *   recoilMs       — ms from peak to guard return
 *   ts             — timestamp
 *
 * Orthodox stance assumed: left hand = jab, right hand = cross/hook.
 * Southpaw support: swap hand labels at the consumer level.
 */

const ALPHA        = 0.35;
const ANGLE_GUARD  = 115;
const ANGLE_EXTEND = 128;
const VEL_MIN      = 0.010;
const MIN_VIS      = 0.45;

// Straight punch (jab/cross) vs bent-arm punch (hook/uppercut)
const STRAIGHT_ANGLE = 135;

function _angleDeg(a, vertex, b) {
  const v1 = { x: a.x - vertex.x, y: a.y - vertex.y };
  const v2 = { x: b.x - vertex.x, y: b.y - vertex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.sqrt(v1.x ** 2 + v1.y ** 2) * Math.sqrt(v2.x ** 2 + v2.y ** 2);
  if (!mag) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180) / Math.PI;
}

// ── Single-hand state machine ─────────────────────────────────────────────────

class _HandTracker {
  constructor(hand, sIdx, eIdx, wIdx) {
    this.hand = hand;
    this.sIdx = sIdx;
    this.eIdx = eIdx;
    this.wIdx = wIdx;
    this._reset();
    this._events = [];
  }

  _reset() {
    this._phase          = "guard";
    this._smoothed       = null;
    this._prev           = null;
    this._peakAngle      = 0;
    this._snapVelocity   = 0;
    this._recoilVelocity = 0;
    this._peakTs         = null;
  }

  resetSession() {
    this._reset();
    this._events = [];
  }

  /** Returns { phase, elbowAngle, velocity } or null if landmarks insufficient. */
  update(landmarks) {
    if (!landmarks || landmarks.length < this.wIdx + 1) return null;

    const sh = landmarks[this.sIdx];
    const el = landmarks[this.eIdx];
    const wr = landmarks[this.wIdx];

    if (
      (sh?.visibility ?? 0) < MIN_VIS ||
      (el?.visibility ?? 0) < MIN_VIS ||
      (wr?.visibility ?? 0) < MIN_VIS
    ) return null;

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
          this._phase        = "extending";
          this._peakAngle    = angle;
          this._snapVelocity = velocity;
        }
        break;

      case "extending":
        if (angle > this._peakAngle)    this._peakAngle    = angle;
        if (velocity > this._snapVelocity) this._snapVelocity = velocity;

        if (this._peakAngle > ANGLE_EXTEND && angle < this._peakAngle - 8) {
          this._phase          = "recoiling";
          this._peakTs         = Date.now();
          this._recoilVelocity = 0;
        } else if (angle < ANGLE_GUARD && velocity < VEL_MIN) {
          this._recordPunch();
        }
        break;

      case "recoiling":
        if (velocity > this._recoilVelocity) this._recoilVelocity = velocity;
        if (angle < ANGLE_GUARD) {
          this._recordPunch();
        }
        break;
    }

    return { phase: this._phase, elbowAngle: Math.round(angle), velocity: Math.round(velocity * 1000) / 1000 };
  }

  _recordPunch() {
    const recoilMs = this._peakTs ? Date.now() - this._peakTs : null;
    const type = this._classifyType();
    this._events.push({
      hand:           this.hand,
      type,
      peakAngle:      Math.round(this._peakAngle),
      snapVelocity:   Math.round(this._snapVelocity   * 1000) / 1000,
      recoilVelocity: Math.round(this._recoilVelocity * 1000) / 1000,
      recoilMs,
      ts: Date.now(),
    });
    if (this._events.length > 100) this._events.shift();
    this._reset();
  }

  _classifyType() {
    if (this.hand === "left") {
      return this._peakAngle >= STRAIGHT_ANGLE ? "jab" : "hook";
    }
    return this._peakAngle >= STRAIGHT_ANGLE ? "cross" : "hook";
  }

  get phase() { return this._phase; }
  getEvents() { return [...this._events]; }
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

  /**
   * Feed one frame. Returns { leftPhase, rightPhase, leftElbow, rightElbow, velocity }.
   */
  update(landmarks) {
    const L = this._left.update(landmarks);
    const R = this._right.update(landmarks);
    if (!L && !R) return null;

    return {
      leftPhase:   L?.phase       || "guard",
      rightPhase:  R?.phase       || "guard",
      leftElbow:   L?.elbowAngle  ?? null,
      rightElbow:  R?.elbowAngle  ?? null,
      velocity:    Math.max(L?.velocity || 0, R?.velocity || 0),
    };
  }

  /** All completed punch events from both hands, sorted by time. */
  getPunchEvents() {
    return [...this._left.getEvents(), ...this._right.getEvents()]
      .sort((a, b) => a.ts - b.ts);
  }

  get punchCount() {
    return this._left.getEvents().length + this._right.getEvents().length;
  }

  /** Dominant active phase: prefers "extending" > "recoiling" > "guard". */
  get phase() {
    const L = this._left.phase;
    const R = this._right.phase;
    if (L === "extending" || R === "extending") return "extending";
    if (L === "recoiling" || R === "recoiling") return "recoiling";
    return "guard";
  }
}
