"use client";

import { RED, RED_DARK, GOLD, PURPLE, redAlpha, goldAlpha, whiteAlpha , blackAlpha} from "@/lib/tokens";
import { getWeightClassDisplay } from "@/lib/weightClasses";
import RankBadge from "@/components/RankBadge";
import styles from "@/components/profile/profilePageStyles";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { formatScore, getActiveChallengeStreak } from "@/lib/utils";
import Image from "next/image";
import { useMemo, useState } from "react";

// ─── Badge Icon SVGs ──────────────────────────────────────────────────────────

function BadgeIcon({ badgeId, color, size = 16 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };
  if (badgeId === "first_challenge") return (
    <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
  );
  if (badgeId === "streak_3" || badgeId === "streak_7") return (
    <svg {...p}><path d="M8.5 14.5A4.5 4.5 0 0 0 13 19a4.5 4.5 0 0 0 4.5-4.5c0-4-3-6-4.5-11.5C11.5 8 8.5 10 8.5 14.5z"/></svg>
  );
  if (badgeId === "jab_master") return (
    <svg {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/></svg>
  );
  if (badgeId === "speed_king") return (
    <svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  );
  if (badgeId === "creator_starter") return (
    <svg {...p}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
  );
  return <svg {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>;
}

// ─── XP Ring ──────────────────────────────────────────────────────────────────

function XPRing({ progress, color, size = 56 }) {
  const R = (size - 6) / 2;
  const circ = 2 * Math.PI * R;
  const dash = Math.min(Math.max(progress / 100, 0), 1) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={`${color}20`} strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}aa)` }}
      />
    </svg>
  );
}

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
  const BADGE_META = {
    first_challenge: { label: t("profileBadgeFirstChallenge"), color: RED },
    streak_3:        { label: t("profileBadgeStreak3"), color: "#FB923C" },
    streak_7:        { label: t("profileBadgeStreak7"), color: "#F59E0B" },
    jab_master:      { label: t("profileBadgeJabMaster"), color: "#60A5FA" },
    speed_king:      { label: t("profileBadgeSpeedKing"), color: PURPLE },
    creator_starter: { label: t("creatorTag"), color: "#34D399" },
  };

  const streakCount = profileUser?.streakCount || 0;
  const challengeStreak = getActiveChallengeStreak(profileUser);
  const arch = profileUser.fighterArchetype ? ARCHETYPE_DISPLAY[profileUser.fighterArchetype] : null;
  const [avatarError, setAvatarError] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const avatarInitial = profileUser.displayName?.charAt(0).toUpperCase() || profileUser.username?.charAt(0).toUpperCase() || "🥊";

  return (
    <section style={styles.fighterCard}>

      {/* ── Hero: Cover + Avatar overlay ─────────────────────────────────── */}
      {/* Wrapper is position:relative so avatarAnchor can escape coverPhotoSection's overflow:hidden */}
      <div style={{ position: "relative" }}>
        <div style={styles.coverPhotoSection}>
          {(profileUser.coverPhotoURL || profileUser.coverPhoto) ? (
            <Image src={profileUser.coverPhotoURL || profileUser.coverPhoto} alt="" fill style={{ objectFit: "cover" }} />
          ) : (
            <div style={styles.coverPhotoFallback} />
          )}
          <div style={styles.coverPhotoGradient} />

          {/* Edit cover button */}
          {isOwnProfile && (
            <button type="button" style={styles.coverPhotoEditBtn} onClick={() => router.push(`/${locale}/profile/edit`)}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
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
              ...(streakCount >= 5 ? {
                boxShadow: `0 0 0 2px #FB923C, 0 0 0 4px rgba(251,146,60,0.2), 0 16px 48px ${blackAlpha(0.7)}`,
                border: "3px solid #FB923C",
              } : {}),
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
            {streakCount >= 5 && <span style={{ fontSize: 20, marginLeft: 6, verticalAlign: "middle" }}>🔥</span>}
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
            {followLoading ? "…" : (isFollowing ? t("unfollow") : t("follow"))}
          </button>
        )}
      </div>

      {/* ── Bio ──────────────────────────────────────────────────────────── */}
      {profileUser.bio && (
        <p style={styles.bio}>{profileUser.bio}</p>
      )}

      {/* ── License eyebrow ──────────────────────────────────────────────── */}
      <p style={styles.statsSectionKicker}>
        {locale === "mn" ? "Тэмцэгчийн лиценз" : locale === "ko" ? "파이터 라이선스" : "Fighter License"}
      </p>

      {/* ── Digital License Card ─────────────────────────────────────────── */}
      <div style={{ ...styles.licenseCard, position: "relative" }} className="section-reveal">
        {/* Belt stripe — rank color accent at top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${fighterRank.color} 0%, ${fighterRank.color}66 55%, transparent 100%)`, pointerEvents: "none" }} />
        {/* Left: XP ring + rank */}
        <button type="button" onClick={onShowRankModal} style={styles.licenseRankBlock}>
          <div style={{ position: "relative", width: 56, height: 56 }}>
            <XPRing progress={rankProgress} color={fighterRank.color} size={56} />
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RankBadge rank={fighterRank} size={28} glowEnabled />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: fighterRank.color, letterSpacing: 0.5, lineHeight: 1 }}>{t(fighterRank.key)}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
              {xp.toLocaleString()} XP
            </span>
            {nextRank && (
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
                {xpToNextVal.toLocaleString()} to {t(nextRank.key)}
              </span>
            )}
          </div>
        </button>

        {/* Divider */}
        <div style={styles.licenseDivider} />

        {/* Right: tags grid */}
        <div style={styles.licenseTagsGrid}>
          {arch && (
            <div style={{ ...styles.licenseTag, color: arch.color, background: `${arch.color}12`, borderColor: `${arch.color}35` }}>
              {arch.emoji} {arch.name}
            </div>
          )}
          {bestScore !== null && (
            <div style={{ ...styles.licenseTag, color: GOLD, background: goldAlpha(0.08), borderColor: goldAlpha(0.28) }}>
              ⭐ {formatScore(bestScore)}/10
            </div>
          )}
          {challengeStreak > 0 && (
            <div style={{ ...styles.licenseTag, color: "#FB923C", background: "rgba(251,146,60,0.1)", borderColor: "rgba(251,146,60,0.3)" }}>
              🔥 {challengeStreak}d
            </div>
          )}
          {profileUser.weightClass && (
            <div style={{ ...styles.licenseTag, color: "#60A5FA", background: "rgba(96,165,250,0.08)", borderColor: "rgba(96,165,250,0.22)" }}>
              ⚖️ {getWeightClassDisplay(profileUser.weightClass)}
            </div>
          )}
          {profileUser.gym && (
            <div style={{ ...styles.licenseTag, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }}>
              🏋️ {profileUser.gym}
            </div>
          )}
          {pvpStats?.wins > 0 && (
            <div style={{ ...styles.licenseTag, color: PURPLE, background: "rgba(167,139,250,0.08)", borderColor: "rgba(167,139,250,0.25)" }}>
              ⚔️ {pvpStats.wins}W {pvpStats.losses}L
            </div>
          )}
          {challengeRanks?.weeklyRank <= 10 && challengeRanks?.weeklyRank > 0 && (
            <div style={{ ...styles.licenseTag, color: GOLD, background: goldAlpha(0.08), borderColor: goldAlpha(0.28) }}>
              #{challengeRanks.weeklyRank} Week
            </div>
          )}
        </div>
      </div>

      {/* ── Badges shelf ─────────────────────────────────────────────────── */}
      {userBadges.length > 0 && (
        <div style={styles.achievementsShelf} className="stagger-list">
          {userBadges.map((b) => {
            const meta = BADGE_META[b.badgeId] || { label: b.badgeId, color: GOLD };
            return (
              <div key={b.badgeId} style={{ ...styles.achievementCard, borderColor: `${meta.color}44`, background: `linear-gradient(145deg, ${meta.color}08, rgba(0,0,0,0))` }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${meta.color}18`, border: `1px solid ${meta.color}38`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BadgeIcon badgeId={b.badgeId} color={meta.color} size={16} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 900, color: meta.color, marginTop: 3, textAlign: "center", lineHeight: 1.2, letterSpacing: 0.3 }}>
                  {meta.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div style={styles.statsRow} className="section-reveal stagger-3">
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

      {/* ── Reputation card ──────────────────────────────────────────────── */}
      {(() => {
        const training   = userReels.filter((r) => r.contentType === "training").length;
        const responses  = userReels.filter((r) => r.contentType === "challenge_response").length;
        const wins       = userReels.filter((r) =>
          r.contentType === "challenge_response" &&
          typeof r.sourceSessionScore === "number" &&
          typeof r.challengeTargetScore === "number" &&
          r.sourceSessionScore > r.challengeTargetScore
        ).length;
        const totalLikesRep = userReels.reduce((s, r) => s + (Number(r.likes || r.likesCount) || 0), 0);
        if (!training && !responses && !totalLikesRep && !stats.followers) return null;
        const cells = [
          { label: t("repTrainingPosts"),      value: training },
          { label: t("repChallengeResponses"), value: responses },
          { label: t("repLikesReceived"),      value: totalLikesRep },
          { label: t("followers"),             value: stats.followers },
          ...(wins > 0 ? [{ label: t("repChallengeWins"), value: wins }] : []),
        ];
        return (
          <div className="section-reveal stagger-4" style={{ margin: "0 0 16px", padding: "12px 16px", borderRadius: 16, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10 }}>
              {t("repCardTitle")}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {cells.map(({ label, value }) => (
                <div key={label} style={{ flex: "1 1 auto", minWidth: 64, textAlign: "center", padding: "6px 8px", borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.1 }}>{value.toLocaleString()}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.38)", letterSpacing: 0.3, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Secondary actions ────────────────────────────────────────────── */}
      <div style={styles.actionRow}>
        {isOwnProfile ? (
          <div style={{ position: "relative", width: "100%" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={onShowFighterCard}
                style={{ ...styles.ghostAction, color: GOLD, borderColor: goldAlpha(0.4), background: goldAlpha(0.08), flex: 1 }}
              >
                🥊 {t("profileFighterCard")}
              </button>
              <button
                type="button"
                onClick={() => setMoreOpen(v => !v)}
                style={{
                  width: 38, height: 38, borderRadius: 12,
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
                <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setMoreOpen(false)} />
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#1c1c1e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 6, minWidth: 200, boxShadow: `0 8px 32px ${blackAlpha(0.6)}`, zIndex: 10, animation: "dropDown 160ms ease" }}>
                  <button onClick={() => { router.push(`/${locale}/dashboard`); setMoreOpen(false); }} style={moreItemStyle}>{t("dashboardViewProgress")}</button>
                  {userReels.length > 0 && (
                    <button onClick={() => { router.push(`/${locale}/creator/dashboard`); setMoreOpen(false); }} style={moreItemStyle}>{t("creatorDashboard")}</button>
                  )}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                  <button onClick={() => { onLogout(); setMoreOpen(false); }} disabled={signingOut} style={{ ...moreItemStyle, color: "#f87171", opacity: signingOut ? 0.6 : 1, cursor: signingOut ? "not-allowed" : "pointer" }}>
                    {signingOut ? t("signingOut") : t("logout")}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={onMessage} style={{ ...styles.ghostAction, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                {t("profileMessageBtn")}
              </button>
              <button type="button" onClick={onShowChallengeModal} style={{ ...styles.ghostAction, flex: 1, color: PURPLE, borderColor: "rgba(167,139,250,0.3)" }}>
                ⚔️ {t("profileChallengeBtn")}
              </button>
              <button type="button" onClick={onShowFighterCard} style={{ ...styles.ghostAction, color: GOLD, borderColor: goldAlpha(0.4), background: goldAlpha(0.08), flexShrink: 0 }}>
                🥊
              </button>
            </div>
            {isMutual && (
              <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 0.5 }}>
                ⇄ {t("mutual")}
              </div>
            )}
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
