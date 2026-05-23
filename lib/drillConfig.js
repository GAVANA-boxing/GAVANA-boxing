// Drill configuration system.
// Each drill defines its own duration, focus, and movement targets.
// drillId maps to both challenge IDs and standalone drill IDs.

export const FOCUS_COLORS = {
  pressure:     "#FF3B30",
  movement:     "#60A5FA",
  defense:      "#A78BFA",
  conditioning: "#F5C451",
  rhythm:       "#10B981",
  balance:      "#94A3B8",
};

export const DRILLS = {
  // ── Default fallback ────────────────────────────────────────────────────
  "default": {
    id: "default",
    label: "Training Session",
    durationSeconds: 10,
    targetMovements: null,
    recommendedIntensity: "medium",
    focusType: "conditioning",
    focusLabel: "TRAINING",
  },

  // ── Standalone drills ────────────────────────────────────────────────────
  "shadowboxing": {
    id: "shadowboxing",
    label: "Shadowboxing Flow",
    durationSeconds: 90,
    targetMovements: null,
    recommendedIntensity: "medium",
    focusType: "conditioning",
    focusLabel: "FLOW",
  },
  "jab-rhythm": {
    id: "jab-rhythm",
    label: "Jab Rhythm",
    durationSeconds: 45,
    targetMovements: 60,
    recommendedIntensity: "high",
    focusType: "rhythm",
    focusLabel: "RHYTHM",
  },
  "pressure-drill": {
    id: "pressure-drill",
    label: "Pressure Drill",
    durationSeconds: 60,
    targetMovements: 80,
    recommendedIntensity: "high",
    focusType: "pressure",
    focusLabel: "PRESSURE",
  },
  "defense-slips": {
    id: "defense-slips",
    label: "Defense & Slips",
    durationSeconds: 30,
    targetMovements: null,
    recommendedIntensity: "low",
    focusType: "defense",
    focusLabel: "DEFENSE",
  },
  "footwork": {
    id: "footwork",
    label: "Footwork Movement",
    durationSeconds: 45,
    targetMovements: null,
    recommendedIntensity: "medium",
    focusType: "movement",
    focusLabel: "MOVEMENT",
  },

  // ── Existing challenges (mapped into the drill system) ───────────────────
  "jab-minute": {
    id: "jab-minute",
    label: "60-Second Jab",
    durationSeconds: 60,
    targetMovements: 80,
    recommendedIntensity: "high",
    focusType: "rhythm",
    focusLabel: "JAB RHYTHM",
  },
  "speed-test": {
    id: "speed-test",
    label: "Speed Test",
    durationSeconds: 20,
    targetMovements: null,
    recommendedIntensity: "max",
    focusType: "conditioning",
    focusLabel: "MAX SPEED",
  },
  "combo-master": {
    id: "combo-master",
    label: "Combo Master",
    durationSeconds: 30,
    targetMovements: 50,
    recommendedIntensity: "high",
    focusType: "pressure",
    focusLabel: "COMBOS",
  },
};

export const DEFAULT_DRILL = DRILLS["default"];

export function getDrillConfig(id) {
  return DRILLS[id] || DEFAULT_DRILL;
}
