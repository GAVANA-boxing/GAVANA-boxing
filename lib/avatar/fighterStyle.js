// Procedural fighter look (roadmap phase 5): a handful of parameters instead of
// a 1.7 MB character file. Pure — lib/three/fighterAvatar.js turns the result
// into meshes. Gloves and waistband take the fighter's rank colour, so the rank
// shows on the body; skin, hair and build are the user's choice (or picked
// from a seed, e.g. the uid, so every fighter looks a little different).

import { getFighterRank, RANK_TIERS } from "@/lib/xp";

export const SKIN_TONES = ["#f3d6c1", "#e8bf9f", "#d29f7a", "#b07a55", "#8a5a3c", "#5e3b26"];
export const HAIR_STYLES = ["none", "buzz", "short", "bun"];
export const HAIR_COLORS = ["#111114", "#3a2618", "#6b4423", "#c9a26b", "#9b9ea4"];
export const BUILDS = { lean: 0.88, medium: 1, heavy: 1.16 };

const ROOKIE_GLOVE = "#e0261c"; // grey gloves read as "no gloves" — rookies get classic red

/** Small deterministic hash → [0, 1). */
export function seedUnit(seed, salt = 0) {
  const s = `${seed ?? ""}:${salt}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 100000) / 100000;
}
const pick = (arr, u) => arr[Math.min(arr.length - 1, Math.floor(u * arr.length))];

/** Keep only known values (prefs come from localStorage). */
export function sanitizeStylePrefs(p) {
  const out = {};
  if (!p || typeof p !== "object") return out;
  if (Number.isInteger(p.skin) && p.skin >= 0 && p.skin < SKIN_TONES.length) out.skin = p.skin;
  if (HAIR_STYLES.includes(p.hair)) out.hair = p.hair;
  if (Number.isInteger(p.hairColor) && p.hairColor >= 0 && p.hairColor < HAIR_COLORS.length) out.hairColor = p.hairColor;
  if (Object.hasOwn(BUILDS, p.build)) out.build = p.build;
  return out;
}

/**
 * @param {{ xp?: number, seed?: string, prefs?: object }} o
 * @returns {{ skin: string, hair: string, hairColor: string, build: number, buildKey: string,
 *             glove: string, trim: string, trunks: string, cuff: string, shoe: string, rankKey: string }}
 */
export function fighterStyle({ xp = 0, seed = "", prefs = {} } = {}) {
  const p = sanitizeStylePrefs(prefs);
  const rank = getFighterRank(Number.isFinite(xp) ? xp : 0);
  const rookie = rank.key === RANK_TIERS[0].key;
  const buildKey = p.build ?? "medium";
  return {
    skin: SKIN_TONES[p.skin ?? Math.floor(seedUnit(seed, 1) * SKIN_TONES.length)],
    hair: p.hair ?? pick(HAIR_STYLES, seedUnit(seed, 2)),
    hairColor: HAIR_COLORS[p.hairColor ?? Math.floor(seedUnit(seed, 3) * 3)], // seeded: the darker three
    build: BUILDS[buildKey],
    buildKey,
    glove: rookie ? ROOKIE_GLOVE : rank.color,
    trim: rank.color,
    trunks: "#141416",
    cuff: "#f5f5f5",
    shoe: "#1b1b1e",
    rankKey: rank.key,
  };
}
