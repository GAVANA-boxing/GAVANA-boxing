import { RED, GOLD } from "@/lib/tokens";

export const AREAS = ["Power", "Speed", "Timing", "Footwork", "Guard", "Accuracy"];

export const AREA_COLOR = {
  Power: RED,
  Speed: "#FB923C",
  Timing: GOLD,
  Footwork: "#60A5FA",
  Guard: "#A78BFA",
  Accuracy: "#34D399",
};

export const DRILL_TYPES = [
  { key: "shadow", labelEn: "Shadow", labelMn: "Сүүдэр" },
  { key: "bag", labelEn: "Bag Work", labelMn: "Уут" },
  { key: "conditioning", labelEn: "Conditioning", labelMn: "Дасгал" },
];

export const DIFF_COLOR = {
  Beginner: "#34D399",
  Intermediate: GOLD,
  Advanced: RED,
};

export const DIFF_MN = {
  Beginner: "Эхлэгч",
  Intermediate: "Дунд",
  Advanced: "Ахисан",
};

// ── Cache helpers ────────────────────────────────────────────────────────────

export function cacheKey(userId, area, type) {
  return `gavana_drills_${userId}_${area}_${type}`;
}

export function readCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { drills, ts } = JSON.parse(raw);
    if (Date.now() - ts > 24 * 3600 * 1000) return null;
    return drills;
  } catch {
    return null;
  }
}

export function writeCache(key, drills) {
  try {
    localStorage.setItem(key, JSON.stringify({ drills, ts: Date.now() }));
  } catch { /* */ }
}
