"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, getDocs, query, collection, where, documentId } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { snapToDocs } from "@/lib/firestore";

export function useGymData({ gymId }) {
  const [gym, setGym] = useState(null);
  const [reels, setReels] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gymId) return;
    let active = true;
    async function load() {
      try {
        const byTs = (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        const [gymSnap, reelsSnap, reviewsSnap, announcementsSnap] = await Promise.all([
          getDoc(doc(db, "gyms", gymId)),
          getDocs(query(collection(db, "reels"), where("gymId", "==", gymId))),
          getDocs(query(collection(db, "gym_reviews"), where("gymId", "==", gymId))),
          getDocs(query(collection(db, "gym_announcements"), where("gymId", "==", gymId))),
        ]);
        if (!active) return;
        if (gymSnap.exists()) setGym({ id: gymSnap.id, ...gymSnap.data() });
        setReels(snapToDocs(reelsSnap).sort(byTs));
        setReviews(snapToDocs(reviewsSnap).sort(byTs));
        setAnnouncements(snapToDocs(announcementsSnap).sort(byTs));

        const membersSnap = await getDocs(query(
          collection(db, "gym_join_requests"),
          where("gymId", "==", gymId),
          where("status", "==", "approved")
        ));
        const memberDocs = snapToDocs(membersSnap);
        const memberUserIds = [...new Set(memberDocs.map((m) => m.userId).filter(Boolean))];
        const memberUserMap = {};
        if (memberUserIds.length > 0) {
          const batches = [];
          for (let i = 0; i < memberUserIds.length; i += 10) {
            batches.push(memberUserIds.slice(i, i + 10));
          }
          await Promise.all(batches.map(async (batch) => {
            const snap = await getDocs(query(collection(db, "users"), where(documentId(), "in", batch)));
            snap.forEach((d) => { memberUserMap[d.id] = d.data(); });
          }));
        }
        if (active) {
          setMembers(memberDocs.map((m) => ({
            ...m,
            user: memberUserMap[m.userId] || null,
          })));
        }
      } catch (e) {
        console.error("gym profile load error", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [gymId]);

  return { gym, setGym, reels, reviews, setReviews, announcements, coaches, members, loading };
}
