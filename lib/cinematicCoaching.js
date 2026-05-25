/**
 * Cinematic coaching messages — converts raw pose session data to
 * natural-language coaching cues a boxer can actually act on.
 *
 * Returns an array of { type: "strength" | "improve", message: string }
 * ordered: improvements first (more actionable), strengths second.
 */

export function generateCoachingMessages(sessionSummary, punchEvents = []) {
  if (!sessionSummary) return [];

  const improve = [];
  const strengths = [];

  // ─── Punch extension (from actual punch events when available) ────────────
  if (punchEvents.length >= 3) {
    const avg = punchEvents.reduce((s, e) => s + e.peakAngle, 0) / punchEvents.length;
    const max = Math.max(...punchEvents.map((e) => e.peakAngle));
    if (avg < 138) {
      improve.push("Punch not extending fully — snap through the target, don't stop short");
    } else if (max >= 163) {
      strengths.push("Strong full extension — reaching through on the cross");
    }
  } else if (sessionSummary.punchExtension?.status === "under_extended") {
    improve.push("Extension incomplete — straighten the arm all the way through the punch");
  }

  // ─── Guard height ─────────────────────────────────────────────────────────
  const guard = sessionSummary.guardHeight;
  if (guard?.status === "too_low") {
    improve.push("Guard dropping — return hands to chin immediately after each punch");
  } else if (guard?.status === "too_high") {
    improve.push("Guard raised too high — relax shoulders, hands at chin level");
  } else if (guard?.status === "good" && sessionSummary.frameCount >= 10) {
    strengths.push("Guard discipline solid — hands stayed up throughout the session");
  }

  // ─── Shoulder-hip rotation ────────────────────────────────────────────────
  const rot = sessionSummary.rotation;
  if (rot?.status === "under_rotated") {
    improve.push("Drive the hip into the punch — rotation is where power comes from");
  } else if (rot?.status === "over_rotated") {
    improve.push("Too much rotation — you're leaving your chin open on the cross");
  } else if (rot?.status === "good") {
    strengths.push("Good hip-shoulder separation — power transferring into punches");
  }

  // ─── Balance ──────────────────────────────────────────────────────────────
  const bal = sessionSummary.balance;
  if (bal?.status === "off_balance") {
    improve.push("Weight drifting laterally — stay centered, hips over your base");
  }

  // ─── Stance ───────────────────────────────────────────────────────────────
  const stance = sessionSummary.stanceWidth;
  if (stance?.status === "too_narrow") {
    improve.push("Stance too narrow — widen your base, one shoulder-width minimum");
  } else if (stance?.status === "too_wide") {
    improve.push("Feet too wide — reduce stance for better lateral mobility");
  }

  return [...improve, ...strengths];
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
