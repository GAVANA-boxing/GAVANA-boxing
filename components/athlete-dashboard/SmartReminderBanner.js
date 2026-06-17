"use client";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

export default function SmartReminderBanner({ locale, lastSession, router }) {
  if (!lastSession) return null;

  const lastTs = getTs(lastSession?.createdAt);
  const daysSince = lastTs ? (Date.now() - lastTs) / (24 * 3600 * 1000) : 99;
  if (daysSince < 2) return null;

  const mn = locale === "mn";
  const days = Math.floor(daysSince);

  return (
    <div style={{
      marginBottom: 20,
      padding: "12px 14px",
      borderRadius: "3px 14px 14px 3px",
      background: "rgba(251,146,60,0.07)",
      border: "1px solid rgba(251,146,60,0.2)",
      borderLeft: "3px solid #FB923C",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 20 }}>🔥</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#FB923C", marginBottom: 2 }}>
          {mn ? `${days} өдөр болж байна` : locale === "ko" ? `${days}일 지났습니다` : `${days} days since your last session`}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
          {mn ? "Streak алдахгүйн тулд өнөөдөр дасгал хийгээрэй" : "Train today to keep your momentum going"}
        </div>
      </div>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/train`)}
        style={{ padding: "8px 14px", borderRadius: 10, background: "#FB923C", border: "none", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", whiteSpace: "nowrap" }}
      >
        {mn ? "Дасгал" : "Train"}
      </button>
    </div>
  );
}
