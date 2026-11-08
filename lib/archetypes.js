// The ONE list of fighting styles (Fighter DNA archetypes): keys, names, colours, short
// descriptions — used by onboarding, the DNA engine, profile, share card and the AI coach.
// Before this there were two lists (onboarding: pressure / counter / technical / brawler,
// DNA: pressure / outboxer / counter / explosive / technician) and up to three colours per
// style. Old onboarding keys are mapped by normalizeArchetype.

export const ARCHETYPE_KEYS = ["pressure", "outboxer", "counter", "explosive", "technician"];

export const ARCHETYPE_COLORS = {
  pressure: "#EF4444",
  outboxer: "#3B82F6",
  counter: "#8B5CF6",
  explosive: "#F59E0B",
  technician: "#10B981",
};

export const ARCHETYPE_EMOJI = {
  pressure: "🔴",
  outboxer: "💨",
  counter: "⚡",
  explosive: "💥",
  technician: "🧠",
};

export const ARCHETYPE_NAMES = {
  mn: {
    pressure: "Дарамтын тулаанч",
    outboxer: "Хурдан хөдлөгч",
    counter: "Контр тулаанч",
    explosive: "Тэсрэмтгий цохигч",
    technician: "Техникийн боксчин",
  },
  ko: {
    pressure: "압박형 파이터",
    outboxer: "아웃복서",
    counter: "카운터 펀처",
    explosive: "폭발적 펀처",
    technician: "테크니컬 복서",
  },
  en: {
    pressure: "Pressure Fighter",
    outboxer: "Elusive Outboxer",
    counter: "Counter Puncher",
    explosive: "Explosive Puncher",
    technician: "Technical Boxer",
  },
};

export const ARCHETYPE_DESCS = {
  pressure: { mn: "Урагш дарж, олон цохилтоор шахна.", ko: "앞으로 밀며 많은 펀치로 압박해요.", en: "Walks forward and wears you down with volume." },
  outboxer: { mn: "Зай барьж, хөлөөрөө хөдөлж, жэбээр удирдана.", ko: "거리를 두고 발로 움직이며 잽으로 주도해요.", en: "Keeps distance, moves the feet, runs the fight with the jab." },
  counter: { mn: "Хүлээж, алдуулаад хариу цохино.", ko: "기다렸다가 피하고 받아쳐요.", en: "Waits, makes them miss, then hits back." },
  explosive: { mn: "Гэнэт орж, хурдан хүчтэй комбо шиднэ.", ko: "갑자기 들어가 빠르고 강한 콤보를 던져요.", en: "Bursts in with fast, hard combinations." },
  technician: { mn: "Зөв байрлал, тогтмол техник, ухаалаг сонголт.", ko: "정확한 자세, 꾸준한 기술, 영리한 선택.", en: "Clean position, steady technique, smart choices." },
};

// Keys from the old onboarding quiz.
const LEGACY = { technical: "technician", brawler: "explosive" };

/** Canonical key for any stored value (old onboarding keys included), or null. */
export function normalizeArchetype(key) {
  if (!key) return null;
  const k = String(key).toLowerCase();
  if (ARCHETYPE_KEYS.includes(k)) return k;
  return LEGACY[k] || null;
}

export function archetypeName(key, locale = "en") {
  const k = normalizeArchetype(key);
  if (!k) return null;
  return (ARCHETYPE_NAMES[locale] || ARCHETYPE_NAMES.en)[k];
}

/** { emoji, name (English), color } per key — the shape the old ARCHETYPE_DISPLAY had. */
export const ARCHETYPE_DISPLAY = Object.fromEntries(
  ARCHETYPE_KEYS.map((k) => [k, { emoji: ARCHETYPE_EMOJI[k], name: ARCHETYPE_NAMES.en[k], color: ARCHETYPE_COLORS[k] }]),
);
