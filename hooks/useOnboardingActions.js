"use client";
import { useState } from "react";
import { addDoc, collection, doc, getDocs, limit, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";
import { funnel, FUNNEL } from "@/lib/funnel";
import { CORE_MODE, showRoute } from "@/lib/coreRoutes";

export function useOnboardingActions({ user, locale, router }) {
  // showIntro: value-prop screen shown before profile-building steps
  // Core mode: the interest screen and the role step lead to hidden features (sparring,
  // reels, gyms, coach marketplace) and their answers aren't used — start at the stance step.
  const [showIntro, setShowIntro] = useState(!CORE_MODE);
  const [primaryInterest, setPrimaryInterest] = useState(null);
  const [step, setStep] = useState(CORE_MODE ? 1 : 0);
  const [role, setRole] = useState(CORE_MODE ? "fighter" : null);
  const [archetype, setArchetype] = useState(null);
  // Which foot is forward decides which hand is the jab — the detector labels
  // every punch by it, so it is asked here (the archetype is optional: Fighter
  // DNA finds the style from real rounds anyway).
  const [stance, setStance] = useState(null);
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

  // Profile writes during onboarding. setDoc + merge (not updateDoc): it also works when
  // users/{uid} was never created (sign-up interrupted) — updateDoc failed silently there and the
  // account was bounced between /onboarding and every other page forever. Capped at 5 s so a
  // dead connection can't freeze the step (the write stays queued and syncs later).
  const saveUser = (data) => Promise.race([
    setDoc(doc(db, "users", user.uid), data, { merge: true }),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);

  const handleIntroNext = async (interest) => {
    setPrimaryInterest(interest);
    // Persist to localStorage for fast reads and Firestore for profile
    try { localStorage.setItem("gavana_primaryInterest", interest); } catch {}
    try { await saveUser({ primaryInterest: interest }); } catch {}
    setShowIntro(false);
  };

  const handleRoleNext = async (selectedRole) => {
    setRole(selectedRole);
    setSaving(true);
    try {
      await saveUser({ role: selectedRole });
    } catch (e) { }
    setSaving(false);
    goTo(selectedRole === "fighter" ? 1 : 4);
  };

  const handleStep1Next = async () => {
    if (!stance) return;
    setSaving(true);
    try { localStorage.setItem("gavana_stance", stance); } catch { /* private mode */ }
    try {
      await saveUser({
        role: "fighter",
        stance,
        ...(archetype ? { archetype, fighterArchetype: archetype } : {}),
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
      await saveUser({ weeklyGoal });
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
      await saveUser({ onboardingComplete: true, onboarding: { completed: true } });
    } catch {}
    funnel(FUNNEL.ONBOARDING_COMPLETED, { locale, meta: "full" });
    // Onboarding already explained the DNA idea — skip the duplicate /train overlay.
    try { localStorage.setItem("gavana_onboarding_seen", "1"); } catch {}
    // Fighters go straight to the camera (value), not a second checklist hub.
    const defaultDest = role === "coach" ? `/${locale}/coach/dashboard`
      : role === "gym" && showRoute("/gyms") ? `/${locale}/gyms/dashboard`
      : `/${locale}/train`;
    router.replace(dest || defaultDest);
  };

  // Fast-path: skip identity questions and go straight to training.
  // Marks onboarding complete (so the global interceptor won't re-trap the
  // user) but flags it deferred so a lightweight profile prompt can ask later.
  const skipToTraining = async () => {
    setSaving(true);
    try {
      await saveUser({
        onboardingComplete: true,
        onboarding: { completed: true },
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
    stance, setStance,
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
