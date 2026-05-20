"use client";

import { useEffect, useState } from "react";
import { getFirebase } from "@/lib/lazyFirebase";

export function useUserReelData({ user, authLoading }) {
  const [userLikes, setUserLikes] = useState(new Set());
  const [userViews, setUserViews] = useState(new Set());
  const [followingIds, setFollowingIds] = useState(new Set());
  const [savedReels, setSavedReels] = useState(new Set());

  useEffect(() => {
    if (authLoading || !user?.uid) {
      setFollowingIds(new Set());
      return;
    }
    let isActive = true;
    async function loadFollowing() {
      try {
        const { db } = await getFirebase();
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        if (!isActive) return;
        const snap = await getDocs(query(collection(db, "follows"), where("followerId", "==", user.uid)));
        if (!isActive) return;
        const nextFollowing = new Set();
        snap.forEach((doc) => { const data = doc.data(); if (data.followingId) nextFollowing.add(data.followingId); });
        setFollowingIds(nextFollowing);
      } catch (err) {
        if (!isActive) return;
        setFollowingIds(new Set());
      }
    }
    loadFollowing();
    return () => { isActive = false; };
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (authLoading || !user?.uid) {
      setUserLikes(new Set());
      return;
    }
    let isActive = true;
    async function loadUserLikes() {
      try {
        const { db } = await getFirebase();
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        if (!isActive) return;
        const likesSnapshot = await getDocs(query(collection(db, "user_likes"), where("userId", "==", user.uid)));
        const likesSet = new Set();
        likesSnapshot.forEach((doc) => { const data = doc.data(); likesSet.add(data.reelId); });
        if (isActive) setUserLikes(likesSet);
      } catch (err) {
      }
    }
    loadUserLikes();
    return () => { isActive = false; };
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (authLoading || !user?.uid) {
      setSavedReels(new Set());
      return;
    }
    let isActive = true;
    async function loadSavedReels() {
      try {
        const { db } = await getFirebase();
        const { collection, getDocs, query, where } = await import("firebase/firestore");
        if (!isActive) return;
        const savedSnapshot = await getDocs(query(collection(db, "saved_reels"), where("userId", "==", user.uid)));
        const savedSet = new Set();
        savedSnapshot.forEach((doc) => { const data = doc.data(); if (data.reelId) savedSet.add(data.reelId); });
        if (isActive) setSavedReels(savedSet);
      } catch (err) {
      }
    }
    loadSavedReels();
    return () => { isActive = false; };
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (authLoading || !user?.uid) {
      setUserViews(new Set());
      return;
    }
    let isActive = true;
    async function loadUserViews() {
      try {
        const sessionKey = `gavana_views_${user.uid}`;
        let viewsSet = new Set();
        try {
          const stored = sessionStorage.getItem(sessionKey);
          if (stored) JSON.parse(stored).forEach((id) => viewsSet.add(id));
        } catch { /* sessionStorage unavailable */ }
        const { db } = await getFirebase();
        const { collection, getDocs, query, where, orderBy, limit } = await import("firebase/firestore");
        if (!isActive) return;
        const snap = await getDocs(query(
          collection(db, "reel_views"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(300)
        ));
        snap.forEach((doc) => viewsSet.add(doc.data().reelId));
        if (isActive) setUserViews(viewsSet);
      } catch (err) {
      }
    }
    loadUserViews();
    return () => { isActive = false; };
  }, [authLoading, user?.uid]);

  return { userLikes, setUserLikes, userViews, setUserViews, followingIds, savedReels, setSavedReels };
}
