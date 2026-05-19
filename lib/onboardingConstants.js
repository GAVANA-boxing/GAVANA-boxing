export const WEIGHT_CLASSES = [
  "Mini Flyweight (49kg)", "Light Flyweight (49kg)", "Flyweight (52kg)",
  "Super Flyweight (55kg)", "Bantamweight (56kg)", "Super Bantamweight (59kg)",
  "Featherweight (59kg)", "Super Featherweight (63kg)", "Lightweight (61kg)",
  "Super Lightweight (64kg)", "Welterweight (67kg)", "Super Welterweight (70kg)",
  "Middleweight (75kg)", "Super Middleweight (79kg)", "Light Heavyweight (81kg)",
  "Cruiserweight (91kg)", "Heavyweight (91+kg)",
];

export const ARCHETYPE_DESCS = {
  pressure: { mn: "Дарамт, хурд, давшдаг тактик.", ko: "압박, 속도, 전진 전술.", en: "Pressure, speed, forward tactics." },
  counter:  { mn: "Timing, тэвчээр, буцаан цохилт.", ko: "타이밍, 인내, 카운터 펀치.", en: "Timing, patience, counter punching." },
  technical:{ mn: "Footwork, позиц, angle хянах.", ko: "풋워크, 포지셔닝, 앵글.", en: "Footwork, positioning, angles." },
  brawler:  { mn: "Хүч, нэг цохилт, knockout хайх.", ko: "파워, 한 방, KO를 노리는.", en: "Power, one shot, hunting the KO." },
};

export const TOTAL_STEPS = 5;

export const WEEKLY_GOALS = [
  { value: 1, emoji: "🌱", labelMn: "1–2 удаа", labelKo: "주 1-2회", labelEn: "1–2×/week", descMn: "Эхлэгч — аажмаар дадлага хий", descKo: "초보자 — 천천히 시작", descEn: "Beginner — build the habit" },
  { value: 3, emoji: "🔥", labelMn: "3 удаа", labelKo: "주 3회", labelEn: "3×/week", descMn: "Тогтмол — хамгийн их үр дүнтэй", descKo: "꾸준히 — 가장 효과적", descEn: "Consistent — most effective" },
  { value: 5, emoji: "💪", labelMn: "4–5 удаа", labelKo: "주 4-5회", labelEn: "4–5×/week", descMn: "Идэвхтэй — rank хурдан өснө", descKo: "활발 — 빠른 랭크 상승", descEn: "Active — rank climbs fast" },
  { value: 7, emoji: "⚡", labelMn: "Өдөр бүр", labelKo: "매일", labelEn: "Daily", descMn: "Champion — зогсохгүй тулааны сэтгэлгээ", descKo: "챔피언 — 멈추지 않는 정신", descEn: "Champion — fighter's mindset" },
];
