"use client";

import { loc } from "@/lib/loc";
import { RED, RED_DARK, redAlpha, whiteAlpha } from "@/lib/tokens";
import styles from "@/components/profile/profilePageStyles";
import Image from "next/image";
import { useState } from "react";

import ProfileLicenseCard from "@/components/profile/ProfileLicenseCard";
import ProfileBadgesShelf from "@/components/profile/ProfileBadgesShelf";
import ProfileReputationCard from "@/components/profile/ProfileReputationCard";
import ProfileActionRow from "@/components/profile/ProfileActionRow";

export default function ProfileFighterCard({
  profileUser,
  isOwnProfile,
  userReels,
  stats,
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
  const streakCount = profileUser?.streakCount || 0;
  const [avatarError, setAvatarError] = useState(false);
  const avatarInitial = (profileUser.displayName || profileUser.username || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <section style={styles.fighterCard}>

      {/* ── Hero: Cover + Avatar overlay ─────────────────────────────────── */}
      {/* Wrapper is position:relative so avatarAnchor can escape coverPhotoSection's overflow:hidden */}
      <div style={{ position: "relative" }}>
        <div style={styles.coverPhotoSection}>
          {(profileUser.coverPhotoURL || profileUser.coverPhoto) ? (
            <Image
              src={profileUser.coverPhotoURL || profileUser.coverPhoto}
              alt=""
              fill
              style={{ objectFit: "cover" }}
            />
          ) : (
            <div style={styles.coverPhotoFallback} />
          )}
          <div style={styles.coverPhotoGradient} />

          {/* Edit cover button */}
          {isOwnProfile && (
            <button
              type="button"
              style={styles.coverPhotoEditBtn}
              onClick={() => router.push(`/${locale}/profile/edit`)}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          )}
        </div>

        {/* Avatar — outside coverPhotoSection so overflow:hidden doesn't clip it */}
        <div style={styles.avatarAnchor}>
          <div
            className={streakCount >= 10 ? "avatar-on-fire" : undefined}
            style={{
              ...styles.avatarFrame,
              ...(streakCount >= 5
                ? {
                    boxShadow: `0 0 0 2px #FB923C, 0 0 0 4px rgba(251,146,60,0.2), 0 16px 48px rgba(0,0,0,0.7)`,
                    border: "3px solid #FB923C",
                  }
                : {}),
            }}
          >
            {profileUser.photoURL && !avatarError ? (
              <Image
                src={profileUser.photoURL}
                alt={profileUser.displayName || profileUser.username || "Profile"}
                width={96}
                height={96}
                style={{ borderRadius: "50%", objectFit: "cover" }}
                onError={() => setAvatarError(true)}
              />
            ) : (
              avatarInitial
            )}
          </div>
        </div>
      </div>

      {/* ── Identity row: name + actions ─────────────────────────────────── */}
      <div style={styles.identityRow}>
        <div style={styles.identityLeft}>
          <h1 style={styles.fighterName}>
            {profileUser.displayName || profileUser.username}
            {streakCount >= 5 && (
              <span style={{ fontSize: 20, marginLeft: 6, verticalAlign: "middle" }}>🔥</span>
            )}
          </h1>
          <div style={styles.fighterUsername}>@{profileUser.username}</div>
        </div>

        {/* Compact action — own profile: edit | other: follow */}
        {isOwnProfile ? (
          <button
            onClick={() => router.push(`/${locale}/profile/edit`)}
            style={styles.identityActionBtn}
          >
            {t("editProfile")}
          </button>
        ) : (
          <button
            onClick={onFollow}
            disabled={followLoading}
            style={{
              ...styles.identityActionBtn,
              background: isFollowing
                ? whiteAlpha(0.06)
                : `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
              borderColor: isFollowing ? whiteAlpha(0.15) : redAlpha(0.5),
              boxShadow: isFollowing ? "none" : `0 6px 20px ${redAlpha(0.3)}`,
              opacity: followLoading ? 0.7 : 1,
              cursor: followLoading ? "not-allowed" : "pointer",
            }}
          >
            {followLoading ? "…" : isFollowing ? t("unfollow") : t("follow")}
          </button>
        )}
      </div>

      {/* ── Bio ──────────────────────────────────────────────────────────── */}
      {profileUser.bio && <p style={styles.bio}>{profileUser.bio}</p>}

      {/* ── License eyebrow ──────────────────────────────────────────────── */}
      <p style={styles.statsSectionKicker}>
        {loc(locale, "Тэмцэгчийн лиценз", "파이터 라이선스", "Fighter License")}
      </p>

      {/* ── Digital License Card ─────────────────────────────────────────── */}
      <ProfileLicenseCard
        profileUser={profileUser}
        xp={xp}
        bestScore={bestScore}
        pvpStats={pvpStats}
        challengeRanks={challengeRanks}
        onShowRankModal={onShowRankModal}
        t={t}
      />

      {/* ── Badges shelf ─────────────────────────────────────────────────── */}
      <ProfileBadgesShelf userBadges={userBadges} t={t} />

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div style={styles.statsRow} className="section-reveal stagger-3">
        <button type="button" onClick={() => onStatNavigate("posts")} style={styles.statButton}>
          <span style={styles.statNumber}>{userReels.length}</span>
          <span style={styles.statLabel}>{t("posts")}</span>
        </button>
        <button
          type="button"
          onClick={() => onStatNavigate("followers")}
          style={styles.statButton}
        >
          <span style={styles.statNumber}>{stats.followers}</span>
          <span style={styles.statLabel}>{t("followers")}</span>
        </button>
        <button
          type="button"
          onClick={() => onStatNavigate("following")}
          style={styles.statButton}
        >
          <span style={styles.statNumber}>{stats.following}</span>
          <span style={styles.statLabel}>{t("followingCount")}</span>
        </button>
      </div>

      {/* ── Reputation card ──────────────────────────────────────────────── */}
      <ProfileReputationCard
        userReels={userReels}
        followersCount={stats.followers}
        t={t}
      />

      {/* ── Secondary actions ────────────────────────────────────────────── */}
      <ProfileActionRow
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        isMutual={isMutual}
        followLoading={followLoading}
        signingOut={signingOut}
        hasReels={userReels.length > 0}
        locale={locale}
        router={router}
        onShowFighterCard={onShowFighterCard}
        onShowChallengeModal={onShowChallengeModal}
        onFollow={onFollow}
        onMessage={onMessage}
        onLogout={onLogout}
        t={t}
      />

    </section>
  );
}
