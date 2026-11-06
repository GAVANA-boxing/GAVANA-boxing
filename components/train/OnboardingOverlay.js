"use client";

import { BRAND, btnPrimary, kickerPill, kickerDot, displayTitle } from "@/components/ui/brand";

// First visit to /train: the three things that decide whether the camera can
// read your punches. Same visual language as the landing page.

const OB_CONTENT = {
  en: {
    kicker: "Your first round",
    title: "Set up in 10 seconds",
    steps: [
      { title: "Prop up your phone", desc: "About chest height, 2–3 steps away. Your whole body in frame." },
      { title: "Light in front of you", desc: "Face a window or lamp — a bright window behind you hides your arms." },
      { title: "Pick your stance", desc: "Which foot is forward? It decides which hand is your jab." },
    ],
    cta: "I'm ready",
    skip: "Skip",
  },
  mn: {
    kicker: "Таны эхний раунд",
    title: "10 секундэд бэлдье",
    steps: [
      { title: "Утсаа тавь", desc: "Ойролцоогоор цээжний өндөрт, 2–3 алхам зайтай. Бүтэн бие чинь кадрт багтах ёстой." },
      { title: "Гэрэл урдаас тусах", desc: "Цонх, гэрэл рүү харж зогс — ард чинь тод цонх байвал гар чинь харагдахгүй." },
      { title: "Байрлалаа сонго", desc: "Аль хөл чинь урдаа вэ? Үүгээр jab ямар гар болохыг тодорхойлно." },
    ],
    cta: "Бэлэн боллоо",
    skip: "Алгасах",
  },
  ko: {
    kicker: "첫 라운드",
    title: "10초면 준비 끝",
    steps: [
      { title: "휴대폰을 세우세요", desc: "가슴 높이, 2–3걸음 떨어져서. 전신이 화면에 들어와야 해요." },
      { title: "빛은 앞에서", desc: "창문이나 조명을 바라보세요 — 뒤에 밝은 창이 있으면 팔이 안 보여요." },
      { title: "스탠스를 고르세요", desc: "어느 발이 앞인가요? 잽 손이 정해져요." },
    ],
    cta: "준비됐어요",
    skip: "건너뛰기",
  },
};

export default function OnboardingOverlay({ locale, onDismiss }) {
  const L = OB_CONTENT[locale] || OB_CONTENT.en;

  return (
    <div role="dialog" aria-modal="true" aria-label={L.title} style={{
      position: "fixed", inset: 0, zIndex: 9998,
      background: "radial-gradient(ellipse 90% 50% at 50% -10%, rgba(255,59,48,0.22) 0%, transparent 60%), #070708",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 20px", overflowY: "auto",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <p style={kickerPill}><span style={kickerDot} />{L.kicker}</p>
        <h2 style={{ ...displayTitle, fontSize: 40, margin: "16px 0 24px" }}>{L.title}</h2>

        <ol style={{ listStyle: "none", margin: "0 0 28px", padding: 0, display: "grid", gap: 10 }}>
          {L.steps.map((step, i) => (
            <li key={step.title} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 16px", borderRadius: 18, background: BRAND.card, border: `1px solid ${BRAND.line}` }}>
              <span style={{ ...displayTitle, fontSize: 22, color: BRAND.red, width: 22, flexShrink: 0, lineHeight: 1.1 }}>{i + 1}</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: BRAND.text }}>{step.title}</span>
                <span style={{ display: "block", marginTop: 4, fontSize: 14, color: BRAND.muted, lineHeight: 1.5 }}>{step.desc}</span>
              </span>
            </li>
          ))}
        </ol>

        <button type="button" onClick={onDismiss} style={btnPrimary}>{L.cta}</button>
        <button
          type="button"
          onClick={onDismiss}
          style={{ display: "block", width: "100%", marginTop: 10, padding: "12px 0", background: "none", border: "none", color: BRAND.faint, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          {L.skip}
        </button>
      </div>
    </div>
  );
}
