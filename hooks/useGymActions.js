"use client";
import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useGymActions({ user, gymId, gym, locale, router, setReviews, t }) {
  // Join request state
  const [joinMessage, setJoinMessage] = useState("");
  const [joinRequested, setJoinRequested] = useState(false);
  const [pendingJoinRequestId, setPendingJoinRequestId] = useState(null);
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Check join/review status after user loads
  useEffect(() => {
    if (!user?.uid || !gymId) return;
    async function checkStatus() {
      const [joinSnap, reviewSnap] = await Promise.all([
        getDocs(query(collection(db, "gym_join_requests"), where("gymId", "==", gymId), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "gym_reviews"), where("gymId", "==", gymId), where("userId", "==", user.uid))),
      ]);
      if (!joinSnap.empty) {
        setJoinRequested(true);
        const pending = joinSnap.docs.find((d) => d.data().status === "pending");
        if (pending) setPendingJoinRequestId(pending.id);
      }
      if (!reviewSnap.empty) setAlreadyReviewed(true);
    }
    checkStatus().catch(() => {});
  }, [user?.uid, gymId]);

  const handleJoinRequest = async () => {
    if (!user) { router.push(`/${locale}/login`); return; }
    setJoinSubmitting(true);
    setJoinError("");
    try {
      const reqDoc = await addDoc(collection(db, "gym_join_requests"), {
        userId: user.uid,
        gymId,
        gymOwnerId: gym.ownerId,
        message: joinMessage.trim(),
        createdAt: serverTimestamp(),
        status: "pending",
      });
      setJoinRequested(true);
      setPendingJoinRequestId(reqDoc.id);
      setShowJoinForm(false);
      // Notify gym owner
      if (gym.ownerId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: gym.ownerId,
          actorId: user.uid,
          actorName: user.displayName || "Someone",
          fromUserId: user.uid,
          fromUsername: user.displayName || "Someone",
          fromUserPhotoURL: user.photoURL || "",
          type: "gym_join_request",
          message: t("notifGymJoinRequest").replace("{actor}", user.displayName || "Someone"),
          gymId,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch {
      setJoinError(t("gymJoinRequestError"));
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    if (!pendingJoinRequestId) return;
    try {
      await deleteDoc(doc(db, "gym_join_requests", pendingJoinRequestId));
      setJoinRequested(false);
      setPendingJoinRequestId(null);
    } catch (e) {
      console.error("Cancel join request error:", e);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) { router.push(`/${locale}/login`); return; }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      await addDoc(collection(db, "gym_reviews"), {
        gymId,
        userId: user.uid,
        rating: reviewRating,
        review: reviewText.trim(),
        createdAt: serverTimestamp(),
      });
      // Recalculate gym rating
      const allReviews = await getDocs(query(collection(db, "gym_reviews"), where("gymId", "==", gymId)));
      const ratings = allReviews.docs.map((d) => d.data().rating || 0);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      await updateDoc(doc(db, "gyms", gymId), {
        rating: Math.round(avg * 10) / 10,
        totalReviews: ratings.length,
      });
      setReviews((prev) => [{ id: Date.now().toString(), gymId, userId: user.uid, rating: reviewRating, review: reviewText.trim(), createdAt: null }, ...prev]);
      setReviewSuccess(true);
      setAlreadyReviewed(true);
      setShowReviewForm(false);
    } catch {
      setReviewError(t("gymReviewError"));
    } finally {
      setReviewSubmitting(false);
    }
  };

  return {
    joinMessage, setJoinMessage,
    joinRequested,
    pendingJoinRequestId,
    joinSubmitting,
    joinError,
    showJoinForm, setShowJoinForm,
    showReviewForm, setShowReviewForm,
    reviewRating, setReviewRating,
    reviewText, setReviewText,
    reviewSubmitting,
    reviewSuccess,
    reviewError,
    alreadyReviewed,
    handleJoinRequest, handleCancelJoinRequest, handleReviewSubmit,
  };
}
