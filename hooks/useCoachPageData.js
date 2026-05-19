"use client";

import { useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";

export function useCoachPageData({ tab, userId }) {
  const [coaches, setCoaches] = useState([]);
  const [sparringPosts, setSparringPosts] = useState([]);
  const [coachesLoading, setCoachesLoading] = useState(false);
  const [sparringLoading, setSparringLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(false);
  const [myRequestCoaches, setMyRequestCoaches] = useState({});
  const coachesLoadedRef = useRef(false);
  const sparringLoadedRef = useRef(false);
  const myRequestsLoadedRef = useRef(false);

  useEffect(() => {
    if (tab !== "coaches" || coachesLoadedRef.current) return;
    coachesLoadedRef.current = true;
    let active = true;
    setCoachesLoading(true);
    getDocs(query(collection(db, "users"), where("isCoach", "==", true)))
      .then((snap) => { if (active) setCoaches(snapToDocs(snap)); })
      .catch(() => {})
      .finally(() => { if (active) setCoachesLoading(false); });
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    if (tab !== "sparring" || sparringLoadedRef.current) return;
    sparringLoadedRef.current = true;
    let active = true;
    setSparringLoading(true);
    getDocs(query(collection(db, "sparring_posts"), where("active", "==", true)))
      .then((snap) => { if (active) setSparringPosts(snapToDocs(snap)); })
      .catch(() => {})
      .finally(() => { if (active) setSparringLoading(false); });
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    if (tab !== "mine" || myRequestsLoadedRef.current || !userId) return;
    myRequestsLoadedRef.current = true;
    let active = true;
    setMyRequestsLoading(true);
    getDocs(query(collection(db, "coach_requests"), where("userId", "==", userId)))
      .then(async (snap) => {
        if (!active) return;
        const reqs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setMyRequests(reqs);

        const coachIds = [...new Set(reqs.map((r) => r.coachId).filter(Boolean))];
        if (coachIds.length) {
          const profiles = await Promise.all(
            coachIds.map((cid) =>
              getDoc(doc(db, "users", cid)).then((s) => s.exists() ? { id: cid, ...s.data() } : null)
            )
          );
          const map = {};
          profiles.forEach((p) => { if (p) map[p.id] = p; });
          if (active) setMyRequestCoaches(map);
        }
      })
      .catch(() => {})
      .finally(() => { if (active) setMyRequestsLoading(false); });
    return () => { active = false; };
  }, [tab, userId]);

  return {
    coaches, setCoaches,
    sparringPosts, setSparringPosts,
    coachesLoading,
    sparringLoading,
    myRequests,
    myRequestsLoading,
    myRequestCoaches,
  };
}
