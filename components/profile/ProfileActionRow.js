"use client";

import { useState } from "react";
import { GOLD, PURPLE, RED, RED_DARK, redAlpha, goldAlpha, whiteAlpha, blackAlpha } from "@/lib/tokens";
import styles from "@/components/profile/profilePageStyles";

const moreItemStyle = {
  display: "block",
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "none",
  background: "transparent",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  textAlign: "left",
  cursor: "pointer",
};

/**
 * ProfileActionRow
 *
 * Props:
 *   isOwnProfile       – boolean
 *   isFollowing        – boolean
 *   isMutual           – boolean
 *   followLoading      – boolean
 *   signingOut         – boolean
 *   hasReels           – boolean   whether the user has any reels (for creator dashboard link)
 *   locale             – string
 *   router             – Next.js router
 *   onShowFighterCard  – () => void
 *   onShowChallengeModal – () => void
 *   onFollow           – () => void
 *   onMessage          – () => void
 *   onLogout           – () => void
 *   t                  – (key: string) => string
 */
export default function ProfileActionRow({
  isOwnProfile,
  isFollowing,
  isMutual,
  followLoading,
  signingOut,
  hasReels,
  locale,
  router,
  onShowFighterCard,
  onShowChallengeModal,
  onFollow,
  onMessage,
  onLogout,
  t,
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div style={styles.actionRow}>
      {isOwnProfile ? (
        <div style={{ position: "relative", width: "100%" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onShowFighterCard}
              style={{
                ...styles.ghostAction,
                color: GOLD,
                borderColor: goldAlpha(0.4),
                background: goldAlpha(0.08),
                flex: 1,
              }}
            >
              🥊 {t("profileFighterCard")}
            </button>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: moreOpen ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                letterSpacing: 1,
              }}
              aria-label="More options"
            >
              ···
            </button>
          </div>

          {moreOpen && (
            <>
              <div
                style={{ position: "fixed", inset: 0, zIndex: 9 }}
                onClick={() => setMoreOpen(false)}
              />
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  background: "#1c1c1e",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  padding: 6,
                  minWidth: 200,
                  boxShadow: `0 8px 32px ${blackAlpha(0.6)}`,
                  zIndex: 10,
                  animation: "dropDown 160ms ease",
                }}
              >
                <button
                  onClick={() => { router.push(`/${locale}/dashboard`); setMoreOpen(false); }}
                  style={moreItemStyle}
                >
                  {t("dashboardViewProgress")}
                </button>
                {hasReels && (
                  <button
                    onClick={() => { router.push(`/${locale}/creator/dashboard`); setMoreOpen(false); }}
                    style={moreItemStyle}
                  >
                    {t("creatorDashboard")}
                  </button>
                )}
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                <button
                  onClick={() => { onLogout(); setMoreOpen(false); }}
                  disabled={signingOut}
                  style={{
                    ...moreItemStyle,
                    color: "#f87171",
                    opacity: signingOut ? 0.6 : 1,
                    cursor: signingOut ? "not-allowed" : "pointer",
                  }}
                >
                  {signingOut ? t("signingOut") : t("logout")}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onMessage}
              style={{
                ...styles.ghostAction,
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {t("profileMessageBtn")}
            </button>
            <button
              type="button"
              onClick={onShowChallengeModal}
              style={{
                ...styles.ghostAction,
                flex: 1,
                color: PURPLE,
                borderColor: "rgba(167,139,250,0.3)",
              }}
            >
              ⚔️ {t("profileChallengeBtn")}
            </button>
            <button
              type="button"
              onClick={onShowFighterCard}
              style={{
                ...styles.ghostAction,
                color: GOLD,
                borderColor: goldAlpha(0.4),
                background: goldAlpha(0.08),
                flexShrink: 0,
              }}
            >
              🥊
            </button>
          </div>
          {isMutual && (
            <div
              style={{
                textAlign: "center",
                fontSize: 11,
                fontWeight: 700,
                color: GOLD,
                letterSpacing: 0.5,
              }}
            >
              ⇄ {t("mutual")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
