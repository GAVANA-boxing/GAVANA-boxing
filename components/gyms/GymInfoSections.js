"use client";

import styles from "@/components/gyms/gymIdStyles";

const AMENITY_ICONS = {
  Shower: "🚿", Showers: "🚿",
  Parking: "🅿️", "Free Parking": "🅿️",
  Locker: "🔒", Lockers: "🔒", "Locker Room": "🔒",
  WiFi: "📶", "Free WiFi": "📶",
  Ring: "🥊", "Boxing Ring": "🥊",
  "Heavy Bags": "🥊", "Punching Bags": "🥊",
  "Speed Bags": "🎯",
  Sauna: "🧖", "Steam Room": "🧖",
  "Juice Bar": "🥤", Café: "☕", Cafe: "☕",
  "Strength Equipment": "🏋️", Gym: "🏋️", Equipment: "🏋️",
  "Changing Room": "👔", "Change Room": "👔",
  "Open Mat": "🟩",
  "Air Conditioning": "❄️", AC: "❄️",
  Cardio: "🏃", "Cardio Equipment": "🏃",
  "Sparring": "🤝",
  "Pro Shop": "🛒",
  "Personal Training": "👤",
  Pool: "🏊",
  Yoga: "🧘",
};

const GYM_GOOD_FOR_MAP = {
  Boxing: ["Fighters", "Sparring", "Technical work"],
  MMA: ["Mixed fighting", "Strike defense", "Grappling"],
  "Muay Thai": ["Kicks & knees", "Clinch work", "Traditional training"],
  Fitness: ["Weight loss", "Cardio", "General fitness"],
  Crossfit: ["Strength", "Conditioning", "Athletic performance"],
  "Street Workout": ["Calisthenics", "Outdoor training", "Body control"],
  Powerlifting: ["Max strength", "Barbell training", "Power sports"],
  "Running Club": ["Endurance", "Cardio", "Community running"],
};

function getGymGoodFor(gym) {
  return GYM_GOOD_FOR_MAP[gym.gymType] || gym.specialties?.slice(0, 3) || [];
}

export default function GymInfoSections({ gym, t }) {
  const goodFor = getGymGoodFor(gym);

  return (
    <>
      {goodFor.length > 0 && (
        <section style={styles.section}>
          <p style={styles.sectionTitle}>{t("gymGoodFor")}</p>
          <div style={styles.pillsRow}>
            {goodFor.map((g) => (
              <span key={g} style={styles.goodForPill}>{g}</span>
            ))}
          </div>
        </section>
      )}

      {gym.description && (
        <section style={styles.section}>
          <p style={styles.sectionTitle}>{t("gymDescription")}</p>
          <p style={styles.bodyText}>{gym.description}</p>
        </section>
      )}

      {gym.specialties?.length > 0 && (
        <section style={styles.section}>
          <p style={styles.sectionTitle}>{t("gymSpecialties")}</p>
          <div style={styles.pillsRow}>
            {gym.specialties.map((s) => (
              <span key={s} style={styles.pill}>{s}</span>
            ))}
          </div>
        </section>
      )}

      {gym.amenities?.length > 0 && (
        <section style={styles.section}>
          <p style={styles.sectionTitle}>{t("gymAmenities")}</p>
          <div style={styles.pillsRow}>
            {gym.amenities.map((a) => (
              <span key={a} style={styles.amenityPill}>
                {AMENITY_ICONS[a] && <span style={{ marginRight: 4 }}>{AMENITY_ICONS[a]}</span>}{a}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
