/**
 * Punch Phase Detector — dual-hand, stateful, frame-by-frame
 *
 * Each completed punch event includes:
 *   hand            — "left" | "right"
 *   type            — "jab" | "cross" | "hook"
 *   peakAngle       — max elbow extension in degrees (raw, not EMA-smoothed)
 *   snapVelocity    — peak wrist velocity during extending
 *   recoilVelocity  — peak wrist velocity during recoiling
 *   recoilMs        — ms from peak extension to guard return (null if peak not genuine)
 *   confidence      — 0.0–1.0 reliability score
 *   confidenceLabel — "high" | "medium" | "low"
 *   lateralRatio    — % of lateral wrist path (high = hook-like arc)
 *   ts              — timestamp
 *
 * Orthodox stance assumed: left hand = jab, right hand = cross/hook.
 */

const ALPHA              = 0.35;
const ANGLE_GUARD        = 115;
const ANGLE_EXTEND       = 128;
const VEL_MIN            = 0.010;
const MIN_VIS            = 0.45;
const STRAIGHT_ANGLE     = 135;
const EXTEND_FRAMES_MIN  = 2;  // consecutive qualifying frames before entering extending
const GENUINE_PEAK_DELTA = 5;  // raw peak must exceed ANGLE_EXTEND by this to record recoilMs

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
    this._peakAngle      = 0;        // EMA-smoothed peak (state machine transitions)
    this._peakRawAngle   = 0;        // raw landmark peak (classification — no EMA bias)
    this._snapVelocity   = 0;
    this._recoilVelocity = 0;
    this._peakTs         = null;
    this._extendFrames   = 0;        // hysteresis: consecutive frames above threshold
    this._extendStartPos = null;     // smoothed wrist position at extend start
    this._extendMaxX     = 0;        // max absolute lateral displacement during extending
    this._extendMaxY     = 0;        // max absolute vertical displacement during extending
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
    const wr = landmarks[this.wIdx]; // raw wrist

    if (
      (sh?.visibility ?? 0) < MIN_VIS ||
      (el?.visibility ?? 0) < MIN_VIS ||
      (wr?.visibility ?? 0) < MIN_VIS
    ) return null;

    // EMA-smoothed wrist for stable velocity and state machine transitions
    this._smoothed = this._smoothed
      ? { x: ALPHA * wr.x + (1 - ALPHA) * this._smoothed.x, y: ALPHA * wr.y + (1 - ALPHA) * this._smoothed.y }
      : { x: wr.x, y: wr.y };

    const sw = this._smoothed;
    const velocity = this._prev
      ? Math.sqrt((sw.x - this._prev.x) ** 2 + (sw.y - this._prev.y) ** 2)
      : 0;
    this._prev = { x: sw.x, y: sw.y };

    // Smoothed angle — stable state machine transitions, resistant to jitter
    const angle    = _angleDeg(sh, el, sw);
    // Raw angle — true extension peak, not biased downward by EMA smoothing
    const rawAngle = _angleDeg(sh, el, { x: wr.x, y: wr.y });

    switch (this._phase) {
      case "guard":
        if (angle > ANGLE_EXTEND && velocity > VEL_MIN) {
          this._extendFrames++;
          if (this._extendFrames >= EXTEND_FRAMES_MIN) {
            this._phase          = "extending";
            this._peakAngle      = angle;
            this._peakRawAngle   = rawAngle;
            this._snapVelocity   = velocity;
            this._extendStartPos = { x: sw.x, y: sw.y };
            this._extendMaxX     = 0;
            this._extendMaxY     = 0;
          }
        } else {
          this._extendFrames = 0; // reset hysteresis on any frame that doesn't qualify
        }
        break;

      case "extending":
        if (angle    > this._peakAngle)    this._peakAngle    = angle;
        if (rawAngle > this._peakRawAngle) this._peakRawAngle = rawAngle;
        if (velocity > this._snapVelocity) this._snapVelocity = velocity;

        // Track lateral vs vertical path for hook arc validation
        if (this._extendStartPos) {
          const dx = Math.abs(sw.x - this._extendStartPos.x);
          const dy = Math.abs(sw.y - this._extendStartPos.y);
          if (dx > this._extendMaxX) this._extendMaxX = dx;
          if (dy > this._extendMaxY) this._extendMaxY = dy;
        }

        if (this._peakAngle > ANGLE_EXTEND && angle < this._peakAngle - 8) {
          this._phase = "recoiling";
          // Only record recoilMs when a genuine extension peak was actually reached
          this._peakTs         = this._peakRawAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA ? Date.now() : null;
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

    return { phase: this._phase, elbowAngle: Math.round(rawAngle), velocity: Math.round(velocity * 1000) / 1000 };
  }

  _recordPunch() {
    const recoilMs = this._peakTs ? Date.now() - this._peakTs : null;
    const type = this._classifyType();
    const { confidence, confidenceLabel, lateralRatio } = this._computeConfidence(type);
    this._events.push({
      hand:           this.hand,
      type,
      peakAngle:      Math.round(this._peakRawAngle),
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
    // Use raw peak angle — EMA smoothing can underestimate by 20-30°, causing
    // jab/cross (165° raw → 133° smoothed) to be misclassified as hook (<135°)
    if (this.hand === "left") {
      return this._peakRawAngle >= STRAIGHT_ANGLE ? "jab" : "hook";
    }
    return this._peakRawAngle >= STRAIGHT_ANGLE ? "cross" : "hook";
  }

  _computeConfidence(type) {
    let score = 1.0;

    // Low snap velocity — likely slow guard raise, not a real punch
    if (this._snapVelocity < VEL_MIN * 1.5) {
      score -= 0.30;
    } else if (this._snapVelocity < VEL_MIN * 2.0) {
      score -= 0.10;
    }

    // Peak barely above extend threshold — arm movement too small
    if (this._peakRawAngle < ANGLE_EXTEND + GENUINE_PEAK_DELTA) {
      score -= 0.30;
    }

    // Borderline classification angle — within 8° of STRAIGHT_ANGLE threshold
    const angleGap = type !== "hook"
      ? this._peakRawAngle - STRAIGHT_ANGLE   // positive = clearly straight punch
      : STRAIGHT_ANGLE - this._peakRawAngle;  // positive = clearly bent-arm
    if (angleGap >= 0 && angleGap < 8) {
      score -= 0.20;
    }

    // Hook lateral path: a hook should have significant lateral wrist arc
    const lateralTotal = this._extendMaxX + this._extendMaxY;
    const lateralRatio = lateralTotal > 0
      ? Math.round((this._extendMaxX / lateralTotal) * 100)
      : 0;
    if (type === "hook" && lateralRatio < 35) {
      score -= 0.25; // no lateral arc but classified as hook → likely misclassified
    }

    score = Math.max(0, Math.min(1, score));
    const confidenceLabel = score >= 0.70 ? "high" : score >= 0.45 ? "medium" : "low";
    return { confidence: Math.round(score * 100) / 100, confidenceLabel, lateralRatio };
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
