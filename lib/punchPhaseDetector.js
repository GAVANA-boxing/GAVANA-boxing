/**
 * Punch Phase Detector — dual-hand, stateful, frame-by-frame.
 *
 * Designed for front-facing laptop/mobile camera (~10fps, MediaPipe lite).
 * Receives RAW (unsmoothed) landmarks from usePoseDetection.js.
 * All smoothing happens here, tuned for punch dynamics.
 *
 * DESIGN PRINCIPLES:
 *   - All motion measured relative to shoulder. Body sway cancels out.
 *   - Angle EMA stabilises elbow threshold crossing without lag-killing peaks.
 *   - Z smoothed separately — MediaPipe lite z is very noisy.
 *   - Three-gate trigger: velocity AND (extension OR z-forward) AND angle rising.
 *   - Per-session calibration: first CALIB_FRAMES guard frames build baseline.
 *   - Cooldown prevents double-counting same punch.
 *   - Rolling visibility gates detection when tracking degrades.
 *   - Minimum extend duration rejects brief noise pulses.
 *
 * Velocity thresholds are normalized by shoulder width → distance-independent.
 */

// ── Detection gates ────────────────────────────────────────────────────────────
const ANGLE_GUARD        = 100;
const ANGLE_EXTEND       = 105;   // entry angle (angle EMA + pre-conditions keep this safe)
const VEL_MIN_NORM       = 0.050; // relVelXY / shoulderWidth minimum to enter extending
const EXT_DELTA_NORM     = 0.12;  // (dist − guardBase) / shoulderWidth minimum
const Z_FWD_GATE         = -0.018; // smoothed z-delta: wrist toward camera = forward punch
const Z_FWD_MIN_EXT      = 0.030; // min extDeltaNorm required when z-gate fires (arm must also be moving out)
const BILATERAL_Z_THRESH = -0.012; // both hands below this simultaneously = body approach, not a punch
const BILATERAL_VEL_THRESH = 0.050; // both hands above this simultaneously = phone jerk, not a punch

// ── Smoothing ──────────────────────────────────────────────────────────────────
const ANGLE_EMA_ALPHA    = 0.50;  // angle smoother inside detector (faster response than landmark EMA)
const Z_EMA_ALPHA        = 0.35;  // z-delta smoother (z from MediaPipe lite is very noisy)
const GUARD_ALPHA        = 0.15;  // slow EMA for guard distance baseline (tracks resting arm length)
const GUARD_CALIB_ALPHA  = 0.40;  // faster EMA during initial calibration window
const VIS_EMA_ALPHA      = 0.25;  // rolling visibility smoother (slow — avoids brief occlusion bouncing)

// ── Stability gates ────────────────────────────────────────────────────────────
const ANGLE_MIN_RATE     = 4.0;   // °/frame: angle must be RISING to enter extending
const VEL_HIGH_BYPASS    = 0.130; // normVel above this bypasses angle-rate gate (very fast snap)
const MIN_EXTEND_MS      = 90;    // extending must last ≥90ms before punch records (~1 frame at 10fps)
const PUNCH_COOLDOWN_MS  = 400;   // min gap between same-hand punches
const CALIB_FRAMES       = 6;     // guard frames needed before detection is enabled
const TRACK_UNSTABLE_VIS = 0.38;  // below this rolling visibility: suppress detection

// ── Other ──────────────────────────────────────────────────────────────────────
const MIN_VIS            = 0.40;  // per-frame visibility floor for landmark usage
const GENUINE_PEAK_DELTA = 5;     // °above ANGLE_EXTEND: needed for "genuine" peak
const EXTEND_TIMEOUT_MS  = 1200;
const RECOIL_TIMEOUT_MS  = 900;

// ── Geometry ──────────────────────────────────────────────────────────────────

function _dist3D(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 2D-only angle at elbow (xy projection).
// MediaPipe lite z is too noisy for 3D angle — z-jitter inverts angle during camera-toward jabs.
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
// Uses RELATIVE wrist path (wrist − shoulder) so body rotation doesn't inflate lateral.
// Hook requires lateral sweep + absence of forward z — diagonal jabs score as straight.

function _typeScores(peakAngle, relExtMaxX, relExtMaxY, zForwardTotal, distIncrease, shoulderWidth) {
  let straight = 0, hook = 0;
  const reasons = [];
  const sw = Math.max(shoulderWidth, 0.10);

  // ── Elbow angle ────────────────────────────────────────────────────────────
  if      (peakAngle >= 145) { straight += 3; reasons.push(`a${peakAngle}s3`); }
  else if (peakAngle >= 128) { straight += 1; reasons.push(`a${peakAngle}s1`); }
  else if (peakAngle <  115) { hook     += 3; reasons.push(`a${peakAngle}h3`); }
  else                       { hook     += 1; reasons.push(`a${peakAngle}h1`); }

  // ── Lateral ratio ──────────────────────────────────────────────────────────
  // Front-camera perspective inflates lateral% on straight punches (diagonal
  // jabs look wide from the front). Threshold raised vs naive camera-space ratio.
  const lateralTotal = relExtMaxX + relExtMaxY;
  const lateralRatio = lateralTotal > 0 ? relExtMaxX / lateralTotal : 0;
  const isForward    = zForwardTotal < -0.015;

  if      (lateralRatio > 0.70 && !isForward) { hook     += 2; reasons.push(`lat${Math.round(lateralRatio*100)}+noZ h2`); }
  else if (lateralRatio > 0.55 && !isForward) { hook     += 1; reasons.push(`lat${Math.round(lateralRatio*100)}+noZ h1`); }
  else if (lateralRatio > 0.55 &&  isForward) { straight += 1; reasons.push(`lat${Math.round(lateralRatio*100)}+zFwd s1`); }
  else if (lateralRatio < 0.30)               { straight += 2; reasons.push(`lat${Math.round(lateralRatio*100)} s2`); }
  else if (lateralRatio < 0.45)               { straight += 1; reasons.push(`lat${Math.round(lateralRatio*100)} s1`); }

  // ── Z-forward contribution ─────────────────────────────────────────────────
  if      (zForwardTotal < -0.05)  { straight += 2; reasons.push("zf s2"); }
  else if (zForwardTotal < -0.015) { straight += 1; reasons.push("zf s1"); }

  // ── Arm extension ──────────────────────────────────────────────────────────
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
    this.shOtherIdx = shOtherIdx;

    this._events        = [];
    this._live          = this._emptyLive();

    // Session-persistent (survive _resetPunch)
    this._guardBaseDist  = null;  // resting arm extension length EMA
    this._smoothAngle    = null;  // angle EMA — stabilises threshold without killing peaks
    this._prevSmoothAngle= null;  // for angle rate
    this._smoothZRel     = 0;     // z-delta EMA — MediaPipe lite z is very noisy
    this._lastPunchTs    = 0;     // for cooldown between same-hand punches
    this._calibFrames    = 0;     // guard frames since session start
    this._rollingVis     = null;  // rolling joint visibility EMA
    this._trackingStable = true;
    this._rejectCounts   = { calib: 0, cooldown: 0, unstable: 0, rate: 0, noExt: 0, brief: 0 };

    this._resetPunch();
  }

  _emptyLive() {
    return {
      phase: "guard",
      elbowAngle: 0, angleRate: 0,
      relWristX: 0, relWristY: 0,
      relVel: 0, normVel: 0,
      extDelta: 0, extDeltaNorm: 0,
      guardBase: 0, shoulderWidth: 0, shoulderWristDist: 0,
      smoothZRel: 0,
      bodyApproach: false, phoneJerk: false,
      calibrated: false, trackingOK: true, rollingVis: 100, cooldownLeft: 0,
      straightScore: 0, hookScore: 0,
      forwardDelta: 0, lateralPct: 0,
      classifyHint: "—", triggerReason: "—",
    };
  }

  _resetPunch() {
    this._phase          = "guard";
    this._prevRelXY      = null;
    this._prevRelZ       = null;
    this._peakAngle      = 0;
    this._snapRelVel     = 0;
    this._recoilVelocity = 0;
    this._peakTs         = null;
    this._phaseStartMs   = null;
    this._extendStartRel = null;
    this._relExtMaxX     = 0;
    this._relExtMaxY     = 0;
    this._zForwardTotal  = 0;
    this._distAtStart    = 0;
    this._distAtPeak     = 0;
    // NOTE: _smoothAngle, _smoothZRel, _guardBaseDist, _lastPunchTs,
    //       _calibFrames, _rollingVis, _trackingStable persist across punches.
  }

  resetSession() {
    this._resetPunch();
    this._guardBaseDist   = null;
    this._smoothAngle     = null;
    this._prevSmoothAngle = null;
    this._smoothZRel      = 0;
    this._lastPunchTs     = 0;
    this._calibFrames     = 0;
    this._rollingVis      = null;
    this._trackingStable  = true;
    this._rejectCounts    = { calib: 0, cooldown: 0, unstable: 0, rate: 0, noExt: 0, brief: 0 };
    this._events          = [];
    this._live            = this._emptyLive();
  }

  getLiveData() { return { ...this._live }; }

  update(landmarks, bodyApproach = false, phoneJerk = false) {
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

    // ── Rolling joint visibility ───────────────────────────────────────────────
    // Slow EMA so brief occlusions don't immediately flip tracking state.
    const minVis = Math.min(sh.visibility ?? 1, el.visibility ?? 1, wr.visibility ?? 1);
    this._rollingVis     = this._rollingVis === null
      ? minVis
      : VIS_EMA_ALPHA * minVis + (1 - VIS_EMA_ALPHA) * this._rollingVis;
    this._trackingStable = (this._rollingVis ?? 1) >= TRACK_UNSTABLE_VIS;

    // ── Shoulder width (distance-normalization factor) ────────────────────────
    const shoulderWidth = Math.max(_dist3D(sh, shOther), 0.10);

    // ── Shoulder-relative wrist position ─────────────────────────────────────
    // Subtracting shoulder removes global body translation (torso sway, head bob).
    const relX = wr.x - sh.x;
    const relY = wr.y - sh.y;
    const relZ = (wr.z ?? 0) - (sh.z ?? 0);

    // ── Relative xy velocity — arm-only motion, normalized by shoulder width ──
    const relVelXY = this._prevRelXY
      ? Math.sqrt((relX - this._prevRelXY.x) ** 2 + (relY - this._prevRelXY.y) ** 2)
      : 0;
    const normVel = relVelXY / shoulderWidth;

    // ── Relative z-delta, smoothed ────────────────────────────────────────────
    // Raw z from MediaPipe lite has ±0.02 jitter per frame. One-frame spikes
    // would falsely gate as "forward punch." EMA requires sustained movement.
    const zRelDeltaRaw = this._prevRelZ !== null ? relZ - this._prevRelZ : 0;
    this._smoothZRel   = Z_EMA_ALPHA * zRelDeltaRaw + (1 - Z_EMA_ALPHA) * this._smoothZRel;

    this._prevRelXY = { x: relX, y: relY };
    this._prevRelZ  = relZ;

    // ── Elbow angle, smoothed ─────────────────────────────────────────────────
    // EMA at α=0.50 stabilises threshold crossing without significant lag.
    // At 10fps, a genuine 150ms jab extension still shows +15–25°/frame rate.
    // Idle guard sway shows ±2–4°/frame — below ANGLE_MIN_RATE.
    const rawAngle    = _angleDeg(sh, el, wr);
    this._smoothAngle = this._smoothAngle === null
      ? rawAngle
      : ANGLE_EMA_ALPHA * rawAngle + (1 - ANGLE_EMA_ALPHA) * this._smoothAngle;
    const angle     = this._smoothAngle;
    const angleRate = this._prevSmoothAngle !== null ? angle - this._prevSmoothAngle : 0;
    this._prevSmoothAngle = angle;

    // ── Shoulder-wrist distance ───────────────────────────────────────────────
    const dist = _dist3D(sh, wr);

    // ── Guard baseline ────────────────────────────────────────────────────────
    // Fast EMA during calibration window → quickly locks to actual guard position.
    // Slow EMA after → tracks gradual stance drift without being pulled by punches.
    if (this._phase === "guard") {
      const baseAlpha = this._calibFrames < CALIB_FRAMES ? GUARD_CALIB_ALPHA : GUARD_ALPHA;
      this._guardBaseDist = this._guardBaseDist === null
        ? dist
        : baseAlpha * dist + (1 - baseAlpha) * this._guardBaseDist;
      if (this._trackingStable) this._calibFrames = Math.min(this._calibFrames + 1, CALIB_FRAMES + 1);
    }
    const guardBase    = this._guardBaseDist ?? dist;
    const extDelta     = dist - guardBase;
    const extDeltaNorm = extDelta / shoulderWidth;

    const now = Date.now();
    const isCalibrated = this._calibFrames >= CALIB_FRAMES;
    const cooldownLeft = Math.max(0, PUNCH_COOLDOWN_MS - (now - this._lastPunchTs));

    // ── Live data ─────────────────────────────────────────────────────────────
    this._live.phase             = this._phase;
    this._live.elbowAngle        = Math.round(angle);
    this._live.angleRate         = Math.round(angleRate * 10) / 10;
    this._live.relWristX         = Math.round(relX * 1000) / 1000;
    this._live.relWristY         = Math.round(relY * 1000) / 1000;
    this._live.relVel            = Math.round(relVelXY * 1000) / 1000;
    this._live.normVel           = Math.round(normVel * 1000) / 1000;
    this._live.extDelta          = Math.round(extDelta * 1000) / 1000;
    this._live.extDeltaNorm      = Math.round(extDeltaNorm * 100) / 100;
    this._live.guardBase         = Math.round(guardBase * 1000) / 1000;
    this._live.shoulderWidth     = Math.round(shoulderWidth * 1000) / 1000;
    this._live.shoulderWristDist = Math.round(dist * 1000) / 1000;
    this._live.smoothZRel        = Math.round(this._smoothZRel * 1000) / 1000;
    this._live.bodyApproach      = bodyApproach;
    this._live.phoneJerk         = phoneJerk;
    this._live.calibrated        = isCalibrated;
    this._live.trackingOK        = this._trackingStable;
    this._live.rollingVis        = Math.round((this._rollingVis ?? 1) * 100);
    this._live.cooldownLeft      = cooldownLeft;

    switch (this._phase) {
      case "guard": {
        // ── Trigger gates ──────────────────────────────────────────────────────
        // Velocity alone = body sway. Require ALSO:
        //   angle RISING (arm opening, not drifting)
        //   AND (arm extending outward OR wrist moving toward camera)
        //   AND calibrated (baseline locked)
        //   AND tracking stable (MediaPipe not degraded)
        //   AND not in cooldown (between punches)
        const angleRising = angleRate > ANGLE_MIN_RATE || normVel > VEL_HIGH_BYPASS;
        const onCooldown  = cooldownLeft > 0;

        // Z-forward is only valid when:
        //  (a) NOT bilateral (both hands going forward = body approaching camera, not a punch)
        //  (b) arm is also extending at least minimally (z alone = pure noise or camera approach)
        const zFwdValid = !bodyApproach
          && this._smoothZRel < Z_FWD_GATE
          && extDeltaNorm > Z_FWD_MIN_EXT;

        const canEnter = angle > ANGLE_EXTEND
          && normVel > VEL_MIN_NORM
          && angleRising
          && (extDeltaNorm > EXT_DELTA_NORM || zFwdValid)
          && isCalibrated
          && this._trackingStable
          && !onCooldown
          && !phoneJerk;

        if (canEnter) {
          this._phase          = "extending";
          this._phaseStartMs   = now;
          this._peakAngle      = angle;
          this._snapRelVel     = relVelXY;
          this._extendStartRel = { x: relX, y: relY };
          this._relExtMaxX     = 0;
          this._relExtMaxY     = 0;
          this._zForwardTotal  = 0;
          this._distAtStart    = dist;
          this._distAtPeak     = dist;
          this._live.triggerReason =
            `ang${Math.round(angle)} nV${normVel.toFixed(3)} ` +
            `extN${extDeltaNorm.toFixed(2)} rate${angleRate.toFixed(1)} ` +
            `zS${this._smoothZRel.toFixed(3)}`;
        } else if (angle > ANGLE_EXTEND && normVel > VEL_MIN_NORM * 0.7) {
          // Near-miss: explain what blocked it and track rejection reason
          if (phoneJerk) {
            this._live.triggerReason = `phoneJerk L${this._live.normVel.toFixed(3)} (bilateral vel)`;
            this._rejectCounts.noExt++;
          } else if (!isCalibrated) {
            this._live.triggerReason = `calib ${this._calibFrames}/${CALIB_FRAMES}`;
            this._rejectCounts.calib++;
          } else if (!this._trackingStable) {
            this._live.triggerReason = `unstable vis${this._live.rollingVis}%`;
            this._rejectCounts.unstable++;
          } else if (onCooldown) {
            this._live.triggerReason = `cooldown ${cooldownLeft}ms`;
            this._rejectCounts.cooldown++;
          } else if (!angleRising) {
            this._live.triggerReason = `rate${angleRate.toFixed(1)}<${ANGLE_MIN_RATE}`;
            this._rejectCounts.rate++;
          } else if (bodyApproach && this._smoothZRel < Z_FWD_GATE) {
            this._live.triggerReason = `bodyApproach z${this._smoothZRel.toFixed(3)} (bilateral)`;
            this._rejectCounts.noExt++;
          } else {
            this._live.triggerReason = `noExt/zFwd e${extDeltaNorm.toFixed(2)} z${this._smoothZRel.toFixed(3)}`;
            this._rejectCounts.noExt++;
          }
        }

        this._live.straightScore = 0;
        this._live.hookScore     = 0;
        this._live.forwardDelta  = 0;
        this._live.lateralPct    = 0;
        this._live.classifyHint  = "—";
        break;
      }

      case "extending": {
        if (angle    > this._peakAngle)  this._peakAngle  = angle;
        if (relVelXY > this._snapRelVel) this._snapRelVel = relVelXY;
        if (dist     > this._distAtPeak) this._distAtPeak = dist;

        if (this._extendStartRel) {
          const dx = Math.abs(relX - this._extendStartRel.x);
          const dy = Math.abs(relY - this._extendStartRel.y);
          if (dx > this._relExtMaxX) this._relExtMaxX = dx;
          if (dy > this._relExtMaxY) this._relExtMaxY = dy;
        }

        if (zRelDeltaRaw < 0) this._zForwardTotal += zRelDeltaRaw;

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
          this._phase        = "recoiling";
          this._phaseStartMs = now;
          this._peakTs       = this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA ? now : null;
          this._recoilVelocity = 0;
        } else if (angle < ANGLE_GUARD) {
          this._recordPunch(shoulderWidth, now);
        } else if (extMs > EXTEND_TIMEOUT_MS && this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA) {
          this._recordPunch(shoulderWidth, now);
        }
        break;
      }

      case "recoiling": {
        if (relVelXY > this._recoilVelocity) this._recoilVelocity = relVelXY;
        const recoilMs = now - (this._phaseStartMs ?? now);

        if (angle < ANGLE_GUARD) {
          this._recordPunch(shoulderWidth, now);
        } else if (recoilMs > RECOIL_TIMEOUT_MS && this._peakAngle > ANGLE_EXTEND + GENUINE_PEAK_DELTA) {
          this._recordPunch(shoulderWidth, now);
        }
        break;
      }
    }

    this._live.phase = this._phase;
    return { phase: this._phase, elbowAngle: Math.round(angle), velocity: Math.round(normVel * 1000) / 1000 };
  }

  _recordPunch(shoulderWidth, now = Date.now()) {
    const extendMs = this._phaseStartMs ? now - this._phaseStartMs : 0;

    // Noise gate: too brief AND angle barely cleared threshold = arm jitter, not punch.
    if (extendMs < MIN_EXTEND_MS && this._peakAngle < ANGLE_EXTEND + GENUINE_PEAK_DELTA * 2) {
      this._rejectCounts.brief++;
      this._resetPunch();
      return;
    }

    const recoilMs = this._peakTs ? now - this._peakTs : null;
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
      snapVelocity:    Math.round(this._snapRelVel     * 1000) / 1000,
      recoilVelocity:  Math.round(this._recoilVelocity * 1000) / 1000,
      recoilMs,
      confidence,
      confidenceLabel,
      lateralRatio:    Math.round(lateralRatio * 100),
      classifyReasons: reasons,
      ts: now,
    });
    if (this._events.length > 100) this._events.shift();

    // Set cooldown BEFORE resetPunch so _lastPunchTs persists
    this._lastPunchTs = now;
    this._resetPunch();
  }

  _computeConfidence(type, { straight, hook, lateralRatio }, shoulderWidth) {
    let score = 1.0;

    // Snap velocity too low (normalized)
    const snapNorm = this._snapRelVel / Math.max(shoulderWidth, 0.10);
    if      (snapNorm < VEL_MIN_NORM * 1.5) score -= 0.25;
    else if (snapNorm < VEL_MIN_NORM * 2.5) score -= 0.10;

    // Peak angle barely above threshold
    if (this._peakAngle < ANGLE_EXTEND + GENUINE_PEAK_DELTA) score -= 0.20;

    // Classification uncertain
    const diff = Math.abs(straight - hook);
    if      (diff === 0) score -= 0.30;
    else if (diff === 1) score -= 0.15;

    // Hook without lateral arc
    if (type === "hook" && lateralRatio < 0.40) score -= 0.20;

    // Unstable tracking during punch
    if (!this._trackingStable) score -= 0.20;

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
    this._left        = new _HandTracker("left",  11, 13, 15, 12);
    this._right       = new _HandTracker("right", 12, 14, 16, 11);
    this._bodyApproach = false;
    this._phoneJerk    = false;
  }

  reset() {
    this._left.resetSession();
    this._right.resetSession();
    this._bodyApproach = false;
    this._phoneJerk    = false;
  }

  update(landmarks) {
    // Pass previous frame's bilateral flags to each tracker,
    // then recompute for next frame after both trackers have updated.
    const L = this._left.update(landmarks, this._bodyApproach, this._phoneJerk);
    const R = this._right.update(landmarks, this._bodyApproach, this._phoneJerk);

    // Bilateral z-forward = whole body moving toward camera, not a punch.
    const lz = this._left._live.smoothZRel;
    const rz = this._right._live.smoothZRel;
    this._bodyApproach = lz < BILATERAL_Z_THRESH && rz < BILATERAL_Z_THRESH;

    // Bilateral velocity spike = phone jerk (tap, drop, sudden move), not a punch.
    // A real jab/cross moves ONE hand fast; the other stays in guard.
    // At 10fps a jab+cross combo cannot occur in the same frame.
    const lv = this._left._live.normVel;
    const rv = this._right._live.normVel;
    this._phoneJerk = lv > BILATERAL_VEL_THRESH && rv > BILATERAL_VEL_THRESH;

    if (!L && !R) return null;

    return {
      leftPhase:  L?.phase      || "guard",
      rightPhase: R?.phase      || "guard",
      leftElbow:  L?.elbowAngle ?? null,
      rightElbow: R?.elbowAngle ?? null,
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

  // Rejection counts accumulated since last resetSession — used for debug session report
  getSessionStats() {
    const l = this._left._rejectCounts;
    const r = this._right._rejectCounts;
    return {
      rejects: {
        calib:    (l.calib    || 0) + (r.calib    || 0),
        cooldown: (l.cooldown || 0) + (r.cooldown || 0),
        unstable: (l.unstable || 0) + (r.unstable || 0),
        rate:     (l.rate     || 0) + (r.rate     || 0),
        noExt:    (l.noExt    || 0) + (r.noExt    || 0),
        brief:    (l.brief    || 0) + (r.brief    || 0),
      },
    };
  }

  // "good" | "degraded" | "poor" — based on rolling joint visibility across both hands
  getTrackingQuality() {
    const lv   = this._left._live.rollingVis  ?? 100;
    const rv   = this._right._live.rollingVis ?? 100;
    const minV = Math.min(lv, rv);
    return minV >= 65 ? "good" : minV >= 45 ? "degraded" : "poor";
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
