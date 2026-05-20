"use client";

import { RED, GOLD, PURPLE, redAlpha, goldAlpha } from "@/lib/tokens";
import RankBadge from "@/components/RankBadge";
import styles from "@/components/profile/profilePageStyles";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { formatScore, getActiveChallengeStreak } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

export default function ProfileFighterCard({
  profileUser,
  isOwnProfile,
  userReels,
  stats,       // { followers, following }
  fighterRank,
  nextRank,
  xp,
  xpToNextVal,
  rankProgress,
  bestScore,
  userBadges,
  challengeRanks,
  pvpStats,
  isMutual,
  isFollowing,
  followLoading,
  signingOut,
  t,
  locale,
  router,
  onShowRankModal,
  onShowFighterCard,
  onShowChallengeModal,
  onFollow,
  onMessage,
  onLogout,
  onStatNavigate,
}) {
  const BADGE_META = {
    first_challenge: { icon: "🥊", label: t("profileBadgeFirstChallenge"), color: RED },
    streak_3:        { icon: "🔥", label: t("profileBadgeStreak3"), color: "#FB923C" },
    streak_7:        { icon: "⚡", label: t("profileBadgeStreak7"), color: "#F59E0B" },
    jab_master:      { icon: "🎯", label: t("profileBadgeJabMaster"), color: "#60A5FA" },
    speed_king:      { icon: "💨", label: t("profileBadgeSpeedKing"), color: PURPLE },
    creator_starter: { icon: "🎬", label: t("creatorTag"), color: "#34D399" },
  };

  const streakCount = profileUser?.streakCount || 0;
  const [avatarError, setAvatarError] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const avatarInitial = profileUser.displayName?.charAt(0).toUpperCase() || profileUser.username?.charAt(0).toUpperCase() || "🥊";

  return (
    <section style={styles.fighterCard}>
      {/* ── Cover Photo ── */}
      <div style={styles.coverPhotoSection}>
        {(profileUser.coverPhotoURL || profileUser.coverPhoto) ? (
          <Image src={profileUser.coverPhotoURL || profileUser.coverPhoto} alt="" fill style={{ objectFit: "cover" }} />
        ) : (
          <div style={styles.coverPhotoFallback} />
        )}
        <div style={styles.coverPhotoGradient} />
        {isOwnProfile && (
          <button type="button" style={styles.coverPhotoEditBtn} onClick={() => router.push(`/${locale}/profile/edit`)}>
            📷
          </button>
        )}
      </div>

      <div style={styles.fighterCardInner}>
      {/* Avatar */}
      <div
        className={streakCount >= 10 ? "avatar-on-fire" : undefined}
        style={{
          ...styles.avatarFrame,
          ...(streakCount >= 5 ? {
            boxShadow: `0 0 0 1px ${goldAlpha(0.55)}, 0 22px 70px rgba(0,0,0,0.5), 0 0 28px rgba(251,146,60,0.6), 0 0 56px rgba(251,146,60,0.28)`,
            border: "3px solid #FB923C",
          } : {}),
        }}
      >
        {profileUser.photoURL && !avatarError ? (
          <Image
            src={profileUser.photoURL}
            alt={profileUser.displayName || profileUser.username || "Profile"}
            width={148}
            height={148}
            style={{ borderRadius: "50%", objectFit: "cover" }}
            onError={() => setAvatarError(true)}
          />
        ) : (
          avatarInitial
        )}
      </div>

      {/* "Add Story" shortcut — own profile only */}
      {isOwnProfile && (
        <button
          type="button"
          onClick={() => router.push(`/${locale}/story/upload`)}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6, padding: "5px 12px", borderRadius: 999, border: `1px solid ${redAlpha(0.35)}`, background: `${redAlpha(0.08)}`, color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: 0.3 }}
        >
          <span style={{ fontSize: 13 }}>+</span>
          {t("profileAddStory")}
        </button>
      )}

      {/* Name + username */}
      <h1 style={styles.fighterName}>
        {profileUser.displayName || profileUser.username}
      </h1>
      <div style={styles.fighterUsername}>@{profileUser.username}</div>

      {/* Bio */}
      {profileUser.bio && (
        <p style={styles.bio}>{profileUser.bio}</p>
      )}

      {/* Archetype badge */}
      {profileUser.fighterArchetype && ARCHETYPE_DISPLAY[profileUser.fighterArchetype] && (() => {
        const arch = ARCHETYPE_DISPLAY[profileUser.fighterArchetype];
        return (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 999,
              background: `${arch.color}15`,
              border: `1px solid ${arch.color}44`,
              color: arch.color, fontSize: 13, fontWeight: 800,
            }}>
              {arch.emoji} {arch.name}
            </span>
          </div>
        );
      })()}

      {/* Gym + weight class metadata */}
      {(profileUser.gym || profileUser.weightClass) && (
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {profileUser.gym && (
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "3px 10px", borderRadius: 999, fontWeight: 700 }}>
              🏋️ {profileUser.gym}
            </span>
          )}
          {profileUser.weightClass && (
            <span style={{ fontSize: 11, color: "#60A5FA", background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)", padding: "3px 10px", borderRadius: 999, fontWeight: 700 }}>
              ⚖️ {profileUser.weightClass}kg
            </span>
          )}
        </div>
      )}

      {/* Fighter identity tags — derived from data */}
      {(() => {
        const tags = [];
        tags.push({ label: t(fighterRank.key), color: fighterRank.color, bg: `${fighterRank.color}18`, border: `${fighterRank.color}44` });
        const challengeStreak = getActiveChallengeStreak(profileUser);
        if (challengeStreak > 0) tags.push({ label: `🔥 ${challengeStreak}d`, color: "#FB923C", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.35)" });
        if (bestScore !== null) tags.push({ label: `⭐ ${formatScore(bestScore)}/10`, color: GOLD, bg: `${goldAlpha(0.12)}`, border: `${goldAlpha(0.35)}` });
        if (userReels.length > 0) tags.push({ label: `🎬 ${t("creatorTag")}`, color: "#60A5FA", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.28)" });
        if (challengeRanks?.weeklyRank && challengeRanks.weeklyRank <= 10) tags.push({ label: `#${challengeRanks.weeklyRank} ${t("seasonCurrentWeek")}`, color: GOLD, bg: `${goldAlpha(0.12)}`, border: `${goldAlpha(0.32)}` });
        if (pvpStats && pvpStats.wins > 0) tags.push({ label: `⚔️ ${pvpStats.wins}W ${pvpStats.losses}L`, color: PURPLE, bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.28)" });
        return (
          <div style={styles.fighterTagsRow}>
            {tags.map((tag, i) => (
              <span key={i} style={{ ...styles.fighterTag, color: tag.color, background: tag.bg, borderColor: tag.border }}>
                {tag.label}
              </span>
            ))}
          </div>
        );
      })()}

      {/* Rank row — tappable, opens rank modal */}
      <button type="button" onClick={onShowRankModal} style={styles.rankRow}>
        <RankBadge rank={fighterRank} size={32} glowEnabled />
        <span style={{ ...styles.rankLabel, color: fighterRank.color, fontFamily: "var(--font-condensed)", letterSpacing: "0.08em" }}>{t(fighterRank.key)}</span>
      </button>

      {/* XP progress bar */}
      <div style={styles.xpWrap}>
        <div style={styles.xpTopRow}>
          <span style={{ ...styles.xpAmount, color: fighterRank.color }}>
            {xp.toLocaleString()} {t("xpLabel")}
          </span>
          <span style={styles.xpNextLabel}>
            {nextRank
              ? t("xpToNext").replace("{xp}", xpToNextVal.toLocaleString()).replace("{rank}", t(nextRank.key))
              : t("atMaxRank")}
          </span>
        </div>
        <div style={styles.xpTrack}>
          <div style={{ ...styles.xpFill, width: `${rankProgress}%`, background: fighterRank.gradient }} />
        </div>
      </div>

      {/* Achievements Shelf */}
      {userBadges.length > 0 && (
        <div style={styles.achievementsShelf}>
          {userBadges.map((b) => {
            const meta = BADGE_META[b.badgeId] || { icon: "🏅", label: b.badgeId, color: GOLD };
            return (
              <div key={b.badgeId} style={{ ...styles.achievementCard, borderColor: meta.color + "44" }}>
                <span style={{ fontSize: 22 }}>{meta.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 900, color: meta.color, marginTop: 4, textAlign: "center", lineHeight: 1.2, letterSpacing: 0.3 }}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats row: posts / followers / following */}
      <div style={styles.statsRow}>
        <button type="button" onClick={() => onStatNavigate("posts")} style={styles.statButton}>
          <span style={styles.statNumber}>{userReels.length}</span>
          <span style={styles.statLabel}>{t("posts")}</span>
        </button>
        <button type="button" onClick={() => onStatNavigate("followers")} style={styles.statButton}>
          <span style={styles.statNumber}>{stats.followers}</span>
          <span style={styles.statLabel}>{t("followers")}</span>
        </button>
        <button type="button" onClick={() => onStatNavigate("following")} style={styles.statButton}>
          <span style={styles.statNumber}>{stats.following}</span>
          <span style={styles.statLabel}>{t("followingCount")}</span>
        </button>
      </div>

      {/* Action buttons */}
      {isOwnProfile ? (
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => router.push(`/${locale}/profile/edit`)}
              style={{ ...styles.ghostAction, flex: 1 }}
            >
              {t("editProfile")}
            </button>
            <button
              type="button"
              onClick={onShowFighterCard}
              style={{
                ...styles.ghostAction,
                color: GOLD,
                borderColor: `${goldAlpha(0.45)}`,
                background: `${goldAlpha(0.1)}`,
                flexShrink: 0,
                fontWeight: 900,
              }}
            >
              🥊 {t("profileFighterCard")}
            </button>
            <button
              type="button"
              onClick={() => setMoreOpen(v => !v)}
              style={{
                width: 38, height: 38, borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.12)",
                background: moreOpen ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.05)",
                color: "#fff", fontSize: 18, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, letterSpacing: 1,
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
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0,
                background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14, padding: 6, minWidth: 200,
                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                zIndex: 10, animation: "dropDown 160ms ease",
              }}>
                <button
                  onClick={() => { router.push(`/${locale}/dashboard`); setMoreOpen(false); }}
                  style={moreItemStyle}
                >
                  {t("dashboardViewProgress")}
                </button>
                {userReels.length > 0 && (
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
                  style={{ ...moreItemStyle, color: "#f87171", opacity: signingOut ? 0.6 : 1, cursor: signingOut ? "not-allowed" : "pointer" }}
                >
                  {signingOut ? t("signingOut") : t("logout")}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onFollow}
              disabled={followLoading}
              style={{
                ...styles.followAction,
                background: followLoading ? "#555" : (isFollowing ? "#151515" : RED),
                cursor: followLoading ? "not-allowed" : "pointer",
                opacity: followLoading ? 0.7 : 1
              }}
            >
              {followLoading ? t("followLoading") : (isFollowing ? t("unfollow") : t("follow"))}
            </button>
            <button
              type="button"
              onClick={onMessage}
              style={{
                height: 38, padding: "0 18px", borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff", fontSize: 13, fontWeight: 800,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {t("profileMessageBtn")}
            </button>
          </div>
          {isMutual && (
            <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 0.5 }}>
              ⇄ {t("mutual")}
            </span>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            <button
              type="button"
              onClick={onShowChallengeModal}
              style={{ ...styles.ghostAction, color: PURPLE, borderColor: "rgba(167,139,250,0.3)", flex: 1 }}
            >
              ⚔️ {t("profileChallengeBtn")}
            </button>
            <button
              type="button"
              onClick={onShowFighterCard}
              style={{
                ...styles.ghostAction,
                color: GOLD,
                borderColor: `${goldAlpha(0.45)}`,
                background: `${goldAlpha(0.1)}`,
                flex: 1,
                fontWeight: 900,
              }}
            >
              🥊 {t("profileFighterCard")}
            </button>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}

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
