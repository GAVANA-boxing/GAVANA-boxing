"use client";

function getLocale() {
  if (typeof document === "undefined") return "en";
  const lang = document.documentElement.lang || "";
  if (lang.startsWith("mn")) return "mn";
  if (lang.startsWith("ko")) return "ko";
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  if (path.startsWith("/mn")) return "mn";
  if (path.startsWith("/ko")) return "ko";
  return "en";
}

const sub = {
  mn: "Ачааллахад алдаа гарлаа. Интернэт холболтоо шалгаад дахин оролдоно уу.",
  ko: "로딩 중 오류가 발생했습니다. 인터넷 연결을 확인하세요.",
  en: "Something went wrong loading this page. Check your connection and try again.",
};

export default function DashboardError({ reset }) {
  const locale = getLocale();
  return (
    <main style={s.page}>
      {/* Ambient red orb */}
      <div style={s.orb} />

      {/* Scan line */}
      <div className="scanline" />

      {/* HUD corners */}
      <div style={s.cornerTL} />
      <div style={s.cornerBR} />

      <div style={s.content}>
        <p style={s.kicker}>GAVANA // DASHBOARD</p>

        <div style={s.iconWrap}>
          <span style={s.icon}>📊</span>
        </div>

        <h2 style={s.title}>DASHBOARD OFFLINE</h2>
        <p style={s.sub}>{sub[locale]}</p>

        <button onClick={() => reset()} style={s.retryBtn}>
          ↺ &nbsp;RETRY
        </button>

        <button
          onClick={() => { window.location.href = "/"; }}
          style={s.ghostBtn}
        >
          ← Go Home
        </button>

        <p style={s.status}>ERROR — TAP RETRY TO RESTORE</p>
      </div>
    </main>
  );
}

const RED = "#C8102E";

const s = {
  page: {
    position: "relative",
    minHeight: "100dvh",
    background: `
      radial-gradient(ellipse 60% 40% at 50% 30%, rgba(200,16,46,0.18) 0%, transparent 60%),
      linear-gradient(180deg, #060608 0%, #090709 100%)
    `,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    width: 400,
    height: 400,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -60%)",
    background: "rgba(200,16,46,0.12)",
    borderRadius: "50%",
    filter: "blur(80px)",
    pointerEvents: "none",
  },
  cornerTL: {
    position: "fixed",
    top: 16,
    left: 16,
    width: 20,
    height: 20,
    borderTop: `2px solid rgba(200,16,46,0.5)`,
    borderLeft: `2px solid rgba(200,16,46,0.5)`,
    borderRadius: "3px 0 0 0",
    pointerEvents: "none",
  },
  cornerBR: {
    position: "fixed",
    bottom: 16,
    right: 16,
    width: 20,
    height: 20,
    borderBottom: `2px solid rgba(200,16,46,0.5)`,
    borderRight: `2px solid rgba(200,16,46,0.5)`,
    borderRadius: "0 0 3px 0",
    pointerEvents: "none",
  },
  content: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    padding: "0 32px",
    gap: 0,
    color: "#fff",
  },
  kicker: {
    margin: "0 0 24px",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 4,
    color: `rgba(200,16,46,0.7)`,
    textTransform: "uppercase",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "rgba(200,16,46,0.1)",
    border: "1px solid rgba(200,16,46,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  icon: { fontSize: 32 },
  title: {
    margin: "0 0 12px",
    fontSize: 28,
    fontWeight: 1000,
    letterSpacing: 2,
    color: "#fff",
    textShadow: `0 0 30px rgba(200,16,46,0.4)`,
  },
  sub: {
    margin: "0 0 32px",
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.55,
    maxWidth: 260,
  },
  retryBtn: {
    padding: "14px 36px",
    borderRadius: 14,
    border: "none",
    background: `linear-gradient(135deg, ${RED}, #a00f25)`,
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 1.5,
    cursor: "pointer",
    boxShadow: `0 0 24px rgba(200,16,46,0.5), 0 8px 24px rgba(200,16,46,0.3)`,
    marginBottom: 12,
  },
  ghostBtn: {
    padding: "14px 36px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    cursor: "pointer",
    marginBottom: 24,
  },
  status: {
    margin: 0,
    fontSize: 9,
    color: "rgba(255,255,255,0.2)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
};
