export const ACADEMY_PATHS = [
  {
    id: "foundation",
    emoji: "📚",
    accentColor: "#F5C451",
    difficulty: "beginner",
    estimatedMinutes: 25,
    lessonIds: ["jab-mechanics", "cross-mechanics", "hook-mechanics", "guard-recovery", "footwork-angle-exit", "double-jab"],
    title: { en: "Foundation Path", mn: "Суурь Зам", ko: "기초 경로" },
    description: {
      en: "Master the five core mechanics every boxer must own.",
      mn: "Тулаанчдын суурь 5 техникийг эзэмш.",
      ko: "모든 복서가 마스터해야 할 5가지 핵심 기술",
    },
  },
  {
    id: "power-mechanics",
    emoji: "💥",
    accentColor: "#F97316",
    difficulty: "intermediate",
    estimatedMinutes: 15,
    lessonIds: ["cross-mechanics", "hook-mechanics", "body-shot"],
    title: { en: "Power Mechanics", mn: "Хүчний Механик", ko: "파워 메카닉" },
    description: {
      en: "Build explosive cross and hook power from hip rotation.",
      mn: "Хүчтэй цохилтыг суурь хөдөлгөөнөөс бүтээ.",
      ko: "엉덩이 회전으로 폭발적인 크로스와 훅 파워 구축",
    },
  },
  {
    id: "footwork",
    emoji: "👣",
    accentColor: "#A855F7",
    difficulty: "intermediate",
    estimatedMinutes: 15,
    lessonIds: ["footwork-angle-exit", "jab-mechanics"],
    title: { en: "Footwork Path", mn: "Хөлний Хөдөлгөөн", ko: "풋워크 경로" },
    description: {
      en: "Control angles and range through elite footwork.",
      mn: "Хөлний хөдөлгөөнөөр байрлал болон зайгаа захир.",
      ko: "엘리트 풋워크로 각도와 거리 제어",
    },
  },
  {
    id: "guard-defense",
    emoji: "🛡️",
    accentColor: "#3B82F6",
    difficulty: "intermediate",
    estimatedMinutes: 15,
    lessonIds: ["guard-recovery", "footwork-angle-exit", "slip-defense", "shoulder-roll"],
    title: { en: "Guard & Defense", mn: "Хамгаалалтын Зам", ko: "가드 & 방어" },
    description: {
      en: "Survive and respond — guard recovery and angle exits.",
      mn: "Амьд үлж хариулт өг — хамгаалалт болон гарц.",
      ko: "생존하고 반응 — 가드 회복과 각도 탈출",
    },
  },
  {
    id: "fighter-style",
    emoji: "⚡",
    accentColor: "#34D399",
    difficulty: "advanced",
    estimatedMinutes: 20,
    lessonIds: ["jab-mechanics", "cross-mechanics", "hook-mechanics", "slip-defense", "pull-counter", "shoulder-roll"],
    title: { en: "Fighter Style Path", mn: "Тулаанчийн Хэв Маяг", ko: "파이터 스타일" },
    description: {
      en: "Study how champions apply fundamentals in elite style.",
      mn: "Аварга тулаанчид суурийг хэрхэн хэрэглэдгийг суд.",
      ko: "챔피언들이 기본기를 엘리트 스타일로 적용하는 방법",
    },
  },
];

export function getPathById(id) {
  return ACADEMY_PATHS.find(p => p.id === id) || ACADEMY_PATHS[0];
}

export function pathTitle(path, locale) {
  return path.title[locale] || path.title.en;
}

export function pathDesc(path, locale) {
  return path.description[locale] || path.description.en;
}

export function getLessonStatus(lessonId, lessonProgress = {}) {
  const lp = lessonProgress[lessonId];
  if (!lp || !lp.attempted) return "not_started";
  if (lp.completed) return "completed";
  return "in_progress";
}

export function getPathProgress(path, lessonProgress = {}) {
  const total = path.lessonIds.length;
  const done = path.lessonIds.filter(id => lessonProgress[id]?.completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const nextLessonId = path.lessonIds.find(id => !lessonProgress[id]?.completed) || null;
  return { total, done, pct, nextLessonId };
}
