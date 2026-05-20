"use client";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useCoachPageActions({ user, router, locale, setSparringPosts }) {
  const [requestedIds, setRequestedIds] = useState(new Set());
  const [showSparringForm, setShowSparringForm] = useState(false);
  const [sparringForm, setSparringForm] = useState({
    weight: "", level: "", location: "", availableTime: "", note: "",
  });
  const [sparringSaving, setSpSaving] = useState(false);
  const [sparringSaved, setSpSaved] = useState(false);

  const handleCoachRequest = async (coachId) => {
    if (!user?.uid) { router.push(`/${locale}/login`); return; }
    try {
      await addDoc(collection(db, "coach_requests"), {
        coachId,
        userId: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
        message: "",
        locale,
      });
      setRequestedIds((prev) => new Set(prev).add(coachId));
    } catch (e) {
    }
  };

  const handleSparringRequest = async (postId) => {
    if (!user?.uid) { router.push(`/${locale}/login`); return; }
    try {
      await addDoc(collection(db, "coach_requests"), {
        sparringPostId: postId,
        userId: user.uid,
        type: "sparring",
        status: "pending",
        createdAt: serverTimestamp(),
        locale,
      });
      setRequestedIds((prev) => new Set(prev).add(postId));
    } catch (e) {
    }
  };

  const handleCreateSparringPost = async () => {
    if (!user?.uid) { router.push(`/${locale}/login`); return; }
    setSpSaving(true);
    try {
      const docRef = await addDoc(collection(db, "sparring_posts"), {
        userId: user.uid,
        weight: sparringForm.weight,
        level: sparringForm.level,
        location: sparringForm.location,
        availableTime: sparringForm.availableTime,
        note: sparringForm.note,
        active: true,
        createdAt: serverTimestamp(),
        locale,
      });
      setSparringPosts((prev) => [{
        id: docRef.id,
        userId: user.uid,
        ...sparringForm,
        active: true,
      }, ...prev]);
      setSpSaved(true);
      setSparringForm({ weight: "", level: "", location: "", availableTime: "", note: "" });
      setShowSparringForm(false);
    } catch (e) {
    } finally {
      setSpSaving(false);
    }
  };

  return {
    requestedIds,
    showSparringForm, setShowSparringForm,
    sparringForm, setSparringForm,
    sparringSaving, sparringSaved,
    handleCoachRequest, handleSparringRequest, handleCreateSparringPost,
  };
}
