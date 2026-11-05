// The activation funnel — every step a brand-new user takes on the way to the
// one moment that matters: "it actually understands my punches" (result_viewed).
// Shared by the client tracker (lib/funnel.js) and the admin funnel API, so the
// order and names can never drift apart.

export const FUNNEL_STEPS = [
  { key: "landing_viewed",       mn: "Landing үзсэн",        en: "Landing viewed" , ko: "랜딩 조회" },
  { key: "auth_completed",       mn: "Бүртгүүлсэн / нэвтэрсэн", en: "Signed up / in" , ko: "가입 / 로그인" },
  { key: "onboarding_completed", mn: "Onboarding дууссан",    en: "Onboarding done" , ko: "온보딩 완료" },
  { key: "train_opened",         mn: "Train нээсэн",          en: "Train opened" , ko: "트레이닝 진입" },
  { key: "camera_granted",       mn: "Камер зөвшөөрсөн",      en: "Camera allowed" , ko: "카메라 허용" },
  { key: "pose_detected",        mn: "Биеийг таньсан",        en: "Body detected" , ko: "자세 인식" },
  { key: "session_started",      mn: "Session эхэлсэн",       en: "Session started" , ko: "세션 시작" },
  { key: "first_punch",          mn: "Эхний цохилт",          en: "First punch" , ko: "첫 펀치" },
  { key: "result_viewed",        mn: "Оноо + feedback харсан (WOW)", en: "Result seen (WOW)" , ko: "점수·피드백 확인 (WOW)" },
  { key: "session_completed",    mn: "Session хадгалсан",     en: "Session saved" , ko: "세션 저장" },
];

// Non-step signals tracked alongside the funnel.
export const FUNNEL_SIGNALS = ["app_opened", "camera_denied", "guest_session_claimed"];

export const FUNNEL_EVENT_NAMES = [
  ...FUNNEL_STEPS.map((s) => s.key),
  ...FUNNEL_SIGNALS,
];
