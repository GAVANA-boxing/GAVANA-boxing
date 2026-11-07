// Stance check from ONE photo (roadmap phase 7). Pure: takes MediaPipe pose
// landmarks (33 points; world landmarks preferred, z = depth, smaller = closer
// to the camera) and estimates the fighter's stance, guard height and foot
// width. Runs on device; nothing is uploaded.
//
// Facing the camera in a boxing stance, the lead side (left for orthodox,
// right for southpaw) is turned toward the lens, so its shoulder, elbow, wrist,
// hip, knee and ankle sit closer to the camera than the rear side's.

const L = { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27 };
const R = { shoulder: 12, elbow: 14, wrist: 16, hip: 24, knee: 26, ankle: 28 };
const NOSE = 0;
// How much each joint pair says about the stance (feet and hands lead most).
const WEIGHTS = { ankle: 1.4, knee: 1.0, wrist: 1.2, elbow: 0.8, hip: 0.7, shoulder: 0.9 };
const MIN_VIS = 0.5;

const vis = (p) => (p && typeof p.visibility === "number" ? p.visibility : 1);
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * @param {Array<{x:number,y:number,z:number,visibility?:number}>} world  world landmarks (meters, hip-centred) or normalized
 * @param {Array<{x:number,y:number,z:number,visibility?:number}>} [image] normalized image landmarks (for guard / feet in 2D)
 * @returns {{ok:boolean, reason?:string, stance?:"orthodox"|"southpaw", confidence?:number, lead?:"left"|"right",
 *            guard?:"high"|"mid"|"low", footWidth?:number, footWidthLabel?:"narrow"|"good"|"wide"}}
 */
export function analyzeStancePhoto(world, image = world) {
  if (!Array.isArray(world) || world.length < 33) return { ok: false, reason: "no_pose" };

  // Depth difference per joint pair: positive → left side is closer (orthodox lead).
  let sum = 0, wsum = 0, used = 0;
  for (const k of Object.keys(WEIGHTS)) {
    const a = world[L[k]], b = world[R[k]];
    if (!a || !b || vis(a) < MIN_VIS || vis(b) < MIN_VIS) continue;
    sum += WEIGHTS[k] * (b.z - a.z);
    wsum += WEIGHTS[k];
    used++;
  }
  if (used < 3) return { ok: false, reason: "body_not_visible" };
  const d = sum / wsum; // average depth gap (world units ≈ meters)

  // Scale by shoulder width so the threshold doesn't depend on distance / units.
  const sw = Math.max(1e-6, Math.hypot(world[L.shoulder].x - world[R.shoulder].x, world[L.shoulder].z - world[R.shoulder].z));
  const rel = d / sw;
  const confidence = Math.max(0, Math.min(1, (Math.abs(rel) - 0.08) / 0.4));
  if (confidence < 0.15) return { ok: false, reason: "square_on" };

  const lead = rel > 0 ? "left" : "right";
  const stance = lead === "left" ? "orthodox" : "southpaw";

  // Guard: wrists vs nose / shoulders in the image (y grows downward).
  const nose = image[NOSE], ls = image[L.shoulder], rs = image[R.shoulder];
  const lw = image[L.wrist], rw = image[R.wrist];
  let guard;
  if (nose && ls && rs && lw && rw && vis(lw) >= MIN_VIS && vis(rw) >= MIN_VIS) {
    const shoulderY = (ls.y + rs.y) / 2;
    const span = Math.max(1e-6, shoulderY - nose.y);
    const wristY = Math.max(lw.y, rw.y); // the lower hand decides
    const h = (shoulderY - wristY) / span; // 1 = nose level, 0 = shoulder level
    guard = h >= 0.45 ? "high" : h >= -0.4 ? "mid" : "low";
  }

  // Foot width: ankle gap / shoulder width in the image.
  let footWidth, footWidthLabel;
  const la = image[L.ankle], ra = image[R.ankle];
  if (la && ra && ls && rs && vis(la) >= MIN_VIS && vis(ra) >= MIN_VIS) {
    footWidth = Math.round((dist2(la, ra) / Math.max(1e-6, dist2(ls, rs))) * 100) / 100;
    footWidthLabel = footWidth < 0.8 ? "narrow" : footWidth > 1.8 ? "wide" : "good";
  }

  return { ok: true, stance, lead, confidence: Math.round(confidence * 100) / 100, guard, footWidth, footWidthLabel };
}
