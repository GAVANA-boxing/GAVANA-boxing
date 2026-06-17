"use client";

import { useState } from "react";
import { GOLD, RED, redAlpha } from "@/lib/tokens";
import { RADAR_KEYS, RADAR_ANGLES, radPolar } from "@/lib/dashboardHelpers";

const METRIC_INFO = {
  Speed: {
    icon: "⚡",
    en: {
      formula: "avg(hits per session) ÷ 2  ·  needs ≥2 hit-tracked sessions",
      fallback: "Falls back to: avgScore × 0.95 + 0.3",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.hits != null && Number(x.hits) > 0).slice(0, 3);
        if (!s.length) return "No hit-tracked sessions yet. Enable punch counting in Train.";
        const avg = s.reduce((a, x) => a + Number(x.hits), 0) / s.length;
        return `Last ${s.length} session avg: ${avg.toFixed(0)} hits/session. Score = ${(avg / 2).toFixed(1)}/10.`;
      },
      tips: ["Focus on combo volume — 3+ punch chains", "Speed rounds: 20 sec all-out bursts", "Shadowbox to a fast metronome"],
    },
    mn: {
      formula: "дундж(hits/session) ÷ 2  ·  ≥2 session шаардлагатай",
      fallback: "Нөөц: avgScore × 0.95 + 0.3",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.hits != null && Number(x.hits) > 0).slice(0, 3);
        if (!s.length) return "Hits хэмжих session байхгүй. Train дээр punch count-ыг идэвхжүүл.";
        const avg = s.reduce((a, x) => a + Number(x.hits), 0) / s.length;
        return `Сүүлийн ${s.length} session дундж: ${avg.toFixed(0)} hits. Оноо = ${(avg / 2).toFixed(1)}/10.`;
      },
      tips: ["Combo-ийн тоог нэмэх — 3+ цохилт", "Хурдны раунд: 20 секундын бүрэн хүч", "Хурдан метроном дагуу сүүдэр дэглэм хий"],
    },
    ko: {
      formula: "평균(hits/세션) ÷ 2  ·  ≥2세션 필요",
      fallback: "대체: avgScore × 0.95 + 0.3",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.hits != null && Number(x.hits) > 0).slice(0, 3);
        if (!s.length) return "히트 추적 세션 없음. 훈련에서 펀치 카운팅을 활성화하세요.";
        const avg = s.reduce((a, x) => a + Number(x.hits), 0) / s.length;
        return `최근 ${s.length}세션 평균: ${avg.toFixed(0)}회. 점수 = ${(avg / 2).toFixed(1)}/10.`;
      },
      tips: ["콤보 볼륨 늘리기 — 3펀치 이상 연타", "스피드 라운드: 20초 전력 질주", "빠른 메트로놈으로 섀도우복싱"],
    },
  },
  Power: {
    icon: "💥",
    en: {
      formula: "avg(hits per session) ÷ 1.8  ·  needs ≥2 hit-tracked sessions",
      fallback: "Falls back to: maxScore × 0.92 + 0.4",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.hits != null && Number(x.hits) > 0).slice(0, 3);
        if (!s.length) return "No hit-tracked sessions yet. Enable punch counting in Train.";
        const avg = s.reduce((a, x) => a + Number(x.hits), 0) / s.length;
        return `Last ${s.length} session avg: ${avg.toFixed(0)} hits/session. Power = ${(avg / 1.8).toFixed(1)}/10.`;
      },
      tips: ["Heavy bag: 8-round power sets", "Strength circuit: push/pull + core", "Slow deliberate punches — full extension"],
    },
    mn: {
      formula: "дундж(hits/session) ÷ 1.8  ·  ≥2 session шаардлагатай",
      fallback: "Нөөц: maxScore × 0.92 + 0.4",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.hits != null && Number(x.hits) > 0).slice(0, 3);
        if (!s.length) return "Hits хэмжих session байхгүй. Train дээр punch count-ыг идэвхжүүл.";
        const avg = s.reduce((a, x) => a + Number(x.hits), 0) / s.length;
        return `Сүүлийн ${s.length} session дундж: ${avg.toFixed(0)} hits. Хүч = ${(avg / 1.8).toFixed(1)}/10.`;
      },
      tips: ["Хүнд уут: 8 раунд хүчний дасгал", "Хүч дасгал: push/pull + дундаас", "Удаан, зориудын цохилт — бүрэн сунгалт"],
    },
    ko: {
      formula: "평균(hits/세션) ÷ 1.8  ·  ≥2세션 필요",
      fallback: "대체: maxScore × 0.92 + 0.4",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.hits != null && Number(x.hits) > 0).slice(0, 3);
        if (!s.length) return "히트 추적 세션 없음. 훈련에서 펀치 카운팅을 활성화하세요.";
        const avg = s.reduce((a, x) => a + Number(x.hits), 0) / s.length;
        return `최근 ${s.length}세션 평균: ${avg.toFixed(0)}회. 파워 = ${(avg / 1.8).toFixed(1)}/10.`;
      },
      tips: ["헤비백: 8라운드 파워 세트", "근력 서킷: 푸시/풀 + 코어", "천천히 정확한 펀치 — 완전히 뻗기"],
    },
  },
  Timing: {
    icon: "🎯",
    en: {
      formula: "avgScore + trend  ·  trend = recent3 − older3 (capped ±2)",
      fallback: "Always uses session score history",
      impact: (sessions) => {
        const scores = sessions.map((s) => Number(s.score)).filter(Number.isFinite);
        if (scores.length < 2) return "Need at least 2 sessions to calculate trend.";
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const recent = scores.slice(0, Math.min(3, scores.length));
        const older = scores.slice(-Math.min(3, scores.length));
        const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const oAvg = older.reduce((a, b) => a + b, 0) / older.length;
        const trend = Math.max(-2, Math.min(2, rAvg - oAvg));
        return `Avg score: ${avg.toFixed(2)}  ·  Trend: ${trend >= 0 ? "+" : ""}${trend.toFixed(2)}  →  Timing: ${Math.min(10, avg + trend).toFixed(1)}/10`;
      },
      tips: ["Counter training: wait, then react", "Rhythm pads — vary cadence", "Film review: spot gaps in opponent patterns"],
    },
    mn: {
      formula: "avgScore + trend  ·  trend = сүүлийн3 − хуучны3 (±2 хязгаар)",
      fallback: "Session оноогоор тооцно",
      impact: (sessions) => {
        const scores = sessions.map((s) => Number(s.score)).filter(Number.isFinite);
        if (scores.length < 2) return "Тооцоолоход хамгийн бага 2 session хэрэгтэй.";
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const recent = scores.slice(0, Math.min(3, scores.length));
        const older = scores.slice(-Math.min(3, scores.length));
        const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const oAvg = older.reduce((a, b) => a + b, 0) / older.length;
        const trend = Math.max(-2, Math.min(2, rAvg - oAvg));
        return `Дундж оноо: ${avg.toFixed(2)}  ·  Тренд: ${trend >= 0 ? "+" : ""}${trend.toFixed(2)}  →  Timing: ${Math.min(10, avg + trend).toFixed(1)}/10`;
      },
      tips: ["Counter дасгал: хүлээж, хариулах", "Rhythm pads — хэм өөрчлөх", "Бичлэг дүн шинжилгээ: өрсөлдөгчийн цоорхой"],
    },
    ko: {
      formula: "avgScore + trend  ·  trend = 최근3 − 이전3 (±2 상한)",
      fallback: "세션 점수 기록으로 계산",
      impact: (sessions) => {
        const scores = sessions.map((s) => Number(s.score)).filter(Number.isFinite);
        if (scores.length < 2) return "계산을 위해 최소 2세션이 필요합니다.";
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const recent = scores.slice(0, Math.min(3, scores.length));
        const older = scores.slice(-Math.min(3, scores.length));
        const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const oAvg = older.reduce((a, b) => a + b, 0) / older.length;
        const trend = Math.max(-2, Math.min(2, rAvg - oAvg));
        return `평균 점수: ${avg.toFixed(2)}  ·  추세: ${trend >= 0 ? "+" : ""}${trend.toFixed(2)}  →  타이밍: ${Math.min(10, avg + trend).toFixed(1)}/10`;
      },
      tips: ["카운터 훈련: 기다리고 반응하기", "리듬 패드 — 박자 변환", "영상 분석: 상대 패턴의 빈틈 포착"],
    },
  },
  Guard: {
    icon: "🛡",
    en: {
      formula: "avg(accuracy %) ÷ 10  ·  needs ≥2 accuracy-tracked sessions",
      fallback: "Falls back to: avgScore × 0.82",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.accuracy != null).slice(0, 3);
        if (!s.length) return "No accuracy-tracked sessions yet. Train with camera to record accuracy.";
        const avg = s.reduce((a, x) => a + Number(x.accuracy), 0) / s.length;
        return `Last ${s.length} session avg accuracy: ${avg.toFixed(1)}%  →  Guard: ${(avg / 10).toFixed(1)}/10`;
      },
      tips: ["Keep hands up between combos", "Slip & roll drills after every session", "Defensive sparring: block-only rounds"],
    },
    mn: {
      formula: "дундж(accuracy %) ÷ 10  ·  ≥2 session шаардлагатай",
      fallback: "Нөөц: avgScore × 0.82",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.accuracy != null).slice(0, 3);
        if (!s.length) return "Accuracy хэмжих session байхгүй. Камертай Train хий.";
        const avg = s.reduce((a, x) => a + Number(x.accuracy), 0) / s.length;
        return `Сүүлийн ${s.length} session дундж accuracy: ${avg.toFixed(1)}%  →  Guard: ${(avg / 10).toFixed(1)}/10`;
      },
      tips: ["Combo дараа гараа дээшлүүл", "Slip & roll дасгал хийх", "Зөвхөн хамгаалах раунд хий"],
    },
    ko: {
      formula: "평균(accuracy %) ÷ 10  ·  ≥2세션 필요",
      fallback: "대체: avgScore × 0.82",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.accuracy != null).slice(0, 3);
        if (!s.length) return "정확도 추적 세션 없음. 카메라로 훈련하세요.";
        const avg = s.reduce((a, x) => a + Number(x.accuracy), 0) / s.length;
        return `최근 ${s.length}세션 평균 정확도: ${avg.toFixed(1)}%  →  가드: ${(avg / 10).toFixed(1)}/10`;
      },
      tips: ["콤보 후 항상 손 올리기", "슬립 & 롤 드릴 매 세션", "방어 스파링: 블로킹 전용 라운드"],
    },
  },
  Footwork: {
    icon: "👟",
    en: {
      formula: "2 + min(streakDays, 10) × 0.5 + avgScore × 0.3",
      fallback: "Always calculated — streak is the main driver",
      impact: (sessions) => {
        const scores = sessions.map((s) => Number(s.score)).filter(Number.isFinite);
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return `Score component: +${(avg * 0.3).toFixed(2)}. Streak is the main driver — train daily to push this higher.`;
      },
      tips: ["Daily training — streak multiplies footwork", "Ladder drills or jump rope 5 min pre-session", "Circle shadowbox: constant lateral movement"],
    },
    mn: {
      formula: "2 + min(streakDays, 10) × 0.5 + avgScore × 0.3",
      fallback: "Streak-ийн тоо гол үүрэгтэй",
      impact: (sessions) => {
        const scores = sessions.map((s) => Number(s.score)).filter(Number.isFinite);
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return `Оноогийн хувь: +${(avg * 0.3).toFixed(2)}. Streak-ийн тоо гол хүчин зүйл — өдөр бүр дасгал хий.`;
      },
      tips: ["Өдөр бүр дасгал хий — streak footwork-ыг нэмнэ", "Ladder drill эсвэл дөрвөлжин 5 мин", "Тойрог сүүдэр дэглэм: байнга хажуу хөдөлгөөн"],
    },
    ko: {
      formula: "2 + min(연속일수, 10) × 0.5 + 평균점수 × 0.3",
      fallback: "연속 훈련이 주요 요소",
      impact: (sessions) => {
        const scores = sessions.map((s) => Number(s.score)).filter(Number.isFinite);
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        return `점수 기여: +${(avg * 0.3).toFixed(2)}. 연속 훈련이 핵심 — 매일 훈련하여 높이세요.`;
      },
      tips: ["매일 훈련 — 연속일이 풋워크 증가", "래더 드릴 또는 줄넘기 5분", "원형 섀도우복싱: 지속적인 측면 이동"],
    },
  },
  Accuracy: {
    icon: "🎯",
    en: {
      formula: "avg(accuracy %) ÷ 10  ·  needs ≥2 accuracy-tracked sessions",
      fallback: "Falls back to: avgScore × 0.88",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.accuracy != null).slice(0, 3);
        if (!s.length) return "No accuracy-tracked sessions yet. Train with camera to record accuracy.";
        const avg = s.reduce((a, x) => a + Number(x.accuracy), 0) / s.length;
        return `Last ${s.length} session avg: ${avg.toFixed(1)}%  →  Accuracy: ${(avg / 10).toFixed(1)}/10`;
      },
      tips: ["Precision mitt work — aim for center", "Slow single punches before full combos", "Target-specific drills in the Train module"],
    },
    mn: {
      formula: "дундж(accuracy %) ÷ 10  ·  ≥2 session шаардлагатай",
      fallback: "Нөөц: avgScore × 0.88",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.accuracy != null).slice(0, 3);
        if (!s.length) return "Accuracy хэмжих session байхгүй. Камертай Train хий.";
        const avg = s.reduce((a, x) => a + Number(x.accuracy), 0) / s.length;
        return `Сүүлийн ${s.length} session дундж: ${avg.toFixed(1)}%  →  Accuracy: ${(avg / 10).toFixed(1)}/10`;
      },
      tips: ["Нарийвчилсан mitt дасгал — голыг чиглэ", "Бүтэн combo-с өмнө удаан нэг цохилт", "Train модулын target дасгал"],
    },
    ko: {
      formula: "평균(accuracy %) ÷ 10  ·  ≥2세션 필요",
      fallback: "대체: avgScore × 0.88",
      impact: (sessions) => {
        const s = sessions.filter((x) => x.accuracy != null).slice(0, 3);
        if (!s.length) return "정확도 추적 세션 없음. 카메라로 훈련하세요.";
        const avg = s.reduce((a, x) => a + Number(x.accuracy), 0) / s.length;
        return `최근 ${s.length}세션 평균: ${avg.toFixed(1)}%  →  정확도: ${(avg / 10).toFixed(1)}/10`;
      },
      tips: ["정밀 미트 훈련 — 중앙 겨냥", "풀 콤보 전 천천히 단타 연습", "Train 모듈의 타겟 드릴"],
    },
  },
};

function MetricSheet({ metricKey, stats, sessions, locale, onClose }) {
  const info = METRIC_INFO[metricKey];
  if (!info) return null;
  const L = info[locale] || info.en;
  const val = Math.max(0, Math.min(10, stats[metricKey] || 0));
  const valColor = val >= 7 ? GOLD : val >= 5 ? "rgba(255,255,255,0.7)" : RED;
  const impactText = L.impact(sessions || []);
  const labelMap = { en: ["Formula", "Recent Drills Impact", "Improvement Tips"], mn: ["Томьёо", "Сүүлийн дасгалын нөлөө", "Сайжруулах зөвлөмж"], ko: ["공식", "최근 드릴 영향", "향상 팁"] };
  const [fLabel, iLabel, tLabel] = labelMap[locale] || labelMap.en;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 540,
          background: "linear-gradient(160deg, #18181B 0%, #0F0F11 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderBottom: "none",
          borderRadius: "20px 20px 0 0",
          padding: "0 0 calc(32px + env(safe-area-inset-bottom))",
          animation: "sheetUp 280ms cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        <style>{`@keyframes sheetUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
        <div style={{ padding: "12px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>{info.icon}</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: 0.2 }}>{metricKey.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: valColor, lineHeight: 1 }}>{val.toFixed(1)}<span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginLeft: 3 }}>/10</span></div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.5)", fontSize: 16, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Formula */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{fLabel}</div>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontFamily: "monospace", fontSize: 12, color: GOLD, fontWeight: 700, lineHeight: 1.6 }}>{L.formula}</div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{L.fallback}</div>
            </div>
          </div>

          {/* Recent drills impact */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{iLabel}</div>
            <div style={{ background: `${redAlpha(0.08)}`, border: `1px solid ${redAlpha(0.18)}`, borderRadius: 10, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>{impactText}</div>
            </div>
          </div>

          {/* Improvement tips */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 }}>{tLabel}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {L.tips.map((tip, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                  <span style={{ fontSize: 11, color: GOLD, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>›</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 600, lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ stats: object, prevStats?: object, locale?: string, sessions?: any[] }} props
 */
export function RadarChart({ stats, prevStats, locale = "en", sessions = [] }) {
  const [selected, setSelected] = useState(null);
  const SIZE = 230;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const maxR = 76;

  const gridPoly = (scale) =>
    RADAR_ANGLES.map((a) => {
      const p = radPolar(a, maxR * scale, cx, cy);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");

  const dataPoints = RADAR_KEYS.map((key, i) => {
    const val = Math.max(0, Math.min(10, stats[key] || 0));
    return radPolar(RADAR_ANGLES[i], (val / 10) * maxR, cx, cy);
  });
  const dataPoly = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const prevPoints = prevStats ? RADAR_KEYS.map((key, i) => {
    const val = Math.max(0, Math.min(10, prevStats[key] || 0));
    return radPolar(RADAR_ANGLES[i], (val / 10) * maxR, cx, cy);
  }) : null;
  const prevPoly = prevPoints?.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // Extra padding to prevent label clip on left/right edges (e.g. "ACCURACY" at 210°)
  const PAD_X = 22, PAD_Y = 8;
  return (
    <>
      {selected && (
        <MetricSheet
          metricKey={selected}
          stats={stats}
          sessions={sessions}
          locale={locale}
          onClose={() => setSelected(null)}
        />
      )}
      <svg viewBox={`${-PAD_X} ${-PAD_Y} ${SIZE + PAD_X * 2} ${SIZE + PAD_Y * 2}`} width="100%" style={{ display: "block", overflow: "visible" }}>
        <defs>
          <radialGradient id="rdg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={redAlpha(0.52)} />
            <stop offset="100%" stopColor={redAlpha(0.05)} />
          </radialGradient>
          <filter id="rdGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0.25, 0.5, 0.75, 1.0].map((scale) => (
          <polygon key={scale} points={gridPoly(scale)}
            fill="none"
            stroke={scale === 1.0 ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.05)"}
            strokeWidth={scale === 1.0 ? 1 : 0.7}
          />
        ))}

        {RADAR_ANGLES.map((a, i) => {
          const outer = radPolar(a, maxR, cx, cy);
          return (
            <line key={i}
              x1={cx.toFixed(1)} y1={cy.toFixed(1)}
              x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
              stroke="rgba(255,255,255,0.055)" strokeWidth="1" />
          );
        })}

        {/* Ghost polygon: previous period stats */}
        {prevPoly && (
          <polygon points={prevPoly}
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.1"
            strokeDasharray="3,3"
            strokeLinejoin="round"
          />
        )}

        <polygon points={dataPoly}
          fill="url(#rdg)"
          stroke={GOLD}
          strokeWidth="1.8"
          strokeLinejoin="round"
          filter="url(#rdGlow)"
          className="radar-polygon"
        />

        {dataPoints.map((p, i) => (
          <circle key={i}
            cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
            r="3" fill={GOLD} stroke="rgba(0,0,0,0.55)" strokeWidth="0.5" opacity="0.92"
          />
        ))}

        {RADAR_KEYS.map((key, i) => {
          const p = radPolar(RADAR_ANGLES[i], maxR + 17, cx, cy);
          const ta = p.x < cx - 8 ? "end" : p.x > cx + 8 ? "start" : "middle";
          const val = Math.max(0, Math.min(10, stats[key] || 0));
          const valColor = val >= 7 ? GOLD : val >= 5 ? "rgba(255,255,255,0.45)" : RED;
          const prev = prevStats?.[key];
          const delta = prev != null ? val - prev : null;
          const hasDelta = delta != null && Math.abs(delta) >= 0.2;
          // hitbox: 44×28 rect centred on the label cluster
          const HW = 44, HH = hasDelta ? 32 : 24;
          const hx = ta === "end" ? p.x - HW : ta === "start" ? p.x : p.x - HW / 2;
          const hy = p.y - 8;
          return (
            <g key={key} style={{ cursor: "pointer" }} onClick={() => setSelected(key)}>
              {/* invisible hitbox */}
              <rect x={hx.toFixed(1)} y={hy.toFixed(1)} width={HW} height={HH} fill="transparent" />
              <text x={p.x.toFixed(1)} y={(p.y - 4).toFixed(1)}
                textAnchor={ta} dominantBaseline="auto"
                fontSize="8" fontWeight="900" fill="rgba(255,255,255,0.6)" letterSpacing="0.7"
                style={{ textDecoration: "underline", textDecorationColor: "rgba(255,255,255,0.2)" }}>
                {key.toUpperCase()}
              </text>
              <text x={p.x.toFixed(1)} y={(p.y + 7).toFixed(1)}
                textAnchor={ta} dominantBaseline="auto"
                fontSize="7" fontWeight="700" fill={valColor}>
                {val.toFixed(1)}
              </text>
              {hasDelta && (
                <text x={p.x.toFixed(1)} y={(p.y + 17).toFixed(1)}
                  textAnchor={ta} dominantBaseline="auto"
                  fontSize="6.5" fontWeight="800" fill={delta > 0 ? "#4ade80" : "#f87171"}>
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </>
  );
}
