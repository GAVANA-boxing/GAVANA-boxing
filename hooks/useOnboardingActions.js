"use client";
import { useState } from "react";
import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";
import { funnel, FUNNEL } from "@/lib/funnel";
import { CORE_MODE } from "@/lib/coreRoutes";

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
    // Core-loop focus: gyms are hidden, so go straight to Welcome → Train.
    if (CORE_MODE) { goTo(4); return; }
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
    funnel(FUNNEL.ONBOARDING_COMPLETED, { locale, meta: "full" });
    // Onboarding already explained the DNA idea — skip the duplicate /train overlay.
    try { localStorage.setItem("gavana_onboarding_seen", "1"); } catch {}
    // Fighters go straight to the camera (value), not a second checklist hub.
    const defaultDest = role === "coach" ? `/${locale}/coach/dashboard`
      : role === "gym" ? `/${locale}/gyms/dashboard`
      : `/${locale}/train`;
    router.replace(dest || defaultDest);
  };

  // Fast-path: skip identity questions and go straight to training.
  // Marks onboarding complete (so the global interceptor won't re-trap the
  // user) but flags it deferred so a lightweight profile prompt can ask later.
  const skipToTraining = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        onboardingComplete: true,
        "onboarding.completed": true,
        onboardingDeferred: true,
        role: role || "fighter",
        primaryInterest: primaryInterest || "train",
      });
    } catch {}
    funnel(FUNNEL.ONBOARDING_COMPLETED, { locale, meta: "skip" });
    try {
      localStorage.setItem("gavana_onboarding_seen", "1");
      localStorage.setItem("gavana_primaryInterest", "train");
    } catch {}
    router.replace(`/${locale}/train`);
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
    skipToTraining,
  };
}
