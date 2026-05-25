/**
 * Cinematic coaching messages — converts raw pose session data to
 * natural-language coaching cues a boxer can actually act on.
 *
 * Returns { type: "strength" | "improve" | "caution", message: string }[]
 * ordered: improvements first, strengths second, cautions last.
 *
 * Velocity thresholds for MediaPipe normalized coords @ 10fps, EMA α=0.35:
 *   Snap:     FAST > 0.032  MODERATE 0.016-0.032  SLOW < 0.016
 *   Recovery: QUICK < 280ms  MODERATE 280-520ms  SLOW > 520ms
 *   Recoil ratio (recoilVel/snapVel): QUICK > 0.60  SLOW < 0.45
 */

const SNAP_FAST         = 0.032;
const SNAP_MODERATE     = 0.016;
const RECOIL_QUICK      = 0.60;
const RECOIL_SLOW       = 0.45;
const RECOVERY_QUICK_MS = 280;
const RECOVERY_SLOW_MS  = 520;
const CONFIDENCE_MIN    = 0.45; // below this = filter out of type-specific coaching

// ─── Punch breakdown ──────────────────────────────────────────────────────────

export function computePunchBreakdown(punchEvents = []) {
  // Only include punches with enough confidence for type-specific stats
  const confident = punchEvents.filter((e) => (e.confidence ?? 1) >= CONFIDENCE_MIN);
  const types = { jab: [], cross: [], hook: [] };
  for (const e of confident) {
    if (types[e.type]) types[e.type].push(e);
  }

  const summary = {};
  for (const [type, events] of Object.entries(types)) {
    if (!events.length) continue;
    summary[type] = {
      count:    events.length,
      avgAngle: Math.round(events.reduce((s, e) => s + e.peakAngle, 0) / events.length),
      avgSnap:  events.filter((e) => e.snapVelocity > 0).length
        ? Math.round(events.filter((e) => e.snapVelocity > 0).reduce((s, e) => s + e.snapVelocity, 0) /
            events.filter((e) => e.snapVelocity > 0).length * 1000) / 1000
        : null,
    };
  }
  return summary;
}

// ─── Velocity stats ───────────────────────────────────────────────────────────

export function computeVelocityStats(punchEvents = []) {
  if (punchEvents.length < 3) return null;

  const withSnap   = punchEvents.filter((e) => e.snapVelocity > 0);
  const withRecoil = punchEvents.filter((e) => e.recoilVelocity > 0);
  const withMs     = punchEvents.filter((e) => e.recoilMs != null);

  const avgSnap   = withSnap.length   ? withSnap.reduce((s, e) => s + e.snapVelocity, 0)   / withSnap.length   : null;
  const avgRecoil = withRecoil.length ? withRecoil.reduce((s, e) => s + e.recoilVelocity, 0) / withRecoil.length : null;
  const avgMs     = withMs.length     ? withMs.reduce((s, e) => s + e.recoilMs, 0)          / withMs.length     : null;

  return {
    avgSnapVelocity:   avgSnap   != null ? Math.round(avgSnap   * 1000) / 1000 : null,
    avgRecoilVelocity: avgRecoil != null ? Math.round(avgRecoil * 1000) / 1000 : null,
    avgRecoilMs:       avgMs     != null ? Math.round(avgMs)                    : null,
    snapRating:
      avgSnap == null          ? null :
      avgSnap >= SNAP_FAST     ? "FAST"     :
      avgSnap >= SNAP_MODERATE ? "MODERATE" : "SLOW",
    recoilRating:
      avgMs == null              ? null :
      avgMs < RECOVERY_QUICK_MS  ? "QUICK"    :
      avgMs > RECOVERY_SLOW_MS   ? "SLOW"     : "MODERATE",
  };
}

// ─── Session confidence ───────────────────────────────────────────────────────

export function computeSessionConfidence(poseMetrics, punchEvents = []) {
  if (!poseMetrics) return "low";

  const { frameCount = 0, cameraQuality, visibilityGaps = [] } = poseMetrics;

  // Camera quality kills confidence immediately
  if (cameraQuality === "too_close") return "low";

  // Not enough pose frames
  if (frameCount < 10) return "low";

  // High-confidence punch ratio
  const highConfPunches = punchEvents.filter((e) => (e.confidence ?? 0) >= 0.70).length;
  const highConfRatio   = punchEvents.length > 0 ? highConfPunches / punchEvents.length : 1;

  const hasLowerGaps = visibilityGaps.some((k) => ["stanceWidth", "balance"].includes(k));

  if (
    frameCount >= 50 &&
    (cameraQuality === "full_body" || cameraQuality === "upper_body_hips") &&
    !hasLowerGaps &&
    highConfRatio >= 0.60
  ) return "high";

  if (
    frameCount >= 20 &&
    cameraQuality !== "too_close" &&
    highConfRatio >= 0.40
  ) return "medium";

  return "low";
}

// ─── Coaching messages ────────────────────────────────────────────────────────

export function generateCoachingMessages(sessionSummary, punchEvents = []) {
  if (!sessionSummary) return [];

  const improve   = [];
  const strengths = [];
  const cautions  = [];

  // Only use high-confidence punches for type-specific feedback
  const confidentPunches = punchEvents.filter((e) => (e.confidence ?? 1) >= CONFIDENCE_MIN);
  const hasPunches       = confidentPunches.length >= 3;
  const breakdown        = computePunchBreakdown(punchEvents); // already filters internally
  const jabs             = breakdown.jab;
  const crosses          = breakdown.cross;
  const hooks            = breakdown.hook;

  const sessionConf = computeSessionConfidence(sessionSummary, punchEvents);

  // ── Jab feedback ──────────────────────────────────────────────────────────
  if (jabs) {
    if (jabs.avgAngle < 138) {
      improve.push({ type: "improve", message: "Lead hand not extending — snap the jab out and retract fast" });
    } else if (jabs.avgAngle >= 158) {
      strengths.push({ type: "strength", message: "Jab reaching well — good lead hand control" });
    }
  }

  // ── Cross feedback ────────────────────────────────────────────────────────
  if (crosses) {
    if (crosses.avgAngle < 145) {
      improve.push({ type: "improve", message: "Cross not fully extending — drive through, don't stop at the shoulder" });
    } else if (crosses.avgAngle >= 160) {
      strengths.push({ type: "strength", message: "Strong cross extension — power hand reaching through" });
    }
  }

  // ── Hook feedback ─────────────────────────────────────────────────────────
  if (hooks) {
    if (hooks.avgAngle > 145) {
      improve.push({ type: "improve", message: "Hook arm too straight — keep the elbow at 90° for maximum arc" });
    } else if (hooks.count >= 3) {
      strengths.push({ type: "strength", message: "Hook arc looks tight — good bent-arm mechanics" });
    }
  }

  // ── Punch extension fallback (no type breakdown yet) ─────────────────────
  if (!hasPunches && sessionSummary.punchExtension?.status === "under_extended") {
    improve.push({ type: "improve", message: "Extension incomplete — straighten the arm all the way through the punch" });
  }

  // ── Snap speed ────────────────────────────────────────────────────────────
  if (hasPunches) {
    const withSnap = confidentPunches.filter((e) => e.snapVelocity > 0);
    if (withSnap.length >= 2) {
      const avgSnap = withSnap.reduce((s, e) => s + e.snapVelocity, 0) / withSnap.length;
      if (avgSnap < SNAP_MODERATE) {
        improve.push({ type: "improve", message: "Punch speed low — drive through the target, don't push it out" });
      } else if (avgSnap >= SNAP_FAST) {
        strengths.push({ type: "strength", message: "Fast hand speed — good snap and punching tempo" });
      }
    }
  }

  // ── Recoil speed ─────────────────────────────────────────────────────────
  if (hasPunches) {
    const withBoth = confidentPunches.filter((e) => e.snapVelocity > 0 && e.recoilVelocity > 0);
    if (withBoth.length >= 2) {
      const avgRatio = withBoth.reduce((s, e) => s + e.recoilVelocity / e.snapVelocity, 0) / withBoth.length;
      if (avgRatio < RECOIL_SLOW) {
        improve.push({ type: "improve", message: "Hands coming back slow — recoil as fast as you punch, no lingering" });
      } else if (avgRatio >= RECOIL_QUICK) {
        strengths.push({ type: "strength", message: "Quick recoil — snapping hands back into guard" });
      }
    }
  }

  // ── Guard recovery ────────────────────────────────────────────────────────
  if (hasPunches) {
    const withMs = confidentPunches.filter((e) => e.recoilMs != null);
    if (withMs.length >= 2) {
      const avgMs = withMs.reduce((s, e) => s + e.recoilMs, 0) / withMs.length;
      if (avgMs > RECOVERY_SLOW_MS) {
        improve.push({ type: "improve", message: "Guard slow to recover after punch — potential opening on the return" });
      } else if (avgMs < RECOVERY_QUICK_MS && withMs.length >= 4) {
        strengths.push({ type: "strength", message: "Guard recovering quickly after each punch" });
      }
    }
  }

  // ── Guard height ─────────────────────────────────────────────────────────
  const guard = sessionSummary.guardHeight;
  if (guard?.status === "too_low") {
    improve.push({ type: "improve", message: "Guard dropping — return hands to chin immediately after each punch" });
  } else if (guard?.status === "too_high") {
    improve.push({ type: "improve", message: "Guard raised too high — relax shoulders, hands at chin level" });
  } else if (guard?.status === "good" && sessionSummary.frameCount >= 10) {
    strengths.push({ type: "strength", message: "Guard discipline solid — hands stayed up throughout the session" });
  }

  // ── Rotation ─────────────────────────────────────────────────────────────
  const rot = sessionSummary.rotation;
  if (rot?.status === "under_rotated") {
    improve.push({ type: "improve", message: "Drive the hip into the punch — rotation is where power comes from" });
  } else if (rot?.status === "over_rotated") {
    improve.push({ type: "improve", message: "Too much rotation — you're leaving your chin open on the cross" });
  } else if (rot?.status === "good") {
    strengths.push({ type: "strength", message: "Good hip-shoulder separation — power transferring into punches" });
  }

  // ── Balance ───────────────────────────────────────────────────────────────
  if (sessionSummary.balance?.status === "off_balance") {
    improve.push({ type: "improve", message: "Weight drifting laterally — stay centered, hips over your base" });
  }

  // ── Stance ───────────────────────────────────────────────────────────────
  const stance = sessionSummary.stanceWidth;
  if (stance?.status === "too_narrow") {
    improve.push({ type: "improve", message: "Stance too narrow — widen your base, one shoulder-width minimum" });
  } else if (stance?.status === "too_wide") {
    improve.push({ type: "improve", message: "Feet too wide — reduce stance for better lateral mobility" });
  }

  // ── Cautions for low-confidence sessions ─────────────────────────────────
  if (sessionConf === "low") {
    cautions.push({ type: "caution", message: "Short session or limited visibility — findings are indicative only" });
  }

  const lowConfPunches = punchEvents.filter((e) => (e.confidence ?? 1) < CONFIDENCE_MIN).length;
  if (lowConfPunches > 0 && punchEvents.length > 0) {
    const pct = Math.round((lowConfPunches / punchEvents.length) * 100);
    if (pct >= 40) {
      cautions.push({ type: "caution", message: `${pct}% of detected punches were low-confidence — step back for better framing` });
    }
  }

  return [...improve, ...strengths, ...cautions];
}

// ─── Camera quality ───────────────────────────────────────────────────────────

export function cameraQualityScore(quality) {
  switch (quality) {
    case "full_body":       return "PERFECT";
    case "upper_body_hips": return "GOOD";
    case "upper_body_only": return "LIMITED";
    case "too_close":       return "UNUSABLE";
    default:                return null;
  }
}
