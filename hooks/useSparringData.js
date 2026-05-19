"use client";

import { useEffect, useState } from "react";
import {
  collection, doc, getDoc, getDocs, query, where, onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";
import { getTimestampMs } from "@/lib/utils";

export function useSparringData({ user, tab }) {
  const [posts, setPosts] = useState([]);
  const [myPost, setMyPost] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequestToIds, setSentRequestToIds] = useState(new Set());
  const [sentRequests, setSentRequests] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchHistory, setMatchHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) setUserData(snap.data());
    }).catch(() => {});
  }, [user?.uid]);

  useEffect(() => {
    const q = query(collection(db, "sparring_posts"), where("lookingForSparring", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const uid = user?.uid;
      const all = snapToDocs(snap).sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
      setMyPost(uid ? (all.find((p) => p.userId === uid) || null) : null);
      setPosts(all.filter((p) => p.userId !== uid));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "sparring_requests"), where("toUserId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setIncomingRequests(
        snapToDocs(snap).sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt))
      );
    }, () => {});
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "sparring_requests"), where("fromUserId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snapToDocs(snap).sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
      setSentRequestToIds(new Set(docs.filter((d) => !d.status || d.status === "pending").map((d) => d.toUserId)));
      setSentRequests(docs);
    }, () => {});
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (tab !== "history" || !user?.uid) return;
    let active = true;
    setHistoryLoading(true);
    Promise.all([
      getDocs(query(collection(db, "pvp_results"), where("challengerId", "==", user.uid))),
      getDocs(query(collection(db, "pvp_results"), where("opponentId", "==", user.uid))),
    ]).then(([asChallenger, asOpponent]) => {
      if (!active) return;
      const fromChallenger = snapToDocs(asChallenger);
      const fromOpponent = asOpponent.docs.map((d) => {
        const data = d.data();
        const result = data.result === "win" ? "loss" : data.result === "loss" ? "win" : data.result;
        return {
          id: d.id,
          ...data,
          result,
          opponentName: data.challengerName || data.challengerDisplayName || "Opponent",
          challengerScore: data.opponentScore,
          opponentScore: data.challengerScore,
        };
      });
      const seen = new Set(fromChallenger.map((d) => d.id));
      const unique = [...fromChallenger, ...fromOpponent.filter((d) => !seen.has(d.id))];
      unique.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setMatchHistory(unique);
    }).catch(() => {}).finally(() => { if (active) setHistoryLoading(false); });
    return () => { active = false; };
  }, [tab, user?.uid]);

  return {
    posts, setPosts,
    myPost, setMyPost,
    incomingRequests,
    sentRequestToIds,
    sentRequests,
    userData,
    loading,
    matchHistory,
    historyLoading,
  };
}
