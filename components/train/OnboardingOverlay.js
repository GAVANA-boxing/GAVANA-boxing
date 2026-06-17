"use client";

import { RED, GOLD } from "@/lib/tokens";

const OB_CONTENT = {
  en: {
    kicker: "BOXING INTELLIGENCE",
    title:  "Build Your Fighter DNA",
    sub:    "Train. Discover who you fight like. Own your identity.",
    steps: [
      { n: "1", label: "Train",  desc: "Throw punches. AI reads your style." },
      { n: "2", label: "Signal", desc: "Your punch patterns form early signals." },
      { n: "3", label: "DNA",    desc: "Your Fighter Archetype reveals." },
    ],
    hook: "3 sessions unlock your Fighter DNA.",
    cta:  "Start Training →",
    skip: "Skip",
  },
  mn: {
    kicker: "БОКСЫН ТАГНУУЛ",
    title:  "Тулаанчийн ДНХ-аа бүрдүүл",
    sub:    "Бэлтгэл хий. Ямар тулаанч болохоо олж мэд. Мөн чанараа эзэмш.",
    steps: [
      { n: "1", label: "Бэлтгэл", desc: "Цохилт хий. AI хэв маягийг таньна." },
      { n: "2", label: "Дохио",   desc: "Цохилтын хэв маяг эрт дохио үүсгэнэ." },
      { n: "3", label: "ДНХ",     desc: "Тулаанчийн архетип илчлэгдэнэ." },
    ],
    hook: "3 тренингт таны тулаанчийн ДНХ нээгдэнэ.",
    cta:  "Бэлтгэл эхлэх →",
    skip: "Алгасах",
  },
  ko: {
    kicker: "복싱 인텔리전스",
    title:  "파이터 DNA를 구축하세요",
    sub:    "훈련하세요. 어떤 파이터처럼 싸우는지 발견하세요. 정체성을 가지세요.",
    steps: [
      { n: "1", label: "훈련", desc: "펀치를 던지세요. AI가 스타일을 읽습니다." },
      { n: "2", label: "신호", desc: "펀치 패턴이 초기 신호를 형성합니다." },
      { n: "3", label: "DNA",  desc: "파이터 아키타입이 공개됩니다." },
    ],
    hook: "3세션이 파이터 DNA를 잠금 해제합니다.",
    cta:  "훈련 시작 →",
    skip: "건너뛰기",
  },
};

export default function OnboardingOverlay({ locale, onDismiss }) {
  const L = OB_CONTENT[locale] || OB_CONTENT.en;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: "rgba(4,4,6,0.99)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>

        {/* Logo + kicker */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🥊</div>
          <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 3, color: `${RED}cc`, textTransform: "uppercase", marginBottom: 10 }}>
            {L.kicker}
          </div>
          <div style={{ fontSize: 28, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display,'Anton',sans-serif)", textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1.05, marginBottom: 10 }}>
            {L.title}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.38)", fontWeight: 600, lineHeight: 1.5 }}>
            {L.sub}
          </p>
        </div>

        {/* 3-step journey */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 28, position: "relative" }}>
          {/* Connector line */}
          <div style={{ position: "absolute", top: 18, left: "calc(50% / 3 + 18px)", right: "calc(50% / 3 + 18px)", height: 1, background: "rgba(255,255,255,0.08)", zIndex: 0 }} />
          {L.steps.map((step, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: i === 2 ? `${GOLD}18` : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${i === 2 ? GOLD : "rgba(255,255,255,0.1)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 900,
                color: i === 2 ? GOLD : "rgba(255,255,255,0.4)",
              }}>
                {i === 2 ? "🧬" : step.n}
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: i === 2 ? GOLD : "rgba(255,255,255,0.6)", marginBottom: 3 }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", lineHeight: 1.4, fontWeight: 600, maxWidth: 80 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hook line */}
        <div style={{ borderRadius: 14, padding: "14px 16px", background: `${GOLD}0c`, border: `1px solid ${GOLD}25`, marginBottom: 24, textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 900, color: GOLD, lineHeight: 1.4 }}>
            {L.hook}
          </p>
        </div>

        {/* CTAs */}
        <button
          type="button"
          onClick={onDismiss}
          style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: RED, border: "none", color: "#fff", fontSize: 15, fontWeight: 900, letterSpacing: 0.5, cursor: "pointer", marginBottom: 12, boxShadow: `0 4px 24px ${RED}44` }}
        >
          {L.cta}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={{ width: "100%", padding: "10px 0", borderRadius: 14, background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          {L.skip}
        </button>
      </div>
    </div>
  );
}
