"use client";

import { RED, GOLD, PURPLE } from "@/lib/tokens";
import styles from "@/components/profile/profilePageStyles";

// ─── Badge Icon SVGs ──────────────────────────────────────────────────────────

function BadgeIcon({ badgeId, color, size = 16 }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  if (badgeId === "first_challenge")
    return (
      <svg {...p}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    );
  if (badgeId === "streak_3" || badgeId === "streak_7")
    return (
      <svg {...p}>
        <path d="M8.5 14.5A4.5 4.5 0 0 0 13 19a4.5 4.5 0 0 0 4.5-4.5c0-4-3-6-4.5-11.5C11.5 8 8.5 10 8.5 14.5z" />
      </svg>
    );
  if (badgeId === "jab_master")
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
      </svg>
    );
  if (badgeId === "speed_king")
    return (
      <svg {...p}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  if (badgeId === "creator_starter")
    return (
      <svg {...p}>
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    );
  return (
    <svg {...p}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

// ─── Badge metadata (own locale strings) ─────────────────────────────────────

const BADGE_META = {
  first_challenge: { color: RED },
  streak_3:        { color: "#FB923C" },
  streak_7:        { color: "#F59E0B" },
  jab_master:      { color: "#60A5FA" },
  speed_king:      { color: PURPLE },
  creator_starter: { color: "#34D399" },
};

/**
 * ProfileBadgesShelf
 *
 * Props:
 *   userBadges  – Array<{ badgeId: string }>
 *   t           – (key: string) => string
 */
export default function ProfileBadgesShelf({ userBadges, t }) {
  if (!userBadges || userBadges.length === 0) return null;

  const badgeLabel = (badgeId) => {
    switch (badgeId) {
      case "first_challenge":  return t("profileBadgeFirstChallenge");
      case "streak_3":         return t("profileBadgeStreak3");
      case "streak_7":         return t("profileBadgeStreak7");
      case "jab_master":       return t("profileBadgeJabMaster");
      case "speed_king":       return t("profileBadgeSpeedKing");
      case "creator_starter":  return t("creatorTag");
      default:                 return badgeId;
    }
  };

  return (
    <div style={styles.achievementsShelf} className="stagger-list">
      {userBadges.map((b) => {
        const meta = BADGE_META[b.badgeId] || { color: GOLD };
        return (
          <div
            key={b.badgeId}
            style={{
              ...styles.achievementCard,
              borderColor: `${meta.color}44`,
              background: `linear-gradient(145deg, ${meta.color}08, rgba(0,0,0,0))`,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: `${meta.color}18`,
                border: `1px solid ${meta.color}38`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BadgeIcon badgeId={b.badgeId} color={meta.color} size={16} />
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                color: meta.color,
                marginTop: 3,
                textAlign: "center",
                lineHeight: 1.2,
                letterSpacing: 0.3,
              }}
            >
              {badgeLabel(b.badgeId)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
