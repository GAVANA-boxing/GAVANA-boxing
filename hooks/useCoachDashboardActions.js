"use client";
import { useState } from "react";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useCoachDashboardActions({ user, locale, t, requests, setRequests, setCompletedSessions, setPrograms }) {
  const [updating, setUpdating] = useState(null);

  // Programs
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [progTitle, setProgTitle] = useState("");
  const [progDesc, setProgDesc] = useState("");
  const [progDuration, setProgDuration] = useState(7);
  const [progLevel, setProgLevel] = useState("beginner");
  const [progSaving, setProgSaving] = useState(false);

  // Booking modal state
  const [bookingRequest, setBookingRequest] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState(60);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  // Profile quick-view modal
  const [profileModal, setProfileModal] = useState(null);

  const handleAccept = async (requestId, requesterId) => {
    setUpdating(requestId);
    try {
      await updateDoc(doc(db, "coach_requests", requestId), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      // Notify requester
      if (requesterId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: requesterId,
          actorId: user.uid,
          actorName: user.displayName || "Coach",
          fromUserId: user.uid,
          fromUsername: user.displayName || "Coach",
          fromUserPhotoURL: user.photoURL || "",
          type: "coach_accept",
          message: "Your coach request was accepted!",
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setRequests((prev) =>
        prev.map((r) => r.id === requestId ? { ...r, status: "accepted" } : r)
      );
    } catch (e) {
    } finally {
      setUpdating(null);
    }
  };

  const handleDecline = async (requestId) => {
    setUpdating(requestId);
    const req = requests.find((r) => r.id === requestId);
    try {
      await updateDoc(doc(db, "coach_requests", requestId), {
        status: "declined",
        declinedAt: serverTimestamp(),
      });
      if (req?.userId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: req.userId,
          actorId: user.uid,
          actorName: user.displayName || "Coach",
          fromUserId: user.uid,
          fromUsername: user.displayName || "Coach",
          fromUserPhotoURL: user.photoURL || "",
          type: "coach_decline",
          message: t("notifCoachDeclined"),
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      setRequests((prev) =>
        prev.map((r) => r.id === requestId ? { ...r, status: "declined" } : r)
      );
    } catch (e) {
    } finally {
      setUpdating(null);
    }
  };

  const openBookingModal = (request) => {
    setBookingRequest(request);
    setBookingDate("");
    setBookingTime("");
    setBookingDuration(60);
    setBookingSuccess(false);
  };

  const handleBookingSubmit = async () => {
    if (!bookingDate || !bookingTime || !bookingRequest) return;
    setBookingSubmitting(true);
    try {
      const bookingDoc = await addDoc(collection(db, "coach_bookings"), {
        coachId: user.uid,
        userId: bookingRequest.userId,
        requestId: bookingRequest.id,
        date: bookingDate,
        time: bookingTime,
        durationMinutes: bookingDuration,
        status: "scheduled",
        createdAt: serverTimestamp(),
      });
      // Store bookingId back on request for easy Mark Complete lookup
      await updateDoc(doc(db, "coach_requests", bookingRequest.id), { bookingId: bookingDoc.id });

      if (bookingRequest.userId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: bookingRequest.userId,
          actorId: user.uid,
          actorName: user.displayName || "Coach",
          fromUserId: user.uid,
          fromUsername: user.displayName || "Coach",
          fromUserPhotoURL: user.photoURL || "",
          type: "booking_scheduled",
          message: t("sessionScheduled"),
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === bookingRequest.id
            ? { ...r, bookedAt: true, bookedDate: bookingDate, bookedTime: bookingTime, bookedDuration: bookingDuration }
            : r
        )
      );
      setBookingSuccess(true);
      setTimeout(() => setBookingRequest(null), 1400);
    } catch (e) {
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleMarkComplete = async (request) => {
    if (!request.bookingId) return;
    setCompletingId(request.id);
    try {
      // 1. Update booking status
      await updateDoc(doc(db, "coach_bookings", request.bookingId), {
        status: "completed",
        completedAt: serverTimestamp(),
      });

      // 2. Increment coach completedSessions
      const { increment } = await import("firebase/firestore");
      const coachRef = doc(db, "users", user.uid);
      const coachSnap = await getDoc(coachRef);
      const coachData = coachSnap.exists() ? coachSnap.data() : {};
      const newCompleted = (Number(coachData.completedSessions) || 0) + 1;

      // 3. Recalculate avg rating from reviews
      const reviewsSnap = await getDocs(query(collection(db, "coach_reviews"), where("coachId", "==", user.uid)));
      const ratings = reviewsSnap.docs.map((d) => Number(d.data().rating)).filter(Number.isFinite);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : Number(coachData.coachRating) || 5;

      await updateDoc(coachRef, {
        completedSessions: newCompleted,
        coachRating: Number(avgRating.toFixed(1)),
        coachTotalReviews: ratings.length,
      });
      setCompletedSessions(newCompleted);

      // 4. Notify student
      if (request.userId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: request.userId,
          actorId: user.uid,
          actorName: user.displayName || "Coach",
          fromUserId: user.uid,
          fromUsername: user.displayName || "Coach",
          fromUserPhotoURL: user.photoURL || "",
          type: "session_completed",
          message: t("coachSessionCompleted"),
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      // 5. Update local state
      setRequests((prev) =>
        prev.map((r) => r.id === request.id ? { ...r, sessionCompleted: true } : r)
      );
    } catch (e) {
    } finally {
      setCompletingId(null);
    }
  };

  const handleCreateProgram = async () => {
    if (!progTitle.trim() || progSaving) return;
    setProgSaving(true);
    try {
      const userData = await getDoc(doc(db, "users", user.uid));
      const uData = userData.exists() ? userData.data() : {};
      const ref = await addDoc(collection(db, "training_programs"), {
        coachId: user.uid,
        coachName: uData.displayName || uData.username || "",
        coachPhotoURL: uData.photoURL || "",
        title: progTitle.trim(),
        description: progDesc.trim(),
        duration: progDuration,
        level: progLevel,
        enrolledCount: 0,
        createdAt: serverTimestamp(),
      });
      setPrograms((prev) => [{ id: ref.id, coachId: user.uid, title: progTitle.trim(), description: progDesc.trim(), duration: progDuration, level: progLevel, enrolledCount: 0 }, ...prev]);
      setProgTitle(""); setProgDesc(""); setProgDuration(7); setProgLevel("beginner");
      setShowCreateForm(false);
    } catch (e) {
    } finally {
      setProgSaving(false);
    }
  };

  return {
    updating,
    showCreateForm, setShowCreateForm,
    progTitle, setProgTitle, progDesc, setProgDesc,
    progDuration, setProgDuration, progLevel, setProgLevel,
    progSaving,
    bookingRequest, setBookingRequest,
    bookingDate, setBookingDate, bookingTime, setBookingTime,
    bookingDuration, setBookingDuration,
    bookingSubmitting, bookingSuccess,
    completingId, activeFilter, setActiveFilter,
    profileModal, setProfileModal,
    handleAccept, handleDecline, openBookingModal, handleBookingSubmit, handleMarkComplete, handleCreateProgram,
  };
}
