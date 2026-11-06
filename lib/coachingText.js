// Coaching cues are generated (lib/cinematicCoaching.js) and stored with sessions
// in English. Translate at display time, keyed by the English text, so sessions
// saved before this file existed are translated too.

const TEXT = {
  "Lead hand not extending — snap the jab out and retract fast": {
    mn: "Урд гар бүрэн сунахгүй байна — jab-аа огцом шидээд хурдан эргүүлж ав",
    ko: "앞손이 끝까지 뻗지 않아요 — 잽을 빠르게 뻗고 빠르게 회수하세요",
  },
  "Jab reaching well — good lead hand control": {
    mn: "Jab сайн сунаж байна — урд гарын хяналт сайн",
    ko: "잽이 잘 뻗어요 — 앞손 컨트롤 좋아요",
  },
  "Cross not fully extending — drive through, don't stop at the shoulder": {
    mn: "Cross бүрэн сунахгүй байна — мөрөн дээрээ зогсолгүй цааш түлх",
    ko: "크로스가 끝까지 뻗지 않아요 — 어깨에서 멈추지 말고 끝까지 밀어내세요",
  },
  "Strong cross extension — power hand reaching through": {
    mn: "Cross сайн сунаж байна — хүчний гар бай руугаа хүрч байна",
    ko: "크로스 뻗음이 좋아요 — 파워 핸드가 끝까지 닿아요",
  },
  "Hook arm too straight — keep the elbow at 90° for maximum arc": {
    mn: "Hook-ийн гар хэт шулуун — тохойгоо 90°-д барь",
    ko: "훅 팔이 너무 펴져요 — 팔꿈치를 90°로 유지하세요",
  },
  "Hook arc looks tight — good bent-arm mechanics": {
    mn: "Hook-ийн нум нягт — тохойгоо зөв нугалж байна",
    ko: "훅 궤도가 간결해요 — 팔 굽힘이 좋아요",
  },
  "Extension incomplete — straighten the arm all the way through the punch": {
    mn: "Гар бүрэн тэнийхгүй байна — цохилт бүрт гараа бүрэн сунга",
    ko: "팔이 덜 펴져요 — 펀치마다 팔을 끝까지 펴세요",
  },
  "No punches registered — try stepping back so full arm is in frame": {
    mn: "Цохилт бүртгэгдсэнгүй — гар бүтэн кадрт орохоор ухарч зогс",
    ko: "펀치가 인식되지 않았어요 — 팔 전체가 보이도록 뒤로 물러서세요",
  },
  "Punch speed low — drive through the target, don't push it out": {
    mn: "Цохилтын хурд бага — түлхэх биш, бай руу огцом цохи",
    ko: "펀치 속도가 느려요 — 밀지 말고 타깃을 관통하세요",
  },
  "Fast hand speed — good snap and punching tempo": {
    mn: "Гар хурдан — огцом, хэмнэлтэй цохиж байна",
    ko: "손이 빨라요 — 스냅과 템포가 좋아요",
  },
  "Hands coming back slow — recoil as fast as you punch, no lingering": {
    mn: "Гар удаан буцаж байна — цохисон хурдаараа гараа эргүүлж ав",
    ko: "손 회수가 느려요 — 뻗는 속도만큼 빠르게 회수하세요",
  },
  "Quick recoil — snapping hands back into guard": {
    mn: "Гараа хурдан эргүүлж, хамгаалалтдаа буцааж байна",
    ko: "회수가 빨라요 — 손이 가드로 빠르게 돌아와요",
  },
  "Guard slow to recover after punch — potential opening on the return": {
    mn: "Цохилтын дараа хамгаалалт удаан сэргэж байна — буцахдаа нээлттэй үлдэж байна",
    ko: "펀치 후 가드 복귀가 느려요 — 돌아올 때 빈틈이 생겨요",
  },
  "Guard recovering quickly after each punch": {
    mn: "Цохилт бүрийн дараа хамгаалалт хурдан сэргэж байна",
    ko: "펀치마다 가드가 빠르게 돌아와요",
  },
  "Guard dropping — return hands to chin immediately after each punch": {
    mn: "Хамгаалалт буурч байна — цохилт бүрийн дараа гараа шууд эрүүндээ буцаа",
    ko: "가드가 내려가요 — 펀치 후 바로 손을 턱으로 가져오세요",
  },
  "Guard raised too high — relax shoulders, hands at chin level": {
    mn: "Хамгаалалт хэт өндөр — мөрөө сулла, гараа эрүүний түвшинд барь",
    ko: "가드가 너무 높아요 — 어깨 힘을 빼고 손은 턱 높이로",
  },
  "Guard discipline solid — hands stayed up throughout the session": {
    mn: "Хамгаалалт тогтвортой — раундын турш гар дээрээ байлаа",
    ko: "가드가 안정적이에요 — 라운드 내내 손이 올라가 있었어요",
  },
  "Drive the hip into the punch — rotation is where power comes from": {
    mn: "Ташаагаа цохилт руу эргүүл — хүч эргэлтээс гардаг",
    ko: "골반을 펀치에 실으세요 — 파워는 회전에서 나와요",
  },
  "Too much rotation — you're leaving your chin open on the cross": {
    mn: "Хэт их эргэж байна — cross цохихдоо эрүүгээ ил үлдээж байна",
    ko: "회전이 너무 커요 — 크로스 때 턱이 열려요",
  },
  "Too much rotation — you're leaving yourself open": {
    mn: "Хэт их эргэж байна — өөрийгөө ил үлдээж байна",
    ko: "회전이 너무 커요 — 빈틈이 생겨요",
  },
  "Good hip-shoulder separation — power transferring into punches": {
    mn: "Ташаа, мөрний эргэлт сайн — хүч цохилтод дамжиж байна",
    ko: "골반-어깨 분리가 좋아요 — 파워가 펀치로 전달돼요",
  },
  "Weight drifting laterally — stay centered, hips over your base": {
    mn: "Жин хажуу тийш гулсаж байна — төвөө барь, ташаа хөлийнхөө дээр",
    ko: "체중이 옆으로 쏠려요 — 중심을 유지하세요",
  },
  "Stance too narrow — widen your base, one shoulder-width minimum": {
    mn: "Байрлал хэт нарийн — хөлөө наад зах нь мөрний өргөнөөр тавь",
    ko: "스탠스가 좁아요 — 최소 어깨너비로 벌리세요",
  },
  "Feet too wide — reduce stance for better lateral mobility": {
    mn: "Хөл хэт өргөн — хажуу тийш амар хөдлөхөөр нарийсга",
    ko: "발이 너무 넓어요 — 좌우 이동을 위해 좁히세요",
  },
  "Short session or limited visibility — findings are indicative only": {
    mn: "Раунд богино эсвэл камер муу харсан — дүн ойролцоо",
    ko: "짧은 세션 또는 시야 제한 — 결과는 참고용이에요",
  },
  "Punches detected, type uncertain — punch more directly toward camera": {
    mn: "Цохилт бүртгэгдсэн ч төрөл нь тодорхойгүй — камер руу илүү чигээр цохи",
    ko: "펀치는 감지됐지만 종류가 불확실해요 — 카메라 쪽으로 곧게 치세요",
  },
};

const LOW_CONF = /^(\d+)% of punches were low-confidence — step back for better framing$/;

/** Coaching cue (stored in English) in the user's language; unknown text passes through. */
export function localizeCoaching(message, locale = "en") {
  if (!message || locale === "en") return message;
  const hit = TEXT[message];
  if (hit) return hit[locale] || message;
  const m = LOW_CONF.exec(message);
  if (m) {
    if (locale === "mn") return `Цохилтын ${m[1]}% нь эргэлзээтэй — илүү сайн харагдахаар ухарч зогс`;
    if (locale === "ko") return `펀치의 ${m[1]}%가 불확실해요 — 더 잘 보이도록 뒤로 물러서세요`;
  }
  return message;
}

export const COACHING_TEXT_KEYS = Object.keys(TEXT);
