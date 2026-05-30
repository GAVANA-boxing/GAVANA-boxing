/**
 * Defensive action detector — Phase 2
 *
 * Detects head-movement defensive actions (slip, bob/weave) from MediaPipe landmarks.
 * Operates at ~10fps. All thresholds are shoulder-width-relative to be
 * camera-distance-invariant.
 *
 * Landmarks used:
 *   0  = nose
 *   11 = left shoulder
 *   12 = right shoulder
 */

const WINDOW_MS   = 400;  // sliding detection window
const COOLDOWN_MS = 900;  // minimum gap between same-type events

// Head must shift >28% of shoulder width sideways to register as a slip
const SLIP_THRESH = 0.28;
// Head must drop >5% of frame height (nose.y increase relative to shoulder mid) to register as bob
const BOB_THRESH  = 0.05;

// Minimum shoulder width to trust the frame (eliminates far-away or partial detections)
const MIN_SHOULDER_W = 0.06;

export class DefensiveDetector {
  constructor() {
    this._history     = [];
    this._lastSlipT   = 0;
    this._lastBobT    = 0;
    this._slipCount   = 0;
    this._bobCount    = 0;
    this._sessionStartT = null;
    this._sessionEndT   = null;
  }

  reset() {
    this._history     = [];
    this._lastSlipT   = 0;
    this._lastBobT    = 0;
    this._slipCount   = 0;
    this._bobCount    = 0;
    this._sessionStartT = null;
    this._sessionEndT   = null;
  }

  /**
   * Call once per pose frame with smoothed landmarks and the frame timestamp (ms).
   */
  addFrame(landmarks, t) {
    if (!landmarks || landmarks.length < 13) return;

    this._sessionEndT = t;
    if (this._sessionStartT === null) this._sessionStartT = t;

    const nose     = landmarks[0];
    const lShoulder = landmarks[11];
    const rShoulder = landmarks[12];

    const shoulderW  = Math.abs(lShoulder.x - rShoulder.x);
    if (shoulderW < MIN_SHOULDER_W) return;

    const midX = (lShoulder.x + rShoulder.x) / 2;
    const midY = (lShoulder.y + rShoulder.y) / 2;

    // relX: head offset left/right as fraction of shoulder width (0 = centered)
    const relX = (nose.x - midX) / shoulderW;
    // relY: nose-to-shoulder vertical gap in normalized coords (negative = nose above shoulders)
    const relY = nose.y - midY;

    this._history.push({ relX, relY, t });

    // Prune frames outside detection window
    const cutoff = t - WINDOW_MS;
    while (this._history.length > 1 && this._history[0].t < cutoff) {
      this._history.shift();
    }

    if (this._history.length < 2) return;

    const oldest = this._history[0];
    const dX = Math.abs(relX - oldest.relX);
    const dY = relY - oldest.relY; // positive = head dropped toward shoulders

    // Slip: sharp lateral head shift
    if (dX > SLIP_THRESH && t - this._lastSlipT > COOLDOWN_MS) {
      this._slipCount++;
      this._lastSlipT = t;
      // Reset history to prevent double-counting the same motion
      this._history = [{ relX, relY, t }];
    }

    // Bob/weave: sharp downward head movement
    if (dY > BOB_THRESH && t - this._lastBobT > COOLDOWN_MS) {
      this._bobCount++;
      this._lastBobT = t;
      this._history = [{ relX, relY, t }];
    }
  }

  getStats() {
    const durationMs = (this._sessionStartT !== null && this._sessionEndT !== null)
      ? this._sessionEndT - this._sessionStartT
      : 0;
    const durationMin = durationMs / 60000;

    const total = this._slipCount + this._bobCount;
    const freq  = durationMin > 0 ? Math.round((total / durationMin) * 10) / 10 : 0;

    let defensiveStyle;
    if (total === 0) {
      defensiveStyle = "guard_reliant";
    } else if (this._slipCount >= this._bobCount * 2) {
      defensiveStyle = "evasive";
    } else if (this._bobCount >= this._slipCount * 2) {
      defensiveStyle = "pressure_shell";
    } else if (freq >= 8) {
      defensiveStyle = "active_defender";
    } else {
      defensiveStyle = "mixed_defense";
    }

    return {
      slipCount:          this._slipCount,
      bobCount:           this._bobCount,
      defensiveTotal:     total,
      defensiveFreqPerMin: freq,
      defensiveStyle,
    };
  }
}
