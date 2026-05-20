"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { getLocale, translate } from "@/lib/i18n";
import { calculateSessionXP, calculateUserXP, getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import ProfileFighterCard from "@/components/profile/ProfileFighterCard";
import { RED, GOLD, PURPLE, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/profile/profilePageStyles";
import BattleSection from "@/components/profile/BattleSection";
import TrainingProgressSection from "@/components/profile/TrainingProgressSection";
import { getTimestampMs, formatScore } from "@/lib/utils";
import ProfileRivalComparison from "@/components/profile/ProfileRivalComparison";
import ProfileReelsGrid from "@/components/profile/ProfileReelsGrid";
import { useProfileData } from "@/hooks/useProfileData";
import { useProfileActions } from "@/hooks/useProfileActions";
import { useReelDeletion } from "@/hooks/useReelDeletion";
import dynamic from "next/dynamic";
const ProfileModals = dynamic(
  () => import("@/components/profile/ProfileModals").then((m) => ({ default: m.ProfileModals })),
  { ssr: false }
);

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const locale = getLocale(params?.locale);
  const userId = params?.userId;
  const t = (key) => translate(locale, key);
  const router = useRouter();

  const BADGE_META = {
    first_challenge: { icon: "🥊", label: t("profileBadgeFirstChallenge"), color: RED },
    streak_3:        { icon: "🔥", label: t("profileBadgeStreak3"), color: "#FB923C" },
    streak_7:        { icon: "⚡", label: t("profileBadgeStreak7"), color: "#F59E0B" },
    jab_master:      { icon: "🎯", label: t("profileBadgeJabMaster"), color: "#60A5FA" },
    speed_king:      { icon: "💨", label: t("profileBadgeSpeedKing"), color: PURPLE },
    creator_starter: { icon: "🎬", label: t("creatorTag"), color: "#34D399" },
  };
  const {
    profileUser, setProfileUser,
    userReels, setUserReels,
    savedUserReels, setSavedUserReels,
    aiFeedbackHistory, trainingSessions,
    loading, setLoading,
    totalLikes, setTotalLikes,
    stats, setStats,
    isFollowing, setIsFollowing,
    isMutual, setIsMutual,
    isOwnProfile,
    challengeRanks, pvpStats, sparringRecord, myStats,
    userBadges, coachBookings,
    rankUpRank, setRankUpRank,
    loadFollowStats,
  } = useProfileData({ user, userId, authLoading, locale });

  const tabContentRef = useRef(null);
  const [profileTab, setProfileTab] = useState("posts");
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
  const [cardShareCopied, setCardShareCopied] = useState(false);
  const [expandedTrainingGroups, setExpandedTrainingGroups] = useState(new Set());

  const { handleMessage, handleFollow, handleLogout, handleSwitchAccount, handleSendChallenge } = useProfileActions({
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

  const {
    deletingReelIds,
    deleteConfirmReel, setDeleteConfirmReel,
    handleDeleteReel,
  } = useReelDeletion({ user, t, userReels, setUserReels, savedUserReels, setSavedUserReels, setTotalLikes });

  // Per-session XP breakdowns — must be before any early return (Rules of Hooks)
  const xpBreakdowns = useMemo(() => {
    const streak = profileUser?.streakCount || 0;
    const sortedAsc = [...(aiFeedbackHistory || [])]
      .map((fb) => ({ ...fb, _ts: getTimestampMs(fb.createdAt) }))
      .sort((a, b) => a._ts - b._ts);
    const result = {};
    let prevScore = null;
    for (const fb of sortedAsc) {
      const score = Number(fb.score);
      if (!Number.isFinite(score)) continue;
      result[fb.id] = calculateSessionXP(score, prevScore, streak);
      prevScore = score;
    }
    return result;
  }, [aiFeedbackHistory, profileUser?.streakCount]);

  const groupedTrainingSessions = useMemo(() => {
    const groups = new Map();

    for (const session of trainingSessions) {
      const key = session.reelId || "free_training";
      const existing = groups.get(key) || {
        key,
        reelId: session.reelId || null,
        label: session.reelId ? `${t("reels.combo")} ${String(session.reelId).slice(0, 8)}` : t("freeTraining"),
        sessions: [],
        latestScore: null,
        bestScore: null,
        firstScore: null,
        latestAt: 0,
        earliestAt: Infinity,
        totalHits: 0,
        totalPunches: 0,
        bestComboStr: null,
      };

      const score = Number(session.score);
      const createdAtMs = getTimestampMs(session.createdAt);
      const hits = Number(session.hits) || 0;
      const punches = Number(session.totalPunches || session.punches) || 0;

      existing.sessions.push(session);
      existing.totalHits += hits;
      existing.totalPunches += punches;

      if (Number.isFinite(score)) {
        existing.bestScore = existing.bestScore === null ? score : Math.max(existing.bestScore, score);
        if (createdAtMs >= existing.latestAt) {
          existing.latestAt = createdAtMs;
          existing.latestScore = score;
        }
        if (createdAtMs < existing.earliestAt) {
          existing.earliestAt = createdAtMs;
          existing.firstScore = score;
        }
      }
      if (session.combo && (!existing.bestComboStr || score > existing.bestScore)) {
        existing.bestComboStr = session.combo;
      }

      groups.set(key, existing);
    }

    return [...groups.values()]
      .map((group) => {
        const sortedSessions = group.sessions.sort((a, b) => {
          const attemptDelta = (Number(b.attemptNumber) || 0) - (Number(a.attemptNumber) || 0);
          if (attemptDelta !== 0) return attemptDelta;
          return getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt);
        });
        const acc = group.totalPunches > 0
          ? Math.round((group.totalHits / group.totalPunches) * 100)
          : null;
        const delta = group.firstScore !== null && group.latestScore !== null
          ? group.latestScore - group.firstScore
          : null;
        return {
          ...group,
          sessions: sortedSessions,
          accuracy: acc,
          improvementDelta: delta,
        };
      })
      .sort((a, b) => b.latestAt - a.latestAt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainingSessions, locale]); // t omitted — recreated every render, locale covers it

  const toggleTrainingGroup = (groupKey) => {
    setExpandedTrainingGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  useEffect(() => {
    if (tabContentRef.current) {
      tabContentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [profileTab]);

  const progressStats = useMemo(() => {
    const sortedAsc = [...(aiFeedbackHistory || [])]
      .map((feedback) => ({
        ...feedback,
        scoreNumber: Number(feedback.score),
        ts: getTimestampMs(feedback.createdAt),
      }))
      .filter((feedback) => Number.isFinite(feedback.scoreNumber))
      .sort((a, b) => a.ts - b.ts);

    const totalSessions = sortedAsc.length;
    const scores = sortedAsc.map((feedback) => feedback.scoreNumber);
    const firstScore = totalSessions ? sortedAsc[0].scoreNumber : null;
    const latestScoreValue = totalSessions ? sortedAsc[totalSessions - 1].scoreNumber : null;
    const bestScoreValue = totalSessions ? Math.max(...scores) : null;
    const averageScoreValue = totalSessions
      ? scores.reduce((sum, score) => sum + score, 0) / totalSessions
      : null;
    const improvement = firstScore !== null && latestScoreValue !== null
      ? latestScoreValue - firstScore
      : null;
    const weeklySequence = sortedAsc.slice(-7).map((feedback) => formatScore(feedback.scoreNumber));

    const comboMap = new Map();
    for (const feedback of sortedAsc) {
      const key = feedback.reelId || "free_training";
      const existing = comboMap.get(key) || {
        key,
        label: feedback.reelId ? `${t("reels.combo")} ${String(feedback.reelId).slice(0, 8)}` : t("freeTraining"),
        bestScore: null,
        attemptCount: 0,
      };

      existing.attemptCount += 1;
      existing.bestScore = existing.bestScore === null
        ? feedback.scoreNumber
        : Math.max(existing.bestScore, feedback.scoreNumber);
      comboMap.set(key, existing);
    }

    return {
      totalSessions,
      firstScore,
      latestScore: latestScoreValue,
      bestScore: bestScoreValue,
      averageScore: averageScoreValue,
      improvement,
      weeklySequence,
      comboProgress: [...comboMap.values()].sort((a, b) => b.bestScore - a.bestScore),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiFeedbackHistory, locale]); // t omitted — recreated every render, locale covers it

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#080808", padding: "calc(28px + env(safe-area-inset-top)) 16px 40px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "grid", gap: 14 }}>
          <div className="shimmer" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div className="shimmer" style={{ height: 220, borderRadius: 20 }} />
          <div className="shimmer" style={{ height: 80, borderRadius: 16 }} />
          <div className="shimmer" style={{ height: 60, borderRadius: 14 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[1,2,3].map((i) => <div key={i} className="shimmer" style={{ height: 70, borderRadius: 14 }} />)}
          </div>
          <div className="shimmer" style={{ height: 160, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!user || !profileUser) {
    return null; // Will redirect
  }

  const feedbackScores = aiFeedbackHistory
    .map((feedback) => Number(feedback.score))
    .filter((score) => Number.isFinite(score));

  const streakCount = profileUser?.streakCount || 0;
  const storedChallengeXP = Number(profileUser?.xp) || 0;
  const trainingSessionXP = trainingSessions.reduce((sum, s) => sum + (Number(s.xpGained) || 0), 0);
  const xp = storedChallengeXP + trainingSessionXP + calculateUserXP({
    aiFeedbackDocs: aiFeedbackHistory,
    streakDays: streakCount,
    likesReceived: totalLikes,
  });
  const fighterRank = getFighterRank(xp);
  const nextRank = getNextRank(xp);
  const rankProgress = getRankProgress(xp);
  const xpToNextVal = nextRank ? nextRank.minXP - xp : 0;

  const latestScore = feedbackScores.length ? feedbackScores[0] : null;
  const bestScore = feedbackScores.length ? Math.max(...feedbackScores) : null;
  const averageScore = feedbackScores.length
    ? feedbackScores.reduce((sum, score) => sum + score, 0) / feedbackScores.length
    : null;
  const visibleReels = profileTab === "saved" ? savedUserReels : userReels;
  const markPreviewFailed = (reelId, type) => {
    setPreviewFailures((prev) => ({ ...prev, [`${reelId}:${type}`]: true }));
  };
  const handleStatNavigate = (target) => {
    if (target === "posts") {
      setProfileTab("posts");
      router.push(`/${locale}/profile/${userId}`);
      return;
    }

    router.push(`/${locale}/profile/${userId}?view=${target}`);
  };

  return (
    <div className="page-enter" style={{
      minHeight: "100vh",
      background: `radial-gradient(ellipse at top center, ${redAlpha(0.08)} 0%, transparent 50%), var(--background)`,
      color: "var(--text-primary)",
      padding: 0,
      overflowX: "hidden"
    }}>
      <header style={styles.backHeader}>
        <button
          type="button"
          style={styles.backBtnProfile}
          onClick={() => router.back()}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </header>
      <ProfileFighterCard
        profileUser={profileUser}
        isOwnProfile={isOwnProfile}
        userReels={userReels}
        stats={stats}
        fighterRank={fighterRank}
        nextRank={nextRank}
        xp={xp}
        xpToNextVal={xpToNextVal}
        rankProgress={rankProgress}
        bestScore={bestScore}
        userBadges={userBadges}
        challengeRanks={challengeRanks}
        pvpStats={pvpStats}
        isMutual={isMutual}
        isFollowing={isFollowing}
        followLoading={followLoading}
        signingOut={signingOut}
        t={t}
        locale={locale}
        router={router}
        onShowRankModal={() => setShowRankModal(true)}
        onShowFighterCard={() => setShowFighterCard(true)}
        onShowChallengeModal={() => { setShowChallengeModal(true); setChallengeSent(false); }}
        onFollow={handleFollow}
        onMessage={handleMessage}
        onLogout={handleLogout}
        onStatNavigate={handleStatNavigate}
      />

      {/* ── Rival Comparison ── */}
      <ProfileRivalComparison
        isOwnProfile={isOwnProfile}
        myStats={myStats}
        profileUser={profileUser}
        xp={xp}
        bestScore={bestScore}
        t={t}
      />

      <div style={styles.profileTabs}>
        <button
          type="button"
          onClick={() => setProfileTab("posts")}
          style={{
            ...styles.profileTab,
            ...(profileTab === "posts" ? styles.profileTabActive : {})
          }}
        >
          {t("postsGrid")}
        </button>
        {isOwnProfile && (
          <button
            type="button"
            onClick={() => setProfileTab("saved")}
            style={{
              ...styles.profileTab,
              ...(profileTab === "saved" ? styles.profileTabActive : {})
            }}
          >
            {t("saved")}
          </button>
        )}
        <button
          type="button"
          onClick={() => setProfileTab("progress")}
          style={{
            ...styles.profileTab,
            ...(profileTab === "progress" ? styles.profileTabActive : {})
          }}
        >
          {t("aiProgress")}
        </button>
        <button
          type="button"
          onClick={() => setProfileTab("record")}
          style={{
            ...styles.profileTab,
            ...(profileTab === "record" ? styles.profileTabActive : {})
          }}
        >
          ⚔️ {t("profileRecordTab")}
        </button>
      </div>

      <div ref={tabContentRef} />

      {profileTab === "progress" ? (
        <TrainingProgressSection
          feedbackScores={feedbackScores}
          progressStats={progressStats}
          streakCount={streakCount}
          fighterRank={fighterRank}
          xp={xp}
          nextRank={nextRank}
          rankProgress={rankProgress}
          aiFeedbackHistory={aiFeedbackHistory}
          isOwnProfile={isOwnProfile}
          locale={locale}
          t={t}
          onGoToDashboard={() => router.push(`/${locale}/dashboard`)}
          onGoToReels={() => router.push(`/${locale}/reels`)}
        />
      ) : profileTab === "record" ? (
        <BattleSection
          pvpStats={pvpStats}
          sparringRecord={sparringRecord}
          isOwnProfile={isOwnProfile}
          locale={locale}
          t={t}
          onGoToSparring={() => router.push(`/${locale}/sparring`)}
        />
      ) : (
      <div style={{
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 2,
        width: "100%"
      }}>
        <ProfileReelsGrid
          visibleReels={visibleReels}
          previewFailures={previewFailures}
          deletingReelIds={deletingReelIds}
          isOwnProfile={isOwnProfile}
          profileTab={profileTab}
          userId={userId}
          locale={locale}
          router={router}
          user={user}
          styles={styles}
          t={t}
          markPreviewFailed={markPreviewFailed}
          setDeleteConfirmReel={setDeleteConfirmReel}
        />
      </div>
      )}


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
        cardShareCopied={cardShareCopied} setCardShareCopied={setCardShareCopied}
      />
    </div>
  );
}

