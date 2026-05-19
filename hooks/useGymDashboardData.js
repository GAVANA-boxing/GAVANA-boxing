"use client";

import { useEffect, useState } from "react";
import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";

export function useGymDashboardData({ user }) {
  const [checking, setChecking] = useState(true);
  const [gym, setGym] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [requesterUsers, setRequesterUsers] = useState({});
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    async function check() {
      try {
        const gymSnap = await getDocs(query(collection(db, "gyms"), where("ownerId", "==", user.uid)));
        if (!active) return;
        if (!gymSnap.empty) {
          const gymDoc = { id: gymSnap.docs[0].id, ...gymSnap.docs[0].data() };
          setGym(gymDoc);
          const [reqSnap, annSnap] = await Promise.all([
            getDocs(query(collection(db, "gym_join_requests"), where("gymId", "==", gymDoc.id))),
            getDocs(query(collection(db, "gym_announcements"), where("gymId", "==", gymDoc.id))),
          ]);
          if (active) {
            const allReqDocs = snapToDocs(reqSnap);
            const pendingDocs = allReqDocs.filter((r) => r.status === "pending" || !r.status);
            const approvedDocs = allReqDocs.filter((r) => r.status === "approved");
            setJoinRequests(pendingDocs);
            setMembers(approvedDocs);
            setAnnouncements(snapToDocs(annSnap).sort((a, b) => {
              const aMs = a.createdAt?.toMillis?.() || a.createdAt?.toDate?.()?.getTime?.() || 0;
              const bMs = b.createdAt?.toMillis?.() || b.createdAt?.toDate?.()?.getTime?.() || 0;
              return bMs - aMs;
            }));
            const uniqueIds = [...new Set(allReqDocs.map((r) => r.userId).filter(Boolean))];
            if (uniqueIds.length > 0) {
              const chunks = [];
              for (let i = 0; i < uniqueIds.length; i += 10) chunks.push(uniqueIds.slice(i, i + 10));
              const userMap = {};
              await Promise.all(chunks.map(async (chunk) => {
                const uSnap = await getDocs(query(collection(db, "users"), where(documentId(), "in", chunk)));
                uSnap.docs.forEach((d) => { userMap[d.id] = d.data(); });
              }));
              if (active) setRequesterUsers(userMap);
            }
          }
        }
      } catch (e) {
        console.error("gym dashboard check error", e);
      } finally {
        if (active) setChecking(false);
      }
    }
    check();
    return () => { active = false; };
  }, [user?.uid]);

  return {
    checking,
    gym,
    joinRequests,
    members,
    requesterUsers,
    announcements,
    setGym,
    setJoinRequests,
    setMembers,
    setAnnouncements,
  };
}
