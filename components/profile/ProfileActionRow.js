"use client";

import { useState, useRef } from "react";
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
  const [dropdownPos, setDropdownPos] = useState(null);
  const moreButtonRef = useRef(null);

  const handleMoreToggle = () => {
    if (!moreOpen && moreButtonRef.current) {
      const rect = moreButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setMoreOpen((v) => !v);
  };

  return (
    <div style={styles.actionRow}>
      {isOwnProfile ? (
        <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
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
              ref={moreButtonRef}
              type="button"
              onClick={handleMoreToggle}
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
                style={{ position: "fixed", inset: 0, zIndex: 99 }}
                onClick={() => setMoreOpen(false)}
              />
              <div
                style={{
                  position: "fixed",
                  top: dropdownPos?.top ?? 200,
                  right: dropdownPos?.right ?? 16,
                  background: "#1c1c1e",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 14,
                  padding: 6,
                  minWidth: 200,
                  boxShadow: `0 8px 32px ${blackAlpha(0.7)}`,
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  zIndex: 100,
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
              </div>
            </>
          )}

          {/* Sign out — always visible */}
          <button
            type="button"
            onClick={onLogout}
            disabled={signingOut}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(248,113,113,0.18)",
              background: "rgba(248,113,113,0.06)",
              color: signingOut ? "rgba(248,113,113,0.4)" : "rgba(248,113,113,0.75)",
              fontSize: 13,
              fontWeight: 700,
              cursor: signingOut ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {signingOut ? t("signingOut") : t("logout")}
          </button>
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
