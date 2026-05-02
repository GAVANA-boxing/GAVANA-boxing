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
  const [profileTab, setProfileTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [previewFailures, setPreviewFailures] = useState({});

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
        const { collection, query, where, orderBy, onSnapshot } = await import("firebase/firestore");

        // Check if this is the current user's own profile
        const isOwn = user.uid === userId;
        setIsOwnProfile(isOwn);

        // Get user data (for now, we'll create a basic user object)
        // In a real app, you'd have a users collection
        const profileUserData = {
          id: userId,
          username: `user_${userId.slice(0, 8)}`, // Placeholder username
          email: `user_${userId.slice(0, 8)}@example.com` // Placeholder email
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
        Loading profile...
      </div>
    );
  }

  if (!user || !profileUser) {
    return null; // Will redirect
  }

  const visibleReels = profileTab === "saved" ? savedUserReels : userReels;
  const markPreviewFailed = (reelId, type) => {
    setPreviewFailures((prev) => ({ ...prev, [`${reelId}:${type}`]: true }));
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
      <div style={{
        width: "100%",
        padding: "var(--space-8) var(--space-4) var(--space-6)",
        background: "radial-gradient(circle at 50% 0%, rgba(193,18,31,0.18), transparent 34%), linear-gradient(180deg, var(--surface) 0%, var(--background) 100%)",
        borderBottom: "1px solid var(--line)",
        textAlign: "center",
        boxSizing: "border-box"
      }}>
        <div style={{
          width: 124,
          height: 124,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #C1121F, #5b0710)",
          border: "2px solid rgba(212,175,55,0.78)",
          boxShadow: "0 0 0 6px rgba(193,18,31,0.16), var(--shadow-glow-red)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 42,
          fontWeight: 950,
          margin: "0 auto 18px",
          color: "var(--text-primary)"
        }}>
          {profileUser.username?.charAt(0).toUpperCase() || "U"}
        </div>

        <h1 style={{
          fontSize: 42,
          fontWeight: 1000,
          margin: "0 0 20px",
          color: "var(--text-primary)",
          letterSpacing: 0,
          lineHeight: 1,
          textShadow: "0 10px 34px rgba(0,0,0,0.7)"
        }}>
          @{profileUser.username}
        </h1>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          marginBottom: 24,
          flexWrap: "wrap"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 950, color: "var(--text-primary)", lineHeight: 1 }}>{userReels.length}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 5 }}>{t("reels")}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 950, color: "var(--text-primary)", lineHeight: 1 }}>{totalLikes}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 5 }}>{t("likes")}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 950, color: "var(--text-primary)", lineHeight: 1 }}>{stats.followers}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 5 }}>{t("followers")}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 950, color: "var(--text-primary)", lineHeight: 1 }}>{stats.following}</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 5 }}>{t("followingCount")}</div>
          </div>
        </div>

        {isOwnProfile ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 10
          }}>
            <button
              onClick={() => router.push(`/${locale}/profile/edit`)}
              style={{
                padding: "9px 17px",
                border: "1px solid var(--line)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.055)",
                color: "var(--text-primary)",
                fontSize: 13,
                cursor: "pointer"
              }}
            >
              {t("editProfile")}
            </button>
            <button
              onClick={handleLogout}
              disabled={signingOut}
              style={{
                padding: "9px 17px",
                border: "1px solid var(--line)",
                borderRadius: 999,
                background: "rgba(255,255,255,0.055)",
                color: "var(--text-primary)",
                fontSize: 13,
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
                padding: "9px 17px",
                border: "none",
                borderRadius: 999,
                background: "var(--primary-red)",
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: "bold",
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
              padding: "10px 28px",
              border: "none",
              borderRadius: 999,
              background: followLoading ? "#555" : (isFollowing ? "#171717" : "#C1121F"),
              color: "var(--text-primary)",
              fontSize: 14,
              fontWeight: "bold",
              cursor: followLoading ? "not-allowed" : "pointer",
              opacity: followLoading ? 0.7 : 1
            }}
          >
            {followLoading ? "..." : (isFollowing ? t("unfollow") : t("follow"))}
          </button>
        )}
      </div>

      <div style={styles.profileTabs}>
        <button
          type="button"
          onClick={() => setProfileTab("posts")}
          style={{
            ...styles.profileTab,
            ...(profileTab === "posts" ? styles.profileTabActive : {})
          }}
        >
          {t("posts")}
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
      </div>

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
              {profileTab === "saved" ? "Bookmarked reels will appear here." : "Training clips will appear here."}
            </p>
          </div>
        ) : (
          visibleReels.map((reel) => {
            const imageFailed = previewFailures[`${reel.id}:image`];
            const videoFailed = previewFailures[`${reel.id}:video`];
            const showImage = reel.thumbnailUrl && !imageFailed;
            const showVideo = !showImage && reel.videoUrl && !videoFailed;
            const likeCount = getSafeReelLikes(reel);

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
                onClick={() => router.push(`/${locale}/reels`)}
              >
                {showImage ? (
                  <img
                    src={reel.thumbnailUrl}
                    alt={reel.description || "Training reel"}
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
                      {reel.description || "Training reel"}
                    </div>
                  </div>
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
  profileTabs: {
    display: "flex",
    width: "100%",
    borderBottom: "1px solid var(--line)",
    background: "var(--background)",
  },
  profileTab: {
    flex: 1,
    minHeight: 46,
    border: "none",
    background: "transparent",
    color: "var(--text-secondary)",
    fontSize: 13,
    fontWeight: 850,
    cursor: "pointer",
  },
  profileTabActive: {
    color: "var(--text-primary)",
    boxShadow: "inset 0 -2px 0 var(--primary-red)",
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
};
