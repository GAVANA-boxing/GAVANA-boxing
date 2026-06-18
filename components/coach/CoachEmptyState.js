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

      {!lastSessionData && (
        <p style={{ margin: "-6px 0 16px", fontSize: 12, color: "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 1.5 }}>
          {locale === "mn"
            ? "Хичээл хийсний дараа дээрхтэй адил AI дүн шинжилгээ авна."
            : locale === "ko"
            ? "세션 후 위와 같은 AI 분석을 받게 됩니다."
            : "After your first session, you'll get AI analysis like this."}
        </p>
      )}

      {!lastSessionData && (
        <div style={{
          width: "100%", borderRadius: 12, padding: "12px 14px", marginBottom: 14,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
            {locale === "mn" ? "ЖИШЭЭ FEEDBACK" : locale === "ko" ? "샘플 피드백" : "SAMPLE AI FEEDBACK"}
          </p>
          {[
            { label: locale === "mn" ? "Jab хурд" : locale === "ko" ? "잽 속도" : "Jab Speed", val: 78, color: "#e8334a" },
            { label: locale === "mn" ? "Хамгаалалт" : locale === "ko" ? "가드" : "Guard", val: 62, color: "#f0a500" },
            { label: locale === "mn" ? "Хөл хөдөлгөөн" : locale === "ko" ? "풋워크" : "Footwork", val: 71, color: "#4a9eff" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", width: 80, flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: 4, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div style={{ width: `${val}%`, height: "100%", borderRadius: 999, background: color, opacity: 0.7 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 900, color, width: 28, textAlign: "right" }}>{val}</span>
            </div>
          ))}
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(255,255,255,0.3)", fontStyle: "italic", lineHeight: 1.4 }}>
            {locale === "mn"
              ? "\"Тохойгоо бага зэрэг бууруулаарай — jab хурдыг нэмнэ.\""
              : locale === "ko"
              ? "\"팔꿈치를 조금 내리세요 — 잽 속도가 향상됩니다.\""
              : "\"Drop your elbow slightly — it'll add speed to your jab.\""}
          </p>
        </div>
      )}

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
