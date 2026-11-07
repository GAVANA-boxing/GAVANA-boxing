"use client";

import { useEffect, useState } from "react";
import { BRAND, btnPrimary, displayTitle, kickerDot, kickerPill, pageBackground } from "@/components/ui/brand";

const T = {
  mn: { kicker: "Офлайн", title: "Интернэт алга", sub: "Холболтоо шалгаад дахин оролдоно уу.", retry: "Дахин оролдох" },
  ko: { kicker: "오프라인", title: "인터넷 연결 없음", sub: "연결을 확인하고 다시 시도하세요.", retry: "다시 시도" },
  en: { kicker: "Offline", title: "No connection", sub: "Check your connection and try again.", retry: "Try again" },
};

/** Shown by the service worker when a page can't load offline (precached, so no locale in the URL). */
export default function OfflinePage() {
  const [locale, setLocale] = useState("mn");
  useEffect(() => {
    const fromPath = (window.location.pathname.match(/^\/(en|mn|ko)(\/|$)/) || [])[1];
    const fromBrowser = (navigator.language || "").slice(0, 2);
    setLocale(fromPath || (T[fromBrowser] ? fromBrowser : "mn"));
  }, []);
  const t = T[locale] || T.mn;

  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: BRAND.text, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <p style={{ ...kickerPill, margin: "0 auto" }}><span style={kickerDot} />{t.kicker}</p>
        <h1 style={{ ...displayTitle, fontSize: 34, lineHeight: 1.1, marginTop: 16 }}>{t.title}</h1>
        <p style={{ margin: "12px 0 24px", fontSize: 15, lineHeight: 1.5, color: BRAND.muted }}>{t.sub}</p>
        <button type="button" onClick={() => window.location.reload()} style={{ ...btnPrimary, fontFamily: "inherit" }}>
          ↻ {t.retry}
        </button>
      </div>
    </main>
  );
}
