"use client";

import { GOLD, RED } from "@/lib/tokens";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function analyzeLoad(trainingSessions) {
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 3600 * 1000;
  const twoWeeksAgo = weekAgo - 7 * 24 * 3600 * 1000;

  const sorted = [...trainingSessions].sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
  const thisWeek = sorted.filter((s) => getTs(s.createdAt) >= weekAgo);
  const lastWeek = sorted.filter((s) => {
    const t = getTs(s.createdAt);
    return t >= twoWeeksAgo && t < weekAgo;
  });

  const lastTs = getTs(sorted[0]?.createdAt);
  const hoursSinceLast = lastTs ? (now - lastTs) / 3600000 : 999;
  const daysSinceLast = hoursSinceLast / 24;

  const weekCount = thisWeek.length;
  const weekScores = thisWeek.map((s) => Number(s.score)).filter(Number.isFinite);
  const weekAvg = weekScores.length ? weekScores.reduce((a, b) => a + b, 0) / weekScores.length : null;

  const lastWeekCount = lastWeek.length;

  // Consecutive days trained (check last 2 days)
  const dayBuckets = new Set(
    sorted
      .filter((s) => getTs(s.createdAt) >= now - 3 * 24 * 3600 * 1000)
      .map((s) => {
        const d = new Date(getTs(s.createdAt));
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      })
  );
  const consecutiveDays = dayBuckets.size;

  // Determine status
  if (weekCount === 0) {
    return {
      status: "inactive",
      level: "warn",
      color: "#F87171",
      icon: "😴",
      en: "No sessions this week — time to get back in the gym.",
      mn: "Энэ долоо хоногт дасгал хийгээгүй байна — буцаж ирэх цаг боллоо.",
    };
  }

  if (weekCount >= 6 && consecutiveDays >= 3) {
    return {
      status: "overtraining",
      level: "warn",
      color: "#FB923C",
      icon: "⚠️",
      en: `${weekCount} sessions this week — consider a rest day to recover.`,
      mn: `Энэ долоо хоногт ${weekCount} дасгал хийсэн — нэг амрах өдөр авч үзнэ үү.`,
    };
  }

  if (weekCount >= 4) {
    const trend = lastWeekCount > 0 ? weekCount - lastWeekCount : 0;
    return {
      status: "optimal",
      level: "good",
      color: "#34D399",
      icon: "✅",
      en: `${weekCount} sessions this week${trend > 0 ? ` — up ${trend} from last week` : ""}. Solid load.`,
      mn: `Энэ долоо хоногт ${weekCount} дасгал${trend > 0 ? `, өнгөрсөн долоо хоногоос ${trend}-р нэмэгдсэн` : ""}. Гайхалтай!`,
    };
  }

  if (weekCount >= 2 && daysSinceLast <= 2) {
    return {
      status: "building",
      level: "info",
      color: "#60A5FA",
      icon: "📈",
      en: `${weekCount} sessions this week. Add 1–2 more to hit optimal training load.`,
      mn: `Энэ долоо хоногт ${weekCount} дасгал. 1–2 нэмвэл хамгийн тохиромжтой ачаалалд хүрнэ.`,
    };
  }

  if (daysSinceLast > 3) {
    const days = Math.floor(daysSinceLast);
    return {
      status: "gap",
      level: "warn",
      color: "#FB923C",
      icon: "🔔",
      en: `${days} days since your last session. Don't lose your momentum.`,
      mn: `Сүүлийн дасгалаас ${days} өдөр боллоо. Хурдаа хадгалаарай.`,
    };
  }

  return {
    status: "on-track",
    level: "good",
    color: GOLD,
    icon: "🔥",
    en: `${weekCount} session${weekCount !== 1 ? "s" : ""} this week. Keep it up!`,
    mn: `Энэ долоо хоногт ${weekCount} дасгал. Үргэлжлүүл!`,
  };
}

export default function TrainingLoadStatus({ trainingSessions, locale, router }) {
  if (!trainingSessions?.length) return null;

  const result = analyzeLoad(trainingSessions);
  const mn = locale === "mn";
  const text = mn ? result.mn : result.en;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 13px",
      marginBottom: 16,
      borderRadius: "3px 12px 12px 3px",
      background: `${result.color}08`,
      border: `1px solid ${result.color}22`,
      borderLeft: `3px solid ${result.color}`,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{result.icon}</span>
      <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
        {text}
      </span>
      {(result.status === "inactive" || result.status === "gap") && (
        <button
          type="button"
          onClick={() => router.push(`/${locale}/train`)}
          style={{
            flexShrink: 0, padding: "6px 12px", borderRadius: 9,
            background: `${result.color}18`, border: `1px solid ${result.color}35`,
            color: result.color, fontSize: 10, fontWeight: 900, cursor: "pointer",
          }}
        >
          {mn ? "Дасгал" : "Train"}
        </button>
      )}
      {result.status === "building" && (
        <button
          type="button"
          onClick={() => router.push(`/${locale}/train`)}
          style={{
            flexShrink: 0, padding: "6px 12px", borderRadius: 9,
            background: `${result.color}18`, border: `1px solid ${result.color}35`,
            color: result.color, fontSize: 10, fontWeight: 900, cursor: "pointer",
          }}
        >
          {mn ? "+Дасгал" : "+Session"}
        </button>
      )}
    </div>
  );
}
