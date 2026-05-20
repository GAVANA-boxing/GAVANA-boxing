"use client";
import { useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { createNewFollowerNotification } from "@/lib/notifications";
import { startConversation } from "@/lib/messaging";

export function useProfileActions({
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
}) {
  const handleMessage = useCallback(async () => {
    if (!user) { router.push(`/${locale || "en"}/login`); return; }
    if (isOwnProfile) { router.push(`/${locale || "en"}/inbox`); return; }
    try {
      const convoId = await startConversation(user, userId, {
        displayName: profileUser?.displayName || profileUser?.username || "",
        photoURL: profileUser?.photoURL || "",
      });
      router.push(`/${locale || "en"}/inbox/${convoId}`);
    } catch (e) {
      console.error("Message error:", e);
    }
  }, [user, userId, locale, router, isOwnProfile, profileUser]);

  const handleFollow = useCallback(async () => {
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
  }, [user, userId, locale, router, isOwnProfile, isFollowing, followLoading, stats, setIsFollowing, setStats, setFollowLoading, setIsMutual, loadFollowStats]);

  const handleLogout = useCallback(async () => {
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
  }, [signingOut, setSigningOut, locale, router]);

  const handleSwitchAccount = useCallback(async () => {
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
  }, [signingOut, setSigningOut, locale, router]);

  const handleSendChallenge = useCallback(async (challengeId) => {
    if (!user?.uid || !userId || challengeSending) return;
    setChallengeSending(true);
    try {
      const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
      await addDoc(collection(db, "pvp_challenges"), {
        challengerId: user.uid,
        opponentId: userId,
        challengeId,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      await addDoc(collection(db, "notifications"), {
        recipientId: userId,
        actorId: user.uid,
        actorName: user.displayName || "Fighter",
        fromUserId: user.uid,
        fromUsername: user.displayName || "Fighter",
        fromUserPhotoURL: user.photoURL || "",
        type: "pvp_challenge",
        challengeId,
        message: locale === "mn"
          ? `${user.displayName || "Fighter"} тан руу тулааны шийдэл илгээлээ!`
          : locale === "ko"
          ? `${user.displayName || "Fighter"}님이 PvP 배틀을 신청했습니다!`
          : `${user.displayName || "Fighter"} challenged you to a battle!`,
        read: false,
        createdAt: serverTimestamp(),
      });
      setChallengeSent(true);
      setTimeout(() => { setChallengeSent(false); setShowChallengeModal(false); }, 2000);

      // Fire-and-forget push notification — fails silently if FCM not configured
      try {
        const token = await import("@/lib/firebase").then(({ auth }) => auth.currentUser?.getIdToken());
        if (token) {
          fetch("/api/push-notify", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              recipientId: userId,
              title: "⚔️ New Challenge!",
              body: `${user.displayName || "A fighter"} challenged you on GAVANA`,
              url: `/${locale}/train`,
            }),
          }).catch(() => {});
        }
      } catch { /* push is optional */ }
    } catch (e) {
      console.error("challenge send error", e);
    } finally {
      setChallengeSending(false);
    }
  }, [user, userId, locale, challengeSending, setChallengeSending, setChallengeSent, setShowChallengeModal]);

  return { handleMessage, handleFollow, handleLogout, handleSwitchAccount, handleSendChallenge };
}
