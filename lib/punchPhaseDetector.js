/**
 * Punch Phase Detector — dual-hand, stateful, frame-by-frame.
 *
 * Designed for front-facing laptop/mobile camera (~10fps, MediaPipe lite).
 * Receives RAW (unsmoothed) landmarks from usePoseDetection.js.
 *
 * DESIGN PRINCIPLES:
 *   - All motion measured relative to shoulder. Body sway cancels out.
 *   - Angle EMA stabilises elbow threshold crossing without lag-killing peaks.
 *   - Z smoothed separately — MediaPipe lite z is very noisy.
 *   - Intent-first gating: high-velocity punches bypass secondary gates.
 *   - Upper-body framing mode: auto-relaxes thresholds when hips not visible.
 *   - Stance calibration: tracks lead hand (orthodox/southpaw) dynamically.
 *   - Soft confidence: marginal punches accepted with lower confidence score.
 *   - Arc classifier: lateral sweep + bounded extension = hook, not misclassified cross.
 *   - All reject/accept reasons stored on punch events and live data for debug.
 */

// ── Detection gates ────────────────────────────────────────────────────────────
const ANGLE_GUARD         = 100;
const ANGLE_EXTEND        = 105;   // entry angle
const VEL_MIN_NORM        = 0.042; // min normalized velocity to enter extending (was 0.050)
const EXT_DELTA_NORM      = 0.10;  // arm extension minimum — full-body framing (was 0.12)
const EXT_DELTA_UPPER     = 0.065; // arm extension minimum — upper-body-only framing (new)
const SNAP_BYPASS_VEL     = 0.130; // normVel above this bypasses extDeltaNorm entirely (intent priority)
const Z_FWD_GATE          = -0.018;
const Z_FWD_MIN_EXT       = 0.025; // was 0.030
// Bilateral false-positive gates (body approach / phone jerk)
const BILATERAL_Z_THRESH  = -0.012;
const BILATERAL_Z_DIFF_MAX= 0.010; // was 0.007 — more lenient asymmetry
const BILATERAL_VEL_THRESH= 0.050;
const BILATERAL_VEL_RATIO = 1.7;   // was 2.0 — phone jerk gate less aggressive
const TOO_CLOSE_SW        = 0.52;

// ── Smoothing ──────────────────────────────────────────────────────────────────
const ANGLE_EMA_ALPHA     = 0.50;
const Z_EMA_ALPHA         = 0.35;
const GUARD_ALPHA         = 0.15;
const GUARD_CALIB_ALPHA   = 0.40;
const VIS_EMA_ALPHA       = 0.25;

// ── Stability gates ────────────────────────────────────────────────────────────
const ANGLE_MIN_RATE      = 2.0;   // was 3.0 — slightly more lenient
const VEL_HIGH_BYPASS     = 0.110; // normVel bypasses angle-rate gate
const EXT_BYPASS_RATE     = 0.085;
const MIN_EXTEND_MS       = 80;    // was 90
const PUNCH_COOLDOWN_MS   = 320;   // was 400 — allow jab-cross-hook combos
const CALIB_FRAMES        = 4;     // was 6 — faster warmup
const TRACK_UNSTABLE_VIS  = 0.35;  // was 0.38 — slightly more tolerant
// Cross/shoulder gate: arm must be faster than shoulder by THIS ratio.
// Was 1.5 — too tight. During a cross/overhand, shoulder rotates INTO the punch.
// Wrist only needs to be 2.2× faster than shoulder, not 3-4× faster.
const WRIST_DOMINANCE_RATIO = 2.2; // was 1.5 — CRITICAL FIX for cross detection
const SHOULDER_MOVE_THRESH  = 0.035;

// ── Hook arc classifier ────────────────────────────────────────────────────────
// True hooks have: limited elbow extension (arm stays bent) + lateral arc + limited dist increase
const HOOK_MAX_PEAK_ANGLE = 140;  // hook arm doesn't fully straighten
const HOOK_MIN_LATERAL    = 0.50; // lateral ratio must be significant
const HOOK_ARC_DIST_MAX   = 0.14; // normalized dist increase — hooks extend less than straights

// ── Upper-body framing ─────────────────────────────────────────────────────────
// When shoulder width > this in normalized coords, user is close → likely upper-body only.
// Relax EXT_DELTA threshold and disable z-reliability assumption.
const UPPER_BODY_SW_THRESH = 0.38;

// ── Other ──────────────────────────────────────────────────────────────────────
const MIN_VIS             = 0.45;  // was 0.50 — accept slightly lower visibility
const GENUINE_PEAK_DELTA  = 5;
const EXTEND_TIMEOUT_MS   = 1200;
const RECOIL_TIMEOUT_MS   = 900;

// ── Geometry ──────────────────────────────────────────────────────────────────

function _dist3D(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = (a.z ?? 0) - (b.z ?? 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

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
// Intent-first: arm extension (dist increase) is the PRIMARY indicator of a straight punch.
// Lateral ratio still used but only dominant when extension evidence is absent.
// Hook = lateral arc + bounded extension + bent arm.

function _typeScores(peakAngle, relExtMaxX, relExtMaxY, zForwardTotal, distIncrease, shoulderWidth) {
  let straight = 0, hook = 0;
  const reasons = [];
  const sw = Math.max(shoulderWidth, 0.10);
  const extNorm = distIncrease / sw; // arm extension normalized by shoulder width

  // ── Elbow angle ────────────────────────────────────────────────────────────
  if      (peakAngle >= 145) { straight += 3; reasons.push(`a${peakAngle}s3`); }
  else if (peakAngle >= 128) { straight += 2; reasons.push(`a${peakAngle}s2`); } // was +1
  else if (peakAngle >= 118) { straight += 1; reasons.push(`a${peakAngle}s1`); }
  else if (peakAngle <  115) { hook     += 3; reasons.push(`a${peakAngle}h3`); }
  else                       { hook     += 1; reasons.push(`a${peakAngle}h1`); }

  // ── Arm extension (STRONGER weight than before) ────────────────────────────
  // A cross extends significantly even if it looks diagonal from the front camera.
  // This is the primary indicator of INTENT to punch straight (not arc).
  if      (extNorm > 0.22) { straight += 3; reasons.push(`dist${extNorm.toFixed(2)}s3`); }
  else if (extNorm > 0.14) { straight += 2; reasons.push(`dist${extNorm.toFixed(2)}s2`); }
  else if (extNorm > 0.07) { straight += 1; reasons.push(`dist${extNorm.toFixed(2)}s1`); }
  else if (extNorm < 0.05) { hook     += 1; reasons.push(`dist${extNorm.toFixed(2)}h1`); } // limited ext = more likely hook

  // ── Lateral ratio ──────────────────────────────────────────────────────────
  // Front-camera inflates lateral for crosses. Only score lateral → hook when
  // BOTH conditions hold: high lateral AND limited extension AND bent arm.
  const lateralTotal = relExtMaxX + relExtMaxY;
  const lateralRatio = lateralTotal > 0 ? relExtMaxX / lateralTotal : 0;
  const isForward    = zForwardTotal < -0.015;
  const isHookArc    = lateralRatio > HOOK_MIN_LATERAL
    && peakAngle <= HOOK_MAX_PEAK_ANGLE
    && extNorm <= HOOK_ARC_DIST_MAX; // arc + bent + short = hook

  if      (isHookArc)                                { hook     += 2; reasons.push(`arc${Math.round(lateralRatio*100)}h2`); }
  else if (lateralRatio > 0.70 && !isForward && extNorm < 0.10) { hook += 1; reasons.push(`lat${Math.round(lateralRatio*100)}h1`); }
  else if (lateralRatio > 0.55 &&  isForward) { straight += 1; reasons.push(`lat${Math.round(lateralRatio*100)}+zFwd s1`); }
  else if (lateralRatio < 0.35)               { straight += 1; reasons.push(`lat${Math.round(lateralRatio*100)} s1`); }

  // ── Z-forward contribution ─────────────────────────────────────────────────
  if      (zForwardTotal < -0.05)  { straight += 2; reasons.push("zf s2"); }
  else if (zForwardTotal < -0.015) { straight += 1; reasons.push("zf s1"); }

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
    this._isLeadHand    = (hand === "left"); // default: orthodox

    // Session-persistent
    this._guardBaseDist  = null;
    this._smoothAngle    = null;
    this._prevSmoothAngle= null;
    this._smoothZRel     = 0;
    this._lastPunchTs    = 0;
    this._calibFrames    = 0;
    this._rollingVis     = null;
    this._trackingStable = true;
    this._prevShPos      = null;
    this._rejectCounts   = { calib: 0, cooldown: 0, unstable: 0, rate: 0, noExt: 0, brief: 0, body: 0 };
    this._acceptCounts   = { full: 0, snap_bypass: 0, upper_body: 0 };

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
      bodyApproach: false, phoneJerk: false, cameraTooClose: false, shoulderMoving: false,
      calibrated: false, trackingOK: true, rollingVis: 100, cooldownLeft: 0,
      straightScore: 0, hookScore: 0,
      forwardDelta: 0, lateralPct: 0,
      classifyHint: "—", triggerReason: "—",
      framingMode: "full", snapBypass: false,
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
    this._snapBypassUsed = false;
    this._upperBodyMode  = false;
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
    this._prevShPos       = null;
    this._rejectCounts    = { calib: 0, cooldown: 0, unstable: 0, rate: 0, noExt: 0, brief: 0, body: 0 };
    this._acceptCounts    = { full: 0, snap_bypass: 0, upper_body: 0 };
    this._events          = [];
    this._live            = this._emptyLive();
  }

  setLeadHand(isLead) { this._isLeadHand = isLead; }
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
    const minVis = Math.min(sh.visibility ?? 1, el.visibility ?? 1, wr.visibility ?? 1);
    this._rollingVis     = this._rollingVis === null
      ? minVis
      : VIS_EMA_ALPHA * minVis + (1 - VIS_EMA_ALPHA) * this._rollingVis;
    this._trackingStable = (this._rollingVis ?? 1) >= TRACK_UNSTABLE_VIS;

    // ── Shoulder width ────────────────────────────────────────────────────────
    const shoulderWidth = Math.max(_dist3D(sh, shOther), 0.10);

    // ── Mobile/upper-body framing mode ────────────────────────────────────────
    // When camera is close or hips not visible, shoulderWidth is large in normalized coords.
    // Relax extension threshold — arm extension appears smaller in close framing.
    const upperBodyMode = shoulderWidth > UPPER_BODY_SW_THRESH;
    const effectiveExtDelta = upperBodyMode ? EXT_DELTA_UPPER : EXT_DELTA_NORM;

    // ── Shoulder-relative wrist position ─────────────────────────────────────
    const relX = wr.x - sh.x;
    const relY = wr.y - sh.y;
    const relZ = (wr.z ?? 0) - (sh.z ?? 0);

    // ── Relative xy velocity ──────────────────────────────────────────────────
    const relVelXY = this._prevRelXY
      ? Math.sqrt((relX - this._prevRelXY.x) ** 2 + (relY - this._prevRelXY.y) ** 2)
      : 0;
    const normVel = relVelXY / shoulderWidth;

    // ── Z-delta, smoothed ─────────────────────────────────────────────────────
    const zRelDeltaRaw = this._prevRelZ !== null ? relZ - this._prevRelZ : 0;
    this._smoothZRel   = Z_EMA_ALPHA * zRelDeltaRaw + (1 - Z_EMA_ALPHA) * this._smoothZRel;

    this._prevRelXY = { x: relX, y: relY };
    this._prevRelZ  = relZ;

    // ── Elbow angle, smoothed ─────────────────────────────────────────────────
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

    // ── Shoulder movement gate ────────────────────────────────────────────────
    // During a cross, the shoulder rotates INTO the punch — so shoulder DOES move.
    // Threshold raised to 2.2× so body-sway (slow, both shoulders) still filtered
    // but cross (arm dominant over shoulder rotation) passes through.
    const shVelRaw = this._prevShPos
      ? Math.sqrt((sh.x - this._prevShPos.x) ** 2 + (sh.y - this._prevShPos.y) ** 2)
      : 0;
    const shVelNorm = shVelRaw / shoulderWidth;
    this._prevShPos = { x: sh.x, y: sh.y };
    const shoulderBodyMoving = shVelNorm > SHOULDER_MOVE_THRESH
      && normVel <= shVelNorm * WRIST_DOMINANCE_RATIO;

    const now = Date.now();
    const isCalibrated = this._calibFrames >= CALIB_FRAMES;
    const cooldownLeft = Math.max(0, PUNCH_COOLDOWN_MS - (now - this._lastPunchTs));

    // ── Intent-first bypass gates ─────────────────────────────────────────────
    // Very fast snaps: bypass extension check entirely (arm is clearly punching)
    const snapBypass = normVel > SNAP_BYPASS_VEL;

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
    this._live.cameraTooClose    = shoulderWidth > TOO_CLOSE_SW;
    this._live.shoulderMoving    = shoulderBodyMoving;
    this._live.calibrated        = isCalibrated;
    this._live.trackingOK        = this._trackingStable;
    this._live.rollingVis        = Math.round((this._rollingVis ?? 1) * 100);
    this._live.cooldownLeft      = cooldownLeft;
    this._live.framingMode       = upperBodyMode ? "upper_body" : "full";
    this._live.snapBypass        = snapBypass;

    switch (this._phase) {
      case "guard": {
        const angleRising = angleRate > ANGLE_MIN_RATE
          || normVel > VEL_HIGH_BYPASS
          || extDeltaNorm > EXT_BYPASS_RATE;
        const onCooldown  = cooldownLeft > 0;

        const cameraTooClose = shoulderWidth > TOO_CLOSE_SW;
        const zFwdValid = !bodyApproach
          && !cameraTooClose
          && this._smoothZRel < Z_FWD_GATE
          && extDeltaNorm > Z_FWD_MIN_EXT;

        // Extension OR snap bypass: high-velocity punches don't need extension gate
        const extOK = extDeltaNorm > effectiveExtDelta || zFwdValid || snapBypass;

        const canEnter = angle > ANGLE_EXTEND
          && normVel > VEL_MIN_NORM
          && angleRising
          && extOK
          && isCalibrated
          && this._trackingStable
          && !onCooldown
          && !phoneJerk
          && !shoulderBodyMoving;

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
          this._snapBypassUsed = snapBypass;
          this._upperBodyMode  = upperBodyMode;
          const modeStr        = upperBodyMode ? " UB" : "";
          const bypassStr      = snapBypass ? " SNAP" : "";
          this._live.triggerReason =
            `ang${Math.round(angle)} nV${normVel.toFixed(3)} ` +
            `extN${extDeltaNorm.toFixed(2)} rate${angleRate.toFixed(1)} ` +
            `zS${this._smoothZRel.toFixed(3)}${modeStr}${bypassStr}`;
        } else if (angle > ANGLE_EXTEND && normVel > VEL_MIN_NORM * 0.7) {
          // Near-miss: log rejection reason
          if (shoulderBodyMoving) {
            this._live.triggerReason = `sh-move sh${shVelNorm.toFixed(3)} w/s=${(normVel/Math.max(shVelNorm,0.001)).toFixed(1)} (need ${WRIST_DOMINANCE_RATIO}×)`;
            this._rejectCounts.body++;
          } else if (phoneJerk) {
            this._live.triggerReason = `phoneJerk vel${this._live.normVel.toFixed(3)} (bilateral)`;
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
          } else if (!extOK) {
            const modeStr = upperBodyMode ? "(UB)" : "";
            this._live.triggerReason = `noExt e${extDeltaNorm.toFixed(2)}<${effectiveExtDelta}${modeStr} z${this._smoothZRel.toFixed(3)} vel${normVel.toFixed(3)}<${SNAP_BYPASS_VEL}`;
            this._rejectCounts.noExt++;
          } else {
            this._live.triggerReason = `blocked z${this._smoothZRel.toFixed(3)} e${extDeltaNorm.toFixed(2)}`;
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
          ? (this._isLeadHand ? "jab?" : "cross?")
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

    // Noise gate: too brief AND angle barely cleared threshold = arm jitter.
    // Snap bypass punches get a more lenient brief gate (fast punches are short).
    const briefThreshold = this._snapBypassUsed ? MIN_EXTEND_MS * 0.5 : MIN_EXTEND_MS;
    if (extendMs < briefThreshold && this._peakAngle < ANGLE_EXTEND + GENUINE_PEAK_DELTA * 2) {
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
    const type   = isHook ? "hook" : (this._isLeadHand ? "jab" : "cross");

    const { confidence, confidenceLabel, confidenceReasons } = this._computeConfidence(
      type, { straight, hook, lateralRatio }, shoulderWidth
    );

    // Accept reason: what path was used to accept this punch
    let acceptReason = "full";
    if (this._snapBypassUsed) acceptReason = "snap_bypass";
    else if (this._upperBodyMode) acceptReason = "upper_body";
    this._acceptCounts[acceptReason] = (this._acceptCounts[acceptReason] || 0) + 1;

    this._events.push({
      hand:            this.hand,
      type,
      peakAngle:       Math.round(this._peakAngle),
      snapVelocity:    Math.round(this._snapRelVel     * 1000) / 1000,
      recoilVelocity:  Math.round(this._recoilVelocity * 1000) / 1000,
      recoilMs,
      confidence,
      confidenceLabel,
      confidenceReasons,
      lateralRatio:    Math.round(lateralRatio * 100),
      classifyReasons: reasons,
      acceptReason,
      framingMode:     this._upperBodyMode ? "upper_body" : "full",
      ts: now,
    });
    if (this._events.length > 100) this._events.shift();

    this._lastPunchTs = now;
    this._resetPunch();
  }

  _computeConfidence(type, { straight, hook, lateralRatio }, shoulderWidth) {
    let score = 1.0;
    const reasons = [];

    // Snap velocity too low
    const snapNorm = this._snapRelVel / Math.max(shoulderWidth, 0.10);
    if      (snapNorm < VEL_MIN_NORM * 1.5) { score -= 0.25; reasons.push("lowSnap"); }
    else if (snapNorm < VEL_MIN_NORM * 2.5) { score -= 0.10; reasons.push("modSnap"); }

    // Peak angle barely above threshold
    if (this._peakAngle < ANGLE_EXTEND + GENUINE_PEAK_DELTA) { score -= 0.20; reasons.push("marginalAngle"); }

    // Classification uncertain
    const diff = Math.abs(straight - hook);
    if      (diff === 0) { score -= 0.30; reasons.push("typeUncertain"); }
    else if (diff === 1) { score -= 0.15; reasons.push("typeMarginal"); }

    // Hook without lateral arc — likely a cross that got misclassified
    if (type === "hook" && lateralRatio < 0.40) { score -= 0.20; reasons.push("hookNoArc"); }

    // Unstable tracking
    if (!this._trackingStable) { score -= 0.15; reasons.push("unstable"); }

    // Snap bypass: confidence slightly reduced (extension not confirmed)
    if (this._snapBypassUsed) { score -= 0.10; reasons.push("snapBypass"); }

    // Upper-body mode: slight confidence reduction (thresholds relaxed)
    if (this._upperBodyMode && !this._snapBypassUsed) { score -= 0.05; reasons.push("upperBody"); }

    score = Math.max(0, Math.min(1, score));
    const confidenceLabel = score >= 0.70 ? "high" : score >= 0.45 ? "medium" : "low";
    return { confidence: Math.round(score * 100) / 100, confidenceLabel, confidenceReasons: reasons.join(",") };
  }

  get phase()  { return this._phase; }
  getEvents()  { return [...this._events]; }
}

// ── Stance calibration ─────────────────────────────────────────────────────────
// Tracks which hand fires the lead jab. After enough punches, infers orthodox/southpaw.
// - Orthodox: left hand leads (more punches or first quick punch)
// - Southpaw: right hand leads

const STANCE_MIN_PUNCHES = 5; // minimum punches before stance locks

class _StanceCalibrator {
  constructor() { this._leftCount = 0; this._rightCount = 0; this._locked = false; }

  record(hand) {
    if (hand === "left") this._leftCount++;
    else this._rightCount++;
  }

  reset() { this._leftCount = 0; this._rightCount = 0; this._locked = false; }

  // Returns true if left hand is lead (orthodox stance)
  isOrthodox() {
    return this._leftCount >= this._rightCount;
  }

  get hint() {
    const total = this._leftCount + this._rightCount;
    if (total < STANCE_MIN_PUNCHES) return "unknown";
    return this._leftCount >= this._rightCount ? "orthodox" : "southpaw";
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export class PunchPhaseDetector {
  constructor() {
    this._left         = new _HandTracker("left",  11, 13, 15, 12);
    this._right        = new _HandTracker("right", 12, 14, 16, 11);
    this._bodyApproach = false;
    this._phoneJerk    = false;
    this._stance       = new _StanceCalibrator();
  }

  reset() {
    this._left.resetSession();
    this._right.resetSession();
    this._bodyApproach = false;
    this._phoneJerk    = false;
    this._stance.reset();
  }

  update(landmarks) {
    // Update stance on both trackers before processing this frame
    const isOrthodox = this._stance.isOrthodox();
    this._left.setLeadHand(isOrthodox);         // left = lead in orthodox
    this._right.setLeadHand(!isOrthodox);       // right = lead in southpaw

    const L = this._left.update(landmarks, this._bodyApproach, this._phoneJerk);
    const R = this._right.update(landmarks, this._bodyApproach, this._phoneJerk);

    // Recompute bilateral flags for next frame
    const lz = this._left._live.smoothZRel;
    const rz = this._right._live.smoothZRel;
    const zDiff = Math.abs(lz - rz);
    this._bodyApproach = lz < BILATERAL_Z_THRESH
      && rz < BILATERAL_Z_THRESH
      && zDiff < BILATERAL_Z_DIFF_MAX;

    const lv = this._left._live.normVel;
    const rv = this._right._live.normVel;
    const maxV = Math.max(lv, rv);
    const minV = Math.min(lv, rv);
    const velRatio = minV > 0.005 ? maxV / minV : maxV / 0.005;
    this._phoneJerk = lv > BILATERAL_VEL_THRESH
      && rv > BILATERAL_VEL_THRESH
      && velRatio < BILATERAL_VEL_RATIO;

    // Record new punches for stance calibration
    const prevTotal = this._left.getEvents().length + this._right.getEvents().length;
    // (events already recorded inside _HandTracker — check for new ones via count)
    // We track stance by looking at event timestamps vs previous update
    this._updateStanceFromEvents();

    if (!L && !R) return null;

    return {
      leftPhase:  L?.phase      || "guard",
      rightPhase: R?.phase      || "guard",
      leftElbow:  L?.elbowAngle ?? null,
      rightElbow: R?.elbowAngle ?? null,
      velocity:   Math.max(L?.velocity || 0, R?.velocity || 0),
    };
  }

  _updateStanceFromEvents() {
    // Sync stance calibrator with total events from each tracker
    const leftEvents  = this._left.getEvents().length;
    const rightEvents = this._right.getEvents().length;
    // Reset and recount each time (simple, always consistent)
    this._stance._leftCount  = leftEvents;
    this._stance._rightCount = rightEvents;
  }

  getPunchEvents() {
    return [...this._left.getEvents(), ...this._right.getEvents()]
      .sort((a, b) => a.ts - b.ts);
  }

  getHandLiveData() {
    return { left: this._left.getLiveData(), right: this._right.getLiveData() };
  }

  getSessionStats() {
    const l = this._left._rejectCounts;
    const r = this._right._rejectCounts;
    const la = this._left._acceptCounts;
    const ra = this._right._acceptCounts;
    return {
      rejects: {
        calib:    (l.calib    || 0) + (r.calib    || 0),
        cooldown: (l.cooldown || 0) + (r.cooldown || 0),
        unstable: (l.unstable || 0) + (r.unstable || 0),
        rate:     (l.rate     || 0) + (r.rate     || 0),
        noExt:    (l.noExt    || 0) + (r.noExt    || 0),
        brief:    (l.brief    || 0) + (r.brief    || 0),
        body:     (l.body     || 0) + (r.body     || 0),
      },
      accepts: {
        full:        (la.full        || 0) + (ra.full        || 0),
        snap_bypass: (la.snap_bypass || 0) + (ra.snap_bypass || 0),
        upper_body:  (la.upper_body  || 0) + (ra.upper_body  || 0),
      },
      stanceHint: this._stance.hint,
    };
  }

  getTrackingQuality() {
    const lv   = this._left._live.rollingVis  ?? 100;
    const rv   = this._right._live.rollingVis ?? 100;
    const minV = Math.min(lv, rv);
    return minV >= 65 ? "good" : minV >= 45 ? "degraded" : "poor";
  }

  getStanceHint() { return this._stance.hint; }

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
