"use client";

const TARGET = 3;

function getBody(remaining, locale) {
  if (locale === "mn") return `${remaining} дасгал дараа таны тулаанчийн архетип илчлэгдэнэ`;
  if (locale === "ko") return `${remaining}세션 후 파이터 아키타입이 공개됩니다`;
  return `${remaining} more session${remaining !== 1 ? "s" : ""} until your Fighter Archetype reveals`;
}

export default function DNASignalForming({ locale, totalSessionCount, router }) {
  const remaining = TARGET - totalSessionCount;

  return (
    <div
      onClick={() => router.push(`/${locale}/fighter-profile`)}
      style={{ borderRadius: 12, padding: "12px 14px", background: "rgba(245,196,81,0.06)", border: "1px solid rgba(245,196,81,0.22)", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
    >
      <div style={{ position: "relative", width: 40, height: 40, flexShrink: 0 }}>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="20" cy="20" r="16" fill="none" stroke="#F5C451" strokeWidth="3"
            strokeDasharray="100.5"
            strokeDashoffset={100.5 * (1 - totalSessionCount / TARGET)}
            strokeLinecap="round"
            transform="rotate(-90 20 20)"
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#F5C451" }}>
          {totalSessionCount}/{TARGET}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(245,196,81,0.75)", marginBottom: 2 }}>
          🧬 {locale === "mn" ? "ДНХ ДОХИО БҮРДЭЖ БАЙНА" : locale === "ko" ? "DNA 신호 형성 중" : "DNA SIGNAL FORMING"}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
          {getBody(remaining, locale)}
        </div>
      </div>
    </div>
  );
}
