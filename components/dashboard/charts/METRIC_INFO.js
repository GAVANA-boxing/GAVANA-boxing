"use client";

export const METRIC_INFO = {
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
