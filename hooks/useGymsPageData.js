"use client";

import { useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";

export function useGymsPageData({ tab, userId }) {
  const [gyms, setGyms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myMemberships, setMyMemberships] = useState([]);
  const [myMembershipsLoading, setMyMembershipsLoading] = useState(false);
  const [ownedGym, setOwnedGym] = useState(null);
  const myMembershipsLoadedRef = useRef(false);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, "gyms"), orderBy("createdAt", "desc"), limit(50)));
        if (active) setGyms(snapToDocs(snap));
      } catch (e) {
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (tab !== "mine" || myMembershipsLoadedRef.current || !userId) return;
    myMembershipsLoadedRef.current = true;
    let active = true;
    setMyMembershipsLoading(true);
    Promise.all([
      getDocs(query(collection(db, "gym_join_requests"), where("userId", "==", userId))),
      getDocs(query(collection(db, "gyms"), where("ownerId", "==", userId))),
    ])
      .then(async ([reqSnap, ownedSnap]) => {
        if (!active) return;
        if (!ownedSnap.empty) {
          const od = ownedSnap.docs[0];
          setOwnedGym({ id: od.id, ...od.data() });
        }
        const reqs = reqSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        const gymIds = [...new Set(reqs.map((r) => r.gymId).filter(Boolean))];
        const gymMap = {};
        await Promise.all(gymIds.map(async (gid) => {
          const s = await getDoc(doc(db, "gyms", gid));
          if (s.exists()) gymMap[gid] = { id: gid, ...s.data() };
        }));
        if (active) setMyMemberships(reqs.map((r) => ({ ...r, gym: gymMap[r.gymId] || null })));
      })
      .catch(() => {})
      .finally(() => { if (active) setMyMembershipsLoading(false); });
    return () => { active = false; };
  }, [tab, userId]);

  return {
    gyms, loading,
    myMemberships, myMembershipsLoading, ownedGym,
  };
}
