"use client";

import { loc } from "@/lib/loc";

/**
 * FeedDnaBanner
 *
 * Floating banner nudging logged-in users without an archetype to take the
 * onboarding quiz. Dismissed locally via onDismiss.
 *
 * Props:
 *   locale     – "mn" | "ko" | "en"
 *   router     – Next.js router
 *   onDismiss  – () => void
 */
export default function FeedDnaBanner({ locale, router, onDismiss }) {
  return (
    <div style={{
      position: "fixed",
      bottom: "calc(env(safe-area-inset-bottom) + 70px)",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 60,
      width: "calc(100% - 32px)",
      maxWidth: 380,
      padding: "11px 14px",
      borderRadius: 14,
      background: "rgba(10,10,12,0.88)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(245,196,81,0.3)",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>🧬</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "#F5C451" }}>
          {loc(locale, "Өөрийн хэв маягаа нээ", "내 스타일 찾기", "Discover Your Style")}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
          {loc(locale, "2 мин · Таны архетипийг нээнэ", "2분 · 내 아키타입 공개", "2 min · Unlock My Style feed")}
        </div>
      </div>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/onboarding`)}
        style={{
          padding: "7px 13px",
          borderRadius: 10,
          border: "none",
          background: "rgba(245,196,81,0.15)",
          color: "#F5C451",
          fontSize: 11,
          fontWeight: 900,
          cursor: "pointer",
          flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {loc(locale, "Эхлэх", "시작", "Start")}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        style={{
          padding: "6px",
          borderRadius: 8,
          border: "none",
          background: "transparent",
          color: "rgba(255,255,255,0.3)",
          fontSize: 14,
          lineHeight: 1,
          cursor: "pointer",
          flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        ✕
      </button>
    </div>
  );
}
