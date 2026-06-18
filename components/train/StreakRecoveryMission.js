"use client";

const COPY = {
  label: { mn: "STREAK ТАСАРСАН — СЭРГЭЭХ ДААЛГАВАР", ko: "스트릭 종료 — 회복 미션", en: "STREAK ENDED — RECOVERY MISSION" },
  body:  { mn: "Нэг хатуу тренинг хийж streak-ийгаа дахин эхлүүл.", ko: "힘든 훈련 한 번으로 스트릭을 다시 시작하세요.", en: "One hard session restarts your streak. Go all out." },
  cta:   { mn: "Сэргээх тренинг →", ko: "회복 훈련 →", en: "Recovery Session →" },
};

export default function StreakRecoveryMission({ locale, wrappedHandleStart }) {
  return (
    <div style={{ borderRadius: 12, padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>💔</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "#F87171", marginBottom: 2 }}>
          {COPY.label[locale] || COPY.label.en}
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>
          {COPY.body[locale] || COPY.body.en}
        </div>
        <button
          type="button"
          onClick={wrappedHandleStart}
          style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)", color: "#F87171", fontSize: 11, fontWeight: 900, cursor: "pointer" }}
        >
          {COPY.cta[locale] || COPY.cta.en}
        </button>
      </div>
    </div>
  );
}
