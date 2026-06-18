"use client";

import { RADIUS, GOLD, whiteAlpha } from "@/lib/tokens";

const FP = {
  en: {
    noSessions:      "Train to build your fighter identity.",
    earlyRead:       "Movement Identity · Early Read",
    earlyReadHint:   "Train more sessions to improve confidence.",
    identityEyebrow: "Movement identity",
    signalConf:      "Signal confidence",
  },
  mn: {
    noSessions:      "Тулаанчийн мөн чанараа бүрдүүлэхийн тулд бэлтгэл хий.",
    earlyRead:       "Хөдөлгөөний таних — эрт унших",
    earlyReadHint:   "Найдвартай байдлаа сайжруулахын тулд илүү session хий.",
    identityEyebrow: "Хөдөлгөөн дээр суурилсан мөн чанар",
    signalConf:      "Дохионы найдвартай байдал",
  },
  ko: {
    noSessions:      "파이터 정체성을 구축하려면 훈련하세요.",
    earlyRead:       "움직임 정체성 · 초기 분석",
    earlyReadHint:   "신뢰도 향상을 위해 더 많은 세션을 훈련하세요.",
    identityEyebrow: "움직임 기반 정체성",
    signalConf:      "신호 신뢰도",
  },
};

export default function CombatIdentitySection({ identity, sessionCount, locale }) {
  const s = FP[locale] || FP.en;
  if (sessionCount === 0) {
    return (
      <div style={{
        borderRadius: RADIUS.lg, padding: "16px 18px",
        background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}`,
        marginBottom: 4,
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: whiteAlpha(0.3), lineHeight: 1.5 }}>
          {s.noSessions}
        </p>
      </div>
    );
  }

  if (sessionCount < 3 || !identity) {
    return (
      <div style={{
        borderRadius: RADIUS.lg, padding: "16px 18px",
        background: whiteAlpha(0.025), border: `1px solid ${whiteAlpha(0.06)}`,
        marginBottom: 4,
      }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 6 }}>
          {s.earlyRead}
        </div>
        {identity && (
          <div style={{ fontSize: 17, fontWeight: 1000, color: whiteAlpha(0.6), letterSpacing: "-0.015em", fontFamily: "var(--font-display, 'Anton', sans-serif)", marginBottom: 6 }}>
            {identity.primary}
          </div>
        )}
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: whiteAlpha(0.3) }}>
          {s.earlyReadHint}
        </p>
      </div>
    );
  }

  const confidencePct = Math.round(identity.confidence * 100);

  return (
    <div style={{
      borderRadius: RADIUS.lg, padding: "18px 18px 14px",
      background: "rgba(255,255,255,0.022)",
      border: `1px solid ${whiteAlpha(0.07)}`,
      marginBottom: 4,
    }}>
      {/* Eyebrow */}
      <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 6 }}>
        {s.identityEyebrow}
      </div>

      {/* Primary identity */}
      <div style={{ fontSize: 22, fontWeight: 1000, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.0, fontFamily: "var(--font-display, 'Anton', sans-serif)", marginBottom: 10 }}>
        {identity.primary}
      </div>

      {/* Confidence bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: whiteAlpha(0.3), letterSpacing: 1, textTransform: "uppercase" }}>{s.signalConf}</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: confidencePct >= 70 ? GOLD : whiteAlpha(0.45), fontFamily: "monospace" }}>
            {confidencePct}%
          </span>
        </div>
        <div style={{ height: 2, borderRadius: 2, background: whiteAlpha(0.07), overflow: "hidden" }}>
          <div style={{
            height: "100%", width: `${confidencePct}%`, borderRadius: 2,
            background: confidencePct >= 70 ? `linear-gradient(90deg, ${GOLD}80, ${GOLD})` : whiteAlpha(0.3),
            transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
          }} />
        </div>
      </div>

      {/* Secondary traits */}
      {identity.secondary.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {identity.secondary.map((trait, i) => (
            <span key={i} style={{
              fontSize: 9.5, fontWeight: 800,
              color: whiteAlpha(0.42),
              background: whiteAlpha(0.04),
              border: `1px solid ${whiteAlpha(0.07)}`,
              borderRadius: RADIUS.full,
              padding: "3px 10px",
            }}>
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
