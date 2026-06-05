import Link from "next/link";

const T = {
  en: {
    heading: "404",
    message: "Page not found",
    back: "Back to home",
  },
  mn: {
    heading: "404",
    message: "Хуудас олдсонгүй",
    back: "Нүүр хуудас руу буцах",
  },
  ko: {
    heading: "404",
    message: "페이지를 찾을 수 없습니다",
    back: "홈으로 돌아가기",
  },
};

// Default to mn (primary language) since locale is not available in root not-found
const t = T.mn;

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 32px",
        textAlign: "center",
        color: "#fff",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Corner accents */}
      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          width: 20,
          height: 20,
          borderTop: "2px solid rgba(200,16,46,0.45)",
          borderLeft: "2px solid rgba(200,16,46,0.45)",
          borderRadius: "3px 0 0 0",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: 16,
          right: 16,
          width: 20,
          height: 20,
          borderBottom: "2px solid rgba(200,16,46,0.45)",
          borderRight: "2px solid rgba(200,16,46,0.45)",
          borderRadius: "0 0 3px 0",
          pointerEvents: "none",
        }}
      />

      {/* Glow orb */}
      <div
        style={{
          position: "fixed",
          width: 400,
          height: 400,
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(200,16,46,0.08)",
          borderRadius: "50%",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      {/* Kicker */}
      <p
        style={{
          margin: "0 0 20px",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 4,
          color: "rgba(200,16,46,0.65)",
          textTransform: "uppercase",
        }}
      >
        GAVANA BOXING
      </p>

      {/* 404 heading */}
      <h1
        style={{
          margin: "0 0 12px",
          fontSize: 96,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: -4,
          color: "#fff",
          textShadow: "0 0 60px rgba(200,16,46,0.4)",
        }}
      >
        {t.heading}
      </h1>

      {/* Message */}
      <p
        style={{
          margin: "0 0 40px",
          fontSize: 16,
          fontWeight: 600,
          color: "rgba(255,255,255,0.45)",
          lineHeight: 1.5,
        }}
      >
        {t.message}
      </p>

      {/* Back link */}
      <Link
        href="/mn/feed"
        style={{
          padding: "14px 36px",
          borderRadius: 14,
          background: "linear-gradient(135deg, #C8102E, #a00f25)",
          color: "#fff",
          fontSize: 13,
          fontWeight: 900,
          letterSpacing: 1.5,
          textDecoration: "none",
          textTransform: "uppercase",
          boxShadow:
            "0 0 24px rgba(200,16,46,0.45), 0 8px 24px rgba(200,16,46,0.25)",
        }}
      >
        {t.back}
      </Link>

      {/* Status line */}
      <p
        style={{
          position: "fixed",
          bottom: 24,
          margin: 0,
          fontSize: 9,
          color: "rgba(255,255,255,0.15)",
          letterSpacing: 2.5,
          textTransform: "uppercase",
        }}
      >
        GAVANA COMBAT SYSTEM
      </p>
    </main>
  );
}
