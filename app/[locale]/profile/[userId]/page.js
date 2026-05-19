"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { getLocale, translate } from "@/lib/i18n";
import { RANK_TIERS, calculateSessionXP, calculateUserXP, getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import ProfileFighterCard from "@/components/profile/ProfileFighterCard";
import RankUpModal from "@/components/RankUpModal";
import { getCurrentSeasonId } from "@/lib/season";
import MediaCover from "@/components/MediaCover";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import BottomSheet from "@/components/BottomSheet";
import { RED, GOLD, PURPLE, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/profile/profilePageStyles";
import RankBeltModal from "@/components/profile/RankBeltModal";
import StreakDetailModal from "@/components/profile/StreakDetailModal";
import FighterShareCard from "@/components/profile/FighterShareCard";
import { WeeklyRecapModal, WeeklyLeaderboardModal } from "@/components/profile/WeeklyModals";
import BattleSection from "@/components/profile/BattleSection";
import TrainingProgressSection from "@/components/profile/TrainingProgressSection";
import { getLocalDateKey, getPreviousLocalDateKey, getTimestampMs, formatScore, getActiveChallengeStreak, getSafeReelLikes } from "@/lib/utils";
import ProfileRivalComparison from "@/components/profile/ProfileRivalComparison";
import ProfileReelsGrid from "@/components/profile/ProfileReelsGrid";
import { useProfileData } from "@/hooks/useProfileData";
import { useProfileActions } from "@/hooks/useProfileActions";

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
  const [deletingReelIds, setDeletingReelIds] = useState(new Set());
  const [previewFailures, setPreviewFailures] = useState({});
  const [deleteConfirmReel, setDeleteConfirmReel] = useState(null);
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
  }, [user, authLoading, locale, router]);


  const handleDeleteReel = async (event, reel) => {
    event.stopPropagation();

    if (!user?.uid || reel.userId !== user.uid || deletingReelIds.has(reel.id)) {
      return;
    }

    const previousUserReels = userReels;
    const previousSavedReels = savedUserReels;

    setDeletingReelIds((prev) => new Set(prev).add(reel.id));
    setUserReels((prev) => prev.filter((item) => item.id !== reel.id));
    setSavedUserReels((prev) => prev.filter((item) => item.id !== reel.id));
    setTotalLikes((prev) => Math.max(0, prev - getSafeReelLikes(reel)));

    try {
      const {
        collection,
        deleteDoc,
        doc,
        getDocs,
        query,
        where,
        writeBatch,
      } = await import("firebase/firestore");

      const deleteDocsInBatches = async (docs) => {
        for (let i = 0; i < docs.length; i += 450) {
          const batch = writeBatch(db);
          docs.slice(i, i + 450).forEach((snapshotDoc) => {
            batch.delete(snapshotDoc.ref);
          });
          await batch.commit();
        }
      };

      const commentsSnapshot = await getDocs(collection(db, "reels", reel.id, "comments"));
      await deleteDocsInBatches(commentsSnapshot.docs);

      const likesSnapshot = await getDocs(query(
        collection(db, "user_likes"),
        where("reelId", "==", reel.id)
      ));
      await deleteDocsInBatches(likesSnapshot.docs);

      const savedSnapshot = await getDocs(query(
        collection(db, "saved_reels"),
        where("reelId", "==", reel.id)
      ));
      await deleteDocsInBatches(savedSnapshot.docs);

      const notificationsSnapshot = await getDocs(query(
        collection(db, "notifications"),
        where("reelId", "==", reel.id)
      ));
      await deleteDocsInBatches(notificationsSnapshot.docs);

      await deleteDoc(doc(db, "reels", reel.id));
    } catch (error) {
      console.error("Error deleting reel:", error);
      setUserReels(previousUserReels);
      setSavedUserReels(previousSavedReels);
      setTotalLikes(previousUserReels.reduce((sum, item) => sum + getSafeReelLikes(item), 0));
      alert(t("deleteReelError"));
    } finally {
      setDeletingReelIds((prev) => {
        const next = new Set(prev);
        next.delete(reel.id);
        return next;
      });
    }
  };

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
  }, [trainingSessions, t]);

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
  }, [aiFeedbackHistory, t]);

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
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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


      {rankUpRank && (
        <RankUpModal rank={rankUpRank} onClose={() => setRankUpRank(null)} t={t} />
      )}

      <BottomSheet
        open={!!deleteConfirmReel}
        onClose={() => setDeleteConfirmReel(null)}
        centered
        zIndex={9999}
        maxWidth={340}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
          <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#fff" }}>
            {t("profileDeleteTitle")}
          </p>
          <p style={{ margin: "0 0 24px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {t("profileDeleteWarning")}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setDeleteConfirmReel(null)}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {t("profileCancelBtn")}
            </button>
            <button
              type="button"
              onClick={async () => { const reel = deleteConfirmReel; setDeleteConfirmReel(null); await handleDeleteReel({ stopPropagation: () => {} }, reel); }}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.15)", color: "#F87171", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
            >
              {t("profileDeleteBtn")}
            </button>
          </div>
        </div>
      </BottomSheet>

      {showStreakModal && (
        <StreakDetailModal
          profile={profileUser}
          trainingSessions={trainingSessions}
          t={t}
          onClose={() => setShowStreakModal(false)}
        />
      )}

      {showRankModal && (
        <RankBeltModal
          xp={xp}
          fighterRank={fighterRank}
          nextRank={nextRank}
          rankProgress={rankProgress}
          t={t}
          onClose={() => setShowRankModal(false)}
        />
      )}

      {showWeeklyRecap && (
        <WeeklyRecapModal
          aiFeedbackHistory={aiFeedbackHistory}
          profileUser={profileUser}
          t={t}
          onClose={() => setShowWeeklyRecap(false)}
        />
      )}

      {showChallengeModal && !isOwnProfile && (
        <BottomSheet
          open
          onClose={() => setShowChallengeModal(false)}
          zIndex={999}
          accent={PURPLE}
          maxWidth={480}
        >
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: PURPLE, letterSpacing: 1.4, textTransform: "uppercase" }}>GAVANA PvP</p>
            <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: "#fff" }}>
              {t("profileSendChallenge")}
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            {t("profilePickChallenge")}
          </p>
          {challengeSent ? (
            <div style={{ textAlign: "center", padding: "24px 0", fontSize: 15, fontWeight: 900, color: "#34D399" }}>
              {t("profileChallengeSent")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "jab-minute", emoji: "👊", label: t("profileChallengeJabMinute"), desc: t("profileChallengeJabDesc") },
                { id: "speed-test", emoji: "⚡", label: t("profileChallengeSpeedTest"), desc: t("profileChallengeSpeedDesc") },
                { id: "combo-master", emoji: "🔥", label: t("profileChallengeComboMaster"), desc: t("profileChallengeComboDesc") },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={challengeSending}
                  onClick={() => handleSendChallenge(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(167,139,250,0.2)", background: challengeSending ? "rgba(167,139,250,0.04)" : "rgba(167,139,250,0.08)", cursor: challengeSending ? "not-allowed" : "pointer", textAlign: "left", width: "100%", transition: "background 0.15s" }}
                >
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{c.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{c.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 16, color: "rgba(167,139,250,0.6)", flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          )}
        </BottomSheet>
      )}

      {showFighterCard && (
        <FighterShareCard
          profileUser={profileUser}
          fighterRank={fighterRank}
          xp={xp}
          rankProgress={rankProgress}
          pvpStats={pvpStats}
          bestScore={bestScore}
          challengeStreak={getActiveChallengeStreak(profileUser)}
          challengeRanks={challengeRanks}
          aiFeedbackHistory={aiFeedbackHistory}
          userBadges={userBadges}
          badgeMeta={BADGE_META}
          locale={locale}
          t={t}
          cardShareCopied={cardShareCopied}
          onShareCopied={setCardShareCopied}
          onClose={() => setShowFighterCard(false)}
        />
      )}

      {showWeeklyModal && challengeRanks && (
        <WeeklyLeaderboardModal
          challengeRanks={challengeRanks}
          t={t}
          onClose={() => setShowWeeklyModal(false)}
          onGoToChallenges={() => { setShowWeeklyModal(false); router.push(`/${locale}/challenges`); }}
        />
      )}
    </div>
  );
}

