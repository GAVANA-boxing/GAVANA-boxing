"use client";

const SP_LABELS = {
  en: { kicker: "AI SPARRING", title: "Spar Your Opposite", sub: "Train against your counter-style", btn: "Get Counter-Combos →" },
  mn: { kicker: "AI СПАРРИНГ", title: "Эсрэг архетиптэй спарринг", sub: "Эсрэг хэв маяг дээр бэлтгэл хий", btn: "Эсрэг комбо авах →" },
  ko: { kicker: "AI 스파링", title: "반대 스타일과 스파링", sub: "카운터 스타일로 훈련하기", btn: "카운터 콤보 받기 →" },
};

const OPPONENT_CYCLE = ["pressure", "outboxer", "counter", "explosive", "technician"];

const OPPONENT_COLORS = {
  pressure: "#EF4444",
  outboxer: "#3B82F6",
  counter: "#8B5CF6",
  explosive: "#F59E0B",
  technician: "#10B981",
};

const OPPONENT_LABELS = {
  pressure:   { en: "Pressure Fighter", mn: "Дарамтын тулаанч", ko: "프레셔 파이터" },
  outboxer:   { en: "Outboxer", mn: "Аутбоксер", ko: "아웃복서" },
  counter:    { en: "Counter Fighter", mn: "Контр тулаанч", ko: "카운터 파이터" },
  explosive:  { en: "Explosive Fighter", mn: "Тэсрэлтийн тулаанч", ko: "폭발적 파이터" },
  technician: { en: "Technician", mn: "Техникч", ko: "테크니션" },
};

export default function AISparringPartner({ userArchetype, locale, router }) {
  const opponent = OPPONENT_CYCLE[new Date().getDay() % 5];
  const oppColor = OPPONENT_COLORS[opponent];
  const oppLabel = OPPONENT_LABELS[opponent]?.[locale] || opponent;
  const SL = SP_LABELS[locale] || SP_LABELS.en;

  const sparQ = locale === "mn"
    ? `Намайг ${userArchetype ? (OPPONENT_LABELS[userArchetype]?.[locale] || userArchetype) : "тулаанч"} гэж үз. Би ${oppLabel}-тай тулаад байна. Ямар комбо болон контр хөдөлгөөн ашиглах вэ?`
    : locale === "ko"
    ? `저는 ${userArchetype ? (OPPONENT_LABELS[userArchetype]?.[locale] || userArchetype) : "파이터"}입니다. ${oppLabel}와 스파링 중입니다. 어떤 콤보와 카운터 동작을 사용해야 할까요?`
    : `I'm a ${userArchetype ? (OPPONENT_LABELS[userArchetype]?.en || userArchetype) : "fighter"}. I'm sparring against a ${oppLabel}. What combos and counter moves should I use?`;

  return (
    <div style={{ marginBottom: 12, borderRadius: 14, overflow: "hidden", border: `1px solid ${oppColor}22`, background: `${oppColor}06` }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${oppColor}66, transparent)` }} />
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: oppColor, textTransform: "uppercase", marginBottom: 6 }}>
          ⚔️ {SL.kicker}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 2 }}>{SL.title}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{SL.sub}</div>
          </div>
          <div style={{ padding: "6px 10px", borderRadius: 10, background: `${oppColor}15`, border: `1px solid ${oppColor}30`, textAlign: "center" }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: oppColor, textTransform: "uppercase", letterSpacing: 0.5 }}>VS</div>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#fff", marginTop: 1, whiteSpace: "nowrap" }}>{oppLabel}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/coach/chat?q=${encodeURIComponent(sparQ)}`)}
          style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: `${oppColor}18`, border: `1px solid ${oppColor}38`, color: oppColor, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
        >
          {SL.btn}
        </button>
      </div>
    </div>
  );
}
