"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";

export function useCoachProfileData({ coachId, user }) {
  const [coach, setCoach] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reels, setReels] = useState([]);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [eligibleBooking, setEligibleBooking] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set());

  useEffect(() => {
    if (!coachId) return;
    let active = true;
    async function load() {
      try {
        const [coachSnap, reviewsSnap, reelsSnap, bookingsSnap] = await Promise.all([
          getDoc(doc(db, "users", coachId)),
          getDocs(query(collection(db, "coach_reviews"), where("coachId", "==", coachId))),
          getDocs(query(collection(db, "reels"), where("userId", "==", coachId))),
          getDocs(query(collection(db, "coach_bookings"), where("coachId", "==", coachId), where("status", "==", "completed"))),
        ]);
        if (!active) return;
        setCoach(coachSnap.exists() ? { id: coachSnap.id, ...coachSnap.data() } : null);
        setReviews(snapToDocs(reviewsSnap));
        setReels(snapToDocs(reelsSnap));
        setCompletedSessions(bookingsSnap.size);
      } catch (e) {
        console.error("Coach profile load error:", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [coachId]);

  useEffect(() => {
    if (!user?.uid || !coachId) return;
    let active = true;
    async function checkEligible() {
      try {
        const [bookingsSnap, existingReviewSnap, pendingReqSnap] = await Promise.all([
          getDocs(query(
            collection(db, "coach_bookings"),
            where("userId", "==", user.uid),
            where("coachId", "==", coachId),
            where("status", "==", "completed")
          )),
          getDocs(query(
            collection(db, "coach_reviews"),
            where("userId", "==", user.uid),
            where("coachId", "==", coachId)
          )),
          getDocs(query(
            collection(db, "coach_requests"),
            where("userId", "==", user.uid),
            where("coachId", "==", coachId),
            where("status", "==", "pending")
          )),
        ]);
        if (!active) return;
        if (!bookingsSnap.empty && existingReviewSnap.empty) {
          setEligibleBooking(bookingsSnap.docs[0].id);
        }
        if (!pendingReqSnap.empty) {
          setRequested(true);
          setPendingRequestId(pendingReqSnap.docs[0].id);
        }
      } catch { /* silent */ }
    }
    checkEligible();
    return () => { active = false; };
  }, [user?.uid, coachId]);

  useEffect(() => {
    if (!coachId) return;
    let active = true;
    async function loadPrograms() {
      try {
        const snap = await getDocs(query(collection(db, "training_programs"), where("coachId", "==", coachId)));
        if (!active) return;
        setPrograms(snapToDocs(snap).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      } catch { if (active) setPrograms([]); }
    }
    loadPrograms();
    return () => { active = false; };
  }, [coachId]);

  useEffect(() => {
    if (!user?.uid) { setEnrolledIds(new Set()); return; }
    let active = true;
    async function loadEnrollments() {
      try {
        const snap = await getDocs(query(collection(db, "program_enrollments"), where("userId", "==", user.uid)));
        if (!active) return;
        setEnrolledIds(new Set(snap.docs.map((d) => d.data().programId)));
      } catch { if (active) setEnrolledIds(new Set()); }
    }
    loadEnrollments();
    return () => { active = false; };
  }, [user?.uid]);

  return {
    coach,
    reviews, setReviews,
    reels,
    completedSessions,
    loading,
    requested, setRequested,
    pendingRequestId, setPendingRequestId,
    eligibleBooking, setEligibleBooking,
    programs, setPrograms,
    enrolledIds, setEnrolledIds,
  };
}
