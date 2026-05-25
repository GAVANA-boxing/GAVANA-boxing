/**
 * Punch Phase Detector — dual-hand, stateful, frame-by-frame.
 *
 * Calibrated for front-facing laptop/mobile camera (~10fps, MediaPipe lite).
 * Landmarks are pre-smoothed (x,y,z EMA) by usePoseDetection.js.
 *
 * Classification uses multi-factor scoring:
 *   straightScore: peak angle, z-forward accumulation, lateral path low, dist increase
 *   hookScore:     bent arm angle, lateral path high, no z-forward
 * Result defaults to straight (jab/cross) on tie — hooks require clear evidence.
 *
 * Each completed punch event includes:
 *   hand, type, peakAngle, snapVelocity, recoilVelocity, recoilMs,
 *   confidence, confidenceLabel, lateralRatio, classifyReasons, ts
 */

// Phase entry: xy-only velocity (z excluded — z is noisier than x/y even after smoothing)
const VEL_MIN_XY         = 0.006;
// For snap measurement: 3D velocity (z-forward shows jab power)
const ANGLE_GUARD        = 100;   // must drop below this to complete recoil
const ANGLE_EXTEND       = 110;   // must exceed this to enter extending
const MIN_VIS            = 0.40;  // landmark visibility cutoff
const GENUINE_PEAK_DELTA = 5;     // peakAngle must exceed ANGLE_EXTEND+this for recoilMs
const EXTEND_TIMEOUT_MS  = 1200;  // force-record if stuck extending
const RECOIL_TIMEOUT_MS  = 900;   // force-record if stuck recoiling

// ── Geometry ──────────────────────────────────────────────────────────────────

function _dist3D(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 3D elbow angle — captures true extension even for jabs toward camera.
// With z-smoothed landmarks this is stable and more reliable than 2D.
function _angleDeg3D(a, vertex, b) {
  const ax = a.x - vertex.x, ay = a.y - vertex.y, az = (a.z ?? 0) - (vertex.z ?? 0);
  const bx = b.x - vertex.x, by = b.y - vertex.y, bz = (b.z ?? 0) - (vertex.z ?? 0);
  const dot  = ax * bx + ay * by + az * bz;
  const magA = Math.sqrt(ax * ax + ay * ay + az * az);
  const magB = Math.sqrt(bx * bx + by * by + bz * bz);
  if (!magA || !magB) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / (magA * magB)))) * 180) / Math.PI;
}

// ── Multi-factor punch type scoring ───────────────────────────────────────────
//
// Called both at record time and during extending for real-time debug display.
// Returns { straightScore, hookScore, lateralRatio, reasons }
//
// Straight punch (jab/cross) signals:
//   • High peak elbow angle (arm opens toward straight)
//   • Wrist moves forward (toward camera, negative z)
//   • Low lateral path ratio (straight line, not arc)
//   • Shoulder-to-wrist distance increases (arm extends outward)
//
// Hook signals:
//   • Bent arm stays bent (lower peak angle)
//   • High lateral path ratio (wrist sweeps horizontally)
//   • Little to no z-forward movement

function _typeScores(peakAngle, extendMaxX, extendMaxY, zForwardTotal, distIncrease) {
  let straight = 0, hook = 0;
  const reasons = [];

  // ── Peak elbow angle ───────────────────────────────────────────────────────
  if      (peakAngle >= 145) { straight += 3; reasons.push(`a${peakAngle}→s3`); }
  else if (peakAngle >= 128) { straight += 1; reasons.push(`a${peakAngle}→s1`); }
  else if (peakAngle <  115) { hook     += 3; reasons.push(`a${peakAngle}→h3`); }
  else                       { hook     += 1; reasons.push(`a${peakAngle}→h1`); }

  // ── Lateral ratio: x-displacement / total xy displacement ─────────────────
  // High lateral (>50%) = hook sweeping across body
  // Low lateral (<30%) = straight punch, arm going forward
  const lateralTotal = extendMaxX + extendMaxY;
  const lateralRatio = lateralTotal > 0 ? extendMaxX / lateralTotal : 0;
  if      (lateralRatio > 0.55) { hook     += 2; reasons.push(`lat${Math.round(lateralRatio*100)}h2`); }
  else if (lateralRatio > 0.42) { hook     += 1; reasons.push(`lat${Math.round(lateralRatio*100)}h1`); }
  else if (lateralRatio < 0.28) { straight += 2; reasons.push(`lat${Math.round(lateralRatio*100)}s2`); }
  else if (lateralRatio < 0.38) { straight += 1; reasons.push(`lat${Math.round(lateralRatio*100)}s1`); }

  // ── Z-forward accumulation (negative = wrist toward camera) ───────────────
  // Strong forward punch creates clear negative z-accumulation during extending.
  // Hooks sweep horizontally with minimal z change.
  if      (zForwardTotal < -0.06) { straight += 2; reasons.push("zf→s2"); }
  else if (zForwardTotal < -0.02) { straight += 1; reasons.push("zf→s1"); }

  // ── Shoulder-wrist distance increase ──────────────────────────────────────
  // Straight punch extends arm away from shoulder; hook keeps arm closer.
  if (distIncrease > 0.05) { straight += 1; reasons.push("dist→s1"); }

  return { straight, hook, lateralRatio, reasons: reasons.join(" ") };
}

// ── Single-hand state machine ─────────────────────────────────────────────────

class _HandTracker {
  constructor(hand, sIdx, eIdx, wIdx) {
    this.hand = hand;
    this.sIdx = sIdx;
    this.eIdx = eIdx;
    this.wIdx = wIdx;
    this._events = [];
    this._live   = this._emptyLive();
    this._reset();
  }

  _emptyLive() {
    return {
      phase: "guard", wristX: 0, wristY: 0,
      velocity: 0, zDelta: 0, elbowAngle: 0, shoulderWristDist: 0,
      straightScore: 0, hookScore: 0, forwardDelta: 0, lateralPct: 0, classifyHint: "—",
    };
  }

  _reset() {
    this._phase          = "guard";
    this._prevXY         = null;  // { x, y } — used for xy-velocity (phase entry)
    this._prevZ          = null;  // z — used for z-delta accumulation
    this._prev3D         = null;  // { x, y, z } — used for snap 3D velocity
    this._peakAngle      = 0;
    this._snapVelocity   = 0;
    this._recoilVelocity = 0;
    this._peakTs         = null;
    this._phaseStartMs   = null;
    this._extendStartPos = null;
    this._extendMaxX     = 0;
    this._extendMaxY     = 0;
    this._zForwardTotal  = 0;    // accumulated negative z-delta during extending
    this._distAtStart    = 0;    // shoulder-wrist distance when extending begins
    this._distAtPeak     = 0;    // max shoulder-wrist distance during extending
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
    const wr = landmarks[this.wIdx]; // pre-smoothed (x,y,z) by usePoseDetection.js

    if (
      (sh?.visibility ?? 0) < MIN_VIS ||
      (el?.visibility ?? 0) < MIN_VIS ||
      (wr?.visibility ?? 0) < MIN_VIS
    ) return null;

    // xy-only velocity — used for phase entry (z excluded to avoid z-noise triggers)
    const xyVelocity = this._prevXY
      ? Math.sqrt((wr.x - this._prevXY.x) ** 2 + (wr.y - this._prevXY.y) ** 2)
      : 0;
    this._prevXY = { x: wr.x, y: wr.y };

    // 3D velocity — used for snap measurement (includes z-forward punch power)
    const velocity3D = this._prev3D ? _dist3D(wr, this._prev3D) : 0;
    this._prev3D = { x: wr.x, y: wr.y, z: wr.z ?? 0 };

    // z-delta: negative = wrist moved toward camera (forward punch)
    const zDelta = this._prevZ !== null ? (wr.z ?? 0) - this._prevZ : 0;
    this._prevZ  = wr.z ?? 0;

    // 3D elbow angle — stable after z-smoothing in usePoseDetection.js
    const angle  = _angleDeg3D(sh, el, wr);
    const shDist = _dist3D(sh, wr);
    const now    = Date.now();

    // Update live data (always current, even outside of extending)
    this._live.phase             = this._phase;
    this._live.wristX            = Math.round(wr.x * 1000) / 1000;
    this._live.wristY            = Math.round(wr.y * 1000) / 1000;
    this._live.velocity          = Math.round(xyVelocity * 1000) / 1000;
    this._live.zDelta            = Math.round(zDelta * 1000) / 1000;
    this._live.elbowAngle        = Math.round(angle);
    this._live.shoulderWristDist = Math.round(shDist * 1000) / 1000;

    switch (this._phase) {
      case "guard":
        // Use xy-only velocity for entry: z noise cannot create false extending trigger
        if (angle > ANGLE_EXTEND && xyVelocity > VEL_MIN_XY) {
          this._phase          = "extending";
          this._phaseStartMs   = now;
          this._peakAngle      = angle;
          this._snapVelocity   = velocity3D;
          this._extendStartPos = { x: wr.x, y: wr.y };
          this._extendMaxX     = 0;
          this._extendMaxY     = 0;
          this._zForwardTotal  = 0;
          this._distAtStart    = shDist;
          this._distAtPeak     = shDist;
        }
        // Reset live punch candidate display when in guard
        this._live.straightScore = 0;
        this._live.hookScore     = 0;
        this._live.forwardDelta  = 0;
        this._live.lateralPct    = 0;
        this._live.classifyHint  = "—";
        break;

      case "extending": {
        if (angle     > this._peakAngle)    this._peakAngle    = angle;
        if (velocity3D > this._snapVelocity) this._snapVelocity = velocity3D;
        if (shDist    > this._distAtPeak)   this._distAtPeak   = shDist;

        // Track lateral vs vertical wrist path
        if (this._extendStartPos) {
          const dx = Math.abs(wr.x - this._extendStartPos.x);
          const dy = Math.abs(wr.y - this._extendStartPos.y);
          if (dx > this._extendMaxX) this._extendMaxX = dx;
          if (dy > this._extendMaxY) this._extendMaxY = dy;
        }

        // Accumulate z-forward movement (only negative = toward camera)
        if (zDelta < 0) this._zForwardTotal += zDelta;

        // Real-time classification preview for debug overlay
        const { straight: ss, hook: hs, lateralRatio: lr } = _typeScores(
          this._peakAngle, this._extendMaxX, this._extendMaxY,
          this._zForwardTotal, this._distAtPeak - this._distAtStart
        );
        this._live.straightScore = ss;
        this._live.hookScore     = hs;
        this._live.forwardDelta  = Math.round(this._zForwardTotal * 1000) / 1000;
        this._live.lateralPct    = Math.round(lr * 100);
        this._live.classifyHint  = ss >= hs
          ? (this.hand === "left" ? "jab?" : "cross?")
          : "hook?";

        const extMs = now - (this._phaseStartMs ?? now);

        if (this._peakAngle > ANGLE_EXTEND && angle < this._peakAngle - 8) {
          // Peak seen, angle dropping — start recoil
          this._phase          = "recoiling";
          this._phaseStartMs   = now;
          this._peakTs         = this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA ? now : null;
          this._recoilVelocity = 0;
        } else if (angle < ANGLE_GUARD) {
          // Very fast return — skip recoiling phase
          this._recordPunch();
        } else if (extMs > EXTEND_TIMEOUT_MS && this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA) {
          // Arm held extended (slow punch or missed return frame)
          this._recordPunch();
        }
        break;
      }

      case "recoiling": {
        if (velocity3D > this._recoilVelocity) this._recoilVelocity = velocity3D;
        const recoilMs = now - (this._phaseStartMs ?? now);

        if (angle < ANGLE_GUARD) {
          this._recordPunch();
        } else if (recoilMs > RECOIL_TIMEOUT_MS && this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA) {
          // Arm returned but didn't reach ANGLE_GUARD (loose guard position)
          this._recordPunch();
        }
        break;
      }
    }

    this._live.phase = this._phase;
    return { phase: this._phase, elbowAngle: Math.round(angle), velocity: Math.round(xyVelocity * 1000) / 1000 };
  }

  _recordPunch() {
    const recoilMs = this._peakTs ? Date.now() - this._peakTs : null;
    const { straight, hook, lateralRatio, reasons } = _typeScores(
      this._peakAngle, this._extendMaxX, this._extendMaxY,
      this._zForwardTotal, this._distAtPeak - this._distAtStart
    );
    // Default to straight (jab/cross) on tie — hooks require clear evidence
    const isHook = hook > straight;
    const type   = isHook ? "hook" : (this.hand === "left" ? "jab" : "cross");
    const { confidence, confidenceLabel } = this._computeConfidence(
      type, { straight, hook, lateralRatio }
    );

    this._events.push({
      hand:             this.hand,
      type,
      peakAngle:        Math.round(this._peakAngle),
      snapVelocity:     Math.round(this._snapVelocity   * 1000) / 1000,
      recoilVelocity:   Math.round(this._recoilVelocity * 1000) / 1000,
      recoilMs,
      confidence,
      confidenceLabel,
      lateralRatio:     Math.round(lateralRatio * 100),
      classifyReasons:  reasons,
      ts: Date.now(),
    });
    if (this._events.length > 100) this._events.shift();
    this._reset();
  }

  _computeConfidence(type, { straight, hook, lateralRatio }) {
    let score = 1.0;

    // Low snap velocity — likely slow raise, not a real punch
    if (this._snapVelocity < VEL_MIN_XY * 1.5)      score -= 0.25;
    else if (this._snapVelocity < VEL_MIN_XY * 2.5)  score -= 0.10;

    // Peak barely above threshold — weak extension
    if (this._peakAngle < ANGLE_EXTEND + GENUINE_PEAK_DELTA) score -= 0.25;

    // Close scoring — type is uncertain
    const diff = Math.abs(straight - hook);
    if (diff === 0)      score -= 0.30;
    else if (diff === 1) score -= 0.15;

    // Hook without lateral arc — likely misclassified
    if (type === "hook" && lateralRatio < 0.40) score -= 0.20;

    score = Math.max(0, Math.min(1, score));
    const confidenceLabel = score >= 0.70 ? "high" : score >= 0.45 ? "medium" : "low";
    return { confidence: Math.round(score * 100) / 100, confidenceLabel };
  }

  get phase()  { return this._phase; }
  getEvents()  { return [...this._events]; }
}

// ── Public API ────────────────────────────────────────────────────────────────

export class PunchPhaseDetector {
  constructor() {
    // Orthodox: left = jab (11,13,15), right = cross/hook (12,14,16)
    // Southpaw support: swap hand labels at consumer level.
    this._left  = new _HandTracker("left",  11, 13, 15);
    this._right = new _HandTracker("right", 12, 14, 16);
  }

  reset() {
    this._left.resetSession();
    this._right.resetSession();
  }

  /** Feed one frame of smoothed landmarks. */
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

  /** All completed punch events from both hands, sorted by timestamp. */
  getPunchEvents() {
    return [...this._left.getEvents(), ...this._right.getEvents()]
      .sort((a, b) => a.ts - b.ts);
  }

  /** Per-hand live state for debug overlay. */
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
