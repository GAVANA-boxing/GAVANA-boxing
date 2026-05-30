// Visual asset fields for fighters and techniques.
// Image/video URLs are empty — populated as real assets become available.
// Computation helpers for punch icons and diagram type mapping live here.

export const FIGHTER_VISUAL_ASSETS = {
  "mike-tyson": {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Bull", animalEmoji: "🐂",
    movementProfile: { pressure: 0.92, lateral: 0.18, speed: 0.82, defense: 0.48 },
  },
  "muhammad-ali": {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Butterfly", animalEmoji: "🦋",
    movementProfile: { pressure: 0.35, lateral: 0.95, speed: 0.75, defense: 0.68 },
  },
  "naoya-inoue": {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Hawk", animalEmoji: "🦅",
    movementProfile: { pressure: 0.78, lateral: 0.55, speed: 0.90, defense: 0.72 },
  },
  "dmitry-bivol": {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Wolf", animalEmoji: "🐺",
    movementProfile: { pressure: 0.62, lateral: 0.70, speed: 0.68, defense: 0.88 },
  },
  "vasyl-lomachenko": {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Snake", animalEmoji: "🐍",
    movementProfile: { pressure: 0.45, lateral: 0.98, speed: 0.85, defense: 0.80 },
  },
  "canelo-alvarez": {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Jaguar", animalEmoji: "🐆",
    movementProfile: { pressure: 0.68, lateral: 0.65, speed: 0.72, defense: 0.85 },
  },
  "gennady-golovkin": {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Bear", animalEmoji: "🐻",
    movementProfile: { pressure: 0.88, lateral: 0.32, speed: 0.65, defense: 0.58 },
  },
  "floyd-mayweather": {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Ghost", animalEmoji: "👻",
    movementProfile: { pressure: 0.22, lateral: 0.78, speed: 0.88, defense: 0.98 },
  },
  "manny-pacquiao": {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Hornet", animalEmoji: "🐝",
    movementProfile: { pressure: 0.72, lateral: 0.85, speed: 0.98, defense: 0.40 },
  },
  "roberto-duran": {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Lion", animalEmoji: "🦁",
    movementProfile: { pressure: 0.90, lateral: 0.38, speed: 0.75, defense: 0.52 },
  },
};

// Maps teaching block type → diagram type
export const BLOCK_DIAGRAM_TYPE = {
  FOOT:   "footwork",
  WEIGHT: "stance",
  ANGLE:  "angle",
  GUARD:  "guard",
};

// Localized labels for movement profile attributes
export const MOVEMENT_ATTR_LABELS = {
  pressure: { en: "Pressure", mn: "Дарамт",      ko: "압박" },
  lateral:  { en: "Lateral",  mn: "Хажуу",        ko: "측면" },
  speed:    { en: "Speed",    mn: "Хурд",         ko: "속도" },
  defense:  { en: "Defense",  mn: "Хамгаалалт",   ko: "방어" },
};

export function getFighterAssets(fighterId) {
  return FIGHTER_VISUAL_ASSETS[fighterId] || {
    imageUrl: "", thumbnailUrl: "", diagramUrl: "", gifUrl: "", videoUrl: "",
    animal: "Fighter", animalEmoji: "🥊",
    movementProfile: { pressure: 0.5, lateral: 0.5, speed: 0.5, defense: 0.5 },
  };
}

// Maps a punch step label to visual metadata (works best with English)
export function punchIconFromStep(step) {
  const s = (step || "").toLowerCase();
  if (s.includes("jab"))        return { code: "JAB",   color: "#F5C451" };
  if (s.includes("cross"))      return { code: "CROSS", color: "#FF3B30" };
  if (s.includes("hook"))       return { code: "HOOK",  color: "#F97316" };
  if (s.includes("upper"))      return { code: "UPPER", color: "#A855F7" };
  if (s.includes("body"))       return { code: "BODY",  color: "#60A5FA" };
  if (s.includes("slip"))       return { code: "SLIP",  color: "#34D399" };
  if (s.includes("parry"))      return { code: "PARRY", color: "#94A3B8" };
  if (s.includes("pivot"))      return { code: "PIVOT", color: "#A855F7" };
  if (s.includes("step"))       return { code: "STEP",  color: "#34D399" };
  if (s.includes("right"))      return { code: "RIGHT", color: "#FF3B30" };
  if (s.includes("left"))       return { code: "LEFT",  color: "#F5C451" };
  return { code: step.split(" ")[0]?.slice(0, 5)?.toUpperCase() || "•", color: "rgba(255,255,255,0.4)" };
}
