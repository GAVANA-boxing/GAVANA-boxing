/**
 * Punch Phase Detector — dual-hand, stateful, frame-by-frame.
 *
 * Designed for front-facing laptop/mobile camera (~10fps, MediaPipe lite).
 * Landmarks are pre-smoothed (x,y,z EMA) by usePoseDetection.js.
 *
 * KEY DESIGN PRINCIPLE: All motion is measured relative to the shoulder.
 * Global body translation (torso sway, head movement) is subtracted out.
 * Only true arm extension triggers detection.
 *
 * Detection requires ALL THREE signals:
 *   1. Elbow angle exceeds ANGLE_EXTEND
 *   2. Normalized relative wrist velocity exceeds VEL_MIN_NORM
 *   3. Shoulder→wrist distance increases by EXT_DELTA_NORM (arm actually extends)
 *
 * Classification uses multi-factor scoring — hooks require both lateral path
 * AND absence of forward z-movement. Diagonal jabs (lateral + forward z)
 * score as straight, not hook.
 */

const ANGLE_GUARD        = 100;
const ANGLE_EXTEND       = 105;   // pre-conditions are strict so lower angle entry is safe
const VEL_MIN_NORM       = 0.050; // relative velocity / shoulderWidth per frame
const EXT_DELTA_NORM     = 0.12;  // (dist - guardBase) / shoulderWidth
const Z_FWD_GATE         = -0.020; // per-frame z-delta: wrist toward camera qualifies as extension
const GUARD_ALPHA        = 0.15;  // slow EMA for guard distance baseline
const MIN_VIS            = 0.40;
const GENUINE_PEAK_DELTA = 5;
const EXTEND_TIMEOUT_MS  = 1200;
const RECOIL_TIMEOUT_MS  = 900;

// ── Geometry ──────────────────────────────────────────────────────────────────

function _dist3D(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 2D-only angle: MediaPipe lite z is too noisy for reliable 3D angle on jabs toward camera.
// xy projection gives stable elbow angle regardless of punch direction.
function _angleDeg(a, vertex, b) {
  const ax = a.x - vertex.x, ay = a.y - vertex.y;
  const bx = b.x - vertex.x, by = b.y - vertex.y;
  const dot  = ax * bx + ay * by;
  const magA = Math.sqrt(ax * ax + ay * ay);
  const magB = Math.sqrt(bx * bx + by * by);
  if (!magA || !magB) return 0;
  return (Math.acos(Math.min(1, Math.max(-1, dot / (magA * magB)))) * 180) / Math.PI;
}

// ── Multi-factor punch type scoring ───────────────────────────────────────────
//
// Uses RELATIVE wrist path (wrist - shoulder) so body rotation doesn't inflate
// lateral ratios. Hook requires lateral + no-z-forward confluence — diagonal
// jabs (lateral + forward z) correctly score as straight punches.

function _typeScores(peakAngle, relExtMaxX, relExtMaxY, zForwardTotal, distIncrease, shoulderWidth) {
  let straight = 0, hook = 0;
  const reasons = [];
  const sw = Math.max(shoulderWidth, 0.10);

  // ── Peak elbow angle ───────────────────────────────────────────────────────
  if      (peakAngle >= 145) { straight += 3; reasons.push(`a${peakAngle}s3`); }
  else if (peakAngle >= 128) { straight += 1; reasons.push(`a${peakAngle}s1`); }
  else if (peakAngle <  115) { hook     += 3; reasons.push(`a${peakAngle}h3`); }
  else                       { hook     += 1; reasons.push(`a${peakAngle}h1`); }

  // ── Relative lateral ratio (relative wrist path, not screen path) ──────────
  // Hook = lateral sweep with NO forward z-movement.
  // Diagonal jab = lateral + forward z → classify as straight, not hook.
  const lateralTotal = relExtMaxX + relExtMaxY;
  const lateralRatio = lateralTotal > 0 ? relExtMaxX / lateralTotal : 0;
  const isForward    = zForwardTotal < -0.015; // wrist clearly moved toward camera

  // Front-camera boxing: diagonal perspective inflates lateral% on straight punches.
  // Raise hook bar: only confirm hook at >70%, treat 55-70% as weak hook signal.
  if      (lateralRatio > 0.70 && !isForward) { hook     += 2; reasons.push(`lat${Math.round(lateralRatio*100)}+noZ h2`); }
  else if (lateralRatio > 0.55 && !isForward) { hook     += 1; reasons.push(`lat${Math.round(lateralRatio*100)}+noZ h1`); }
  else if (lateralRatio > 0.55 &&  isForward) { straight += 1; reasons.push(`lat${Math.round(lateralRatio*100)}+zFwd s1`); }
  else if (lateralRatio < 0.30)               { straight += 2; reasons.push(`lat${Math.round(lateralRatio*100)} s2`); }
  else if (lateralRatio < 0.45)               { straight += 1; reasons.push(`lat${Math.round(lateralRatio*100)} s1`); }

  // ── Relative z-forward (wrist moved toward camera relative to shoulder) ────
  if      (zForwardTotal < -0.05)  { straight += 2; reasons.push("zf s2"); }
  else if (zForwardTotal < -0.015) { straight += 1; reasons.push("zf s1"); }

  // ── Shoulder-wrist distance increase (arm extending outward) ──────────────
  if (distIncrease / sw > 0.10) { straight += 1; reasons.push("dist s1"); }

  return { straight, hook, lateralRatio, reasons: reasons.join(" ") };
}

// ── Single-hand state machine ─────────────────────────────────────────────────

class _HandTracker {
  constructor(hand, sIdx, eIdx, wIdx, shOtherIdx) {
    this.hand       = hand;
    this.sIdx       = sIdx;
    this.eIdx       = eIdx;
    this.wIdx       = wIdx;
    this.shOtherIdx = shOtherIdx; // opposite shoulder for width measurement
    this._events    = [];
    this._live      = this._emptyLive();
    this._guardBaseDist = null;  // persistent across punches — tracks guard arm length
    this._resetPunch();
  }

  _emptyLive() {
    return {
      phase: "guard",
      elbowAngle: 0, relWristX: 0, relWristY: 0,
      relVel: 0, normVel: 0,
      extDelta: 0, extDeltaNorm: 0,
      guardBase: 0, shoulderWidth: 0, shoulderWristDist: 0,
      zRelDelta: 0,
      straightScore: 0, hookScore: 0,
      forwardDelta: 0, lateralPct: 0,
      classifyHint: "—", triggerReason: "—",
    };
  }

  _resetPunch() {
    this._phase           = "guard";
    this._prevRelXY       = null;  // previous relative wrist { x, y }
    this._prevRelZ        = null;  // previous relative z
    this._peakAngle       = 0;
    this._snapRelVel      = 0;     // peak relative velocity during extending
    this._recoilVelocity  = 0;
    this._peakTs          = null;
    this._phaseStartMs    = null;
    this._extendStartRel  = null;  // relative wrist at extend start { x, y }
    this._relExtMaxX      = 0;     // max x displacement of relative wrist
    this._relExtMaxY      = 0;     // max y displacement of relative wrist
    this._zForwardTotal   = 0;     // accumulated relative z-forward during extending
    this._distAtStart     = 0;
    this._distAtPeak      = 0;
  }

  resetSession() {
    this._resetPunch();
    this._guardBaseDist = null;
    this._events        = [];
    this._live          = this._emptyLive();
  }

  getLiveData() { return { ...this._live }; }

  update(landmarks) {
    if (!landmarks || landmarks.length < Math.max(this.wIdx, this.shOtherIdx) + 1) return null;

    const sh      = landmarks[this.sIdx];
    const el      = landmarks[this.eIdx];
    const wr      = landmarks[this.wIdx];
    const shOther = landmarks[this.shOtherIdx];

    if (
      (sh?.visibility ?? 0) < MIN_VIS ||
      (el?.visibility ?? 0) < MIN_VIS ||
      (wr?.visibility ?? 0) < MIN_VIS
    ) return null;

    // ── Shoulder width (distance-normalization factor) ─────────────────────
    const shoulderWidth = Math.max(_dist3D(sh, shOther), 0.10);

    // ── Shoulder-relative wrist position ──────────────────────────────────
    // Subtracting shoulder removes global body translation (torso sway, head bob).
    // Only pure arm movement remains.
    const relX = wr.x - sh.x;
    const relY = wr.y - sh.y;
    const relZ = (wr.z ?? 0) - (sh.z ?? 0);

    // ── Relative xy velocity (arm-only motion, normalized by shoulder width) ─
    const relVelXY = this._prevRelXY
      ? Math.sqrt((relX - this._prevRelXY.x) ** 2 + (relY - this._prevRelXY.y) ** 2)
      : 0;
    const normVel  = relVelXY / shoulderWidth;

    // ── Relative z-delta (wrist moving toward camera relative to shoulder) ──
    const zRelDelta = this._prevRelZ !== null ? relZ - this._prevRelZ : 0;

    this._prevRelXY = { x: relX, y: relY };
    this._prevRelZ  = relZ;

    // ── 3D elbow angle ──────────────────────────────────────────────────────
    const angle = _angleDeg(sh, el, wr);

    // ── Shoulder-wrist distance ─────────────────────────────────────────────
    const dist = _dist3D(sh, wr);

    // ── Guard baseline: slow EMA while at rest ──────────────────────────────
    // Only updates in guard phase to track the arm's resting extension length.
    // This normalizes extension delta against the user's actual guard position.
    if (this._phase === "guard") {
      this._guardBaseDist = this._guardBaseDist === null
        ? dist
        : GUARD_ALPHA * dist + (1 - GUARD_ALPHA) * this._guardBaseDist;
    }
    const guardBase    = this._guardBaseDist ?? dist;
    const extDelta     = dist - guardBase;
    const extDeltaNorm = extDelta / shoulderWidth;

    const now = Date.now();

    // ── Live data (always updated — visible in debug overlay) ───────────────
    this._live.phase             = this._phase;
    this._live.elbowAngle        = Math.round(angle);
    this._live.relWristX         = Math.round(relX * 1000) / 1000;
    this._live.relWristY         = Math.round(relY * 1000) / 1000;
    this._live.relVel            = Math.round(relVelXY * 1000) / 1000;
    this._live.normVel           = Math.round(normVel * 1000) / 1000;
    this._live.extDelta          = Math.round(extDelta * 1000) / 1000;
    this._live.extDeltaNorm      = Math.round(extDeltaNorm * 100) / 100;
    this._live.guardBase         = Math.round(guardBase * 1000) / 1000;
    this._live.shoulderWidth     = Math.round(shoulderWidth * 1000) / 1000;
    this._live.shoulderWristDist = Math.round(dist * 1000) / 1000;
    this._live.zRelDelta         = Math.round(zRelDelta * 1000) / 1000;

    switch (this._phase) {
      case "guard": {
        // All THREE conditions must pass to enter extending:
        // 1. Elbow angle: arm is actually opening (not just at rest)
        // 2. Normalized relative velocity: arm moved fast relative to shoulder
        //    (body sway = ~0 relative velocity → blocked)
        // 3. Normalized extension delta: arm actually extended outward
        //    (guard raise / shoulder shift = small delta → blocked)
        // Velocity alone = body sway. Require ALSO arm extension OR z-forward (punch toward camera).
        const canEnter = angle > ANGLE_EXTEND
          && normVel > VEL_MIN_NORM
          && (extDeltaNorm > EXT_DELTA_NORM || zRelDelta < Z_FWD_GATE);

        if (canEnter) {
          this._phase         = "extending";
          this._phaseStartMs  = now;
          this._peakAngle     = angle;
          this._snapRelVel    = relVelXY;
          this._extendStartRel = { x: relX, y: relY };
          this._relExtMaxX    = 0;
          this._relExtMaxY    = 0;
          this._zForwardTotal = 0;
          this._distAtStart   = dist;
          this._distAtPeak    = dist;
          this._live.triggerReason =
            `ang${Math.round(angle)} nV${normVel.toFixed(3)} extN${extDeltaNorm.toFixed(2)}`;
        }
        // Reset punch candidate display while in guard
        this._live.straightScore = 0;
        this._live.hookScore     = 0;
        this._live.forwardDelta  = 0;
        this._live.lateralPct    = 0;
        this._live.classifyHint  = "—";
        break;
      }

      case "extending": {
        if (angle      > this._peakAngle)   this._peakAngle  = angle;
        if (relVelXY   > this._snapRelVel)  this._snapRelVel = relVelXY;
        if (dist       > this._distAtPeak)  this._distAtPeak = dist;

        // Track relative wrist path (removes body rotation from lateral ratio)
        if (this._extendStartRel) {
          const dx = Math.abs(relX - this._extendStartRel.x);
          const dy = Math.abs(relY - this._extendStartRel.y);
          if (dx > this._relExtMaxX) this._relExtMaxX = dx;
          if (dy > this._relExtMaxY) this._relExtMaxY = dy;
        }

        // Relative z-forward (negative = wrist moving toward camera vs shoulder)
        if (zRelDelta < 0) this._zForwardTotal += zRelDelta;

        // Real-time type scoring for debug overlay
        const { straight: ss, hook: hs, lateralRatio: lr } = _typeScores(
          this._peakAngle, this._relExtMaxX, this._relExtMaxY,
          this._zForwardTotal, this._distAtPeak - this._distAtStart, shoulderWidth
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
          this._phase          = "recoiling";
          this._phaseStartMs   = now;
          this._peakTs         = this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA ? now : null;
          this._recoilVelocity = 0;
        } else if (angle < ANGLE_GUARD) {
          this._recordPunch(shoulderWidth);
        } else if (extMs > EXTEND_TIMEOUT_MS && this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA) {
          this._recordPunch(shoulderWidth);
        }
        break;
      }

      case "recoiling": {
        if (relVelXY > this._recoilVelocity) this._recoilVelocity = relVelXY;
        const recoilMs = now - (this._phaseStartMs ?? now);

        if (angle < ANGLE_GUARD) {
          this._recordPunch(shoulderWidth);
        } else if (recoilMs > RECOIL_TIMEOUT_MS && this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA) {
          this._recordPunch(shoulderWidth);
        }
        break;
      }
    }

    this._live.phase = this._phase;
    return { phase: this._phase, elbowAngle: Math.round(angle), velocity: Math.round(normVel * 1000) / 1000 };
  }

  _recordPunch(shoulderWidth) {
    const recoilMs = this._peakTs ? Date.now() - this._peakTs : null;
    const { straight, hook, lateralRatio, reasons } = _typeScores(
      this._peakAngle, this._relExtMaxX, this._relExtMaxY,
      this._zForwardTotal, this._distAtPeak - this._distAtStart, shoulderWidth
    );
    const isHook = hook > straight;
    const type   = isHook ? "hook" : (this.hand === "left" ? "jab" : "cross");
    const { confidence, confidenceLabel } = this._computeConfidence(
      type, { straight, hook, lateralRatio }, shoulderWidth
    );

    this._events.push({
      hand:            this.hand,
      type,
      peakAngle:       Math.round(this._peakAngle),
      snapVelocity:    Math.round(this._snapRelVel    * 1000) / 1000,
      recoilVelocity:  Math.round(this._recoilVelocity * 1000) / 1000,
      recoilMs,
      confidence,
      confidenceLabel,
      lateralRatio:    Math.round(lateralRatio * 100),
      classifyReasons: reasons,
      ts: Date.now(),
    });
    if (this._events.length > 100) this._events.shift();
    this._resetPunch();
  }

  _computeConfidence(type, { straight, hook, lateralRatio }, shoulderWidth) {
    let score = 1.0;

    // Snap velocity too low (normalized) — likely slow raise, not punch
    const snapNorm = this._snapRelVel / Math.max(shoulderWidth, 0.10);
    if      (snapNorm < VEL_MIN_NORM * 1.5) score -= 0.25;
    else if (snapNorm < VEL_MIN_NORM * 2.5) score -= 0.10;

    // Peak angle barely above threshold
    if (this._peakAngle < ANGLE_EXTEND + GENUINE_PEAK_DELTA) score -= 0.20;

    // Classification uncertain — scores close
    const diff = Math.abs(straight - hook);
    if      (diff === 0) score -= 0.30;
    else if (diff === 1) score -= 0.15;

    // Hook without lateral arc
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
    // Orthodox stance: left = jab (sh:11, el:13, wr:15, otherSh:12)
    //                  right = cross/hook (sh:12, el:14, wr:16, otherSh:11)
    this._left  = new _HandTracker("left",  11, 13, 15, 12);
    this._right = new _HandTracker("right", 12, 14, 16, 11);
  }

  reset() {
    this._left.resetSession();
    this._right.resetSession();
  }

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

  getPunchEvents() {
    return [...this._left.getEvents(), ...this._right.getEvents()]
      .sort((a, b) => a.ts - b.ts);
  }

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
