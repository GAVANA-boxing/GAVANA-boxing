// Radar area → keywords to match relevant items from fighter data
const AREA_KEYWORDS = {
  Timing:   ["timing", "rhythm", "counter", "reaction", "tempo", "moment", "bait"],
  Guard:    ["guard", "defense", "defence", "parry", "slip", "shell", "peek", "protect", "cover"],
  Footwork: ["footwork", "step", "lateral", "pivot", "angle", "movement", "position", "stance", "distance"],
  Speed:    ["speed", "fast", "quick", "burst", "explosive", "snap", "combination"],
  Power:    ["power", "body", "force", "hook", "knockout", "heavy", "damage"],
  Accuracy: ["accuracy", "precision", "clean", "target", "jab", "placement", "technique"],
};

// What each fighter best teaches — ordered by primary strength
const FIGHTER_TEACHES = {
  "mike-tyson":      ["Power", "Speed", "Guard"],
  "muhammad-ali":    ["Footwork", "Timing", "Speed"],
  "vasyl-lomachenko":["Footwork", "Timing", "Accuracy"],
  "dmitry-bivol":    ["Guard", "Timing", "Accuracy"],
  "floyd-mayweather":["Guard", "Timing", "Accuracy"],
  "manny-pacquiao":  ["Speed", "Footwork", "Power"],
  "gennady-golovkin":["Power", "Timing", "Guard"],
  "canelo-alvarez":  ["Timing", "Guard", "Power"],
  "naoya-inoue":     ["Speed", "Power", "Accuracy"],
  "roberto-duran":   ["Power", "Guard", "Timing"],
};

function findRelevantItems(items = [], focusArea, limit = 2) {
  const keywords = AREA_KEYWORDS[focusArea] || [];
  const matches = items.filter((item) =>
    keywords.some((kw) => String(item).toLowerCase().includes(kw))
  );
  return (matches.length ? matches : items).slice(0, limit);
}

// Returns personalized connection between user's snapshot and this fighter
// Returns null if snapshot unavailable or fighter not mapped
export function getPersonalConnection(snapshot, fighter) {
  if (!snapshot || !fighter?.id) return null;

  const teaches = FIGHTER_TEACHES[fighter.id];
  if (!teaches) return null;

  const { weakAreas, radarStats } = snapshot;
  const weakKeys = weakAreas.map(([k]) => k);

  // Areas where user is weak AND this fighter teaches
  const relevantWeak = teaches.filter((k) => weakKeys.includes(k));

  // Primary focus: pick weakest overlapping area; fallback to fighter's top strength
  const primaryFocus = relevantWeak.length > 0
    ? weakAreas.find(([k]) => relevantWeak.includes(k))?.[0] ?? teaches[0]
    : teaches[0];

  const primaryValue = radarStats[primaryFocus];
  const isDirectlyRelevant = relevantWeak.length > 0;

  // Pull items from fighter data that relate to primary focus
  const focusStudy  = findRelevantItems(fighter.whatToStudy   || [], primaryFocus, 2);
  const focusDrills = findRelevantItems(fighter.drills        || [], primaryFocus, 2);
  const focusHabits = findRelevantItems(fighter.habitsToMimick|| [], primaryFocus, 1);

  return {
    primaryFocus,
    primaryValue,
    isDirectlyRelevant,
    relevantWeak,
    teaches,
    focusStudy,
    focusDrills,
    focusHabits,
  };
}
