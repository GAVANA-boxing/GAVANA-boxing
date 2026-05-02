"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import { getLocale, translate } from "@/lib/i18n";

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
  const [profileTab, setProfileTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [previewFailures, setPreviewFailures] = useState({});
  const [deletingReelIds, setDeletingReelIds] = useState(new Set());

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
          email: userData.email || `${fallbackName}@example.com`
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

          const latestByReelId = new Map();
          snapshot.docs
            .map((feedbackDoc) => ({
              id: feedbackDoc.id,
              ...feedbackDoc.data(),
            }))
            .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt))
            .forEach((feedback) => {
              const reelKey = feedback.reelId || feedback.id;
              if (!latestByReelId.has(reelKey)) {
                latestByReelId.set(reelKey, feedback);
              }
            });

          setAiFeedbackHistory([...latestByReelId.values()]);
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

  // Check if current user is following this profile
  const checkFollowStatus = async (currentUserId, targetUserId) => {
    if (!currentUserId || !targetUserId) return;

    try {
      const { doc, getDoc } = await import("firebase/firestore");

      const followRef = doc(db, "follows", `${currentUserId}_${targetUserId}`);
      const followDoc = await getDoc(followRef);
      setIsFollowing(followDoc.exists());
    } catch (error) {
      console.error("Error checking follow status:", error);
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
      const { doc, setDoc, deleteDoc, serverTimestamp } = await import("firebase/firestore");

      const followRef = doc(db, "follows", `${user.uid}_${userId}`);

      if (wasFollowing) {
        // Unfollow
        await deleteDoc(followRef);
        // Reload follow stats to ensure accuracy
        await loadFollowStats(userId);
      } else {
        // Follow
        await setDoc(followRef, {
          followerId: user.uid,
          followingId: userId,
          createdAt: serverTimestamp()
        });
        await createNotification({
          recipientId: userId,
          actorId: user.uid,
          actorName: user.email?.split("@")[0],
          type: "follow",
        });
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
    <div style={{
      minHeight: "100vh",
      background: "var(--background)",
      color: "var(--text-primary)",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: 0,
      overflowX: "hidden"
    }}>
      <section style={styles.fighterCard}>
        <div style={styles.fighterCardInner}>
        <div style={styles.avatarFrame}>
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

        <p style={styles.fighterKicker}>{t("fighter")}</p>
        <h1 style={styles.fighterName}>
          {profileUser.displayName || profileUser.username}
        </h1>
        <div style={styles.fighterUsername}>
          @{profileUser.username}
        </div>

        {profileUser.bio && (
          <p style={styles.bio}>
            {profileUser.bio}
          </p>
        )}

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

        {isOwnProfile ? (
          <div style={styles.actionRow}>
            <button
              onClick={() => router.push(`/${locale}/profile/edit`)}
              style={styles.ghostAction}
            >
              {t("editProfile")}
            </button>
            <button
              onClick={handleLogout}
              disabled={signingOut}
              style={{
                ...styles.ghostAction,
                cursor: signingOut ? "not-allowed" : "pointer",
                opacity: signingOut ? 0.7 : 1
              }}
            >
              {signingOut ? t("signingOut") : t("logout")}
            </button>
            <button
              onClick={handleSwitchAccount}
              disabled={signingOut}
              style={{
                ...styles.primaryAction,
                cursor: signingOut ? "not-allowed" : "pointer",
                opacity: signingOut ? 0.7 : 1
              }}
            >
              {t("switchAccount")}
            </button>
          </div>
        ) : (
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
        <section style={styles.progressSection}>
          <div style={styles.progressHeader}>
            <p style={styles.progressKicker}>{t("aiCoachKicker")}</p>
            <h2 style={styles.progressTitle}>{t("aiProgress")}</h2>
          </div>

          <div style={styles.scoreGrid}>
            <div style={styles.scoreCard}>
              <span style={styles.scoreValue}>{formatScore(latestScore)}</span>
              <span style={styles.scoreLabel}>{t("latest")}</span>
            </div>
            <div style={styles.scoreCard}>
              <span style={styles.scoreValue}>{formatScore(bestScore)}</span>
              <span style={styles.scoreLabel}>{t("best")}</span>
            </div>
            <div style={styles.scoreCard}>
              <span style={styles.scoreValue}>{formatScore(averageScore)}</span>
              <span style={styles.scoreLabel}>{t("average")}</span>
            </div>
          </div>

          <div style={styles.progressList}>
            {aiFeedbackHistory.length === 0 ? (
              <div style={styles.progressEmpty}>
                <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 900 }}>
                  {t("noAiFeedbackYet")}
                </p>
                <p style={{ margin: "8px 0 0" }}>
                  {t("aiFeedbackEmptyHelp")}
                </p>
              </div>
            ) : (
              aiFeedbackHistory.map((feedback) => (
                <article key={feedback.id} style={styles.progressItem}>
                  <div style={styles.progressItemTop}>
                    <span style={styles.progressDate}>{formatFeedbackDate(feedback.createdAt)}</span>
                    <strong style={styles.progressScore}>{t("score")}: {formatScore(feedback.score)}/10</strong>
                  </div>
                  <p style={styles.progressCaption}>
                    {feedback.reelCaption || t("trainingReel")}
                  </p>
                </article>
              ))
            )}
          </div>
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
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "56px 24px",
            color: "var(--text-secondary)",
            background: "var(--background)"
          }}>
            <p style={{ margin: 0, color: "var(--text-primary)", fontWeight: 850 }}>
              {profileTab === "saved" ? t("noSavedReelsYet") : t("noReelsYet")}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 13 }}>
              {profileTab === "saved" ? t("bookmarkedReelsEmpty") : t("trainingClipsEmpty")}
            </p>
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

            return (
              <div
                key={reel.id}
                className="profile-reel-tile"
                style={{
                  aspectRatio: "9/16",
                  overflow: "hidden",
                  background: "var(--surface-soft)",
                  cursor: "pointer",
                  position: "relative"
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
                  <div style={styles.reelPreviewFallback}>
                    <div style={styles.reelPreviewGlow} />
                    <div style={styles.reelPreviewFallbackText}>
                      {reel.description || t("trainingReel")}
                    </div>
                  </div>
                )}
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
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "22px 8px 8px",
                color: "var(--text-primary)",
                fontSize: 11,
                background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
                textShadow: "0 2px 8px rgba(0,0,0,0.9)"
              }}>
                <div style={{ fontWeight: 800, marginBottom: 3 }}>
                  {likeCount} {t("likes")}
                </div>
                <div style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "rgba(255,255,255,0.78)"
                }}>
                  {reel.description || ""}
                </div>
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
      `}</style>
    </div>
  );
}

const styles = {
  fighterCard: {
    width: "100%",
    padding: "calc(28px + env(safe-area-inset-top)) 16px 26px",
    background: "radial-gradient(circle at 50% 0%, rgba(193,18,31,0.22), transparent 36%), linear-gradient(180deg, #0B0B0B 0%, #070707 100%)",
    borderBottom: "1px solid rgba(212,175,55,0.14)",
    boxSizing: "border-box",
  },
  fighterCardInner: {
    width: "min(100%, 520px)",
    margin: "0 auto",
    textAlign: "center",
  },
  avatarFrame: {
    width: 138,
    height: 138,
    borderRadius: "50%",
    background: "linear-gradient(145deg, #C1121F, #310408)",
    border: "3px solid #C1121F",
    boxShadow: "0 0 0 1px rgba(212,175,55,0.55), 0 22px 70px rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 48,
    fontWeight: 1000,
    margin: "0 auto 18px",
    color: "#FFFFFF",
    overflow: "hidden",
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
    fontSize: "clamp(34px, 10vw, 48px)",
    lineHeight: 0.95,
    fontWeight: 1000,
    letterSpacing: 0,
  },
  fighterUsername: {
    marginTop: 10,
    color: "#AAAAAA",
    fontSize: 14,
    fontWeight: 750,
  },
  bio: {
    maxWidth: 430,
    margin: "18px auto 0",
    padding: "14px 16px",
    borderRadius: 16,
    background: "rgba(255,255,255,0.045)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 1.55,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 1,
    margin: "22px auto 22px",
    maxWidth: 430,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
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
    padding: "24px 16px 42px",
    boxSizing: "border-box",
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
  progressList: {
    display: "grid",
    gap: 10,
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
    display: "flex",
    alignItems: "flex-end",
    padding: 10,
    background: "radial-gradient(circle at 50% 34%, rgba(212,175,55,0.14), transparent 30%), radial-gradient(circle at 45% 64%, rgba(193,18,31,0.18), transparent 34%), linear-gradient(145deg, #070707, #14090b 56%, #050505)",
  },
  reelPreviewGlow: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(135deg, transparent, rgba(255,255,255,0.07), transparent)",
    opacity: 0.55,
  },
  reelPreviewFallbackText: {
    position: "relative",
    color: "var(--text-primary)",
    fontSize: 12,
    fontWeight: 850,
    lineHeight: 1.25,
    textShadow: "0 3px 14px rgba(0,0,0,0.9)",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
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
};
