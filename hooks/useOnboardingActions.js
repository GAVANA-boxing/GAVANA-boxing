"use client";
import { useState } from "react";
import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";

export function useOnboardingActions({ user, locale, router }) {
  // showIntro: value-prop screen shown before profile-building steps
  const [showIntro, setShowIntro] = useState(true);
  const [primaryInterest, setPrimaryInterest] = useState(null);
  const [step, setStep] = useState(0);
  const [role, setRole] = useState(null);
  const [archetype, setArchetype] = useState(null);
  const [weightClass, setWeightClass] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [animDir, setAnimDir] = useState(1);

  const [gyms, setGyms] = useState([]);
  const [gymsLoading, setGymsLoading] = useState(false);
  const [requestedGymId, setRequestedGymId] = useState(null);
  const [joining, setJoining] = useState(null);

  const goTo = (nextStep) => {
    setAnimDir(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const handleIntroNext = async (interest) => {
    setPrimaryInterest(interest);
    // Persist to localStorage for fast reads and Firestore for profile
    try { localStorage.setItem("gavana_primaryInterest", interest); } catch {}
    try { await updateDoc(doc(db, "users", user.uid), { primaryInterest: interest }); } catch {}
    setShowIntro(false);
  };

  const handleRoleNext = async (selectedRole) => {
    setRole(selectedRole);
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { role: selectedRole });
    } catch (e) { }
    setSaving(false);
    goTo(selectedRole === "fighter" ? 1 : 4);
  };

  const handleStep1Next = async () => {
    if (!archetype) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role: "fighter",
        archetype,
        fighterArchetype: archetype,
        weightClass: weightClass || null,
      });
    } catch (e) {
    } finally {
      setSaving(false);
    }
    goTo(2);
  };

  const handleStep2Next = async () => {
    if (!weeklyGoal) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { weeklyGoal });
    } catch (e) {
    } finally {
      setSaving(false);
    }
    setGymsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "gyms"), limit(12)));
      setGyms(snapToDocs(snap));
    } catch {}
    setGymsLoading(false);
    goTo(3);
  };

  const handleJoinGym = async (gym) => {
    if (joining || requestedGymId) return;
    setJoining(gym.id);
    try {
      await addDoc(collection(db, "gym_join_requests"), {
        gymId: gym.id,
        gymName: gym.gymName || "",
        userId: user.uid,
        message: "",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setRequestedGymId(gym.id);
    } catch (e) {
    } finally {
      setJoining(null);
    }
  };

  const finishOnboarding = async (dest) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        onboardingComplete: true,
        "onboarding.completed": true,
      });
    } catch {}
    router.replace(dest || `/${locale}/train`);
  };

  return {
    showIntro,
    primaryInterest,
    handleIntroNext,
    step, setStep,
    role,
    archetype, setArchetype,
    weightClass, setWeightClass,
    weeklyGoal, setWeeklyGoal,
    saving,
    animDir,
    gyms,
    gymsLoading,
    requestedGymId,
    joining,
    goTo,
    handleRoleNext,
    handleStep1Next,
    handleStep2Next,
    handleJoinGym,
    finishOnboarding,
  };
}
