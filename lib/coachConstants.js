import { RED, PURPLE } from "@/lib/tokens";

export const SPECIALTIES = [
  "Footwork", "Pressure", "Counter", "Beginners",
  "Sparring", "Conditioning", "Defense", "Pad work", "Amateur", "Pro",
];

export const VIBE_FILTERS = ["Friendly", "Technical", "Hard sparring", "Competitive"];

export const LEVELS = ["Amateur", "Fighter", "Pro", "Elite", "Champion"];

export const SPECIALTY_COLORS = {
  Amateur:      "#34D399",
  Pro:          RED,
  Sparring:     "#FB923C",
  Defense:      "#60A5FA",
  Counter:      "#60A5FA",
  Footwork:     PURPLE,
  "Pad work":   "#F59E0B",
  Conditioning: "#34D399",
  Beginners:    "#34D399",
  Pressure:     "#F87171",
};

export const BEST_FOR_MAP = {
  Footwork: { en: "Fighters wanting better ring movement & pivots", mn: "Хөдөлгөөн, хөлийн ажлаа сайжруулахыг хүсэгчид", ko: "이동 동작을 향상시키려는 선수" },
  Pressure: { en: "Brawlers building aggressive pressure fighting", mn: "Дайралтын арга барилаа хөгжүүлэхийг хүсэгчид", ko: "압박 파이팅을 구사하려는 선수" },
  Counter: { en: "Defensive fighters learning counter-punching", mn: "Тохой үхэлт тоглогч болохыг хүсэгчид", ko: "카운터펀치를 익히려는 수비 지향 선수" },
  Beginners: { en: "First-time boxers — all levels welcome", mn: "Анх удаа боксыг эзэмшигчид", ko: "처음 복싱을 시작하는 입문자" },
  Sparring: { en: "Fighters ready to test themselves in the ring", mn: "Рингд сорилоо туршихад бэлэн тамирчид", ko: "실전 훈련을 하고 싶은 선수" },
  Conditioning: { en: "Athletes improving fitness and endurance", mn: "Бие бялдараа сайжруулахыг хүсэгчид", ko: "체력과 지구력을 강화하려는 운동선수" },
  Defense: { en: "Fighters wanting a tighter guard and better slipping", mn: "Хамгаалалтаа бат бэх болгохыг хүсэгчид", ko: "가드와 슬리핑을 개선하고 싶은 선수" },
  "Pad work": { en: "Anyone wanting sharper, faster hands", mn: "Гарын хурд, нарийвчлалаа дээшлүүлэхийг хүсэгчид", ko: "더 빠르고 정확한 손기술을 원하는 선수" },
  Amateur: { en: "Competitors training for amateur fights", mn: "Аматур тэмцээнд бэлтгэж буй тамирчид", ko: "아마추어 대회를 준비하는 선수" },
  Pro: { en: "Professional-level fighters and competitors", mn: "Мэргэжлийн түвшний тамирчид", ko: "프로 레벨의 파이터" },
};

export const IMPROVE_MAP = {
  Footwork: ["Footwork & Pivots", "Ring positioning", "Defensive movement"],
  Pressure: ["Forward pressure", "Body work", "Cutting off the ring"],
  Counter: ["Timing & counters", "Head movement", "Defensive IQ"],
  Beginners: ["Basic stance & guard", "Punching mechanics", "Confidence"],
  Sparring: ["Timing & reaction", "Ring generalship", "Composure"],
  Conditioning: ["Endurance", "Core strength", "Recovery speed"],
  Defense: ["Slipping & rolling", "Guard stability", "Block mechanics"],
  "Pad work": ["Hand speed", "Combination flow", "Accuracy"],
  Amateur: ["Fight IQ", "Scoring punches", "Amateur tactics"],
  Pro: ["Advanced tactics", "Mental game", "Peak conditioning"],
};

export function getCoachInsight(coach) {
  const specs = coach.coachSpecialties || [];
  const first = specs[0];
  const bestFor = first ? BEST_FOR_MAP[first] : null;
  const improves = specs
    .flatMap((s) => IMPROVE_MAP[s] || [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4);
  return { bestFor, improves };
}
