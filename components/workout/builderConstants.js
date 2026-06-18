// Shared constants, helpers, and pure logic for WorkoutBuilderPage

export const GOALS = [
  { key: "conditioning",   emoji: "🏋️", mn: "Нийт бэлтгэл",  ko: "체력 훈련",    en: "Conditioning" },
  { key: "technique",      emoji: "🥊", mn: "Техник",         ko: "기술 향상",    en: "Technique" },
  { key: "sparring_prep",  emoji: "⚔️", mn: "Спарринг бэлтгэл", ko: "스파링 준비", en: "Sparring Prep" },
  { key: "competition",    emoji: "🏆", mn: "Тэмцээн",        ko: "대회 준비",    en: "Competition" },
];

export const LEVELS = [
  { key: "beginner",     mn: "Анхан",    ko: "초급",   en: "Beginner" },
  { key: "intermediate", mn: "Дундаж",   ko: "중급",   en: "Intermediate" },
  { key: "advanced",     mn: "Дэвшилтэт", ko: "고급",  en: "Advanced" },
];

export const DAYS_OPTIONS = [2, 3, 4, 5];

export const DURATION_OPTIONS = [
  { value: 30,  mn: "30 мин",  ko: "30분",  en: "30 min" },
  { value: 45,  mn: "45 мин",  ko: "45분",  en: "45 min" },
  { value: 60,  mn: "60 мин",  ko: "60분",  en: "60 min" },
  { value: 90,  mn: "90 мин",  ko: "90분",  en: "90 min" },
];

/** Pick locale-specific label, fall back to English. */
export function label(obj, locale) {
  return obj[locale] || obj.en;
}

/** Build the AI prompt string. */
export function buildPrompt(goal, level, days, duration, locale) {
  const goalLabel = GOALS.find((g) => g.key === goal)?.en || goal;
  const levelLabel = LEVELS.find((l) => l.key === level)?.en || level;

  const langNote =
    locale === "mn"
      ? "Reply in Mongolian. Use English for boxing terms (jab, cross, hook, uppercut, combo, footwork, guard, shadow boxing, pad work, bag work, sparring, conditioning)."
      : locale === "ko"
      ? "Reply in Korean. Use English for boxing terms (jab, cross, hook, uppercut, combo, footwork, guard)."
      : "Reply in English.";

  return `${langNote}

Create a practical weekly boxing training program:
- Athlete level: ${levelLabel}
- Goal: ${goalLabel}
- Training days: ${days} days per week (include rest days)
- Session duration: ${duration} minutes

Format exactly like this (do NOT use markdown headers or asterisks):

WEEKLY PLAN

Day 1 - [Day name]:
• Exercise: X min
• Exercise: X min
...

Day 2 - REST

Day 3 - [Day name]:
...

TIPS:
• Tip 1
• Tip 2
• Tip 3

Keep it practical, boxing-specific, and achievable. Each session must fit within ${duration} minutes.`;
}

/** Parse raw AI text into { days, tips, raw }. */
export function parsePlan(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const days = [];
  const tips = [];
  let currentDay = null;
  let inTips = false;

  for (const line of lines) {
    if (
      /^WEEKLY PLAN/i.test(line) ||
      /^7 ХОНОГИЙН ПЛАН/i.test(line) ||
      /^주간 플랜/i.test(line)
    )
      continue;

    if (
      /^TIPS?:/i.test(line) ||
      /^ЗӨВЛӨМЖ/i.test(line) ||
      /^팁:/i.test(line)
    ) {
      inTips = true;
      currentDay = null;
      continue;
    }

    if (inTips) {
      const tip = line.replace(/^[•\-*]\s*/, "");
      if (tip) tips.push(tip);
      continue;
    }

    if (
      /^Day\s+\d+/i.test(line) ||
      /^өдөр\s+\d+/i.test(line) ||
      /^\d+[-\s]?(дэх|р|дугаар)?\s*өдөр/i.test(line)
    ) {
      currentDay = { title: line, items: [], isRest: /rest|амар/i.test(line) };
      days.push(currentDay);
      continue;
    }

    if (currentDay && !currentDay.isRest) {
      const item = line.replace(/^[•\-*]\s*/, "");
      if (item) currentDay.items.push(item);
    }
  }

  return { days, tips, raw: text };
}
