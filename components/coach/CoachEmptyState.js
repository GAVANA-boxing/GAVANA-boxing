"use client";

import s from "@/components/coach/coachChatStyles";

/**
 * Empty chat state: avatar, greeting, optional "Review last session" CTA, quick-action chips.
 *
 * Props:
 *   activePersona    {{ emoji, color, greeting: { mn, ko, en } }}
 *   locale           {string}
 *   quickActions     {string[]}  — translated quick-action labels
 *   lastSessionData  {object|null}
 *   reviewLoading    {boolean}
 *   loading          {boolean}
 *   onQuickAction    {(text: string) => void}
 *   onReview         {() => void}
 */
export default function CoachEmptyState({
  activePersona,
  locale,
  quickActions,
  lastSessionData,
  reviewLoading,
  loading,
  onQuickAction,
  onReview,
}) {
  const reviewLabel =
    locale === "mn" ? "Сүүлийн session-аа шинжлүүл"
    : locale === "ko" ? "마지막 세션 리뷰"
    : "Review my last session";

  return (
    <div style={s.emptyWrap}>
      <div style={{ ...s.coachAvatar, borderColor: activePersona.color + "55", background: activePersona.color + "15" }}>
        <span style={{ fontSize: 32 }}>{activePersona.emoji}</span>
      </div>
      <p style={s.greeting}>{activePersona.greeting[locale] || activePersona.greeting.en}</p>

      {lastSessionData && (
        <button
          type="button"
          onClick={onReview}
          disabled={reviewLoading || loading}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: 12, marginBottom: 10,
            background: `${activePersona.color}14`, border: `1px solid ${activePersona.color}44`,
            color: activePersona.color, fontSize: 13, fontWeight: 900, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
            opacity: reviewLoading ? 0.6 : 1,
          }}
        >
          <span>📋</span>
          {reviewLabel}
        </button>
      )}

      <div style={s.quickGrid}>
        {quickActions.map((qa) => (
          <button key={qa} type="button" style={s.quickChip} onClick={() => onQuickAction(qa)}>
            {qa}
          </button>
        ))}
      </div>
    </div>
  );
}
