"use client";

const LABELS = {
  title: {
    en: "Programs Coming Soon",
    mn: "Хөтөлбөр удахгүй гарна",
    ko: "프로그램 출시 예정",
  },
  body: {
    en: "Personalized training programs are being built.\nTry the AI Workout Builder in the meantime.",
    mn: "Ганцаарчилсан тренингийн хөтөлбөр бэлтгэгдэж байна.\nAI Workout Builder ашиглаж болно.",
    ko: "맞춤 훈련 프로그램을 준비 중입니다.\nAI 워크아웃 빌더를 사용해보세요.",
  },
  btn: {
    en: "Open AI Builder",
    mn: "AI Builder нээх",
    ko: "AI 빌더 열기",
  },
};

/**
 * Props:
 *   locale     "en" | "mn" | "ko"
 *   onOpenBuilder  () => void
 */
export default function EmptyPrograms({ locale, onOpenBuilder }) {
  const loc = locale || "en";
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🥊</div>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#fff", marginBottom: 8 }}>
        {LABELS.title[loc] ?? LABELS.title.en}
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 20 }}>
        {LABELS.body[loc] ?? LABELS.body.en}
      </div>
      <button
        type="button"
        onClick={onOpenBuilder}
        style={{
          padding: "12px 28px", borderRadius: 14,
          background: "linear-gradient(145deg,#EF4444,#cc2820)",
          border: "none", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer",
        }}
      >
        🤖 {LABELS.btn[loc] ?? LABELS.btn.en}
      </button>
    </div>
  );
}
