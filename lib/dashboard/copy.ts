// Fighter dashboard copy — MN / KO / EN. One typed object per locale, so a missing string is a
// type error (no silent English fallback).
import type {
  BenchmarkAxis, Confidence, DashboardErrorCode, Locale, OrderStatus, PunchType, Stance, VideoAnalysisStatus,
} from "./types";
import type { ClipErrorCode } from "@/lib/videoAnalysis/clip";

export interface DashboardCopy {
  title: string;
  kpi: { training: string; speed: string; technique: string; orders: string };
  sessionsN: (n: number) => string;
  /** analysed videos; `more` = the count is only the live window, there may be more */
  videosN: (n: number, more: boolean) => string;
  duration: (minutes: number) => string;
  ms: string;
  speedSub: string;
  rating: Record<"FAST" | "MODERATE" | "SLOW", string>;
  techniqueSub: (passed: number, total: number) => string;
  ordersSub: string;
  noValue: string;
  bio: { title: string; sub: (n: number) => string; trend: string; technique: string; balanced: string; guard: string; mix: string; empty: string; confidence: string };
  punch: Record<PunchType, string>;
  confidence: Record<Confidence, string>;
  bench: { title: string; you: string; ref: string; source: (label: string, athletes: number, clips: number) => string; empty: string; axisHelp: string };
  axis: Record<BenchmarkAxis, string>;
  videos: { title: string; empty: string; poseFrames: (pct: number) => string; punches: (n: number) => string; failed: string };
  videoStatus: Record<VideoAnalysisStatus, string>;
  clip: {
    analyze: string; another: string; privacy: string; cancel: string; realtime: string;
    phase: { reading: string; loading_model: string; analyzing: string; saving: string; done: string };
    error: Record<ClipErrorCode, string>;
  };
  orders: { title: string; empty: string; track: string; more: (n: number) => string };
  orderStatus: Record<OrderStatus, string>;
  error: Record<DashboardErrorCode, string>;
  retry: string;
  streak: (n: number) => string;
  nextRank: string;
  topRank: string;
  stance: Record<Stance, string>;
}

const mn: DashboardCopy = {
  title: "Тулаанчны самбар",
  kpi: { training: "Нийт бэлтгэл", speed: "Цохилтын хурд", technique: "Техникийн оноо", orders: "Идэвхтэй захиалга" },
  sessionsN: (n) => `${n} раунд`,
  videosN: (n, more) => `${n}${more ? "+" : ""} видео шинжилсэн`,
  duration: (m) => (m >= 60 ? `${Math.floor(m / 60)} ц ${m % 60} мин` : `${m} мин`),
  ms: "мс",
  speedSub: "Гараа хамгаалалтад буцаах дундаж хугацаа",
  rating: { FAST: "Хурдан", MODERATE: "Дунд", SLOW: "Удаан" },
  techniqueSub: (p, t) => `Сүүлийн раунд: ${p}/${t} шалгуур зөв`,
  ordersSub: "Төлбөр, бэлтгэл, хүргэлтийн шатанд",
  noValue: "—",
  bio: {
    title: "Биомеханик анализ", sub: (n) => `Сүүлийн ${n} раунд · MediaPipe`, trend: "Раундын оноо (0–10)",
    technique: "Техник", balanced: "Тэнцвэртэй раунд", guard: "Хамгаалалт зөв", mix: "Цохилтын төрөл",
    empty: "Анализ хийсэн раунд алга. Эхний раундаа хийгээрэй.", confidence: "Камерын итгэл",
  },
  punch: { jab: "Жэб", cross: "Кросс", hook: "Хук", uppercut: "Апперкот" },
  confidence: { high: "өндөр", medium: "дунд", low: "бага", none: "хэмжээгүй" },
  bench: {
    title: "FKG харьцуулалт", you: "Та", ref: "Жишиг",
    source: (l, a, c) => `${l} · ${a} тамирчин · ${c} клип`,
    empty: "Жишиг профайл хараахан нийтлэгдээгүй. Бид зохиомол «про» тоо харуулдаггүй.",
    axisHelp: "0–100, хоёр талыг нэг хэмжүүрээр",
  },
  axis: { speed: "Хурд", technique: "Техник", guard: "Хамгаалалт", balance: "Тэнцвэр", volume: "Цохилтын тоо", variety: "Олон төрөл" },
  videos: {
    title: "Сүүлийн видео анализ", empty: "Видео оруулаагүй байна.",
    poseFrames: (p) => `Бие ${p}% кадрт илэрсэн`, punches: (n) => `${n} цохилт`, failed: "Анализ амжилтгүй",
  },
  videoStatus: { queued: "Дараалалд", processing: "Боловсруулж байна", completed: "Дууссан", failed: "Алдаа" },
  clip: {
    analyze: "Видео шинжлүүлэх", another: "Өөр видео", cancel: "Зогсоох",
    privacy: "Видео таны төхөөрөмж дээр шинжлэгдэнэ, серверт илгээгдэхгүй. Зөвхөн оноо ба араг ясны зураг хадгалагдана.",
    realtime: "Видео бодит хурдаараа тоглогдоно — дуустал хүлээнэ үү.",
    phase: { reading: "Видеог уншиж байна…", loading_model: "MediaPipe ачаалж байна…", analyzing: "Шинжилж байна", saving: "Хадгалж байна…", done: "Шинжилгээ дууслаа" },
    error: {
      not_video: "Видео файл сонгоно уу.", too_large: "Файл хэт том (300 MB хүртэл).",
      too_short: "Видео хэт богино (3 секундээс урт байх).", too_long: "Видео хэт урт (3 минут хүртэл).",
      unsupported_video: "Энэ видеог тоглуулж чадсангүй — MP4 эсвэл WebM сонгоно уу.",
      model_load_failed: "MediaPipe ачаалж чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.",
      no_body_detected: "Видеонд бие харагдсангүй. Бүх биеэ кадрт оруулж бичнэ үү.",
      interrupted: "Шинжилгээ зогссон.", save_failed: "Үр дүнг хадгалж чадсангүй.",
    },
  },
  orders: { title: "Захиалгын түүх", empty: "Захиалга алга.", track: "Хүргэлт хянах", more: (n) => `+${n} бараа` },
  orderStatus: {
    pending_payment: "Төлбөр хүлээгдэж байна", paid: "Төлөгдсөн", fulfilling: "Бэлтгэж байна", shipped: "Илгээсэн",
    delivered: "Хүргэгдсэн", cancelled: "Цуцалсан", refunded: "Буцаан олгосон",
  },
  error: {
    "permission-denied": "Энэ хэсгийг харах эрх алга.", unavailable: "Сүлжээ тасарсан байна.",
    "not-found": "Өгөгдөл олдсонгүй.", unauthenticated: "Самбараа харахын тулд нэвтэрнэ үү.", unknown: "Ачаалж чадсангүй.",
  },
  retry: "Дахин оролдох",
  streak: (n) => `${n} өдөр дараалан`,
  nextRank: "Дараагийн цол",
  topRank: "Хамгийн дээд цол",
  stance: { orthodox: "Ортодокс", southpaw: "Саутпоу" },
};

const ko: DashboardCopy = {
  title: "파이터 대시보드",
  kpi: { training: "총 훈련", speed: "펀치 속도", technique: "기술 점수", orders: "진행 중 주문" },
  sessionsN: (n) => `${n}라운드`,
  videosN: (n, more) => `분석 영상 ${n}${more ? "+" : ""}개`,
  duration: (m) => (m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`),
  ms: "ms",
  speedSub: "가드로 손을 되돌리는 평균 시간",
  rating: { FAST: "빠름", MODERATE: "보통", SLOW: "느림" },
  techniqueSub: (p, t) => `최근 라운드: 자세 체크 ${p}/${t}`,
  ordersSub: "결제·준비·배송 단계",
  noValue: "—",
  bio: {
    title: "바이오메카닉 분석", sub: (n) => `최근 ${n}라운드 · MediaPipe`, trend: "라운드 점수 (0–10)",
    technique: "기술", balanced: "균형 잡힌 라운드", guard: "가드 정확", mix: "펀치 구성",
    empty: "분석된 라운드가 없습니다. 첫 라운드를 시작하세요.", confidence: "카메라 신뢰도",
  },
  punch: { jab: "잽", cross: "크로스", hook: "훅", uppercut: "어퍼컷" },
  confidence: { high: "높음", medium: "보통", low: "낮음", none: "측정 안 됨" },
  bench: {
    title: "FKG 비교", you: "나", ref: "기준",
    source: (l, a, c) => `${l} · 선수 ${a}명 · 클립 ${c}개`,
    empty: "아직 공개된 기준 프로필이 없습니다. 지어낸 '프로' 수치는 보여주지 않습니다.",
    axisHelp: "0–100, 양쪽 모두 같은 척도",
  },
  axis: { speed: "속도", technique: "기술", guard: "가드", balance: "균형", volume: "볼륨", variety: "다양성" },
  videos: {
    title: "최근 영상 분석", empty: "업로드한 영상이 없습니다.",
    poseFrames: (p) => `${p}% 프레임에서 포즈 감지`, punches: (n) => `펀치 ${n}회`, failed: "분석 실패",
  },
  videoStatus: { queued: "대기 중", processing: "처리 중", completed: "완료", failed: "실패" },
  clip: {
    analyze: "영상 분석하기", another: "다른 영상", cancel: "중지",
    privacy: "영상은 기기에서 분석되며 서버로 전송되지 않습니다. 점수와 스켈레톤 이미지만 저장됩니다.",
    realtime: "영상이 실제 속도로 재생됩니다 — 끝날 때까지 기다려 주세요.",
    phase: { reading: "영상 읽는 중…", loading_model: "MediaPipe 불러오는 중…", analyzing: "분석 중", saving: "저장 중…", done: "분석 완료" },
    error: {
      not_video: "영상 파일을 선택하세요.", too_large: "파일이 너무 큽니다 (최대 300 MB).",
      too_short: "영상이 너무 짧습니다 (3초 이상).", too_long: "영상이 너무 깁니다 (최대 3분).",
      unsupported_video: "이 영상을 재생할 수 없습니다 — MP4 또는 WebM을 선택하세요.",
      model_load_failed: "MediaPipe를 불러오지 못했습니다. 인터넷 연결을 확인하고 다시 시도하세요.",
      no_body_detected: "영상에서 몸이 보이지 않습니다. 전신이 화면에 들어오게 촬영하세요.",
      interrupted: "분석이 중지되었습니다.", save_failed: "결과를 저장하지 못했습니다.",
    },
  },
  orders: { title: "주문 내역", empty: "주문이 없습니다.", track: "배송 조회", more: (n) => `외 ${n}개` },
  orderStatus: {
    pending_payment: "결제 대기", paid: "결제 완료", fulfilling: "상품 준비 중", shipped: "배송 중",
    delivered: "배송 완료", cancelled: "취소됨", refunded: "환불됨",
  },
  error: {
    "permission-denied": "이 섹션을 볼 권한이 없습니다.", unavailable: "네트워크 연결이 끊겼습니다.",
    "not-found": "데이터를 찾을 수 없습니다.", unauthenticated: "대시보드를 보려면 로그인하세요.", unknown: "불러오지 못했습니다.",
  },
  retry: "다시 시도",
  streak: (n) => `${n}일 연속`,
  nextRank: "다음 랭크",
  topRank: "최고 랭크",
  stance: { orthodox: "오소독스", southpaw: "사우스포" },
};

const en: DashboardCopy = {
  title: "Fighter dashboard",
  kpi: { training: "Total training", speed: "Punch speed", technique: "Technique score", orders: "Active orders" },
  sessionsN: (n) => `${n} round${n === 1 ? "" : "s"}`,
  videosN: (n, more) => `${n}${more ? "+" : ""} video${n === 1 && !more ? "" : "s"} analysed`,
  duration: (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`),
  ms: "ms",
  speedSub: "Average time to bring the hand back to guard",
  rating: { FAST: "Fast", MODERATE: "Moderate", SLOW: "Slow" },
  techniqueSub: (p, t) => `Last round: ${p}/${t} form checks good`,
  ordersSub: "Awaiting payment, packing or delivery",
  noValue: "—",
  bio: {
    title: "Biomechanics", sub: (n) => `Last ${n} rounds · MediaPipe`, trend: "Round score (0–10)",
    technique: "Technique", balanced: "Balanced rounds", guard: "Guard held", mix: "Punch mix",
    empty: "No analysed rounds yet. Start your first round.", confidence: "Camera confidence",
  },
  punch: { jab: "Jab", cross: "Cross", hook: "Hook", uppercut: "Uppercut" },
  confidence: { high: "high", medium: "medium", low: "low", none: "not measured" },
  bench: {
    title: "FKG comparison", you: "You", ref: "Ref.",
    source: (l, a, c) => `${l} · ${a} athlete${a === 1 ? "" : "s"} · ${c} clips`,
    empty: "No reference profile has been published yet. We don't show made-up “pro” numbers.",
    axisHelp: "0–100, both sides on the same scale",
  },
  axis: { speed: "Speed", technique: "Technique", guard: "Guard", balance: "Balance", volume: "Volume", variety: "Variety" },
  videos: {
    title: "Recent video analyses", empty: "No videos uploaded yet.",
    poseFrames: (p) => `Body found in ${p}% of frames`, punches: (n) => `${n} punches`, failed: "Analysis failed",
  },
  videoStatus: { queued: "Queued", processing: "Processing", completed: "Completed", failed: "Failed" },
  clip: {
    analyze: "Analyse a video", another: "Another video", cancel: "Stop",
    privacy: "The video is analysed on your device and never uploaded. Only the score and a skeleton image are saved.",
    realtime: "The video plays at normal speed — keep this page open until it ends.",
    phase: { reading: "Reading the video…", loading_model: "Loading MediaPipe…", analyzing: "Analysing", saving: "Saving…", done: "Analysis complete" },
    error: {
      not_video: "Choose a video file.", too_large: "The file is too big (300 MB max).",
      too_short: "The video is too short (3 s minimum).", too_long: "The video is too long (3 min max).",
      unsupported_video: "This video can't be played — choose an MP4 or WebM.",
      model_load_failed: "Couldn't load MediaPipe. Check your connection and try again.",
      no_body_detected: "No body was found in the video. Film with your whole body in frame.",
      interrupted: "The analysis was stopped.", save_failed: "Couldn't save the result.",
    },
  },
  orders: { title: "Order history", empty: "No orders yet.", track: "Track delivery", more: (n) => `+${n} more` },
  orderStatus: {
    pending_payment: "Awaiting payment", paid: "Paid", fulfilling: "Packing", shipped: "Shipped",
    delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
  },
  error: {
    "permission-denied": "You don't have access to this section.", unavailable: "You're offline.",
    "not-found": "Nothing found.", unauthenticated: "Sign in to see your dashboard.", unknown: "Couldn't load this.",
  },
  retry: "Try again",
  streak: (n) => `${n}-day streak`,
  nextRank: "Next rank",
  topRank: "Top rank",
  stance: { orthodox: "Orthodox", southpaw: "Southpaw" },
};

export const DASHBOARD_COPY: Record<Locale, DashboardCopy> = { mn, ko, en };

export const dashboardCopy = (locale: string): DashboardCopy =>
  DASHBOARD_COPY[(locale === "mn" || locale === "ko" ? locale : "en") as Locale];

/** "189,000₮" — whole tögrög, grouped. */
export const formatMnt = (amount: number) => `${Math.round(amount).toLocaleString("en-US")}₮`;

/** "11/06" — short, locale-neutral month/day in the viewer's time zone ("" → "—"). */
export const shortDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};
