"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";

export default function UserProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { locale, userId } = useParams();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState(null);
  const [userReels, setUserReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [reelLikes, setReelLikes] = useState({});
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      setLoading(false);
      router.push(`/${locale}/login`);
    }
  }, [user, authLoading, locale, router]);

  // Load profile data
  useEffect(() => {
    async function loadUserProfile() {
      if (authLoading) return;

      if (!user || !userId) {
        setLoading(false);
        return;
      }

      try {
        const { collection, query, where, getDocs, orderBy, doc, getDoc } = await import("firebase/firestore");

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

        // Get user's reels
        const reelsQuery = query(
          collection(db, "reels"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc")
        );
        const reelsSnapshot = await getDocs(reelsQuery);
        const reelsData = reelsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUserReels(reelsData);

        // Load likes for each reel
        await loadReelLikes(reelsData);

        // Calculate total likes by counting user_likes for this user's reels
        const reelIds = reelsData.map(reel => reel.id);
        let totalLikesCount = 0;

        if (reelIds.length > 0) {
          // Handle Firestore 'in' query limit of 10 by batching
          const batchSize = 10;
          for (let i = 0; i < reelIds.length; i += batchSize) {
            const batchIds = reelIds.slice(i, i + batchSize);
            const likesQuery = query(
              collection(db, "user_likes"),
              where("reelId", "in", batchIds)
            );
            const likesSnapshot = await getDocs(likesQuery);
            totalLikesCount += likesSnapshot.size;
          }
        }

        setTotalLikes(totalLikesCount);

        // Load followers/following counts
        await loadFollowStats(userId);

        // Check if current user is following this profile
        if (!isOwn) {
          await checkFollowStatus(user.uid, userId);
        }

      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [user, userId, authLoading]);

  // Load likes for reels
  const loadReelLikes = async (reels) => {
    if (!user?.uid) return;
    if (reels.length === 0) return;

    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore");

      const reelIds = reels.map(reel => reel.id);
      const likesMap = {};

      // Handle Firestore 'in' query limit of 10 by batching
      const batchSize = 10;
      for (let i = 0; i < reelIds.length; i += batchSize) {
        const batchIds = reelIds.slice(i, i + batchSize);
        const likesQuery = query(
          collection(db, "user_likes"),
          where("reelId", "in", batchIds)
        );
        const likesSnapshot = await getDocs(likesQuery);

        // Count likes for each reel in this batch
        batchIds.forEach(reelId => {
          const reelLikes = likesSnapshot.docs.filter(doc => doc.data().reelId === reelId).length;
          likesMap[reelId] = reelLikes;
        });
      }

      setReelLikes(likesMap);
    } catch (error) {
      console.error("Error loading reel likes:", error);
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
    if (!user || isOwnProfile || followLoading) return;

    setFollowLoading(true);
    try {
      const { doc, setDoc, deleteDoc, serverTimestamp } = await import("firebase/firestore");

      const followRef = doc(db, "follows", `${user.uid}_${userId}`);

      if (isFollowing) {
        // Unfollow
        await deleteDoc(followRef);
        setIsFollowing(false);
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
        setIsFollowing(true);
        // Reload follow stats to ensure accuracy
        await loadFollowStats(userId);
      }
    } catch (error) {
      console.error("Error following user:", error);
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
        background: "#080808",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff"
      }}>
        Loading profile...
      </div>
    );
  }

  if (!user || !profileUser) {
    return null; // Will redirect
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        padding: "20px",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        textAlign: "center"
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "#E8002D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 32,
          fontWeight: "bold",
          margin: "0 auto 16px",
          color: "#fff"
        }}>
          {profileUser.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <h1 style={{
          fontSize: 24,
          fontWeight: "bold",
          margin: "0 0 8px",
          color: "#fff"
        }}>
          @{profileUser.username}
        </h1>

        {/* Stats */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: 32,
          marginBottom: 20
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
              {userReels.length}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>Reels</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
              {totalLikes}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>Likes</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
              {stats.followers}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>Followers</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>
              {stats.following}
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>Following</div>
          </div>
        </div>

        {/* Follow/Edit Button */}
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
                padding: "8px 16px",
                border: "1px solid #333",
                borderRadius: 20,
                background: "transparent",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              disabled={signingOut}
              style={{
                padding: "8px 16px",
                border: "1px solid #333",
                borderRadius: 20,
                background: "#171717",
                color: "#fff",
                fontSize: 14,
                cursor: signingOut ? "not-allowed" : "pointer",
                opacity: signingOut ? 0.7 : 1
              }}
            >
              {signingOut ? "Signing out..." : "Logout"}
            </button>
            <button
              onClick={handleSwitchAccount}
              disabled={signingOut}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: 20,
                background: "#E8002D",
                color: "#fff",
                fontSize: 14,
                fontWeight: "bold",
                cursor: signingOut ? "not-allowed" : "pointer",
                opacity: signingOut ? 0.7 : 1
              }}
            >
              Switch account
            </button>
          </div>
        ) : (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            style={{
              padding: "8px 16px",
              border: "none",
              borderRadius: 20,
              background: followLoading ? "#666" : (isFollowing ? "#333" : "#E8002D"),
              color: "#fff",
              fontSize: 14,
              fontWeight: "bold",
              cursor: followLoading ? "not-allowed" : "pointer",
              opacity: followLoading ? 0.7 : 1
            }}
          >
            {followLoading ? "..." : (isFollowing ? "Unfollow" : "Follow")}
          </button>
        )}
      </div>

      {/* User's Reels Grid */}
      <div style={{
        padding: "20px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
        gap: 12
      }}>
        {userReels.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            padding: "40px",
            color: "#666"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <p>No reels yet</p>
          </div>
        ) : (
          userReels.map((reel) => (
            <div
              key={reel.id}
              style={{
                aspectRatio: "9/16",
                borderRadius: 12,
                overflow: "hidden",
                background: "#1a1a1a",
                cursor: "pointer",
                position: "relative"
              }}
              onClick={() => router.push(`/${locale}/reels`)}
            >
              <video
                src={reel.videoUrl}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
                muted
                preload="metadata"
              />
              <div style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                right: 8,
                color: "#fff",
                fontSize: 12
              }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                  ♥ {reelLikes[reel.id] || 0}
                </div>
                <div style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}>
                  {reel.description || ""}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
