"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function getTimestampMs(timestamp) {
  if (!timestamp) return 0;
  if (timestamp.toMillis) return timestamp.toMillis();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function normalizeText(text) {
  return String(text || "").trim().replace(/\s+/g, " ");
}

async function shouldSkipDuplicateNotification({
  recipientId,
  actorId,
  type,
  reelId,
  text,
}) {
  const notificationsQuery = query(
    collection(db, "notifications"),
    where("recipientId", "==", recipientId)
  );
  const snapshot = await getDocs(notificationsQuery);
  const normalizedText = normalizeText(text);
  const oneMinuteAgo = Date.now() - 60 * 1000;

  return snapshot.docs.some((notificationDoc) => {
    const notification = notificationDoc.data();
    const sameActor = (notification.fromUserId || notification.actorId) === actorId;
    const sameType = notification.type === type;
    const sameReel = (notification.reelId || null) === (reelId || null);

    if (!sameActor || !sameType) return false;

    if (type === "like") {
      return sameReel;
    }

    if (type === "follow") {
      return true;
    }

    if (type === "comment") {
      const existingText = normalizeText(notification.text);
      const createdAtMs = getTimestampMs(notification.createdAt);
      return sameReel && existingText === normalizedText && createdAtMs >= oneMinuteAgo;
    }

    return false;
  });
}

export async function createPvpNotification({
  opponentId,
  challengerId,
  challengerName,
  challengerPhotoURL = "",
  reelId = null,
  challengerScore,
  opponentScore,
  result,
}) {
  if (!opponentId || !challengerId || opponentId === challengerId) return;

  try {
    let fromUserPhotoURL = challengerPhotoURL;

    if (!fromUserPhotoURL) {
      try {
        const actorSnap = await getDoc(doc(db, "users", challengerId));
        const actorData = actorSnap.exists() ? actorSnap.data() : {};
        fromUserPhotoURL = actorData.photoURL || actorData.profileImageUrl || actorData.profileImage || actorData.avatarUrl || "";
      } catch (e) {
        // silent
      }
    }

    await addDoc(collection(db, "notifications"), {
      recipientId: opponentId,
      actorId: challengerId,
      actorName: challengerName || "Someone",
      fromUserId: challengerId,
      fromUsername: challengerName || "Someone",
      fromUserPhotoURL,
      type: "pvp_challenge",
      reelId,
      challengerScore,
      opponentScore,
      result,
      read: false,
      createdAt: serverTimestamp(),
      text: "",
    });
  } catch (error) {
    console.error("Failed to create PvP notification:", error);
  }
}

export async function createNotification({
  recipientId,
  actorId,
  actorName,
  actorPhotoURL = "",
  type,
  reelId = null,
  text = "",
}) {
  if (!recipientId || !actorId || recipientId === actorId) {
    return;
  }

  try {
    let skipDuplicate = false;

    try {
      skipDuplicate = await shouldSkipDuplicateNotification({
        recipientId,
        actorId,
        type,
        reelId,
        text,
      });
    } catch (duplicateCheckError) {
      console.error("Failed to check duplicate notification:", duplicateCheckError);
    }

    if (skipDuplicate) {
      return;
    }

    let fromUserPhotoURL = actorPhotoURL || "";

    if (!fromUserPhotoURL) {
      try {
        const actorSnap = await getDoc(doc(db, "users", actorId));
        const actorData = actorSnap.exists() ? actorSnap.data() : {};
        fromUserPhotoURL = actorData.photoURL || actorData.profileImageUrl || actorData.profileImage || actorData.avatarUrl || "";
      } catch (profileError) {
        console.error("Failed to load notification actor profile:", profileError);
      }
    }

    await addDoc(collection(db, "notifications"), {
      recipientId,
      actorId,
      actorName: actorName || "Someone",
      fromUserId: actorId,
      fromUsername: actorName || "Someone",
      fromUserPhotoURL,
      type,
      reelId,
      text,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
