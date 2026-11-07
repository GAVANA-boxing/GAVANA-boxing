"use client";

import { useCallback, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { getFirebase } from "@/lib/lazyFirebase";
import { createNewFollowerNotification } from "@/lib/notifications";
import { sendPushNotification } from "@/lib/pushNotification";

export function useFeedFollow({ user, router, currentLocale }) {
  const [followingSet, setFollowingSet] = useState(new Set());
  const [loadingSet,   setLoadingSet]   = useState(new Set());

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    async function loadFollows() {
      try {
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const snap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid)));
        if (cancelled) return;
        setFollowingSet(new Set(snap.docs.map((d) => d.data().followingId)));
      } catch { /* non-critical */ }
    }

    loadFollows();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const handleFollow = useCallback(async (creatorUid) => {
    if (!user?.uid) {
      router.push(`/${currentLocale}/login`);
      return;
    }
    if (!creatorUid || creatorUid === user.uid) return;
    if (loadingSet.has(creatorUid)) return;

    const wasFollowing = followingSet.has(creatorUid);

    // Optimistic update
    setFollowingSet((prev) => {
      const next = new Set(prev);
      wasFollowing ? next.delete(creatorUid) : next.add(creatorUid);
      return next;
    });
    setLoadingSet((prev) => new Set(prev).add(creatorUid));

    try {
      const { doc, setDoc, deleteDoc, serverTimestamp } = await import("firebase/firestore");
      const followRef = doc(db, "follows", `${user.uid}_${creatorUid}`);

      if (wasFollowing) {
        await deleteDoc(followRef);
      } else {
        await setDoc(followRef, {
          followerId:  user.uid,
          followingId: creatorUid,
          createdAt:   serverTimestamp(),
        });

        const actorName = user.displayName || user.email?.split("@")[0] || "";
        createNewFollowerNotification({
          recipientId:   creatorUid,
          actorId:       user.uid,
          actorName,
          actorPhotoURL: user.photoURL || "",
        });

        // Fire-and-forget push notification
        auth.currentUser?.getIdToken().then((token) => {
          sendPushNotification({ recipientId: creatorUid, kind: "follow", actorName, token });
        }).catch(() => {});
      }
    } catch {
      // Rollback on failure
      setFollowingSet((prev) => {
        const next = new Set(prev);
        wasFollowing ? next.add(creatorUid) : next.delete(creatorUid);
        return next;
      });
    } finally {
      setLoadingSet((prev) => {
        const next = new Set(prev);
        next.delete(creatorUid);
        return next;
      });
    }
  }, [user, router, currentLocale, followingSet, loadingSet]);

  return { followingSet, loadingSet, handleFollow };
}
