/**
 * Cinematic coaching messages — converts raw pose session data to
 * natural-language coaching cues a boxer can actually act on.
 *
 * Returns an array of { type: "strength" | "improve", message: string }
 * ordered: improvements first (more actionable), strengths second.
 *
 * Velocity thresholds are calibrated for MediaPipe normalized coords at 10fps
 * with internal EMA smoothing (ALPHA=0.35). Recalibrate after real-world testing.
 *
 *   Snap velocity:   FAST > 0.032, MODERATE 0.016-0.032, SLOW < 0.016
 *   Recoil ratio:    QUICK recoil > 0.60× snap, SLOW < 0.45× snap
 *   Guard recovery:  QUICK < 280ms, SLOW > 520ms
 */

const SNAP_FAST     = 0.032;
const SNAP_MODERATE = 0.016;
const RECOIL_QUICK  = 0.60;  // recoilVelocity / snapVelocity
const RECOIL_SLOW   = 0.45;
const RECOVERY_QUICK_MS = 280;
const RECOVERY_SLOW_MS  = 520;

export function generateCoachingMessages(sessionSummary, punchEvents = []) {
  if (!sessionSummary) return [];

  const improve   = [];
  const strengths = [];

  const hasPunches = punchEvents.length >= 3;

  // ─── Punch extension ──────────────────────────────────────────────────────
  if (hasPunches) {
    const avgAngle = punchEvents.reduce((s, e) => s + e.peakAngle, 0) / punchEvents.length;
    const maxAngle = Math.max(...punchEvents.map((e) => e.peakAngle));
    if (avgAngle < 138) {
      improve.push({ type: "improve", message: "Punch not extending fully — snap through the target, don't stop short" });
    } else if (maxAngle >= 163) {
      strengths.push({ type: "strength", message: "Strong full extension — reaching through on the cross" });
    }
  } else if (sessionSummary.punchExtension?.status === "under_extended") {
    improve.push({ type: "improve", message: "Extension incomplete — straighten the arm all the way through the punch" });
  }

  // ─── Snap speed ───────────────────────────────────────────────────────────
  if (hasPunches) {
    const withSnap  = punchEvents.filter((e) => e.snapVelocity > 0);
    if (withSnap.length >= 2) {
      const avgSnap = withSnap.reduce((s, e) => s + e.snapVelocity, 0) / withSnap.length;
      if (avgSnap < SNAP_MODERATE) {
        improve.push({ type: "improve", message: "Punch speed low — drive through the target, don't push it out" });
      } else if (avgSnap >= SNAP_FAST) {
        strengths.push({ type: "strength", message: "Fast hand speed — good snap and punching tempo" });
      }
    }
  }

  // ─── Recoil speed (hands coming back) ────────────────────────────────────
  if (hasPunches) {
    const withBoth = punchEvents.filter((e) => e.snapVelocity > 0 && e.recoilVelocity > 0);
    if (withBoth.length >= 2) {
      const avgRatio = withBoth.reduce((s, e) => s + e.recoilVelocity / e.snapVelocity, 0) / withBoth.length;
      if (avgRatio < RECOIL_SLOW) {
        improve.push({ type: "improve", message: "Hands coming back slow — recoil as fast as you punch, no lingering" });
      } else if (avgRatio >= RECOIL_QUICK) {
        strengths.push({ type: "strength", message: "Quick recoil — snapping hands back into guard position" });
      }
    }
  }

  // ─── Guard recovery time ──────────────────────────────────────────────────
  if (hasPunches) {
    const withMs = punchEvents.filter((e) => e.recoilMs != null);
    if (withMs.length >= 2) {
      const avgMs = withMs.reduce((s, e) => s + e.recoilMs, 0) / withMs.length;
      if (avgMs > RECOVERY_SLOW_MS) {
        improve.push({ type: "improve", message: "Guard slow to recover after punch — potential opening on the return" });
      } else if (avgMs < RECOVERY_QUICK_MS && withMs.length >= 4) {
        strengths.push({ type: "strength", message: "Guard recovering quickly after each punch" });
      }
    }
  }

  // ─── Guard height ─────────────────────────────────────────────────────────
  const guard = sessionSummary.guardHeight;
  if (guard?.status === "too_low") {
    improve.push({ type: "improve", message: "Guard dropping — return hands to chin immediately after each punch" });
  } else if (guard?.status === "too_high") {
    improve.push({ type: "improve", message: "Guard raised too high — relax shoulders, hands at chin level" });
  } else if (guard?.status === "good" && sessionSummary.frameCount >= 10) {
    strengths.push({ type: "strength", message: "Guard discipline solid — hands stayed up throughout the session" });
  }

  // ─── Shoulder-hip rotation ────────────────────────────────────────────────
  const rot = sessionSummary.rotation;
  if (rot?.status === "under_rotated") {
    improve.push({ type: "improve", message: "Drive the hip into the punch — rotation is where power comes from" });
  } else if (rot?.status === "over_rotated") {
    improve.push({ type: "improve", message: "Too much rotation — you're leaving your chin open on the cross" });
  } else if (rot?.status === "good") {
    strengths.push({ type: "strength", message: "Good hip-shoulder separation — power transferring into punches" });
  }

  // ─── Balance ──────────────────────────────────────────────────────────────
  const bal = sessionSummary.balance;
  if (bal?.status === "off_balance") {
    improve.push({ type: "improve", message: "Weight drifting laterally — stay centered, hips over your base" });
  }

  // ─── Stance ───────────────────────────────────────────────────────────────
  const stance = sessionSummary.stanceWidth;
  if (stance?.status === "too_narrow") {
    improve.push({ type: "improve", message: "Stance too narrow — widen your base, one shoulder-width minimum" });
  } else if (stance?.status === "too_wide") {
    improve.push({ type: "improve", message: "Feet too wide — reduce stance for better lateral mobility" });
  }

  return [...improve, ...strengths];
}

/**
 * Compute velocity-based statistics across all punch events.
 * Returns null if fewer than 3 punches recorded.
 */
export function computeVelocityStats(punchEvents = []) {
  if (punchEvents.length < 3) return null;

  const withSnap  = punchEvents.filter((e) => e.snapVelocity > 0);
  const withRecoil = punchEvents.filter((e) => e.recoilVelocity > 0);
  const withMs    = punchEvents.filter((e) => e.recoilMs != null);

  const avgSnap   = withSnap.length  ? withSnap.reduce((s, e) => s + e.snapVelocity, 0)   / withSnap.length  : null;
  const avgRecoil = withRecoil.length ? withRecoil.reduce((s, e) => s + e.recoilVelocity, 0) / withRecoil.length : null;
  const avgMs     = withMs.length    ? withMs.reduce((s, e) => s + e.recoilMs, 0)          / withMs.length    : null;

  return {
    avgSnapVelocity:   avgSnap   != null ? Math.round(avgSnap   * 1000) / 1000 : null,
    avgRecoilVelocity: avgRecoil != null ? Math.round(avgRecoil * 1000) / 1000 : null,
    avgRecoilMs:       avgMs     != null ? Math.round(avgMs)                    : null,
    snapRating:
      avgSnap == null          ? null :
      avgSnap >= SNAP_FAST     ? "FAST" :
      avgSnap >= SNAP_MODERATE ? "MODERATE" : "SLOW",
    recoilRating:
      avgMs == null               ? null :
      avgMs < RECOVERY_QUICK_MS   ? "QUICK" :
      avgMs > RECOVERY_SLOW_MS    ? "SLOW"  : "MODERATE",
  };
}

/**
 * Maps internal camera quality string to a user-facing score label.
 */
export function cameraQualityScore(quality) {
  switch (quality) {
    case "full_body":       return "PERFECT";
    case "upper_body_hips": return "GOOD";
    case "upper_body_only": return "LIMITED";
    case "too_close":       return "UNUSABLE";
    default:                return null;
  }
}
