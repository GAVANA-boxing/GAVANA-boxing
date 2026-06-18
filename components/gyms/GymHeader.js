"use client";

import styles from "@/components/gyms/gymIdStyles";

const GYM_TYPE_KEYS = {
  Boxing: "gymTypeBoxing",
  MMA: "gymTypeMMA",
  "Muay Thai": "gymTypeMuayThai",
  Fitness: "gymTypeFitness",
  Crossfit: "gymTypeCrossfit",
  "Street Workout": "gymTypeStreetWorkout",
  Powerlifting: "gymTypePowerlifting",
  "Running Club": "gymTypeRunningClub",
};

function getGymVibes(gym) {
  if (gym.vibes?.length) return gym.vibes;
  const v = [];
  if (gym.gymType === "Boxing") { v.push("Technical", "Sparring"); }
  else if (gym.gymType === "MMA") { v.push("Hard training", "Competitive"); }
  else if (gym.gymType === "Muay Thai") { v.push("Traditional", "Technical"); }
  else if (gym.gymType === "Fitness") { v.push("Beginner-Friendly", "Conditioning"); }
  else if (gym.gymType === "Crossfit") { v.push("High intensity", "Conditioning"); }
  return v;
}

export default function GymHeader({ gym, t }) {
  const vibes = getGymVibes(gym);

  return (
    <div style={styles.gymHeader}>
      <div style={styles.gymNameRow}>
        <h1 style={styles.gymName}>{gym.gymName}</h1>
        {gym.verified && (
          <span style={styles.verifiedBadge}>✓ {t("gymVerified")}</span>
        )}
      </div>
      {gym.gymType && (
        <span style={styles.typeChip}>{t(GYM_TYPE_KEYS[gym.gymType]) || gym.gymType}</span>
      )}
      {(gym.city || gym.country) && (
        <p style={styles.gymLocation}>📍 {[gym.district, gym.city, gym.country].filter(Boolean).join(", ")}</p>
      )}
      {gym.address && <p style={styles.gymAddress}>{gym.address}</p>}
      {vibes.length > 0 && (
        <div style={styles.vibeRow}>
          {vibes.map((v) => (
            <span key={v} style={styles.vibeBadge}>{v}</span>
          ))}
        </div>
      )}
    </div>
  );
}
