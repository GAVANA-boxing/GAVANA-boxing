"use client";

import { useState } from "react";
import { GOLD, RED } from "@/lib/tokens";
import { loc } from "@/lib/loc";

export default function WelcomeBanner({ locale, router, username, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("gavana_welcome_dismissed", "1"); } catch { /* */ }
    onDismiss?.();
  };

  const mn = locale === "mn";
  const ko = locale === "ko";

  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(135deg, rgba(255,59,48,0.1) 0%, rgba(245,196,81,0.06) 100%)",
      border: "1px solid rgba(255,59,48,0.2)",
      borderLeft: `3px solid ${RED}`,
      borderRadius: "3px 16px 16px 3px",
      padding: "16px 14px 14px",
      marginBottom: 20,
    }}>
      <button
        type="button"
        onClick={dismiss}
        style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: 0 }}
      >×</button>

      <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 900, color: RED, letterSpacing: 2.5, textTransform: "uppercase" }}>
        {loc(locale, "🥊 GAVANA-д тавтай морил", "🥊 GAVANA에 오신 것을 환영합니다", "🥊 Welcome to GAVANA")}
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1.3 }}>
        {username ? (mn ? `${username}, эхлэх цаг боллоо!` : `${username}, let's get started!`) : (mn ? "Эхлэх цаг боллоо!" : "Time to get started!")}
      </p>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
        {mn
          ? "Эхний дадлагаа дуусгаснаар AI coach тантай танилцаж, хувийн хөтөлбөр зохиож эхэлнэ."
          : "Complete your first session and your AI coach will start learning your style."}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/train`)}
          style={{ width: "100%", padding: "11px 0", borderRadius: 11, background: RED, border: "none", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", letterSpacing: 0.3 }}
        >
          {loc(locale, "⚡ Дадлага эхлэх", "⚡ 훈련 시작", "⚡ Start Training")}
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/fighters`)}
            style={{ padding: "9px 0", borderRadius: 10, background: `${GOLD}15`, border: `1px solid ${GOLD}30`, color: GOLD, fontSize: 12, fontWeight: 800, cursor: "pointer" }}
          >
            {mn ? "📖 Fighter судлах" : "📖 Study Fighters"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/coach/chat`)}
            style={{ padding: "9px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.65)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
          >
            {mn ? "💬 Coach-той ярих" : "💬 Chat with Coach"}
          </button>
        </div>
      </div>
    </div>
  );
}
