"use client";

/**
 * Props:
 *   battles        — array of battle objects from useChallengesData
 *   battlesLoading — boolean
 *   challenges     — array of { id, titleKey, descKey, emoji }
 *   locale         — string
 *   router         — Next.js router
 *   t              — (key: string) => string   translate function
 */
export default function BattlesList({ battles, battlesLoading, challenges, locale, router, t }) {
  if (battlesLoading) {
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="shimmer" style={{ height: 80, borderRadius: 16 }} />
        ))}
      </div>
    );
  }

  if (battles.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "40px 16px", textAlign: "center" }}>
        <span style={{ fontSize: 48, opacity: 0.5 }}>⚔️</span>
        <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#fff" }}>
          {t("battleNoneYet")}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", maxWidth: 260, lineHeight: 1.6 }}>
          {t("battleNoneDesc")}
        </p>
        <button
          type="button"
          style={{ padding: "11px 24px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,#7C3AED,#4C1D95)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
          onClick={() => router.push(`/${locale}/fighters`)}
        >
          {t("battleFindFighters")}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {battles.map((battle) => {
        const challengeInfo = challenges.find((c) => c.id === battle.challengeId);
        const isReceived = battle.role === "opponent";
        const isPending = battle.status === "pending";
        return (
          <div
            key={battle.id}
            style={{
              borderRadius: 16,
              border: `1px solid ${isPending && isReceived ? "rgba(167,139,250,0.35)" : "rgba(255,255,255,0.07)"}`,
              background: isPending && isReceived ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.025)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>
                {isPending && isReceived ? "⚔️" : battle.status === "completed" ? "✅" : "🕐"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {challengeInfo ? t(challengeInfo.titleKey) : battle.challengeId}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{isReceived ? t("battleChallengeReceived") : t("battleChallengeSent")}</span>
                  <span style={{ width: 2, height: 2, borderRadius: "50%", background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
                  <span style={{ color: battle.status === "pending" ? "#FBBF24" : battle.status === "completed" ? "#34D399" : "rgba(255,255,255,0.45)" }}>
                    {battle.status === "pending" ? t("battlePending") : battle.status === "completed" ? t("battleCompleted") : battle.status}
                  </span>
                </div>
              </div>
              {isPending && isReceived && (
                <button
                  type="button"
                  style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#7C3AED,#4C1D95)", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}
                  onClick={() => router.push(`/${locale}/train?challengeId=${battle.challengeId || "jab-minute"}&challengeUserId=${battle.challengerId}`)}
                >
                  {t("battleCompete")}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
