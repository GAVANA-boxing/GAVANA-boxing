"use client";

import { RADIUS, GOLD, whiteAlpha } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const TRIBE_INFO = {
  pressure:   { en: { motto: "Forward. Always.", desc: "Break opponents with relentless pressure and volume." }, mn: { motto: "Урагш. Үргэлж.", desc: "Тасралтгүй дарамт, тооноор дайсныг дарна." }, ko: { motto: "전진. 항상.", desc: "끊임없는 프레셔와 볼륨으로 상대를 압도합니다." } },
  outboxer:   { en: { motto: "Control the distance.", desc: "Win with footwork, angles, and ring generalship." }, mn: { motto: "Зайг эзэмш.", desc: "Хөдөлгөөн, өнцөг, рингийн удирдлагаар ялна." }, ko: { motto: "거리를 지배하라.", desc: "풋워크, 앵글, 링 컨트롤로 승리합니다." } },
  counter:    { en: { motto: "Patient. Precise. Deadly.", desc: "Let them come — and make them pay." }, mn: { motto: "Тэвчээртэй. Нарийн. Аюултай.", desc: "Ирэхийг нь хүлээ — дараа нь шийтгэ." }, ko: { motto: "인내. 정확. 치명적.", desc: "오게 내버려 두고 — 대가를 치르게 하세요." } },
  explosive:  { en: { motto: "One shot. End it.", desc: "Explosive speed and power that changes fights instantly." }, mn: { motto: "Нэг цохилт. Дуусгана.", desc: "Тэсрэмтгий хурд, хүч — тулааныг нэн даруй өөрчилнэ." }, ko: { motto: "한 방. 끝내라.", desc: "폭발적인 스피드와 파워로 경기를 순식간에 바꿉니다." } },
  technician: { en: { motto: "Fundamentals win fights.", desc: "Systematic, precise, always in control." }, mn: { motto: "Үндэс нь тулаан ялна.", desc: "Системтэй, нарийн, үргэлж хяналтдаа." }, ko: { motto: "기본기가 승리를 만든다.", desc: "체계적이고 정확하며 항상 컨트롤 아래 있습니다." } },
};

export default function TribeCard({ archetypeKey, archetype, tribeCount, locale }) {
  if (!archetypeKey) return null;
  const acc = ARCH_TRAINING_COLORS[archetypeKey] || GOLD;
  const info = (TRIBE_INFO[archetypeKey]?.[locale] || TRIBE_INFO[archetypeKey]?.en) || {};
  const memberLabel = locale === "mn"
    ? `${tribeCount ?? "?"} тулаанч`
    : locale === "ko"
    ? `${tribeCount ?? "?"} 파이터`
    : `${tribeCount ?? "?"} fighter${tribeCount !== 1 ? "s" : ""}`;
  const tribeTitle = locale === "mn" ? "ТАНЫ ОВОГ АЙМАГ" : locale === "ko" ? "당신의 부족" : "YOUR TRIBE";
  const gavanaLabel = locale === "mn" ? "GAVANA дахь" : locale === "ko" ? "GAVANA 내" : "in GAVANA";

  return (
    <div style={{ borderRadius: RADIUS.lg, overflow: "hidden", border: `1px solid ${acc}30`, background: `${acc}08`, marginBottom: 8 }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${acc}88, transparent)` }} />
      <div style={{ padding: "14px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
            {tribeTitle}
          </span>
          <div style={{ padding: "3px 10px", borderRadius: 999, background: `${acc}15`, border: `1px solid ${acc}35`, fontSize: 8.5, fontWeight: 900, color: acc }}>
            {memberLabel} {gavanaLabel}
          </div>
        </div>

        {/* Archetype name + motto */}
        <div style={{ fontSize: 22, fontWeight: 1000, color: "#fff", textTransform: "uppercase", letterSpacing: "-0.02em", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1.0, marginBottom: 6 }}>
          {archetype}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: acc, marginBottom: 8, fontStyle: "italic" }}>
          "{info.motto}"
        </div>
        <div style={{ fontSize: 11, color: whiteAlpha(0.4), lineHeight: 1.5, fontWeight: 600 }}>
          {info.desc}
        </div>
      </div>
    </div>
  );
}
