"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useParams, usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { getLocale, translate } from "@/lib/i18n";
import { getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import { getAccountXp } from "@/lib/domain/progression";
import { computeEarnedBadges } from "@/lib/badges";
import { computeFighterDNA } from "@/lib/fighterDNA";
import { deriveRadarStats } from "@/lib/dashboardHelpers";
import { FIGHTERS } from "@/lib/fighters";
import { RED, PURPLE } from "@/lib/tokens";
import { CORE_MODE } from "@/lib/coreRoutes";
import { useProfileData } from "@/hooks/useProfileData";
import { useProfileActions } from "@/hooks/useProfileActions";
import { useReelDeletion } from "@/hooks/useReelDeletion";
import ProfileLoadingSkeleton from "@/components/profile/ProfileLoadingSkeleton";
import ProfileView from "@/components/profile/ProfileView";
import ProfileTabBar from "@/components/profile/ProfileTabBar";
import ProfileReelsGrid from "@/components/profile/ProfileReelsGrid";
import BattleSection from "@/components/profile/BattleSection";
import BottomNav from "@/components/BottomNav";
import MenuSheet from "@/components/bottomnav/MenuSheet";

const ProfileModals = dynamic(
  () => import("@/components/profile/ProfileModals").then((m) => ({ default: m.ProfileModals })),
  { ssr: false }
);
const FollowListModal = dynamic(() => import("@/components/profile/FollowListModal"), { ssr: false });

// Profile ("Me"): who the fighter is — photo, rank, tags, achievements and the
// latest sessions. Numbers in depth live on /progress; this page links there.
// The social tabs (posts / saved / record) only render when CORE_MODE is off.

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const locale = getLocale(params?.locale);
  const userId = params?.userId;
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const pathname = usePathname();

  const BADGE_META = {
    first_challenge: { icon: "🥊", label: t("profileBadgeFirstChallenge"), color: RED },
    streak_3:        { icon: "🔥", label: t("profileBadgeStreak3"), color: "#FB923C" },
    streak_7:        { icon: "⚡", label: t("profileBadgeStreak7"), color: "#F59E0B" },
    jab_master:      { icon: "🎯", label: t("profileBadgeJabMaster"), color: "#3B82F6" },
    speed_king:      { icon: "💨", label: t("profileBadgeSpeedKing"), color: PURPLE },
    creator_starter: { icon: "🎬", label: t("creatorTag"), color: "#34D399" },
  };

  const {
    profileUser,
    userReels, setUserReels,
    savedUserReels, setSavedUserReels,
    aiFeedbackHistory, trainingSessions,
    loading, setLoading,
    totalLikes, setTotalLikes,
    stats, setStats,
    isFollowing, setIsFollowing,
    isMutual, setIsMutual,
    isOwnProfile,
    challengeRanks, pvpStats, sparringRecord,
    userBadges,
    rankUpRank, setRankUpRank,
    loadFollowStats,
  } = useProfileData({ user, userId, authLoading, locale });

  const [profileTab, setProfileTab] = useState("posts");
  const [menuOpen, setMenuOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [challengeSending, setChallengeSending] = useState(false);
  const [challengeSent, setChallengeSent] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [previewFailures, setPreviewFailures] = useState({});
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [showFighterCard, setShowFighterCard] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [followListView, setFollowListView] = useState(null); // "followers" | "following" | null

  const { handleFollow, handleLogout, handleSendChallenge } = useProfileActions({
    user, userId, locale, router,
    isOwnProfile, isFollowing, setIsFollowing,
    stats, setStats,
    profileUser,
    followLoading, setFollowLoading,
    signingOut, setSigningOut,
    setIsMutual,
    challengeSending, setChallengeSending,
    setChallengeSent, setShowChallengeModal,
    loadFollowStats,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
      router.push(`/${locale}/login`);
    }
  }, [user, authLoading, locale, router, setLoading]);

  const { deletingReelIds, deleteConfirmReel, setDeleteConfirmReel, handleDeleteReel } =
    useReelDeletion({ user, t, userReels, setUserReels, savedUserReels, setSavedUserReels, setTotalLikes });

  const streakCount = Number(profileUser?.dailyStreak ?? profileUser?.streakCount) || 0;

  // ── All hooks must be above conditional returns ──
  const earnedBadgeIds = useMemo(() => {
    const scores = (trainingSessions || []).map((s) => Number(s.score)).filter(Number.isFinite);
    return computeEarnedBadges({
      sessionCount: trainingSessions.length,
      bestScore: scores.length ? Math.max(...scores) : 0,
      streakDays: streakCount,
      studiedCount: (profileUser?.studiedFighters || []).length,
      totalFighters: FIGHTERS.length,
      radarStats: scores.length ? deriveRadarStats(scores, trainingSessions, streakCount) : null,
    });
  }, [trainingSessions, streakCount, profileUser?.studiedFighters]);

  const dna = useMemo(() => computeFighterDNA({ sessions: trainingSessions, locale }), [trainingSessions, locale]);

  if (loading) return <ProfileLoadingSkeleton />;
  if (!user || !profileUser) return null; // Will redirect

  // Own profile: the account XP from your own rounds. Someone else's: the server-written publicXp
  // (their rounds are private); until their next round it falls back to stored XP + streak only.
  const ownXp = getAccountXp({
    storedXp: profileUser?.xp,
    trainingSessions,
    streakDays: streakCount,
    bestStreakDays: Number(profileUser?.bestDailyStreak) || 0,
  });
  const xp = isOwnProfile || !Number.isFinite(Number(profileUser?.publicXp)) || profileUser?.publicXp == null
    ? ownXp
    : Number(profileUser.publicXp);
  const fighterRank = getFighterRank(xp);
  const nextRank = getNextRank(xp);
  const rankProgress = getRankProgress(xp);

  const feedbackScores = aiFeedbackHistory.map((f) => Number(f.score)).filter(Number.isFinite);
  const bestScore = feedbackScores.length ? Math.max(...feedbackScores) : null;
  const showSocial = !CORE_MODE || (stats.followers || 0) > 0 || (stats.following || 0) > 0;
  const visibleReels = profileTab === "saved" ? savedUserReels : userReels;

  return (
    <main className="page-enter" style={{ minHeight: "100dvh", background: "#08080a", color: "#fff" }}>
      {menuOpen && <MenuSheet onClose={() => setMenuOpen(false)} router={router} locale={locale} pathname={pathname} />}

      <ProfileView
        locale={locale} t={t}
        profileUser={profileUser} isOwnProfile={isOwnProfile}
        xp={xp} rank={fighterRank} nextRank={nextRank} rankPct={rankProgress}
        sessions={trainingSessions} streak={streakCount}
        earnedBadgeIds={earnedBadgeIds} dna={dna}
        social={showSocial ? { followers: stats.followers || 0, following: stats.following || 0 } : null}
        isFollowing={isFollowing} followLoading={followLoading}
        onBack={isOwnProfile ? undefined : () => router.back()}
        onMenu={isOwnProfile ? () => setMenuOpen(true) : undefined}
        onShareCard={() => setShowFighterCard(true)}
        onEdit={() => router.push(`/${locale}/profile/edit`)}
        onFollow={handleFollow}
        onFollowers={() => setFollowListView("followers")}
        onFollowing={() => setFollowListView("following")}
        onLogout={handleLogout} signingOut={signingOut}
        go={(path) => router.push(`/${locale}${path}`)}
      >
      {/* Social tabs — full app only */}
      {!CORE_MODE && (
        <div style={{ marginTop: 26 }}>
          <ProfileTabBar profileTab={profileTab} isOwnProfile={isOwnProfile} onTabChange={setProfileTab} t={t} />
          {profileTab === "record" ? (
            <BattleSection
              pvpStats={pvpStats} sparringRecord={sparringRecord} isOwnProfile={isOwnProfile}
              locale={locale} t={t} onGoToSparring={() => router.push(`/${locale}/sparring`)}
            />
          ) : profileTab !== "progress" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, width: "100%" }}>
              <ProfileReelsGrid
                visibleReels={visibleReels} previewFailures={previewFailures} deletingReelIds={deletingReelIds}
                isOwnProfile={isOwnProfile} profileTab={profileTab} userId={userId} locale={locale}
                router={router} user={user} t={t}
                markPreviewFailed={(reelId, type) => setPreviewFailures((p) => ({ ...p, [`${reelId}:${type}`]: true }))}
                setDeleteConfirmReel={setDeleteConfirmReel}
              />
            </div>
          ) : null}
        </div>
      )}
      </ProfileView>

      <ProfileModals
        rankUpRank={rankUpRank} setRankUpRank={setRankUpRank}
        deleteConfirmReel={deleteConfirmReel} setDeleteConfirmReel={setDeleteConfirmReel} handleDeleteReel={handleDeleteReel}
        showStreakModal={showStreakModal} setShowStreakModal={setShowStreakModal} profileUser={profileUser} trainingSessions={trainingSessions}
        showRankModal={showRankModal} setShowRankModal={setShowRankModal} xp={xp} fighterRank={fighterRank} nextRank={nextRank} rankProgress={rankProgress}
        showWeeklyRecap={showWeeklyRecap} setShowWeeklyRecap={setShowWeeklyRecap} aiFeedbackHistory={aiFeedbackHistory}
        showChallengeModal={showChallengeModal} setShowChallengeModal={setShowChallengeModal} isOwnProfile={isOwnProfile} challengeSent={challengeSent} challengeSending={challengeSending} handleSendChallenge={handleSendChallenge}
        showFighterCard={showFighterCard} setShowFighterCard={setShowFighterCard} pvpStats={pvpStats} bestScore={bestScore} challengeRanks={challengeRanks} userBadges={userBadges} badgeMeta={BADGE_META}
        showWeeklyModal={showWeeklyModal} setShowWeeklyModal={setShowWeeklyModal}
        locale={locale} router={router} t={t}
      />

      {followListView && (
        <FollowListModal type={followListView} userId={userId} locale={locale} onClose={() => setFollowListView(null)} />
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </main>
  );
}
