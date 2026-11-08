"use client";

import s from "@/components/onboarding/onboardingStyles";

const INTRO_CARDS = (locale) => [
  {
    value: "train",
    emoji: "🥊",
    label: locale === "mn" ? "AI-тай дасгал" : locale === "ko" ? "AI로 훈련하기" : "Train With AI",
    desc: locale === "mn" ? "Цохилт, хурд, хамгаалалтаа камераар хэмжүүл" : locale === "ko" ? "펀치·속도·가드를 카메라로 측정" : "Your camera counts punches and reads speed and guard",
  },
  {
    value: "learn",
    emoji: "🎓",
    label: locale === "mn" ? "Боксын академи" : locale === "ko" ? "복싱 배우기" : "Learn Boxing",
    desc: locale === "mn" ? "Чемпионуудын нэрт техникийг судлах" : locale === "ko" ? "챔피언의 기술을 체계적으로 배우기" : "Study the techniques of legendary champions",
  },
  {
    value: "sparring",
    emoji: "⚔️",
    label: locale === "mn" ? "Спарринг хайх" : locale === "ko" ? "스파링 찾기" : "Find Sparring",
    desc: locale === "mn" ? "Ойр орчмын ижил түвшний тулаанч олох" : locale === "ko" ? "근처의 같은 수준 파이터 찾기" : "Connect with fighters at your level nearby",
  },
  {
    value: "watch",
    emoji: "📱",
    label: locale === "mn" ? "Тулаанчдыг дагах" : locale === "ko" ? "파이터 보기" : "Watch Fighters",
    desc: locale === "mn" ? "Тулаанчдын бичлэг, сорилтыг үзэх" : locale === "ko" ? "파이터들의 영상과 챌린지 보기" : "Watch training reels, challenges & breakdowns",
  },
];

export default function OnboardingIntroScreen({ locale, onNext, onSkipToTrain }) {
  const cards = INTRO_CARDS(locale);

  return (
    <div style={s.page}>
      <div style={s.bgGlow} />
      <div style={{ ...s.inner, paddingTop: 40 }} className="ob-step">
        <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}.ob-step{animation:slideIn 0.3s ease forwards}`}</style>
        <div style={s.header}>
          <p style={s.kicker}>GAVANA</p>
          <h1 style={s.title}>
            {locale === "mn" ? "Юу хийхийг хүсч байна вэ?" : locale === "ko" ? "무엇을 하고 싶으신가요?" : "What brings you here?"}
          </h1>
          <p style={s.subtitle}>
            {locale === "mn" ? "Таны туршлагыг тохируулна. Дараа нь бүгдийг хийж болно." : locale === "ko" ? "경험을 맞춤 설정합니다. 나중에 모든 걸 할 수 있어요." : "Personalizes your experience. You can do everything later."}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {cards.map((card) => (
            <button
              key={card.value}
              type="button"
              onClick={() => onNext(card.value)}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 18px", borderRadius: 16, cursor: "pointer",
                border: "1.5px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                textAlign: "left", width: "100%",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 30, flexShrink: 0, lineHeight: 1, width: 40, textAlign: "center" }}>{card.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 2 }}>{card.label}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.35 }}>{card.desc}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          ))}
        </div>

        {/* Fast-path: skip straight to the camera, defer identity questions */}
        {onSkipToTrain && (
          <button
            type="button"
            onClick={onSkipToTrain}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              width: "100%", padding: "13px 0", borderRadius: 14,
              border: "none", background: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 800,
            }}
          >
            <span style={{ fontSize: 15 }}>🥊</span>
            {locale === "mn" ? "Алгасаад шууд бэлтгэх →" : locale === "ko" ? "건너뛰고 바로 훈련하기 →" : "Skip — start training now →"}
          </button>
        )}
      </div>
    </div>
  );
}
