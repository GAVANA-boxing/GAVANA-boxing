export const GYM_TYPES = [
  "Boxing", "MMA", "Muay Thai", "Fitness",
  "Crossfit", "Street Workout", "Powerlifting", "Running Club",
];
export const GYM_TYPE_KEYS = {
  Boxing: "gymTypeBoxing", MMA: "gymTypeMMA", "Muay Thai": "gymTypeMuayThai",
  Fitness: "gymTypeFitness", Crossfit: "gymTypeCrossfit",
  "Street Workout": "gymTypeStreetWorkout", Powerlifting: "gymTypePowerlifting",
  "Running Club": "gymTypeRunningClub",
};
export const VIBE_FILTERS = ["Beginner-Friendly", "Technical", "Competitive", "Traditional"];

export const VIBE_LABELS = {
  "Beginner-Friendly": { mn: "Анхлан суралцагч", ko: "입문자 친화적" },
  "Technical":         { mn: "Техникийн",         ko: "기술적" },
  "Competitive":       { mn: "Өрсөлдөөнт",        ko: "경쟁적" },
  "Traditional":       { mn: "Уламжлалт",         ko: "전통적" },
};

export function getDefaultVibes(gymType) {
  const map = {
    Boxing: ["Technical", "Sparring"],
    MMA: ["Hard training", "Competitive"],
    "Muay Thai": ["Traditional", "Technical"],
    Fitness: ["Beginner-Friendly", "Conditioning"],
    Crossfit: ["High intensity", "Competitive"],
  };
  return map[gymType] || [];
}

export const SPECIALTIES = ["Boxing", "MMA", "Muay Thai", "Kickboxing", "Jab", "Footwork", "Defense", "Conditioning", "Sparring", "Strength"];
export const AMENITIES = ["Showers", "Lockers", "Parking", "WiFi", "Punching Bags", "Boxing Ring", "Weights", "Cardio"];
export const AMENITY_KEYS = {
  Showers: "gymAmenityShowers", Lockers: "gymAmenityLockers", Parking: "gymAmenityParking",
  WiFi: "gymAmenityWifi", "Punching Bags": "gymAmenityBag", "Boxing Ring": "gymAmenityRing",
  Weights: "gymAmenityWeights", Cardio: "gymAmenityCardio",
};

export function getCompleteness(gym) {
  if (!gym) return 0;
  let score = 0;
  if (gym.gymName) score += 20;
  if (gym.description) score += 15;
  if (gym.logo) score += 15;
  if (gym.city && gym.country) score += 10;
  if (gym.district || gym.address) score += 10;
  if (gym.specialties?.length > 0) score += 10;
  if (gym.amenities?.length > 0) score += 10;
  if (gym.phone) score += 5;
  if (gym.instagram || gym.website) score += 5;
  return Math.min(100, score);
}
