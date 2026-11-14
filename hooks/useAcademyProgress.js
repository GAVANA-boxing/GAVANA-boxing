"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useUserProfile } from "@/context/UserProfileProvider";
import { nextLessonEntry } from "@/lib/academyProgress";
import { getLocalDateKey } from "@/lib/utils";

const STORAGE_KEY = "gavana_academy_progress";
const DEFAULT_PATH = "foundation";

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { lessonProgress: {}, currentPathId: DEFAULT_PATH };
  } catch { return { lessonProgress: {}, currentPathId: DEFAULT_PATH }; }
}

function saveLocal(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
}

export function useAcademyProgress({ user }) {
  const [lessonProgress, setLessonProgress] = useState({});
  const [currentPathId, setCurrentPathIdState] = useState(DEFAULT_PATH);
  const [loading, setLoading] = useState(true);
  const [guestPrompt, setGuestPrompt] = useState(false);
  const { profile, loading: profileLoading } = useUserProfile();
  const seededForRef = useRef(null);

  useEffect(() => {
    if (user?.uid) {
      // Seed once per signed-in user from the shared profile; don't re-clobber
      // the locally-mutated progress on every realtime tick.
      if (profileLoading) return;
      if (seededForRef.current !== user.uid) {
        const ap = profile?.academyProgress || {};
        setLessonProgress(ap.lessonProgress || {});
        setCurrentPathIdState(ap.currentPathId || DEFAULT_PATH);
        seededForRef.current = user.uid;
      }
      setLoading(false);
    } else {
      seededForRef.current = null;
      const stored = loadLocal();
      setLessonProgress(stored.lessonProgress || {});
      setCurrentPathIdState(stored.currentPathId || DEFAULT_PATH);
      setLoading(false);
    }
  }, [user?.uid, profile, profileLoading]);

  const persist = useCallback(async (nextLp, pathId, showPrompt = false) => {
    if (user?.uid) {
      try {
        const { doc, setDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        await setDoc(doc(db, "users", user.uid), {
          academyProgress: { lessonProgress: nextLp, currentPathId: pathId },
        }, { merge: true });
      } catch { }
    } else {
      saveLocal({ lessonProgress: nextLp, currentPathId: pathId });
      if (showPrompt) setGuestPrompt(true);
    }
  }, [user?.uid]);

  // One round with a lesson. `punches` is the round's punch count (roundPunchCount): a round the
  // result screen calls "not enough data" records nothing. What "done" means per lesson lives in
  // lib/academyProgress.js.
  const recordSession = useCallback((lessonId, score, punches) => {
    setLessonProgress(prev => {
      const entry = nextLessonEntry(prev[lessonId], lessonId, { score, punches, dateKey: getLocalDateKey() });
      if (!entry) return prev;
      const next = { ...prev, [lessonId]: entry };
      persist(next, currentPathId, true);
      return next;
    });
  }, [currentPathId, persist]);

  const setCurrentPath = useCallback((pathId) => {
    setCurrentPathIdState(pathId);
    persist(lessonProgress, pathId);
  }, [lessonProgress, persist]);

  return {
    lessonProgress,
    currentPathId,
    loading,
    guestPrompt,
    setGuestPrompt,
    recordSession,
    setCurrentPath,
  };
}
