"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";
import { useUserProfile } from "@/context/UserProfileProvider";

export function useCoachDashboardData({ user, authLoading, router, locale }) {
  const { profile, loading: profileLoading } = useUserProfile();
  const [requests, setRequests] = useState([]);
  const [requesterUsers, setRequesterUsers] = useState({});
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [programs, setPrograms] = useState([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/${locale}/login`);
      return;
    }
    if (profileLoading) return;
    if (!profile?.isCoach) {
      setAccessDenied(true);
      router.replace(`/${locale}/coach`);
      return;
    }
    setCompletedSessions(Number(profile.completedSessions) || 0);
  }, [authLoading, user, router, locale, profile, profileLoading]);

  useEffect(() => {
    if (!user?.uid || loadedRef.current) return;
    loadedRef.current = true;
    let active = true;

    async function loadRequests() {
      setLoadingRequests(true);
      try {
        const snap = await getDocs(
          query(collection(db, "coach_requests"), where("coachId", "==", user.uid))
        );
        if (!active) return;

        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setRequests(docs);

        const uniqueIds = [...new Set(docs.map((r) => r.userId).filter(Boolean))];
        if (uniqueIds.length === 0) return;

        const chunks = [];
        for (let i = 0; i < uniqueIds.length; i += 10) {
          chunks.push(uniqueIds.slice(i, i + 10));
        }
        const userMap = {};
        await Promise.all(
          chunks.map(async (chunk) => {
            const uSnap = await getDocs(
              query(collection(db, "users"), where(documentId(), "in", chunk))
            );
            uSnap.docs.forEach((d) => { userMap[d.id] = d.data(); });
          })
        );
        if (active) setRequesterUsers(userMap);
      } catch (e) {
      } finally {
        if (active) setLoadingRequests(false);
      }
    }

    loadRequests();
    return () => { active = false; };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    getDocs(query(collection(db, "training_programs"), where("coachId", "==", user.uid)))
      .then((snap) => {
        if (!active) return;
        setPrograms(snapToDocs(snap).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      }).catch(() => {});
    return () => { active = false; };
  }, [user?.uid]);

  return {
    requests, setRequests,
    requesterUsers,
    loadingRequests,
    accessDenied,
    completedSessions, setCompletedSessions,
    programs, setPrograms,
  };
}
