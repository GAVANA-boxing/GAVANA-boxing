// The activation funnel — every step a brand-new user takes on the way to the
// one moment that matters: "it actually understands my punches" (result_viewed).
// Shared by the client tracker (lib/funnel.js) and the admin funnel API, so the
// order and names can never drift apart.

export const FUNNEL_STEPS = [
  { key: "landing_viewed",       mn: "Landing үзсэн",        en: "Landing viewed" },
  { key: "auth_completed",       mn: "Бүртгүүлсэн / нэвтэрсэн", en: "Signed up / in" },
  { key: "onboarding_completed", mn: "Onboarding дууссан",    en: "Onboarding done" },
  { key: "train_opened",         mn: "Train нээсэн",          en: "Train opened" },
  { key: "camera_granted",       mn: "Камер зөвшөөрсөн",      en: "Camera allowed" },
  { key: "pose_detected",        mn: "Биеийг таньсан",        en: "Body detected" },
  { key: "session_started",      mn: "Session эхэлсэн",       en: "Session started" },
  { key: "first_punch",          mn: "Эхний цохилт",          en: "First punch" },
  { key: "result_viewed",        mn: "Оноо + feedback харсан (WOW)", en: "Result seen (WOW)" },
  { key: "session_completed",    mn: "Session хадгалсан",     en: "Session saved" },
];

// Non-step signals tracked alongside the funnel.
export const FUNNEL_SIGNALS = ["app_opened", "camera_denied"];

export const FUNNEL_EVENT_NAMES = [
  ...FUNNEL_STEPS.map((s) => s.key),
  ...FUNNEL_SIGNALS,
];
