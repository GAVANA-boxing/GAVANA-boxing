"use client";

import { RED, RADIUS, FONT_SIZE, FONT_WEIGHT, whiteAlpha, redAlpha } from "@/lib/tokens";

export default function FeedEmptyState({ locale, router }) {
  const title =
    locale === "mn" ? "Тэжээл удахгүй нээгдэнэ"
    : locale === "ko" ? "피드 준비 중"
    : "Feed coming soon";

  const description =
    locale === "mn"
      ? "Дасгалын сесс эсвэл Academy хичээл дуусгаад өөрийн ахицаа хуваалц."
      : locale === "ko"
      ? "트레이닝 세션이나 아카데미 레슨을 완료하고 진행 상황을 공유하세요."
      : "Complete a training session or academy lesson and share your progress.";

  const cta =
    locale === "mn" ? "Дасгал хийх"
    : locale === "ko" ? "훈련하기"
    : "Go Train";

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: "0 32px",
      textAlign: "center",
      background: "#000",
    }}>
      {/* Icon */}
      <div style={{
        width: 64, height: 64,
        borderRadius: RADIUS.lg,
        background: redAlpha(0.1),
        border: `1px solid ${redAlpha(0.2)}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28,
        marginBottom: 4,
      }}>
        🎬
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <p style={{
          margin: 0,
          fontSize: FONT_SIZE.lg,
          fontWeight: FONT_WEIGHT.ultra,
          color: "#fff",
          letterSpacing: -0.3,
          lineHeight: 1.2,
        }}>
          {title}
        </p>
        <p style={{
          margin: 0,
          fontSize: FONT_SIZE.sm,
          color: whiteAlpha(0.42),
          maxWidth: 260,
          lineHeight: 1.6,
        }}>
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/${locale}/train`)}
        style={{
          marginTop: 8,
          padding: "13px 32px",
          borderRadius: RADIUS.md,
          background: RED,
          border: "none",
          color: "#fff",
          fontSize: FONT_SIZE.sm,
          fontWeight: FONT_WEIGHT.ultra,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: `0 4px 20px ${redAlpha(0.4)}`,
        }}
      >
        {cta}
      </button>
    </div>
  );
}
