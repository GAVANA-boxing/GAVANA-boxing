"use client";

import { useEffect, useState, useRef } from "react";
import { createNotification } from "@/lib/notifications";
import {
  getSafeLikeCount,
  getSafeViewCount,
  sortReelsByEngagement,
  getCreatedAtMs,
} from "@/lib/reelHelpers";
import { computeFeedScore } from "@/lib/analytics";
import { useUserReelData } from "@/hooks/useUserReelData";

import { getFirebase } from "@/lib/lazyFirebase";

export function useReelFeed({ user, authLoading, isProfileSource, profileSourceUserId, currentReelId }) {
  const [allReels, setAllReels] = useState(null);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [creatorProfiles, setCreatorProfiles] = useState({});
  const [creatorStats, setCreatorStats] = useState({});
  const [gymNames, setGymNames] = useState({});
  const [featuredCreatorIds, setFeaturedCreatorIds] = useState(new Set());
  const [userTrainingProfile, setUserTrainingProfile] = useState(null);
  const [profileReelProgress, setProfileReelProgress] = useState(null);

  const creatorProfileRequests = useRef(new Set());
  const gymNameRequests = useRef(new Set());

  const { userLikes, setUserLikes, userViews, setUserViews, followingIds, savedReels, setSavedReels } =
    useUserReelData({ user, authLoading });

  // Load profile-source progress for current reel
  useEffect(() => {
    if (!isProfileSource || !profileSourceUserId || !currentReelId) {
      setProfileReelProgress(null);
      return;
    }

    let isActive = true;
    setProfileReelProgress(null); // reset while loading

    async function loadProgress() {
      try {
        const { db } = await getFirebase();
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const snap = await getDocs(query(
          collection(db, "training_sessions"),
          where("userId", "==", profileSourceUserId),
          where("reelId", "==", currentReelId)
        ));

        if (!isActive) return;

        if (snap.empty) {
          setProfileReelProgress({ empty: true });
          return;
        }

        const sessions = snap.docs
          .map((d) => ({ ...d.data(), id: d.id }))
          .filter((s) => s.type === "training" && Number.isFinite(Number(s.score)))
          .sort((a, b) => {
            const ta = a.createdAt?.toMillis?.() || 0;
            const tb = b.createdAt?.toMillis?.() || 0;
            return tb - ta;
          });

        if (!sessions.length) {
          setProfileReelProgress({ empty: true });
          return;
        }

        const scores = sessions.map((s) => Number(s.score));
        setProfileReelProgress({
          empty: false,
          attempts: sessions.length,
          bestScore: Math.max(...scores),
          latestScore: scores[0],
        });
      } catch (err) {
        console.error("Failed to load profile reel progress:", err);
        if (isActive) setProfileReelProgress(null);
      }
    }

    loadProgress();
    return () => { isActive = false; };
  }, [isProfileSource, profileSourceUserId, currentReelId]);

  // Load creator profiles
  useEffect(() => {
    if (!allReels || !allReels.length) return;

    let isActive = true;
    const missingCreatorIds = [...new Set(
      allReels
        .map((reel) => reel?.userId)
        .filter((userId) => userId && !creatorProfiles[userId] && !creatorProfileRequests.current.has(userId))
    )];

    if (!missingCreatorIds.length) return;

    async function loadCreatorProfiles() {
      try {
        const { db } = await getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");

        await Promise.all(missingCreatorIds.map(async (creatorId) => {
          creatorProfileRequests.current.add(creatorId);

          try {
            const profileSnap = await getDoc(doc(db, "users", creatorId));
            const profileData = profileSnap.exists() ? profileSnap.data() : {};

            if (!isActive) return;

            setCreatorProfiles((prev) => ({
              ...prev,
              [creatorId]: {
                displayName: profileData.displayName || "",
                username: profileData.username || "",
                photoURL: profileData.photoURL || "",
                profileImageUrl: profileData.profileImageUrl || "",
                profileImage: profileData.profileImage || "",
                streakCount: Number(profileData.streakCount) || 0,
              },
            }));
          } catch (err) {
            console.error("Failed to load creator profile:", err);

            if (!isActive) return;

            setCreatorProfiles((prev) => ({
              ...prev,
              [creatorId]: {},
            }));
          }
        }));
      } catch (err) {
        console.error("Failed to prepare creator profile reads:", err);
      }
    }

    loadCreatorProfiles();

    return () => {
      isActive = false;
    };
  }, [allReels, creatorProfiles]);

  // Fetch creator stats (XP, rank, best AI score)
  useEffect(() => {
    if (!allReels || !allReels.length) return;

    let isActive = true;
    const missingCreatorIds = [...new Set(
      allReels
        .map((reel) => reel?.userId)
        .filter((userId) => userId && !creatorStats[userId])
    )];

    if (!missingCreatorIds.length) return;

    async function loadCreatorStats() {
      try {
        const { db } = await getFirebase();
        const { collection, query, where, getDocs, doc, getDoc } = await import("firebase/firestore");
        const { calculateUserXP, getFighterRank } = await import("@/lib/xp");

        await Promise.all(missingCreatorIds.map(async (creatorId) => {
          if (!isActive) return;

          try {
            // Get AI feedback scores
            const feedbackQuery = query(
              collection(db, "ai_feedback"),
              where("userId", "==", creatorId)
            );
            const feedbackSnap = await getDocs(feedbackQuery);
            const feedbackDocs = feedbackSnap.docs.map(doc => ({
              score: doc.data().score,
              createdAt: doc.data().createdAt
            }));

            // Get user profile for streak
            const userDoc = await getDoc(doc(db, "users", creatorId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            const streakDays = Number(userData.streakCount) || 0;

            // Calculate XP and rank (without likesReceived for now)
            const totalXP = calculateUserXP({
              aiFeedbackDocs: feedbackDocs,
              streakDays,
              likesReceived: 0 // TODO: Calculate total likes received
            });
            const rank = getFighterRank(totalXP);

            // Get best AI score
            const bestScore = feedbackDocs.length > 0
              ? Math.max(...feedbackDocs.map(d => Number(d.score) || 0))
              : null;

            if (!isActive) return;

            setCreatorStats((prev) => ({
              ...prev,
              [creatorId]: {
                xp: totalXP,
                rank,
                bestScore,
                hasData: feedbackDocs.length > 0
              },
            }));
          } catch (err) {
            console.error("Failed to load creator stats:", err);

            if (!isActive) return;

            setCreatorStats((prev) => ({
              ...prev,
              [creatorId]: {
                xp: 0,
                rank: null,
                bestScore: null,
                hasData: false
              },
            }));
          }
        }));
      } catch (err) {
        console.error("Failed to prepare creator stats reads:", err);
      }
    }

    loadCreatorStats();

    return () => {
      isActive = false;
    };
  }, [allReels, creatorStats]);

  // Fetch reels from Firestore with real-time updates
  useEffect(() => {
    if (authLoading) {
      setReelsLoading(true);
      return;
    }

    if (!user?.uid) {
      setAllReels([]);
      setFollowingIds(new Set());
      setReelsLoading(false);
      return;
    }

    let unsubscribe;
    let isActive = true;

    async function loadReels() {
      try {
        const { db } = await getFirebase();
        const { collection, query, orderBy, limit, onSnapshot } = await import("firebase/firestore");
        if (!isActive) return;

        const reelsQuery = query(collection(db, "reels"), orderBy("createdAt", "desc"), limit(120));

        // Use onSnapshot for real-time updates
        unsubscribe = onSnapshot(reelsQuery, (snapshot) => {
          if (!isActive) return;

          const reelsData = snapshot.docs.map((doc) => {
            const data = doc.data();
            // Migrate from likesCount to likes if needed
            let likeCount = getSafeLikeCount({ likes: data.likes, likesCount: data.likesCount });
            return {
              id: doc.id,
              ...data,
              likes: likeCount
            };
          });

          setAllReels(reelsData.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a)));
          setReelsLoading(false);
        }, (err) => {
          if (!isActive) return;
          console.error("Failed to listen for reels:", err);
          setAllReels([]);
          setReelsLoading(false);
        });
      } catch (err) {
        if (!isActive) return;
        console.error("Failed to load reels:", err);
        setAllReels([]);
        setReelsLoading(false);
      }
    }

    setAllReels(null);
    setReelsLoading(true);
    loadReels();

    return () => {
      isActive = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [authLoading, user?.uid]);

  // Load user_training_profile for feed personalization
  useEffect(() => {
    if (!user?.uid) { setUserTrainingProfile(null); return; }
    let active = true;
    async function loadProfile() {
      try {
        const { db } = await getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "user_training_profile", user.uid));
        if (active && snap.exists()) setUserTrainingProfile(snap.data());
      } catch { /* non-critical */ }
    }
    loadProfile();
    return () => { active = false; };
  }, [user?.uid]);

  // Load currently active featured creators (used for feed boost)
  useEffect(() => {
    let active = true;
    async function loadFeaturedCreators() {
      try {
        const { db } = await getFirebase();
        const { collection, getDocs, query, where, Timestamp } = await import("firebase/firestore");
        const now = Timestamp.now();
        const snap = await getDocs(query(
          collection(db, "featured_creators"),
          where("featuredUntil", ">=", now)
        ));
        if (!active) return;
        const ids = new Set();
        snap.forEach((doc) => { if (doc.data().userId) ids.add(doc.data().userId); });
        setFeaturedCreatorIds(ids);
      } catch { /* non-critical — featured boost is best-effort */ }
    }
    loadFeaturedCreators();
    return () => { active = false; };
  }, []);

  // Lazily fetch gym names for tagged reels
  useEffect(() => {
    const reelsWithGym = (allReels || []).filter((r) => r.gymId && !gymNames[r.gymId] && !gymNameRequests.current.has(r.gymId));
    if (reelsWithGym.length === 0) return;
    reelsWithGym.forEach((r) => gymNameRequests.current.add(r.gymId));
    async function fetchGymNames() {
      try {
        const { db } = await getFirebase();
        const { doc, getDoc } = await import("firebase/firestore");
        const results = await Promise.all(reelsWithGym.map((r) => getDoc(doc(db, "gyms", r.gymId))));
        const updates = {};
        results.forEach((snap) => { if (snap.exists()) updates[snap.id] = snap.data().gymName || ""; });
        if (Object.keys(updates).length > 0) setGymNames((prev) => ({ ...prev, ...updates }));
      } catch { /* non-critical */ }
    }
    fetchGymNames();
  }, [allReels, gymNames]);

  return {
    allReels, setAllReels,
    reelsLoading,
    userLikes, setUserLikes,
    userViews, setUserViews,
    followingIds,
    savedReels, setSavedReels,
    creatorProfiles,
    creatorStats,
    gymNames,
    featuredCreatorIds,
    userTrainingProfile,
    profileReelProgress,
  };
}
