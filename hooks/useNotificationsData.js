"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection, doc, getDoc, onSnapshot, query, updateDoc, where, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getActorId } from "@/lib/notificationHelpers";
import { getTimestampMs } from "@/lib/utils";

export function useNotificationsData({ user, authLoading }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actorProfiles, setActorProfiles] = useState({});
  const actorProfileRequests = useRef(new Set());

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const notificationsQuery = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid)
    );
    let isActive = true;

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      if (!isActive) return;

      const nextNotifications = snapshot.docs
        .map((notificationDoc) => ({
          id: notificationDoc.id,
          ...notificationDoc.data(),
        }))
        .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

      setNotifications(nextNotifications);
      setLoading(false);

      const unread = snapshot.docs.filter((d) => d.data().read === false);
      if (unread.length > 0) {
        const batch = writeBatch(db);
        unread.forEach((d) => batch.update(doc(db, "notifications", d.id), { read: true }));
        batch.commit().catch((error) => {
        });
      }
    }, (error) => {
      if (!isActive) return;
      setNotifications([]);
      setLoading(false);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [authLoading, user?.uid]);

  useEffect(() => {
    if (!notifications.length) return;

    let isActive = true;
    const missingActorIds = [...new Set(
      notifications
        .filter((notification) => !notification.fromUserPhotoURL && !notification.actorPhotoURL)
        .map((notification) => getActorId(notification))
        .filter((actorId) => actorId && !actorProfiles[actorId] && !actorProfileRequests.current.has(actorId))
    )];

    if (!missingActorIds.length) return;

    async function loadMissingActorProfiles() {
      await Promise.all(missingActorIds.map(async (actorId) => {
        actorProfileRequests.current.add(actorId);

        try {
          const actorSnap = await getDoc(doc(db, "users", actorId));
          const actorData = actorSnap.exists() ? actorSnap.data() : {};

          if (!isActive) return;

          setActorProfiles((prev) => ({
            ...prev,
            [actorId]: {
              photoURL: actorData.photoURL || "",
              profileImageUrl: actorData.profileImageUrl || "",
              profileImage: actorData.profileImage || "",
              avatarUrl: actorData.avatarUrl || "",
            },
          }));
        } catch (error) {

          if (!isActive) return;

          setActorProfiles((prev) => ({
            ...prev,
            [actorId]: {},
          }));
        }
      }));
    }

    loadMissingActorProfiles();

    return () => {
      isActive = false;
    };
  }, [notifications, actorProfiles]);

  return { notifications, loading, actorProfiles };
}
