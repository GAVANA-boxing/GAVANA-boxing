"use client";

import { useEffect, useState } from "react";

const T = {
  en: {
    title: "NO SIGNAL",
    sub1: "Check your connection and try again.",
    sub2: "Your training data is saved locally.",
    retry: "↺  RETRY CONNECTION",
    status: "GAVANA COMBAT SYSTEM — OFFLINE MODE",
  },
  mn: {
    title: "ДОХИО АЛГА",
    sub1: "Интернет холболтоо шалгаад дахин оролдоно уу.",
    sub2: "Таны дасгалын өгөгдөл нутагт хадгалагдсан.",
    retry: "↺  ДАХИН ХОЛБОГДОХ",
    status: "GAVANA ТУЛААНЫ СИСТЕМ — ОФЛАЙН ГОРИМ",
  },
  ko: {
    title: "신호 없음",
    sub1: "연결을 확인하고 다시 시도하세요.",
    sub2: "훈련 데이터는 로컬에 저장되어 있습니다.",
    retry: "↺  연결 재시도",
    status: "GAVANA 전투 시스템 — 오프라인 모드",
  },
};

export default function OfflinePage() {
  const [locale, setLocale] = useState("mn");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const match = window.location.pathname.match(/^\/(en|mn|ko)(\/|$)/);
      if (match) setLocale(match[1]);
    }
  }, []);
  const t = T[locale] || T.mn;

  return (
    <main style={s.page}>
      <div style={s.orb} />
      <div className="scanline" />
      <div style={s.cornerTL} />
      <div style={s.cornerBR} />

      <div style={s.content}>
        <p style={s.kicker}>GAVANA BOXING</p>

        <div style={s.iconWrap}>
          <span style={s.icon}>📡</span>
        </div>

        <h1 style={s.title}>{t.title}</h1>
        <p style={s.sub}>
          {t.sub1}
          <br />
          {t.sub2}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          style={s.retryBtn}
        >
          {t.retry}
        </button>

        <p style={s.status}>{t.status}</p>
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
      radial-gradient(ellipse 60% 50% at 50% 25%, rgba(200,16,46,0.16) 0%, transparent 60%),
      linear-gradient(180deg, #060608 0%, #09090B 100%)
    `,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  orb: {
    position: "absolute",
    width: 450,
    height: 450,
    top: "-60px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(200,16,46,0.10)",
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
    borderTop: "2px solid rgba(200,16,46,0.45)",
    borderLeft: "2px solid rgba(200,16,46,0.45)",
    borderRadius: "3px 0 0 0",
    pointerEvents: "none",
  },
  cornerBR: {
    position: "fixed",
    bottom: 16,
    right: 16,
    width: 20,
    height: 20,
    borderBottom: "2px solid rgba(200,16,46,0.45)",
    borderRight: "2px solid rgba(200,16,46,0.45)",
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
    color: "#fff",
  },
  kicker: {
    margin: "0 0 24px",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 4,
    color: "rgba(200,16,46,0.65)",
    textTransform: "uppercase",
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: "50%",
    background: "rgba(200,16,46,0.1)",
    border: "1px solid rgba(200,16,46,0.28)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    boxShadow: "0 0 30px rgba(200,16,46,0.12)",
  },
  icon: { fontSize: 34 },
  title: {
    margin: "0 0 14px",
    fontSize: 30,
    fontWeight: 1000,
    letterSpacing: 3,
    textShadow: "0 0 30px rgba(200,16,46,0.35)",
  },
  sub: {
    margin: "0 0 32px",
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 1.65,
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
    boxShadow: "0 0 24px rgba(200,16,46,0.45), 0 8px 24px rgba(200,16,46,0.25)",
    marginBottom: 28,
  },
  status: {
    margin: 0,
    fontSize: 9,
    color: "rgba(255,255,255,0.18)",
    letterSpacing: 2.5,
    textTransform: "uppercase",
  },
};
