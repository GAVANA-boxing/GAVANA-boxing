"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { createNotification, createNewFollowerNotification } from "@/lib/notifications";
import { startConversation } from "@/lib/messaging";
import { getLocale, translate } from "@/lib/i18n";
import { RANK_TIERS, calculateSessionXP, calculateUserXP, getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import RankIcon from "@/components/RankIcon";
import RankUpModal from "@/components/RankUpModal";
import { getCurrentSeasonId } from "@/lib/season";
import MediaCover from "@/components/MediaCover";

function getSafeReelLikes(reel) {
  const fieldLikes = typeof reel.likes === "number" && !Number.isNaN(reel.likes)
    ? reel.likes
    : reel.likesCount;

  if (typeof fieldLikes !== "number" || Number.isNaN(fieldLikes)) {
    return 0;
  }

  return Math.max(0, fieldLikes);
}

function getTimestampMs(timestamp) {
  if (!timestamp) return 0;
  if (timestamp.toMillis) return timestamp.toMillis();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatFeedbackDate(timestamp) {
  const time = getTimestampMs(timestamp);
  if (!time) return "";
  return new Date(time).toLocaleDateString();
}

function formatScore(score) {
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) return "0";
  return numericScore.toFixed(1).replace(/\.0$/, "");
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPreviousLocalDateKey(date = new Date()) {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return getLocalDateKey(previous);
}

function getActiveChallengeStreak(profile) {
  const lastDate = String(profile?.lastChallengeDate || "");
  if (lastDate !== getLocalDateKey() && lastDate !== getPreviousLocalDateKey()) return 0;
  return Number(profile?.challengeStreak) || 0;
}

function RankBeltModal({ xp, fighterRank, nextRank, rankProgress, t, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        background: "rgba(0,0,0,0.78)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(100%, 430px)",
          borderRadius: 24,
          background: "linear-gradient(160deg, #111 0%, #0b0b0b 100%)",
          border: `1px solid ${fighterRank.color}44`,
          boxShadow: fighterRank.glowColor ? `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${fighterRank.color}22, 0 0 40px ${fighterRank.glowColor}` : "0 32px 80px rgba(0,0,0,0.6)",
          padding: "26px 22px 22px",
          display: "grid",
          gap: 18,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ margin: 0, color: fighterRank.color, fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>{t("rankBeltModalTitle")}</p>
            <h2 style={{ margin: "5px 0 0", color: "#fff", fontSize: 26, fontWeight: 1000, lineHeight: 1 }}>{t(fighterRank.key)}</h2>
            <p style={{ margin: "8px 0 0", color: "#888", fontSize: 13, lineHeight: 1.4 }}>{t("rankBeltMotivation")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ flexShrink: 0, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "#888", fontSize: 11, fontWeight: 800 }}>{xp.toLocaleString()} XP</span>
            {nextRank ? (
              <span style={{ color: fighterRank.color, fontSize: 11, fontWeight: 800 }}>
                {nextRank.minXP - xp} XP → {t(nextRank.key)}
              </span>
            ) : (
              <span style={{ color: fighterRank.color, fontSize: 11, fontWeight: 800 }}>{t("rankBeltMaxed")}</span>
            )}
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: 999, background: fighterRank.gradient, transition: "width 600ms ease", boxShadow: fighterRank.glowColor ? `0 0 12px ${fighterRank.glowColor}` : "none" }} />
          </div>
          <p style={{ margin: 0, color: "#555", fontSize: 10, fontWeight: 700, textAlign: "right" }}>{rankProgress}%</p>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <p style={{ margin: "0 0 6px", color: "#666", fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase" }}>{t("rankBeltAllRanks")}</p>
          {RANK_TIERS.map((tier) => {
            const isCurrent = tier.key === fighterRank.key;
            const isReached = xp >= tier.minXP;
            return (
              <div key={tier.key} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: 12,
                background: isCurrent ? `${tier.color}18` : "rgba(255,255,255,0.03)",
                border: isCurrent ? `1px solid ${tier.color}44` : "1px solid rgba(255,255,255,0.05)",
                opacity: isReached ? 1 : 0.38,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: isReached ? tier.color : "#333", boxShadow: isReached && tier.glowColor ? `0 0 8px ${tier.glowColor}` : "none" }} />
                  <span style={{ color: isReached ? "#fff" : "#555", fontSize: 13, fontWeight: isCurrent ? 900 : 700 }}>{t(tier.key)}</span>
                  {isCurrent && <span style={{ fontSize: 9, fontWeight: 900, color: tier.color, letterSpacing: 1, textTransform: "uppercase" }}>{t("rankBeltCurrent")}</span>}
                </div>
                <span style={{ color: "#555", fontSize: 11, fontWeight: 700 }}>{tier.minXP.toLocaleString()} XP</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StreakDetailModal({ profile, trainingSessions, t, onClose }) {
  const challengeStreak = Number(profile?.challengeStreak) || 0;
  const trainingStreak = Number(profile?.streakCount) || 0;
  const lastChallengeDate = profile?.lastChallengeDate || "";
  const hasAnyStreak = challengeStreak > 0 || trainingStreak > 0;

  const lastTrainingMs = trainingSessions.length
    ? Math.max(...trainingSessions.map((s) => {
        if (!s.createdAt) return 0;
        if (s.createdAt.toMillis) return s.createdAt.toMillis();
        const d = s.createdAt.toDate ? s.createdAt.toDate() : new Date(s.createdAt);
        return d.getTime() || 0;
      }))
    : 0;

  const lastTrainingLabel = lastTrainingMs
    ? new Date(lastTrainingMs).toLocaleDateString()
    : lastChallengeDate || null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(100%, 400px)",
          borderRadius: 24,
          background: "linear-gradient(160deg, #111 0%, #0b0b0b 100%)",
          border: "1px solid rgba(251,146,60,0.28)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(251,146,60,0.12)",
          padding: "28px 24px 24px",
          display: "grid",
          gap: 20,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ margin: 0, color: "#FB923C", fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>🔥</p>
            <h2 style={{ margin: "4px 0 0", color: "#fff", fontSize: 22, fontWeight: 1000 }}>{t("streakModalTitle")}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>

        {!hasAnyStreak ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: "#888", fontSize: 14 }}>
            {t("streakNoStreak")}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={streakCardStyle}>
              <span style={streakCardLabel}>{t("streakCurrentDays")}</span>
              <span style={{ ...streakCardValue, color: "#FB923C" }}>{challengeStreak}</span>
              <span style={streakCardUnit}>days</span>
            </div>
            <div style={streakCardStyle}>
              <span style={streakCardLabel}>{t("streakBestDays")}</span>
              <span style={{ ...streakCardValue, color: "#D4AF37" }}>{Math.max(challengeStreak, trainingStreak)}</span>
              <span style={streakCardUnit}>days</span>
            </div>
          </div>
        )}

        {hasAnyStreak && (
          <div style={{ display: "grid", gap: 10 }}>
            {lastTrainingLabel && (
              <div style={streakRowStyle}>
                <span style={streakRowLabel}>{t("streakLastTrain")}</span>
                <span style={streakRowValue}>{lastTrainingLabel}</span>
              </div>
            )}
            <div style={{ ...streakRowStyle }}>
              <span style={streakRowLabel}>{t("streakCurrentDays")}</span>
              <span style={streakRowValue}>{challengeStreak} {challengeStreak === 1 ? "day" : "days"}</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#888", fontSize: 11, fontWeight: 700 }}>Streak progress</span>
                <span style={{ color: "#FB923C", fontSize: 11, fontWeight: 900 }}>{Math.min(100, Math.round((challengeStreak / 7) * 100))}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(100, Math.round((challengeStreak / 7) * 100))}%`, borderRadius: 999, background: "linear-gradient(90deg, #EA580C, #FB923C)", transition: "width 500ms ease" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const streakCardStyle = {
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "14px 16px",
  display: "grid",
  gap: 4,
  justifyItems: "center",
};
const streakCardLabel = { color: "#888", fontSize: 10, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" };
const streakCardValue = { fontSize: 36, fontWeight: 1000, lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)" };
const streakCardUnit = { color: "#888", fontSize: 11, fontWeight: 700 };
const streakRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center" };
const streakRowLabel = { color: "#888", fontSize: 13, fontWeight: 700 };
const streakRowValue = { color: "#fff", fontSize: 13, fontWeight: 900 };

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const locale = getLocale(params?.locale);
  const userId = params?.userId;
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const [profileUser, setProfileUser] = useState(null);
  const [userReels, setUserReels] = useState([]);
  const [savedUserReels, setSavedUserReels] = useState([]);
  const [aiFeedbackHistory, setAiFeedbackHistory] = useState([]);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [profileTab, setProfileTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isMutual, setIsMutual] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [previewFailures, setPreviewFailures] = useState({});
  const [deletingReelIds, setDeletingReelIds] = useState(new Set());
  const [rankUpRank, setRankUpRank] = useState(null);
  const [expandedTrainingGroups, setExpandedTrainingGroups] = useState(new Set());
  const [showAiFeedbackList, setShowAiFeedbackList] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showRankModal, setShowRankModal] = useState(false);
  const [dailyMissionData, setDailyMissionData] = useState(null);
  const [challengeRanks, setChallengeRanks] = useState(null);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showWeeklyRecap, setShowWeeklyRecap] = useState(false);
  const [pvpStats, setPvpStats] = useState(null);
  const [coachBookings, setCoachBookings] = useState([]);
  const [userBadges, setUserBadges] = useState([]);
  const rankUpShownRef = useRef(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
      router.push(`/${locale}/login`);
    }
  }, [user, authLoading, locale, router]);

  // Load profile data
  useEffect(() => {
    let unsubscribeReels = null;
    let isActive = true;

    async function loadUserProfile() {
      if (authLoading) return;

      if (!user || !userId) {
        setLoading(false);
        return;
      }

      try {
        const { collection, query, where, orderBy, onSnapshot, doc, getDoc } = await import("firebase/firestore");

        // Check if this is the current user's own profile
        const isOwn = user.uid === userId;
        setIsOwnProfile(isOwn);

        const userDoc = await getDoc(doc(db, "users", userId));
        const userData = userDoc.exists() ? userDoc.data() : {};
        const fallbackName = userData.username || userData.email?.split("@")[0] || `user_${userId.slice(0, 8)}`;
        const profileUserData = {
          id: userId,
          username: userData.username || fallbackName,
          displayName: userData.displayName || userData.username || fallbackName,
          bio: userData.bio || "",
          photoURL: userData.photoURL || userData.profileImageUrl || "",
          email: userData.email || `${fallbackName}@example.com`,
          streakCount: Number(userData.streakCount) || 0,
          xp: Number(userData.xp) || 0,
          totalChallengesCompleted: Number(userData.totalChallengesCompleted) || 0,
          challengeStreak: Number(userData.challengeStreak) || 0,
          lastChallengeDate: userData.lastChallengeDate || "",
        };
        setProfileUser(profileUserData);

        // Listen to user's reels so likes update in real time from the reel document.
        const reelsQuery = query(
          collection(db, "reels"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );

        unsubscribeReels = onSnapshot(reelsQuery, (reelsSnapshot) => {
          if (!isActive) return;
          const reelsData = reelsSnapshot.docs.map((reelDoc) => ({
            id: reelDoc.id,
            ...reelDoc.data()
          }));
          setUserReels(reelsData);
          setTotalLikes(reelsData.reduce((sum, reel) => sum + getSafeReelLikes(reel), 0));
          setLoading(false);
        }, (error) => {
          if (!isActive) return;
          console.error("Error listening to profile reels:", error);
          setUserReels([]);
          setTotalLikes(0);
          setLoading(false);
        });

        await loadSavedReels(userId);

        // Load followers/following counts
        await loadFollowStats(userId);

        // Check if current user is following this profile
        if (!isOwn) {
          await checkFollowStatus(user.uid, userId);
        }

      } catch (error) {
        console.error("Error loading profile:", error);
        if (isActive) {
          setLoading(false);
        }
      }
    }

    setLoading(true);
    loadUserProfile();

    return () => {
      isActive = false;
      if (unsubscribeReels) {
        unsubscribeReels();
      }
    };
  }, [user, userId, authLoading]);

  useEffect(() => {
    if (authLoading || !user?.uid || !userId) {
      setAiFeedbackHistory([]);
      return;
    }

    let isActive = true;
    let unsubscribeFeedback = null;

    async function listenForAiFeedback() {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const feedbackQuery = query(
          collection(db, "ai_feedback"),
          where("userId", "==", userId)
        );

        unsubscribeFeedback = onSnapshot(feedbackQuery, (snapshot) => {
          if (!isActive) return;

          const feedbackItems = snapshot.docs
            .map((feedbackDoc) => ({
              id: feedbackDoc.id,
              ...feedbackDoc.data(),
            }))
            .filter((feedback) => Number.isFinite(Number(feedback.score)))
            .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

          setAiFeedbackHistory(feedbackItems);
        }, (error) => {
          if (!isActive) return;
          console.error("Error listening to AI feedback:", error);
          setAiFeedbackHistory([]);
        });
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading AI feedback:", error);
        setAiFeedbackHistory([]);
      }
    }

    listenForAiFeedback();

    return () => {
      isActive = false;
      if (unsubscribeFeedback) {
        unsubscribeFeedback();
      }
    };
  }, [authLoading, user?.uid, userId]);

  useEffect(() => {
    if (authLoading || !user?.uid || !userId) {
      setTrainingSessions([]);
      return;
    }

    let isActive = true;
    let unsubscribeTraining = null;

    async function listenForTrainingSessions() {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const trainingQuery = query(
          collection(db, "training_sessions"),
          where("userId", "==", userId)
        );

        unsubscribeTraining = onSnapshot(trainingQuery, (snapshot) => {
          if (!isActive) return;

          const sessions = snapshot.docs
            .map((sessionDoc) => ({
              id: sessionDoc.id,
              ...sessionDoc.data(),
            }))
            .filter((session) => session.type === "training")
            .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

          setTrainingSessions(sessions);
        }, (error) => {
          if (!isActive) return;
          console.error("Error listening to training sessions:", error);
          setTrainingSessions([]);
        });
      } catch (error) {
        if (!isActive) return;
        console.error("Error loading training sessions:", error);
        setTrainingSessions([]);
      }
    }

    listenForTrainingSessions();

    return () => {
      isActive = false;
      if (unsubscribeTraining) {
        unsubscribeTraining();
      }
    };
  }, [authLoading, user?.uid, userId]);

  // Load daily mission data for own profile
  useEffect(() => {
    if (authLoading || !user?.uid || !userId || user.uid !== userId) {
      setDailyMissionData(null);
      return;
    }
    let active = true;

    async function loadDailyMission() {
      try {
        const { doc: fsDoc, getDoc: fsGetDoc } = await import("firebase/firestore");
        const snap = await fsGetDoc(fsDoc(db, "users", user.uid));
        if (!active) return;
        const data = snap.exists() ? snap.data() : {};
        const todayKey = new Date().toISOString().split("T")[0];
        setDailyMissionData({
          dailyStreak: Number(data.dailyStreak) || 0,
          bestDailyStreak: Number(data.bestDailyStreak) || 0,
          missionCompleted: data.dailyMissionCompleted === todayKey,
          lastTrainingDate: data.lastTrainingDate || null,
        });
      } catch (e) {
        if (active) setDailyMissionData(null);
      }
    }

    loadDailyMission();
    return () => { active = false; };
  }, [authLoading, user?.uid, userId]);

  // Load challenge ranks — weekly + all-time rank for this profile
  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadChallengeRanks() {
      try {
        const { collection, getDocs } = await import("firebase/firestore");
        const snap = await getDocs(collection(db, "challenge_results"));
        if (!active) return;

        const currentSeasonId = getCurrentSeasonId();

        // Collect all results
        const allResults = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.userId && d.score != null) {
            allResults.push({
              userId: d.userId,
              score: Number(d.score),
              seasonId: d.seasonId || null,
            });
          }
        });

        // Weekly: filter by current season, dedupe per user (best score)
        const weeklyByUser = {};
        for (const r of allResults) {
          if (r.seasonId !== currentSeasonId) continue;
          const score = r.score;
          if (Number.isNaN(score)) continue;
          if (!weeklyByUser[r.userId] || score > weeklyByUser[r.userId]) {
            weeklyByUser[r.userId] = score;
          }
        }
        const weeklySorted = Object.entries(weeklyByUser)
          .sort((a, b) => b[1] - a[1]);
        const weeklyRankIdx = weeklySorted.findIndex(([uid]) => uid === userId);
        const weeklyRank = weeklyRankIdx >= 0 ? weeklyRankIdx + 1 : null;
        const bestWeeklyScore = weeklyByUser[userId] ?? null;

        // All-time: dedupe per user (best score across all results)
        const allTimeByUser = {};
        for (const r of allResults) {
          const score = r.score;
          if (Number.isNaN(score)) continue;
          if (!allTimeByUser[r.userId] || score > allTimeByUser[r.userId]) {
            allTimeByUser[r.userId] = score;
          }
        }
        const allTimeSorted = Object.entries(allTimeByUser)
          .sort((a, b) => b[1] - a[1]);
        const allTimeRankIdx = allTimeSorted.findIndex(([uid]) => uid === userId);
        const allTimeRank = allTimeRankIdx >= 0 ? allTimeRankIdx + 1 : null;

        if (active) {
          setChallengeRanks({ weeklyRank, allTimeRank, bestWeeklyScore, currentSeasonId });
        }
      } catch (e) {
        if (active) setChallengeRanks(null);
      }
    }

    loadChallengeRanks();
    return () => { active = false; };
  }, [userId]);

  // Load PvP stats for this profile
  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadPvpStats() {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const [asChallenger, asOpponent] = await Promise.all([
          getDocs(query(collection(db, "pvp_results"), where("challengerId", "==", userId))),
          getDocs(query(collection(db, "pvp_results"), where("opponentId", "==", userId))),
        ]);
        if (!active) return;

        let wins = 0;
        let losses = 0;
        let bestWinScore = null;
        const battles = [];

        asChallenger.forEach((d) => {
          const data = d.data();
          const isWin = data.result === "win";
          if (isWin) {
            wins++;
            const s = Number(data.challengerScore);
            if (Number.isFinite(s) && (bestWinScore === null || s > bestWinScore)) bestWinScore = s;
          } else {
            losses++;
          }
          battles.push({
            id: d.id,
            opponentName: data.opponentName || "Opponent",
            challengerScore: Number(data.challengerScore) || 0,
            opponentScore: Number(data.opponentScore) || 0,
            result: data.result,
            createdAt: data.createdAt,
          });
        });

        battles.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

        setPvpStats({
          wins,
          losses,
          timeschallenged: asOpponent.size,
          bestWinScore,
          recentBattles: battles.slice(0, 5),
        });
      } catch (e) {
        if (active) setPvpStats(null);
      }
    }

    loadPvpStats();
    return () => { active = false; };
  }, [userId]);

  // Load earned badges
  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function loadBadges() {
      try {
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        const snap = await getDocs(query(collection(db, "user_badges"), where("userId", "==", userId)));
        if (!active) return;
        const badges = snap.docs.map((d) => d.data());
        setUserBadges(badges);
      } catch { if (active) setUserBadges([]); }
    }
    loadBadges();
    return () => { active = false; };
  }, [userId]);

  // Load upcoming coach bookings — own profile only
  useEffect(() => {
    if (!userId || !isOwnProfile) return;
    let active = true;

    async function loadBookings() {
      try {
        const { collection, getDocs, query, where, orderBy } = await import("firebase/firestore");
        const snap = await getDocs(
          query(
            collection(db, "coach_bookings"),
            where("userId", "==", userId),
            where("status", "==", "scheduled"),
            orderBy("date", "asc")
          )
        );
        if (!active) return;
        setCoachBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {
        // bookings are optional — silently skip
      }
    }

    loadBookings();
    return () => { active = false; };
  }, [userId, isOwnProfile]);

  // Detect rank-up during session — own profile only
  useEffect(() => {
    if (loading || rankUpShownRef.current || !isOwnProfile) return;
    const currentXP = (Number(profileUser?.xp) || 0) + calculateUserXP({
      aiFeedbackDocs: aiFeedbackHistory,
      streakDays: profileUser?.streakCount || 0,
      likesReceived: totalLikes,
    });
    const currentRank = getFighterRank(currentXP);
    const storedKey = typeof window !== "undefined"
      ? localStorage.getItem("gavana_rank_key")
      : null;
    const currentIdx = RANK_TIERS.findIndex((r) => r.key === currentRank.key);
    const storedIdx = storedKey ? RANK_TIERS.findIndex((r) => r.key === storedKey) : -1;
    if (storedIdx >= 0 && currentIdx > storedIdx) {
      setRankUpRank(currentRank);
      rankUpShownRef.current = true;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("gavana_rank_key", currentRank.key);
    }
  }, [loading, aiFeedbackHistory, userReels.length, stats.followers, profileUser?.streakCount, totalLikes, isOwnProfile]);

  const loadSavedReels = async (targetUserId) => {
    if (!user?.uid || user.uid !== targetUserId) {
      setSavedUserReels([]);
      return;
    }

    try {
      const { collection, query, where, getDocs, documentId } = await import("firebase/firestore");
      const savedSnapshot = await getDocs(query(
        collection(db, "saved_reels"),
        where("userId", "==", targetUserId)
      ));
      const savedReelIds = savedSnapshot.docs
        .map((savedDoc) => savedDoc.data().reelId)
        .filter(Boolean);

      if (savedReelIds.length === 0) {
        setSavedUserReels([]);
        return;
      }

      const savedReels = [];
      const batchSize = 10;

      for (let i = 0; i < savedReelIds.length; i += batchSize) {
        const batchIds = savedReelIds.slice(i, i + batchSize);
        const reelsSnapshot = await getDocs(query(
          collection(db, "reels"),
          where(documentId(), "in", batchIds)
        ));
        reelsSnapshot.forEach((reelDoc) => {
          savedReels.push({ id: reelDoc.id, ...reelDoc.data() });
        });
      }

      setSavedUserReels(savedReels);
    } catch (error) {
      console.error("Error loading saved reels:", error);
      setSavedUserReels([]);
    }
  };

  // Load follow statistics
  const loadFollowStats = async (targetUserId) => {
    if (!user?.uid) return;

    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore");

      // Count followers (users following this user)
      const followersQuery = query(
        collection(db, "follows"),
        where("followingId", "==", targetUserId)
      );
      const followersSnapshot = await getDocs(followersQuery);
      const followersCount = followersSnapshot.size;

      // Count following (users this user is following)
      const followingQuery = query(
        collection(db, "follows"),
        where("followerId", "==", targetUserId)
      );
      const followingSnapshot = await getDocs(followingQuery);
      const followingCount = followingSnapshot.size;

      setStats({ followers: followersCount, following: followingCount });
    } catch (error) {
      console.error("Error loading follow stats:", error);
    }
  };

  // Check if current user is following this profile (and if the follow is mutual)
  const checkFollowStatus = async (currentUserId, targetUserId) => {
    if (!currentUserId || !targetUserId) return;

    try {
      const { doc, getDoc } = await import("firebase/firestore");

      const [followDoc, reverseDoc] = await Promise.all([
        getDoc(doc(db, "follows", `${currentUserId}_${targetUserId}`)),
        getDoc(doc(db, "follows", `${targetUserId}_${currentUserId}`)),
      ]);
      setIsFollowing(followDoc.exists());
      setIsMutual(followDoc.exists() && reverseDoc.exists());
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  // Handle message
  const handleMessage = async () => {
    if (!user) { router.push(`/${locale || "en"}/login`); return; }
    if (isOwnProfile) { router.push(`/${locale || "en"}/inbox`); return; }
    try {
      const displayName = profileUser?.displayName || profileUser?.username || "Fighter";
      const photoURL = profileUser?.photoURL || "";
      const convoId = await startConversation(user, userId, {
        displayName,
        photoURL,
      });
      router.push(`/${locale || "en"}/inbox/${convoId}`);
    } catch (e) {
      console.error("Message error:", e);
    }
  };

  // Handle follow/unfollow
  const handleFollow = async () => {
    if (!user) {
      router.push(`/${locale || "en"}/login`);
      return;
    }

    if (isOwnProfile || followLoading) return;

    setFollowLoading(true);
    const wasFollowing = isFollowing;
    const previousStats = stats;
    setIsFollowing(!wasFollowing);
    setStats((prev) => ({
      ...prev,
      followers: Math.max(0, prev.followers + (wasFollowing ? -1 : 1))
    }));

    try {
      const { doc, setDoc, deleteDoc, getDoc, serverTimestamp } = await import("firebase/firestore");

      const followRef = doc(db, "follows", `${user.uid}_${userId}`);

      if (wasFollowing) {
        // Unfollow
        await deleteDoc(followRef);
        setIsMutual(false);
        // Reload follow stats to ensure accuracy
        await loadFollowStats(userId);
      } else {
        // Follow
        await setDoc(followRef, {
          followerId: user.uid,
          followingId: userId,
          createdAt: serverTimestamp()
        });
        createNewFollowerNotification({
          recipientId: userId,
          actorId: user.uid,
          actorName: user.displayName || user.email?.split("@")[0],
          actorPhotoURL: user.photoURL || "",
        });
        // Check if now mutual
        const reverseDoc = await getDoc(doc(db, "follows", `${userId}_${user.uid}`));
        setIsMutual(reverseDoc.exists());
        // Reload follow stats to ensure accuracy
        await loadFollowStats(userId);
      }
    } catch (error) {
      console.error("Error following user:", error);
      setIsFollowing(wasFollowing);
      setStats(previousStats);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLogout = async () => {
    if (signingOut) return;

    setSigningOut(true);
    try {
      await signOut(auth);
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSigningOut(false);
    }
  };

  const handleSwitchAccount = async () => {
    if (signingOut) return;

    setSigningOut(true);
    try {
      await signOut(auth);
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error("Error switching account:", error);
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteReel = async (event, reel) => {
    event.stopPropagation();

    if (!user?.uid || reel.userId !== user.uid || deletingReelIds.has(reel.id)) {
      return;
    }

    const confirmed = window.confirm(t("confirmDeleteReel"));
    if (!confirmed) return;

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
      <div style={{
        minHeight: "100vh",
        background: "var(--background)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-primary)"
      }}>
        {t("loadingProfile")}
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
      background: "radial-gradient(ellipse at top center, rgba(193,18,31,0.08) 0%, transparent 50%), var(--background)",
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
        >
          {t("back")}
        </button>
      </header>
      <section style={styles.fighterCard}>
        <div style={styles.fighterCardInner}>
        {/* Avatar */}
        <div
          className={streakCount >= 10 ? "avatar-on-fire" : undefined}
          style={{
            ...styles.avatarFrame,
            ...(streakCount >= 5 ? {
              boxShadow: "0 0 0 1px rgba(212,175,55,0.55), 0 22px 70px rgba(0,0,0,0.5), 0 0 28px rgba(251,146,60,0.6), 0 0 56px rgba(251,146,60,0.28)",
              border: "3px solid #FB923C",
            } : {}),
          }}
        >
          {profileUser.photoURL ? (
            <img
              src={profileUser.photoURL}
              alt={profileUser.displayName || profileUser.username || "Profile"}
              style={styles.avatarImage}
            />
          ) : (
            profileUser.displayName?.charAt(0).toUpperCase() || profileUser.username?.charAt(0).toUpperCase() || "U"
          )}
        </div>

        {/* Name + username */}
        <h1 style={styles.fighterName}>
          {profileUser.displayName || profileUser.username}
        </h1>
        <div style={styles.fighterUsername}>@{profileUser.username}</div>

        {/* Bio */}
        {profileUser.bio && (
          <p style={styles.bio}>{profileUser.bio}</p>
        )}

        {/* Fighter identity tags — derived from data */}
        {(() => {
          const tags = [];
          tags.push({ label: t(fighterRank.key), color: fighterRank.color, bg: `${fighterRank.color}18`, border: `${fighterRank.color}44` });
          const challengeStreak = getActiveChallengeStreak(profileUser);
          if (challengeStreak > 0) tags.push({ label: `🔥 ${challengeStreak}d`, color: "#FB923C", bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.35)" });
          if (bestScore !== null) tags.push({ label: `⭐ ${formatScore(bestScore)}/10`, color: "#D4AF37", bg: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.35)" });
          if (userReels.length > 0) tags.push({ label: `🎬 ${t("creatorTag")}`, color: "#60A5FA", bg: "rgba(96,165,250,0.10)", border: "rgba(96,165,250,0.28)" });
          if (challengeRanks?.weeklyRank && challengeRanks.weeklyRank <= 10) tags.push({ label: `#${challengeRanks.weeklyRank} ${t("seasonCurrentWeek")}`, color: "#D4AF37", bg: "rgba(212,175,55,0.12)", border: "rgba(212,175,55,0.32)" });
          if (pvpStats && pvpStats.wins > 0) tags.push({ label: `⚔️ ${pvpStats.wins}W ${pvpStats.losses}L`, color: "#A78BFA", bg: "rgba(167,139,250,0.10)", border: "rgba(167,139,250,0.28)" });
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
        <button type="button" onClick={() => setShowRankModal(true)} style={styles.rankRow}>
          <RankIcon rank={fighterRank} size={30} animated />
          <span style={{ ...styles.rankLabel, color: fighterRank.color }}>{t(fighterRank.key)}</span>
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

        {/* User achievement badges */}
        {userBadges.length > 0 && (
          <div style={styles.badgesRow}>
            {userBadges.map((b) => {
              const ICONS = { first_challenge: "🥊", streak_3: "🔥", streak_7: "⚡", jab_master: "🎯", speed_king: "💨", creator_starter: "🎬" };
              const icon = ICONS[b.badgeId] || "🏅";
              return (
                <div key={b.badgeId} style={styles.badgePill} title={t(b.badgeId + "Badge") || b.badgeId}>
                  <span>{icon}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Stats row: posts / followers / following */}
        <div style={styles.statsRow}>
          <button type="button" onClick={() => handleStatNavigate("posts")} style={styles.statButton}>
            <span style={styles.statNumber}>{userReels.length}</span>
            <span style={styles.statLabel}>{t("posts")}</span>
          </button>
          <button type="button" onClick={() => handleStatNavigate("followers")} style={styles.statButton}>
            <span style={styles.statNumber}>{stats.followers}</span>
            <span style={styles.statLabel}>{t("followers")}</span>
          </button>
          <button type="button" onClick={() => handleStatNavigate("following")} style={styles.statButton}>
            <span style={styles.statNumber}>{stats.following}</span>
            <span style={styles.statLabel}>{t("followingCount")}</span>
          </button>
        </div>

        {/* Action buttons */}
        {isOwnProfile ? (
          <div style={styles.actionRow}>
            <button onClick={() => router.push(`/${locale}/profile/edit`)} style={styles.ghostAction}>
              {t("editProfile")}
            </button>
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              style={{ ...styles.ghostAction, color: "#D4AF37", borderColor: "rgba(212,175,55,0.3)" }}
            >
              {t("dashboardViewProgress")}
            </button>
            {userReels.length > 0 && (
              <button onClick={() => router.push(`/${locale}/creator/dashboard`)} style={styles.ghostAction}>
                {t("creatorDashboard")}
              </button>
            )}
            <button
              onClick={handleLogout}
              disabled={signingOut}
              style={{ ...styles.ghostAction, opacity: signingOut ? 0.7 : 1, cursor: signingOut ? "not-allowed" : "pointer" }}
            >
              {signingOut ? t("signingOut") : t("logout")}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleFollow}
                disabled={followLoading}
                style={{
                  ...styles.followAction,
                  background: followLoading ? "#555" : (isFollowing ? "#151515" : "#C1121F"),
                  cursor: followLoading ? "not-allowed" : "pointer",
                  opacity: followLoading ? 0.7 : 1
                }}
              >
                {followLoading ? t("followLoading") : (isFollowing ? t("unfollow") : t("follow"))}
              </button>
              <button
                type="button"
                onClick={handleMessage}
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
                Message
              </button>
            </div>
            {isMutual && (
              <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", letterSpacing: 0.5 }}>
                ⇄ {t("mutual")}
              </span>
            )}
          </div>
        )}
        </div>
      </section>


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
      </div>

      {profileTab === "progress" ? (
        <section style={{ ...styles.progressSection, padding: "16px 16px 32px" }}>
          {(() => {
            const scores = feedbackScores;
            const best = progressStats.bestScore ?? 0;
            const avg = progressStats.averageScore ?? 0;
            const fighterScore = scores.length
              ? Math.min(100, Math.round(best * 6 + avg * 4 + Math.min(5, streakCount * 0.3)))
              : 0;

            const recentAvg = scores.length >= 1
              ? scores.slice(0, Math.min(3, scores.length)).reduce((a, b) => a + b, 0) / Math.min(3, scores.length)
              : 0;
            const olderAvg = scores.length >= 4
              ? scores.slice(3, 6).reduce((a, b) => a + b, 0) / Math.min(3, scores.slice(3, 6).length)
              : 0;
            const delta = scores.length >= 4 ? recentAvg - olderAvg : 0;

            let insightText, insightColor;
            if (scores.length < 2) {
              insightText = locale === "mn" ? "Дасгал хийж эхэл — ахиц харагдана 🎯"
                : locale === "ko" ? "훈련을 시작하면 추세가 보여요 🎯"
                : "Start training to see your progress 🎯";
              insightColor = "#D4AF37";
            } else if (delta >= 0.4) {
              insightText = locale === "mn" ? "Оноо нэмэгдэж байна 🔥 Ийнхүү явж байгаарай."
                : locale === "ko" ? "점수가 오르고 있어요 🔥 계속 유지하세요."
                : "Score is climbing 🔥 Keep the pressure on.";
              insightColor = "#4ade80";
            } else if (delta <= -0.4) {
              insightText = locale === "mn" ? "Техник болон guard-д анхаар ⚠️"
                : locale === "ko" ? "기술과 가드에 집중하세요 ⚠️"
                : "Focus on technique and guard ⚠️";
              insightColor = "#FB923C";
            } else if (streakCount >= 3) {
              insightText = locale === "mn" ? "Тасралтгүй дасгал — хамгийн сайн зэвсэг 💪"
                : locale === "ko" ? "꾸준함이 무기예요 💪"
                : "Consistency is your weapon 💪";
              insightColor = "#4ade80";
            } else {
              insightText = locale === "mn" ? "Intensity нэмж score ахиулаарай."
                : locale === "ko" ? "강도를 높여보세요."
                : "Push intensity to break through.";
              insightColor = "#D4AF37";
            }

            return (
              <div style={{
                position: "relative",
                background: "linear-gradient(145deg, #1c0202 0%, #0e0000 40%, #080808 100%)",
                border: "1px solid rgba(193,18,31,0.18)",
                borderLeft: "3px solid #C1121F",
                borderRadius: "3px 20px 20px 3px",
                padding: "20px 18px 18px",
                boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 10% 30%, rgba(193,18,31,0.18) 0%, transparent 55%)" }} />
                <div style={{ position: "relative" }}>
                  <p style={{ margin: "0 0 16px", fontSize: 9, fontWeight: 900, color: "rgba(193,18,31,0.7)", letterSpacing: 3, textTransform: "uppercase" }}>
                    GAVANA · FIGHTER SCORE
                  </p>

                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 64, fontWeight: 900, color: "#fff", letterSpacing: "-0.04em", lineHeight: 0.9, fontFamily: "var(--font-display,'Anton',sans-serif)", textShadow: "0 0 40px rgba(193,18,31,0.4)" }}>
                        {fighterScore}
                      </div>
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.2)", fontWeight: 700 }}>/100</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: fighterRank.color, display: "block", marginBottom: 4 }}>
                        {t(fighterRank.key)}
                      </span>
                      <span style={{ fontSize: 12, color: "#D4AF37", fontWeight: 800, display: "block" }}>
                        {xp.toLocaleString()} XP
                      </span>
                      {nextRank && (
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontWeight: 700 }}>
                          {(nextRank.minXP - xp).toLocaleString()} → {t(nextRank.key)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* XP bar */}
                  <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: 999, background: fighterRank.gradient || fighterRank.color, boxShadow: `0 0 10px ${fighterRank.color}55`, transition: "width 800ms cubic-bezier(0.16,1,0.3,1)" }} />
                  </div>

                  <p style={{ margin: "0 0 18px", fontSize: 12, color: insightColor, fontStyle: "italic", lineHeight: 1.55, borderLeft: `2px solid ${insightColor}44`, paddingLeft: 10 }}>
                    {insightText}
                  </p>

                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/dashboard`)}
                      style={{
                        width: "100%", padding: "13px 0", borderRadius: 13,
                        background: "linear-gradient(135deg, #C1121F, #7d0812)",
                        border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                        boxShadow: "0 4px 18px rgba(193,18,31,0.38)",
                        letterSpacing: 0.3,
                      }}
                    >
                      {locale === "mn" ? "Ахиц дэлгэрэнгүй харах →" : locale === "ko" ? "상세 분석 보기 →" : "View Full Analytics →"}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </section>
      ) : (
      <div style={{
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 1,
        width: "100%"
      }}>
        {visibleReels.length === 0 ? (
          <div style={styles.reelGridEmpty}>
            <div style={styles.reelGridEmptyIcon}>🥊</div>
            <p style={styles.reelGridEmptyTitle}>
              {profileTab === "saved" ? t("noSavedReelsYet") : t("noReelsYet")}
            </p>
            <p style={styles.reelGridEmptyText}>
              {profileTab === "saved" ? t("bookmarkedReelsEmpty") : t("trainingClipsEmpty")}
            </p>
            {profileTab !== "saved" && isOwnProfile && (
              <button
                type="button"
                style={styles.reelGridEmptyCta}
                onClick={() => router.push(`/${locale}/upload`)}
              >
                {t("uploadFirstReel")}
              </button>
            )}
          </div>
        ) : (
          visibleReels.map((reel) => {
            const imageFailed = previewFailures[`${reel.id}:image`];
            const videoFailed = previewFailures[`${reel.id}:video`];
            const showImage = reel.thumbnailUrl && !imageFailed;
            const showVideo = !showImage && reel.videoUrl && !videoFailed;
            const likeCount = getSafeReelLikes(reel);
            const canDeleteReel = user?.uid && reel.userId === user.uid;
            const isDeletingReel = deletingReelIds.has(reel.id);
            const effectiveType = reel.contentType || reel.type || "lifestyle";

            return (
              <div
                key={reel.id}
                className="profile-reel-tile"
                style={{
                  aspectRatio: "9/16",
                  overflow: "hidden",
                  background: "#0a0a0a",
                  cursor: "pointer",
                  position: "relative",
                  borderRadius: 2,
                }}
                onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}&source=profile&userId=${userId}`)}
              >
                {showImage ? (
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.description || t("trainingReel")}
                    className="profile-reel-media"
                    style={styles.reelPreviewMedia}
                    loading="lazy"
                    onError={() => markPreviewFailed(reel.id, "image")}
                  />
                ) : showVideo ? (
                  <video
                    src={reel.videoUrl}
                    className="profile-reel-media"
                    style={styles.reelPreviewMedia}
                    muted
                    playsInline
                    preload="metadata"
                    poster={reel.thumbnailUrl || undefined}
                    onLoadedMetadata={(event) => {
                      try {
                        if (event.currentTarget.currentTime === 0) {
                          event.currentTarget.currentTime = 0.05;
                        }
                      } catch {
                        // Some mobile browsers do not allow seeking before enough data is ready.
                      }
                    }}
                    onError={() => markPreviewFailed(reel.id, "video")}
                  />
                ) : (
                  <MediaCover
                    contentType={effectiveType}
                    caption={reel.description || reel.caption}
                    style={{ position: "absolute", inset: 0 }}
                  />
                )}

                {/* Content type indicator — top-left */}
                <div style={styles.reelTileTypeBadge}>
                  {effectiveType === "training" ? "🥊" : effectiveType === "educational" ? "📚" : "🎬"}
                </div>

                {canDeleteReel && (
                  <button
                    type="button"
                    aria-label={t("deleteReel")}
                    title={t("deleteReel")}
                    onClick={(event) => handleDeleteReel(event, reel)}
                    disabled={isDeletingReel}
                    style={{
                      ...styles.deleteReelButton,
                      opacity: isDeletingReel ? 0.55 : 1,
                      cursor: isDeletingReel ? "not-allowed" : "pointer",
                    }}
                  >
                    {isDeletingReel ? "..." : "×"}
                  </button>
                )}
                <div style={styles.reelTileOverlay}>
                  <div style={styles.reelTileLikes}>
                    ♥ {likeCount}
                  </div>
                  {reel.description && (
                    <div style={styles.reelTileCaption}>
                      {reel.description}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      )}

      <style>{`
        .profile-reel-tile .profile-reel-media {
          transform: scale(1);
          transition: transform var(--motion-fast), filter var(--motion-fast);
        }
        .profile-reel-tile:hover .profile-reel-media {
          transform: scale(1.08);
          filter: contrast(1.08);
        }
        .profile-reel-tile:active .profile-reel-media {
          transform: scale(1.12);
          filter: contrast(1.12);
        }
        @keyframes avatarFire {
          0%,100% { box-shadow: 0 0 0 1px rgba(212,175,55,0.55), 0 22px 70px rgba(0,0,0,0.5), 0 0 28px rgba(251,146,60,0.7), 0 0 56px rgba(251,146,60,0.35); border-color: #FB923C; }
          50%      { box-shadow: 0 0 0 1px rgba(212,175,55,0.75), 0 22px 70px rgba(0,0,0,0.5), 0 0 44px rgba(251,146,60,1.0), 0 0 88px rgba(251,146,60,0.55); border-color: #FFA040; }
        }
        .avatar-on-fire { animation: avatarFire 1.6s ease-in-out infinite; }
      `}</style>

      {rankUpRank && (
        <RankUpModal rank={rankUpRank} onClose={() => setRankUpRank(null)} t={t} />
      )}

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

      {showWeeklyRecap && (() => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
        const getMs = (ts) => { if (!ts) return 0; if (ts.toMillis) return ts.toMillis(); return Number(ts) || 0; };
        const weekFeedback = (aiFeedbackHistory || []).filter((f) => getMs(f.createdAt) >= sevenDaysAgo);
        const weekXP = weekFeedback.reduce((s, f) => s + Math.round((Number(f.score) || 0) * (Number(f.score) || 0) * 10), 0);
        const weekChallenges = weekFeedback.length;
        return (
          <div style={styles.modalOverlay} onClick={() => setShowWeeklyRecap(false)}>
            <div style={styles.weeklyModalSheet} onClick={(e) => e.stopPropagation()}>
              <div style={styles.weeklyModalHandle} />
              <div style={styles.weeklyModalHeader}>
                <span style={styles.weeklyModalTitle}>📅 {t("weeklyRecapTitle")}</span>
                <button type="button" style={styles.weeklyModalClose} onClick={() => setShowWeeklyRecap(false)}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "4px 0 8px" }}>
                <div style={styles.weeklyRankItem}>
                  <span style={{ ...styles.weeklyRankNum, color: "#D4AF37" }}>+{weekXP}</span>
                  <span style={styles.weeklyRankLbl}>{t("weeklyRecapXP")}</span>
                </div>
                <div style={styles.weeklyRankItem}>
                  <span style={{ ...styles.weeklyRankNum, color: "#34D399" }}>{weekChallenges}</span>
                  <span style={styles.weeklyRankLbl}>{t("weeklyRecapChallenges")}</span>
                </div>
                <div style={styles.weeklyRankItem}>
                  <span style={{ ...styles.weeklyRankNum, color: "#FB923C" }}>{profileUser?.challengeStreak || 0}</span>
                  <span style={styles.weeklyRankLbl}>{t("dayStreak").replace("{n}", "")}</span>
                </div>
              </div>
              <button type="button" style={{ ...styles.weeklyModalClose, width: "100%", padding: "11px 0", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }} onClick={() => setShowWeeklyRecap(false)}>
                {t("weeklyRecapClose")}
              </button>
            </div>
          </div>
        );
      })()}

      {showWeeklyModal && challengeRanks && (
        <div style={styles.modalOverlay} onClick={() => setShowWeeklyModal(false)}>
          <div style={styles.weeklyModalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.weeklyModalHandle} />
            <div style={styles.weeklyModalHeader}>
              <span style={styles.weeklyModalTitle}>🏆 {t("weeklySeasonModalTitle")}</span>
              <button type="button" style={styles.weeklyModalClose} onClick={() => setShowWeeklyModal(false)}>✕</button>
            </div>

            {challengeRanks.weeklyRank && challengeRanks.weeklyRank <= 3 && (
              <div style={styles.weeklyModalBadgeBlock}>
                <div style={styles.weeklyModalBadgeEmoji}>
                  {challengeRanks.weeklyRank === 1 ? "🥇" : challengeRanks.weeklyRank === 2 ? "🥈" : "🥉"}
                </div>
                <div style={{
                  ...styles.weeklyModalBadgeName,
                  color: challengeRanks.weeklyRank === 1 ? "#D4AF37" : challengeRanks.weeklyRank === 2 ? "#9CA3AF" : "#FB923C",
                }}>
                  {challengeRanks.weeklyRank === 1
                    ? t("weeklyChampionBadge")
                    : challengeRanks.weeklyRank === 2
                    ? t("weeklySilverBadge")
                    : t("weeklyBronzeBadge")}
                </div>
              </div>
            )}

            <div style={styles.weeklyModalStats}>
              {challengeRanks.weeklyRank && (
                <div style={styles.weeklyModalStat}>
                  <span style={styles.weeklyModalStatVal}>#{challengeRanks.weeklyRank}</span>
                  <span style={styles.weeklyModalStatLbl}>{t("seasonCurrentWeek")}</span>
                </div>
              )}
              {challengeRanks.bestWeeklyScore != null && (
                <div style={styles.weeklyModalStat}>
                  <span style={{ ...styles.weeklyModalStatVal, color: "#D4AF37" }}>{challengeRanks.bestWeeklyScore}/10</span>
                  <span style={styles.weeklyModalStatLbl}>{t("seasonBestWeeklyScore")}</span>
                </div>
              )}
              {challengeRanks.allTimeRank && (
                <div style={styles.weeklyModalStat}>
                  <span style={styles.weeklyModalStatVal}>#{challengeRanks.allTimeRank}</span>
                  <span style={styles.weeklyModalStatLbl}>{t("seasonAllTime")}</span>
                </div>
              )}
            </div>

            <p style={styles.weeklyModalDesc}>{t("weeklySeasonModalDesc")}</p>

            <button type="button" style={styles.weeklyModalBtn} onClick={() => { setShowWeeklyModal(false); router.push(`/${locale}/challenges`); }}>
              {t("weeklySeasonModalCta")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  backHeader: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    paddingTop: "calc(12px + env(safe-area-inset-top))",
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    background: "rgba(7,7,7,0.88)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  },
  backBtnProfile: {
    border: "1px solid rgba(212,175,55,0.28)",
    background: "transparent",
    color: "#fff",
    borderRadius: 10,
    padding: "8px 14px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 700,
  },
  fighterCard: {
    width: "100%",
    padding: "32px 16px 28px",
    background: "radial-gradient(ellipse at 50% 0%, rgba(193,18,31,0.28) 0%, rgba(193,18,31,0.06) 40%, transparent 65%), linear-gradient(180deg, #0C0C0C 0%, #070707 100%)",
    boxSizing: "border-box",
    position: "relative",
    overflow: "hidden",
  },
  fighterCardInner: {
    width: "min(100%, 520px)",
    margin: "0 auto",
    textAlign: "center",
  },
  avatarFrame: {
    width: 148,
    height: 148,
    borderRadius: "50%",
    background: "linear-gradient(145deg, #C1121F, #310408)",
    border: "3px solid rgba(193,18,31,0.85)",
    boxShadow: "0 0 0 1px rgba(212,175,55,0.5), 0 0 0 4px rgba(193,18,31,0.15), 0 24px 80px rgba(0,0,0,0.6), 0 0 48px rgba(193,18,31,0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 52,
    fontWeight: 1000,
    margin: "0 auto 20px",
    color: "#FFFFFF",
    overflow: "hidden",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
  },
  fighterKicker: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 2,
  },
  fighterName: {
    margin: "8px 0 0",
    color: "#FFFFFF",
    fontSize: "clamp(36px, 11vw, 56px)",
    lineHeight: 0.92,
    fontWeight: 1000,
    letterSpacing: -0.5,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  fighterUsername: {
    marginTop: 10,
    color: "#AAAAAA",
    fontSize: 14,
    fontWeight: 750,
  },
  challengeStreakBadge: {
    width: "fit-content",
    margin: "12px auto 0",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    minHeight: 32,
    padding: "0 12px",
    borderRadius: 999,
    background: "rgba(251,146,60,0.12)",
    border: "1px solid rgba(251,146,60,0.3)",
    color: "#FED7AA",
    fontSize: 13,
    fontWeight: 950,
  },
  challengeStreakIcon: {
    fontSize: 16,
    lineHeight: 1,
  },
  badgesRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    margin: "14px auto 0",
    maxWidth: 430,
  },
  badgePill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: 19,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 20,
    cursor: "default",
  },
  bio: {
    maxWidth: 380,
    margin: "14px auto 0",
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 400,
    fontStyle: "italic",
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 1,
    margin: "24px auto 24px",
    maxWidth: 430,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.01)",
  },
  statButton: {
    minHeight: 72,
    border: "none",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    background: "transparent",
    color: "#FFFFFF",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: 7,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 25,
    lineHeight: 1,
    fontWeight: 1000,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  statLabel: {
    color: "#AAAAAA",
    fontSize: 10,
    fontWeight: 850,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  actionRow: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  ghostAction: {
    padding: "10px 17px",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.055)",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  primaryAction: {
    padding: "10px 17px",
    border: "none",
    borderRadius: 999,
    background: "#C1121F",
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  followAction: {
    padding: "12px 34px",
    border: "none",
    borderRadius: 999,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: 900,
  },
  profileTabs: {
    display: "flex",
    width: "100%",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "#070707",
  },
  profileTab: {
    flex: 1,
    minHeight: 50,
    border: "none",
    background: "transparent",
    color: "#777",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    cursor: "pointer",
  },
  profileTabActive: {
    color: "#FFFFFF",
    boxShadow: "inset 0 -2px 0 #C1121F",
  },
  progressSection: {
    width: "min(100%, 680px)",
    margin: "0 auto",
    padding: "24px 16px 80px",
    boxSizing: "border-box",
  },
  dailyMissionCard: {
    marginBottom: 18,
    padding: "14px 16px",
    borderRadius: 18,
    background: "linear-gradient(145deg, rgba(212,175,55,0.10), rgba(11,11,11,0.98))",
    border: "1px solid rgba(212,175,55,0.22)",
    display: "grid",
    gap: 10,
    boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
  },
  dailyMissionTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dailyMissionLabel: {
    color: "#D4AF37",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  dailyMissionBadgeDone: {
    padding: "3px 10px",
    borderRadius: 999,
    background: "rgba(52,211,153,0.15)",
    border: "1px solid rgba(52,211,153,0.3)",
    color: "#34D399",
    fontSize: 10,
    fontWeight: 900,
  },
  dailyMissionBadgePending: {
    padding: "3px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#888",
    fontSize: 10,
    fontWeight: 700,
  },
  dailyMissionTarget: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  dailyMissionTargetText: {
    fontSize: 14,
    fontWeight: 900,
    lineHeight: 1.3,
  },
  dailyMissionXpHint: {
    fontSize: 11,
    color: "#888",
    fontWeight: 700,
  },
  dailyMissionStreakRow: {
    display: "flex",
    gap: 18,
    padding: "10px 0 6px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
  },
  dailyMissionStreakStat: { display: "grid", gap: 3 },
  dailyMissionStreakNum: {
    fontSize: 20,
    fontWeight: 1000,
    lineHeight: 1,
  },
  dailyMissionStreakLbl: {
    fontSize: 9,
    color: "#888",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  dailyMissionMilestones: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  dailyMissionMilestoneLbl: {
    fontSize: 10,
    color: "#666",
    fontWeight: 700,
    letterSpacing: 0.4,
  },
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginBottom: 14,
  },
  overviewCard: {
    minHeight: 72,
    borderRadius: 16,
    background: "linear-gradient(145deg, rgba(193,18,31,0.10), rgba(11,11,11,0.98))",
    border: "1px solid rgba(255,255,255,0.07)",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: 6,
    padding: "10px 6px",
  },
  overviewVal: {
    color: "var(--text-primary)",
    fontSize: 24,
    lineHeight: 1,
    fontWeight: 1000,
  },
  overviewLbl: {
    color: "var(--text-secondary)",
    fontSize: 9,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  improvementBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  improvementItem: {
    display: "grid",
    gap: 4,
    justifyItems: "center",
    flex: 1,
    minWidth: 60,
  },
  improvementArrow: {
    color: "#555",
    fontSize: 18,
    fontWeight: 900,
    flexShrink: 0,
  },
  improvementLbl: {
    color: "var(--text-secondary)",
    fontSize: 9,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  improvementVal: {
    color: "var(--text-primary)",
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 1000,
  },
  sectionTitle: {
    margin: 0,
    color: "var(--text-primary)",
    fontSize: 15,
    fontWeight: 950,
    letterSpacing: 0,
  },
  reelProgressCard: {
    borderRadius: 18,
    background: "rgba(11,11,11,0.97)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "14px 16px 12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
    display: "grid",
    gap: 10,
  },
  reelCardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  reelCardLeft: {
    display: "grid",
    gap: 4,
    minWidth: 0,
  },
  reelCardTitle: {
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 950,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  reelCardMeta: {
    display: "flex",
    gap: 6,
    color: "#888",
    fontSize: 11,
    fontWeight: 700,
  },
  reelDeltaPill: {
    flexShrink: 0,
    padding: "3px 9px",
    borderRadius: 999,
    border: "1px solid",
    fontSize: 11,
    fontWeight: 900,
    background: "rgba(0,0,0,0.4)",
  },
  reelStatsRow: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    background: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  reelStat: {
    flex: 1,
    display: "grid",
    gap: 3,
    justifyItems: "center",
    padding: "9px 6px",
  },
  reelStatVal: {
    color: "var(--text-primary)",
    fontSize: 16,
    lineHeight: 1,
    fontWeight: 1000,
  },
  reelStatLbl: {
    color: "#666",
    fontSize: 9,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  reelStatDivider: {
    width: 1,
    alignSelf: "stretch",
    background: "rgba(255,255,255,0.07)",
    flexShrink: 0,
  },
  viewAttemptsBtn: {
    background: "transparent",
    border: "none",
    color: "#888",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
    padding: "4px 0",
    textAlign: "left",
    letterSpacing: 0.5,
    display: "flex",
    alignItems: "center",
  },
  attemptsListWrap: {
    display: "grid",
    gap: 1,
    borderTop: "1px solid rgba(255,255,255,0.06)",
    paddingTop: 8,
  },
  attemptRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "9px 2px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  attemptNum: {
    display: "block",
    color: "var(--text-primary)",
    fontSize: 12,
    fontWeight: 900,
    marginBottom: 2,
  },
  aiFeedbackToggle: {
    display: "flex",
    alignItems: "center",
    background: "transparent",
    border: "none",
    padding: 0,
    cursor: "pointer",
    textAlign: "left",
  },
  progressHeader: {
    marginBottom: 18,
  },
  progressKicker: {
    margin: 0,
    color: "var(--accent-gold)",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 1.8,
  },
  progressTitle: {
    margin: "6px 0 0",
    color: "var(--text-primary)",
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 1000,
  },
  scoreGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginBottom: 18,
  },
  scoreCard: {
    minHeight: 84,
    borderRadius: 18,
    background: "linear-gradient(145deg, rgba(193,18,31,0.14), rgba(11,11,11,0.96))",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "grid",
    alignContent: "center",
    justifyItems: "center",
    gap: 7,
    boxShadow: "0 18px 44px rgba(0,0,0,0.22)",
  },
  scoreValue: {
    color: "var(--text-primary)",
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 1000,
  },
  scoreLabel: {
    color: "var(--text-secondary)",
    fontSize: 11,
    fontWeight: 850,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  beforeAfterCard: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginBottom: 18,
    padding: 14,
    borderRadius: 18,
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  beforeAfterItem: {
    display: "grid",
    justifyItems: "center",
    gap: 5,
  },
  beforeAfterLabel: {
    color: "var(--text-secondary)",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  beforeAfterValue: {
    color: "var(--text-primary)",
    fontSize: 22,
    lineHeight: 1,
    fontWeight: 1000,
  },
  progressSubsection: {
    display: "grid",
    gap: 10,
    marginBottom: 18,
  },
  weeklySequence: {
    margin: 0,
    padding: "14px 15px",
    borderRadius: 16,
    background: "rgba(11,11,11,0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "var(--accent-gold)",
    fontSize: 15,
    fontWeight: 900,
    lineHeight: 1.55,
    overflowWrap: "anywhere",
  },
  comboProgressList: {
    display: "grid",
    gap: 10,
  },
  comboProgressItem: {
    borderRadius: 16,
    background: "rgba(11,11,11,0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  progressList: {
    display: "grid",
    gap: 10,
  },
  trainingHistoryBlock: {
    marginTop: 22,
    display: "grid",
    gap: 12,
  },
  trainingHistoryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trainingHistoryTitle: {
    margin: 0,
    color: "var(--text-primary)",
    fontSize: 18,
    fontWeight: 950,
    letterSpacing: 0,
  },
  trainingGroup: {
    borderRadius: 18,
    background: "rgba(11,11,11,0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
    boxShadow: "0 12px 34px rgba(0,0,0,0.2)",
  },
  trainingGroupButton: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    color: "var(--text-primary)",
    cursor: "pointer",
    textAlign: "left",
  },
  trainingGroupMain: {
    display: "grid",
    gap: 5,
    minWidth: 0,
  },
  trainingGroupTitle: {
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 950,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  trainingGroupScores: {
    display: "grid",
    gap: 4,
    color: "var(--accent-gold)",
    fontSize: 12,
    fontWeight: 900,
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  trainingAttemptList: {
    display: "grid",
    gap: 1,
    padding: "0 12px 12px",
  },
  trainingAttemptRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "11px 3px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
  },
  trainingAttemptTitle: {
    display: "block",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 900,
    marginBottom: 3,
  },
  trainingAttemptStats: {
    display: "grid",
    gap: 3,
    color: "var(--text-secondary)",
    fontSize: 12,
    fontWeight: 850,
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  progressEmpty: {
    padding: "34px 18px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.045)",
    color: "var(--text-secondary)",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  progressItem: {
    borderRadius: 18,
    background: "rgba(11,11,11,0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: 15,
    boxShadow: "0 12px 34px rgba(0,0,0,0.2)",
  },
  progressItemTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 9,
  },
  progressDate: {
    color: "var(--text-secondary)",
    fontSize: 12,
    fontWeight: 750,
  },
  progressScore: {
    color: "var(--accent-gold)",
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  progressCaption: {
    margin: 0,
    color: "rgba(255,255,255,0.82)",
    fontSize: 14,
    lineHeight: 1.45,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  reelPreviewMedia: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    background: "linear-gradient(145deg, #070707, #18090c)",
  },
  reelPreviewFallback: {
    position: "absolute",
    inset: 0,
  },
  deleteReelButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 3,
    width: 30,
    height: 30,
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(7,7,7,0.72)",
    color: "#fff",
    fontSize: 20,
    fontWeight: 800,
    lineHeight: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 24px rgba(0,0,0,0.36)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
  },
  fighterTagsRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    margin: "14px auto 4px",
    maxWidth: 430,
  },
  fighterTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid",
    fontSize: 11,
    fontWeight: 850,
    letterSpacing: 0.3,
    lineHeight: 1.4,
  },
  reelGridEmpty: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "72px 24px 80px",
    gap: 12,
    background: "var(--background)",
  },
  reelGridEmptyIcon: {
    fontSize: 52,
    lineHeight: 1,
    marginBottom: 4,
    filter: "drop-shadow(0 4px 16px rgba(193,18,31,0.4))",
  },
  reelGridEmptyTitle: {
    margin: 0,
    color: "var(--text-primary)",
    fontWeight: 950,
    fontSize: 20,
    textAlign: "center",
  },
  reelGridEmptyText: {
    margin: 0,
    fontSize: 14,
    color: "var(--text-secondary)",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 1.5,
  },
  reelGridEmptyCta: {
    marginTop: 8,
    padding: "12px 26px",
    borderRadius: 999,
    border: "none",
    background: "#C1121F",
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    letterSpacing: 0.2,
  },
  reelTileTypeBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    fontSize: 14,
    lineHeight: 1,
    pointerEvents: "none",
    zIndex: 4,
    filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.95))",
  },
  reelTileOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "20px 6px 6px",
    background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
    pointerEvents: "none",
    zIndex: 3,
  },
  reelTileLikes: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.2,
    textShadow: "0 1px 6px rgba(0,0,0,0.9)",
    marginBottom: 2,
  },
  reelTileCaption: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: 600,
    textShadow: "0 1px 4px rgba(0,0,0,0.9)",
  },
  rankRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
    marginBottom: 2,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "6px 14px",
    borderRadius: 14,
    WebkitTapHighlightColor: "transparent",
  },
  rankLabel: {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  onFireBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    color: "#FB923C",
    background: "rgba(251,146,60,0.12)",
    border: "1px solid rgba(251,146,60,0.3)",
  },
  xpWrap: {
    maxWidth: 430,
    margin: "12px auto 0",
    padding: "0 4px",
  },
  xpTopRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  xpAmount: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 0.3,
  },
  xpNextLabel: {
    fontSize: 11,
    color: "#888",
    textAlign: "right",
  },
  xpTrack: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 500ms ease",
  },
  xpBreakdownRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "4px 10px",
    marginTop: 10,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(212,175,55,0.07)",
    border: "1px solid rgba(212,175,55,0.14)",
  },
  xpBDLabel: {
    fontSize: 9,
    fontWeight: 900,
    color: "#D4AF37",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginRight: 2,
  },
  xpBDItem: {
    fontSize: 11,
    color: "#888",
    fontWeight: 600,
  },
  xpBDNum: {
    fontWeight: 900,
    color: "#ccc",
  },
  xpBDTotal: {
    marginLeft: "auto",
    fontSize: 12,
    fontWeight: 900,
    color: "#fff",
    whiteSpace: "nowrap",
  },
  xpCapFlag: {
    fontSize: 10,
    color: "#FB923C",
    fontWeight: 700,
  },
  weeklySeasonCard: {
    width: "100%",
    background: "rgba(212,175,55,0.08)",
    border: "1px solid rgba(212,175,55,0.28)",
    borderRadius: 14,
    padding: "12px 16px",
    marginTop: 14,
    cursor: "pointer",
    textAlign: "left",
  },
  weeklyBadgeRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  weeklyBadgeEmoji: {
    fontSize: 18,
    lineHeight: 1,
  },
  weeklyBadgeLabel: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  weeklyRankRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  weeklyRankItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  weeklyRankNum: {
    fontSize: 16,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1,
  },
  weeklyRankLbl: {
    fontSize: 9,
    color: "#888",
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  weeklyRankDivider: {
    width: 1,
    height: 28,
    background: "rgba(255,255,255,0.12)",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.78)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    zIndex: 300,
    display: "flex",
    alignItems: "flex-end",
  },
  weeklyModalSheet: {
    width: "100%",
    background: "#111",
    borderRadius: "18px 18px 0 0",
    padding: "20px 20px 40px",
    maxHeight: "60vh",
    overflowY: "auto",
  },
  weeklyModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    background: "rgba(255,255,255,0.18)",
    margin: "0 auto 16px",
  },
  weeklyModalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  weeklyModalTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: "#fff",
  },
  weeklyModalClose: {
    background: "transparent",
    border: "none",
    color: "#888",
    fontSize: 18,
    cursor: "pointer",
    padding: "4px 8px",
  },
  weeklyModalBadgeBlock: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
    padding: "16px 0",
    background: "rgba(212,175,55,0.06)",
    borderRadius: 12,
    border: "1px solid rgba(212,175,55,0.2)",
  },
  weeklyModalBadgeEmoji: {
    fontSize: 44,
    lineHeight: 1,
  },
  weeklyModalBadgeName: {
    fontSize: 16,
    fontWeight: 900,
    letterSpacing: 0.5,
  },
  weeklyModalStats: {
    display: "flex",
    justifyContent: "space-around",
    gap: 12,
    marginBottom: 16,
    padding: "14px 12px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
  },
  weeklyModalStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
  },
  weeklyModalStatVal: {
    fontSize: 22,
    fontWeight: 900,
    color: "#fff",
    lineHeight: 1,
  },
  weeklyModalStatLbl: {
    fontSize: 10,
    color: "#888",
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  weeklyModalDesc: {
    margin: "0 0 16px",
    fontSize: 13,
    color: "#888",
    lineHeight: 1.55,
    textAlign: "center",
  },
  weeklyModalBtn: {
    width: "100%",
    padding: "14px 0",
    borderRadius: 12,
    background: "linear-gradient(135deg, #C1121F, #9B0D18)",
    border: "none",
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    letterSpacing: 0.5,
  },
  sessionsCard: {
    width: "100%",
    background: "rgba(212,175,55,0.05)",
    border: "1px solid rgba(212,175,55,0.2)",
    borderRadius: 14,
    padding: "12px 14px",
    marginTop: 14,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  sessionsTitle: {
    fontSize: 13,
    fontWeight: 1000,
    color: "#D4AF37",
    letterSpacing: 0.3,
  },
  sessionRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  sessionDateBadge: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "rgba(212,175,55,0.1)",
    border: "1px solid rgba(212,175,55,0.25)",
    borderRadius: 10,
    padding: "6px 10px",
    minWidth: 60,
  },
  sessionDateDay: {
    fontSize: 12,
    fontWeight: 1000,
    color: "#D4AF37",
  },
  sessionDateTime: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: 700,
  },
  sessionInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: 900,
    color: "#fff",
  },
  sessionStatus: {
    fontSize: 11,
    color: "#34D399",
    fontWeight: 700,
  },
  pvpCard: {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: "10px 14px",
    marginTop: 14,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  pvpCardTitle: {
    fontSize: 10,
    fontWeight: 900,
    color: "#888",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pvpCardRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  pvpCardStat: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
  },
  pvpCardNum: {
    fontSize: 20,
    fontWeight: 1000,
    color: "#fff",
    lineHeight: 1,
  },
  pvpCardLbl: {
    fontSize: 9,
    color: "#666",
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  pvpCardDivider: {
    width: 1,
    height: 24,
    background: "rgba(255,255,255,0.1)",
  },
  pvpBattleList: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    borderTop: "1px solid rgba(255,255,255,0.07)",
    paddingTop: 10,
  },
  pvpBattleListTitle: {
    fontSize: 9,
    fontWeight: 900,
    color: "#555",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  pvpBattleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  pvpBattleBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    border: "1px solid",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 1000,
    flexShrink: 0,
  },
  pvpBattleOpponent: {
    flex: 1,
    fontSize: 12,
    fontWeight: 700,
    color: "#ccc",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pvpBattleScores: {
    fontSize: 11,
    color: "#666",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
};
