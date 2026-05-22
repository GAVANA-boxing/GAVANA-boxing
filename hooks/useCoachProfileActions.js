"use client";
import { useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, increment, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useCoachProfileActions({
  user, router, locale, t, coachId,
  setRequested, setPendingRequestId, pendingRequestId,
  setReviews, setEligibleBooking, eligibleBooking,
  setEnrolledIds, setPrograms, enrolledIds,
}) {
  const [requesting, setRequesting] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [enrolling, setEnrolling] = useState(null);

  const handleRequest = async () => {
    if (!user?.uid) { router.push(`/${locale}/login`); return; }
    setRequesting(true);
    try {
      const reqDoc = await addDoc(collection(db, "coach_requests"), {
        coachId,
        userId: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
        message: "",
        locale,
      });
      setRequested(true);
      setPendingRequestId(reqDoc.id);
      // Notify the coach
      await addDoc(collection(db, "notifications"), {
        recipientId: coachId,
        actorId: user.uid,
        actorName: user.displayName || "Someone",
        fromUserId: user.uid,
        fromUsername: user.displayName || "Someone",
        fromUserPhotoURL: user.photoURL || "",
        type: "coach_request",
        message: t("notifCoachRequest").replace("{actor}", user.displayName || "Someone"),
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
    } finally {
      setRequesting(false);
    }
  };

  const handleCancelCoachRequest = async () => {
    if (!pendingRequestId) return;
    try {
      await deleteDoc(doc(db, "coach_requests", pendingRequestId));
      setRequested(false);
      setPendingRequestId(null);
    } catch (e) {
    }
  };

  const handleReviewSubmit = async () => {
    if (!user?.uid || !eligibleBooking) return;
    setReviewSubmitting(true);
    setReviewError("");
    try {
      // Double-check no existing review for this booking
      const existing = await getDocs(query(
        collection(db, "coach_reviews"),
        where("bookingId", "==", eligibleBooking),
        where("userId", "==", user.uid)
      ));
      if (!existing.empty) {
        setReviewError(t("coachReviewAlreadyReviewed"));
        setReviewSubmitting(false);
        return;
      }

      await addDoc(collection(db, "coach_reviews"), {
        coachId,
        userId: user.uid,
        bookingId: eligibleBooking,
        rating: reviewRating,
        review: reviewText.trim(),
        createdAt: serverTimestamp(),
      });

      // Recalculate average rating
      const allReviews = await getDocs(query(collection(db, "coach_reviews"), where("coachId", "==", coachId)));
      const ratings = allReviews.docs.map((d) => Number(d.data().rating)).filter(Number.isFinite);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5;

      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", coachId), {
        coachRating: Number(avg.toFixed(1)),
        coachTotalReviews: ratings.length,
      });

      setReviews((prev) => [{ id: Date.now(), coachId, userId: user.uid, bookingId: eligibleBooking, rating: reviewRating, review: reviewText.trim(), createdAt: null }, ...prev]);
      setReviewSuccess(true);
      setEligibleBooking(null);
      setShowReviewForm(false);
    } catch (e) {
      setReviewError(t("coachReviewError"));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleEnroll = async (program) => {
    if (!user) { router.push(`/${locale}/login`); return; }
    if (enrolling) return;
    setEnrolling(program.id);
    const alreadyEnrolled = enrolledIds.has(program.id);
    try {
      if (alreadyEnrolled) {
        const snap = await getDocs(query(collection(db, "program_enrollments"), where("userId", "==", user.uid), where("programId", "==", program.id)));
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        await updateDoc(doc(db, "training_programs", program.id), { enrolledCount: increment(-1) }).catch(() => {});
        setEnrolledIds((prev) => { const next = new Set(prev); next.delete(program.id); return next; });
        setPrograms((prev) => prev.map((p) => p.id === program.id ? { ...p, enrolledCount: Math.max(0, (p.enrolledCount || 1) - 1) } : p));
      } else {
        await addDoc(collection(db, "program_enrollments"), {
          userId: user.uid,
          programId: program.id,
          coachId: program.coachId,
          enrolledAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "training_programs", program.id), { enrolledCount: increment(1) }).catch(() => {});
        setEnrolledIds((prev) => new Set([...prev, program.id]));
        setPrograms((prev) => prev.map((p) => p.id === program.id ? { ...p, enrolledCount: (p.enrolledCount || 0) + 1 } : p));
      }
    } catch (e) {
    } finally {
      setEnrolling(null);
    }
  };

  return {
    requesting,
    showReviewForm, setShowReviewForm,
    reviewRating, setReviewRating,
    reviewText, setReviewText,
    reviewSubmitting, reviewSuccess, reviewError,
    enrolling,
    handleRequest, handleCancelCoachRequest, handleReviewSubmit, handleEnroll,
  };
}
