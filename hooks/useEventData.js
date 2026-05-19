"use client";
import { useEffect, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, documentId, getDoc, increment, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

function formatEventDate(dateStr, locale) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(
    locale === "mn" ? "mn-MN" : locale === "ko" ? "ko-KR" : "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );
}

export function useEventData({ eventId, user, authLoading, locale, router }) {
  const [event, setEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [participants, setParticipants] = useState({});
  const [isGoing, setIsGoing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [settingReminder, setSettingReminder] = useState(false);

  useEffect(() => {
    if (!eventId || !user?.uid) return;
    let active = true;
    async function load() {
      try {
        const [eventDoc, rsvpSnap] = await Promise.all([
          getDoc(doc(db, "events", eventId)),
          getDocs(query(collection(db, "event_rsvps"), where("eventId", "==", eventId))),
        ]);
        if (!active) return;
        if (!eventDoc.exists()) { setLoading(false); return; }
        setEvent({ id: eventDoc.id, ...eventDoc.data() });

        const rsvpList = rsvpSnap.docs.map((d) => d.data());
        setRsvps(rsvpList);
        setIsGoing(rsvpList.some((r) => r.userId === user.uid));

        // Batch-load participant profiles
        const uids = [...new Set(rsvpList.map((r) => r.userId).filter(Boolean))];
        if (uids.length > 0) {
          const chunks = [];
          for (let i = 0; i < uids.length; i += 10) chunks.push(uids.slice(i, i + 10));
          const userMap = {};
          await Promise.all(chunks.map(async (chunk) => {
            const uSnap = await getDocs(query(collection(db, "users"), where(documentId(), "in", chunk)));
            uSnap.docs.forEach((d) => { userMap[d.id] = d.data(); });
          }));
          if (active) setParticipants(userMap);
        }
      } catch (e) {
        console.error("event detail load error", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [eventId, user?.uid, authLoading]);

  const handleRsvp = async () => {
    if (!user || rsvping || !event) return;
    setRsvping(true);
    const rsvpDocId = `${user.uid}_${eventId}`;
    try {
      if (isGoing) {
        await deleteDoc(doc(db, "event_rsvps", rsvpDocId));
        await updateDoc(doc(db, "events", eventId), { participantCount: increment(-1) });
        setIsGoing(false);
        setRsvps((prev) => prev.filter((r) => r.userId !== user.uid));
        setEvent((prev) => ({ ...prev, participantCount: Math.max(0, (prev.participantCount || 1) - 1) }));
      } else {
        await setDoc(doc(db, "event_rsvps", rsvpDocId), {
          eventId,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "events", eventId), { participantCount: increment(1) });
        setIsGoing(true);
        setRsvps((prev) => [...prev, { eventId, userId: user.uid }]);
        setEvent((prev) => ({ ...prev, participantCount: (prev.participantCount || 0) + 1 }));
        if (event.organizerId && event.organizerId !== user.uid) {
          await addDoc(collection(db, "notifications"), {
            recipientId: event.organizerId,
            actorId: user.uid,
            actorName: user.displayName || user.email?.split("@")[0] || "Fighter",
            fromUserId: user.uid,
            fromUsername: user.displayName || user.email?.split("@")[0] || "Fighter",
            fromUserPhotoURL: user.photoURL || "",
            type: "event_rsvp",
            message: `${user.displayName || "Fighter"} ${locale === "mn" ? "таны event-д RSVP хийлээ" : locale === "ko" ? "님이 이벤트에 참가 신청했습니다" : "RSVP'd to your event"}: ${event.title}`,
            eventId,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (e) {
      console.error("rsvp error", e);
    } finally {
      setRsvping(false);
    }
  };

  const handleReminder = async () => {
    if (!user || settingReminder || reminderSet || !event) return;
    setSettingReminder(true);
    try {
      await addDoc(collection(db, "notifications"), {
        recipientId: user.uid,
        actorId: "system",
        type: "event_reminder",
        message: locale === "mn"
          ? `📅 Сануулга: ${event.title} — ${formatEventDate(event.date, locale)}`
          : locale === "ko"
          ? `📅 알림: ${event.title} — ${formatEventDate(event.date, locale)}`
          : `📅 Reminder: ${event.title} — ${formatEventDate(event.date, locale)}`,
        eventId,
        read: false,
        createdAt: serverTimestamp(),
      });
      setReminderSet(true);
    } catch {}
    finally { setSettingReminder(false); }
  };

  return {
    event, setEvent,
    rsvps,
    participants,
    isGoing,
    loading,
    rsvping,
    reminderSet,
    settingReminder,
    handleRsvp,
    handleReminder,
  };
}
