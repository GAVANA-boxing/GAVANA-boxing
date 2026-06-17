"use client";

import { GOLD } from "@/lib/tokens";
import { computeAggregatePunchPattern } from "@/lib/movementInsight";

const EVO_L = {
  en: {
    eyebrow:       "EXPERIMENT COMPLETE",
    subtitle:      (n) => `${n}-day experiment finished`,
    baseline:      "Before",
    current:       "After",
    jab:           "Jab",
    cross:         "Cross",
    hook:          "Hook",
    noData:        "Train more sessions to see evolution",
    newExp:        "Try New Experiment",
    continueStyle: "Continue This Style",
    viewFighter:   "View Fighter →",
    adoptionLabel: "Style Adoption",
    sessionsIn:    (n) => `${n} session${n !== 1 ? "s" : ""} during experiment`,
    verdict: {
      strong:   { label: "Strong Adoption 🔥",   rec: "This archetype fits you. Keep training with this style." },
      moderate: { label: "Moderate Influence ⚡", rec: "Some shift detected. More sessions will reveal the impact." },
      minimal:  { label: "Minimal Shift 💡",      rec: "No major change yet. Try a different fighter or more sessions." },
    },
    dominantShift: (punch, pct, name) => `Your ${punch} increased ${pct}% — ${name} influence detected`,
    noShift:       (name) => `Style experiment with ${name} complete`,
  },
  mn: {
    eyebrow:       "ТУРШИЛТ ДУУССАН",
    subtitle:      (n) => `${n} өдрийн туршилт дууслаа`,
    baseline:      "Өмнө",
    current:       "Одоо",
    jab:           "Жааб",
    cross:         "Кросс",
    hook:          "Хук",
    noData:        "Хөгжлийг харахын тулд илүү тренинг хий",
    newExp:        "Шинэ туршилт хий",
    continueStyle: "Энэ хэв маягаар үргэлжлүүл",
    viewFighter:   "Тулаанчийг харах →",
    adoptionLabel: "Хэв маягийн нөлөө",
    sessionsIn:    (n) => `Туршилтын ${n} тренинг`,
    verdict: {
      strong:   { label: "Хүчтэй нөлөө 🔥",    rec: "Энэ archetype тантай нийцэж байна. Үргэлжлүүл." },
      moderate: { label: "Дунд зэргийн нөлөө ⚡", rec: "Зарим өөрчлөлт илэрлээ. Илүү тренинг хийгээрэй." },
      minimal:  { label: "Бага зэрэг нөлөө 💡",  rec: "Том өөрчлөлт байхгүй. Өөр тулаанч туршиж үз." },
    },
    dominantShift: (punch, pct, name) => `Таны ${punch} ${pct}%-иар нэмэгдсэн — ${name}-ийн нөлөө илрэв`,
    noShift:       (name) => `${name}-тай хэв маягийн туршилт дууслаа`,
  },
  ko: {
    eyebrow:       "실험 완료",
    subtitle:      (n) => `${n}일 실험 완료`,
    baseline:      "이전",
    current:       "이후",
    jab:           "잽",
    cross:         "크로스",
    hook:          "훅",
    noData:        "진화를 보려면 더 많이 훈련하세요",
    newExp:        "새 실험 시작",
    continueStyle: "이 스타일 계속하기",
    viewFighter:   "파이터 보기 →",
    adoptionLabel: "스타일 흡수도",
    sessionsIn:    (n) => `실험 중 ${n}개 세션`,
    verdict: {
      strong:   { label: "강한 흡수 🔥",     rec: "이 아키타입이 잘 맞습니다. 계속 훈련하세요." },
      moderate: { label: "중간 영향 ⚡",      rec: "일부 변화가 감지됐습니다. 더 많이 훈련해 보세요." },
      minimal:  { label: "미미한 변화 💡",    rec: "아직 큰 변화 없음. 다른 파이터나 더 많은 세션을 시도해 보세요." },
    },
    dominantShift: (punch, pct, name) => `${punch}이 ${pct}% 증가 — ${name} 스타일 영향 감지`,
    noShift:       (name) => `${name} 스타일 실험 완료`,
  },
};

export default function EvolutionRevealPanel({ experiment, sessions, locale, router, onClearExperiment }) {
  const L = EVO_L[locale] || EVO_L.en;
  const acc = experiment.fighterAccent || "#F5C451";
  const startSec = experiment.startDate?.seconds || 0;
  const daysElapsed = Math.floor((Date.now() / 1000 - startSec) / 86400);

  const expSessions = sessions.filter((s) => (s.createdAt?.seconds || 0) > startSec);
  const currentPattern = computeAggregatePunchPattern(expSessions);
  const baseline = experiment.baselinePunchPct;

  const punches = [
    { key: "jab",   label: L.jab,   color: "#3B82F6", basePct: baseline?.jabPct,   nowPct: currentPattern?.jabPct   },
    { key: "cross", label: L.cross, color: "#EF4444", basePct: baseline?.crossPct, nowPct: currentPattern?.crossPct },
    { key: "hook",  label: L.hook,  color: "#8B5CF6", basePct: baseline?.hookPct,  nowPct: currentPattern?.hookPct  },
  ];

  const shifts = punches.map((p) => ({
    ...p,
    delta: (p.nowPct != null && p.basePct != null) ? p.nowPct - p.basePct : null,
  }));
  const topShift = shifts.filter((s) => s.delta != null).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0];
  const insight = topShift?.delta != null && Math.abs(topShift.delta) >= 5
    ? L.dominantShift(topShift.label.toLowerCase(), topShift.delta > 0 ? `+${topShift.delta}` : topShift.delta, experiment.fighterName)
    : L.noShift(experiment.fighterName);

  // Adoption score: avg absolute shift (0–10 per punch * 3 punches) + session bonus
  const validShifts = shifts.filter((s) => s.delta != null);
  const avgAbsShift = validShifts.length > 0
    ? validShifts.reduce((a, s) => a + Math.abs(s.delta), 0) / validShifts.length
    : 0;
  const sessionBonus = Math.min(20, expSessions.length * 4);
  const adoptionScore = Math.min(100, Math.round(avgAbsShift * 3.5 + sessionBonus));
  const verdictKey = adoptionScore >= 65 ? "strong" : adoptionScore >= 35 ? "moderate" : "minimal";
  const verdict = L.verdict[verdictKey];
  const adoptionColor = adoptionScore >= 65 ? "#34D399" : adoptionScore >= 35 ? GOLD : "#94A3B8";

  return (
    <div style={{
      borderRadius: 16, overflow: "hidden",
      border: `1px solid ${acc}40`,
      background: `linear-gradient(135deg, ${acc}0c 0%, rgba(0,0,0,0) 60%)`,
      marginBottom: 8,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${acc}20` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚗️</span>
            <div>
              <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 2 }}>
                {L.eyebrow}
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#fff" }}>{experiment.fighterName}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
                {L.subtitle(daysElapsed)} · {L.sessionsIn(expSessions.length)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/fighters/${experiment.fighterId}`)}
            style={{ background: `${acc}18`, border: `1px solid ${acc}35`, borderRadius: 8, padding: "5px 10px", color: acc, fontSize: 9.5, fontWeight: 900, cursor: "pointer" }}
          >
            {L.viewFighter}
          </button>
        </div>

        {/* Adoption score bar */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
              {L.adoptionLabel}
            </span>
            <span style={{ fontSize: 16, fontWeight: 900, color: adoptionColor, fontFamily: "monospace" }}>
              {adoptionScore}%
            </span>
          </div>
          <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${adoptionScore}%`, borderRadius: 4,
              background: `linear-gradient(90deg, ${adoptionColor}88, ${adoptionColor})`,
              boxShadow: `0 0 8px ${adoptionColor}55`,
              transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
            }} />
          </div>
          <div style={{ marginTop: 7, fontSize: 11, fontWeight: 800, color: adoptionColor }}>{verdict.label}</div>
          <div style={{ marginTop: 2, fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.38)", lineHeight: 1.4 }}>{verdict.rec}</div>
        </div>
      </div>

      {/* Punch comparison bars */}
      <div style={{ padding: "12px 16px" }}>
        {!currentPattern && (
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{L.noData}</p>
        )}

        {currentPattern && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 36, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>{L.baseline}</span>
                <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>{L.current}</span>
              </div>
              <span style={{ width: 38, flexShrink: 0 }} />
            </div>

            {punches.map(({ key, label, color, basePct, nowPct }) => {
              const delta = (nowPct != null && basePct != null) ? nowPct - basePct : null;
              const deltaStr = delta == null ? "" : delta > 0 ? `+${delta}%` : `${delta}%`;
              const deltaColor = delta == null ? "transparent" : delta > 0 ? "#34D399" : delta < 0 ? "#F87171" : "rgba(255,255,255,0.3)";
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 36, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 0.8, flexShrink: 0 }}>
                    {label}
                  </span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    {basePct != null && (
                      <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${basePct}%`, height: "100%", background: "rgba(255,255,255,0.22)", borderRadius: 2 }} />
                      </div>
                    )}
                    {nowPct != null && (
                      <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${nowPct}%`, height: "100%", background: color, borderRadius: 2, boxShadow: `0 0 6px ${color}55` }} />
                      </div>
                    )}
                    {basePct == null && nowPct == null && (
                      <div style={{ height: 4, background: "rgba(255,255,255,0.04)", borderRadius: 2 }} />
                    )}
                  </div>
                  <div style={{ width: 38, textAlign: "right", fontSize: 10, fontWeight: 900, color: deltaColor, fontFamily: "monospace", flexShrink: 0 }}>
                    {deltaStr || (nowPct != null ? `${nowPct}%` : "—")}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Insight line */}
        <div style={{ marginTop: 12, padding: "9px 12px", borderRadius: 10, background: `${acc}10`, border: `1px solid ${acc}20` }}>
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 800, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>
            {insight}
          </p>
        </div>

        {/* Action buttons */}
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/fighters/${experiment.fighterId}`)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 10,
              background: `${acc}18`, border: `1px solid ${acc}40`,
              color: acc, fontSize: 11, fontWeight: 900, cursor: "pointer",
            }}
          >
            {L.continueStyle}
          </button>
          <button
            type="button"
            onClick={onClearExperiment}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 900, cursor: "pointer",
            }}
          >
            {L.newExp}
          </button>
        </div>
      </div>
    </div>
  );
}
