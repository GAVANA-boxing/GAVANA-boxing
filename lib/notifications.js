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
import { getTimestampMs } from "@/lib/utils";

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

    if (type === "follow" || type === "new_follower") {
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

// Sent from the train page after a challenge result is saved.
// One notification per (actor, reel) — duplicate guard matches "like" logic.
export async function createChallengeAttemptNotification({ reelCreatorId, actorId, actorName, actorPhotoURL = "", reelId, score }) {
  if (!reelCreatorId || !actorId || reelCreatorId === actorId) return;
  try {
    const already = await shouldSkipDuplicateNotification({ recipientId: reelCreatorId, actorId, type: "challenge_attempt", reelId: reelId || null, text: "" });
    if (already) return;
    await addDoc(collection(db, "notifications"), {
      recipientId: reelCreatorId,
      actorId,
      actorName: actorName || "Someone",
      fromUserId: actorId,
      fromUsername: actorName || "Someone",
      fromUserPhotoURL: actorPhotoURL || "",
      type: "challenge_attempt",
      reelId: reelId || null,
      score: score != null ? Number(score) : null,
      text: "",
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch { /* non-critical */ }
}

// Sent from the upload page when a reel is a remix of another.
export async function createRemixNotification({ originalCreatorId, actorId, actorName, actorPhotoURL = "", originalReelId, newReelId }) {
  if (!originalCreatorId || !actorId || originalCreatorId === actorId) return;
  try {
    const already = await shouldSkipDuplicateNotification({ recipientId: originalCreatorId, actorId, type: "remix", reelId: originalReelId || null, text: "" });
    if (already) return;
    await addDoc(collection(db, "notifications"), {
      recipientId: originalCreatorId,
      actorId,
      actorName: actorName || "Someone",
      fromUserId: actorId,
      fromUsername: actorName || "Someone",
      fromUserPhotoURL: actorPhotoURL || "",
      type: "remix",
      reelId: originalReelId || null,
      remixReelId: newReelId || null,
      text: "",
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch { /* non-critical */ }
}

// Sent when user A follows user B — one notification per (actor, recipient).
export async function createNewFollowerNotification({ recipientId, actorId, actorName, actorPhotoURL = "" }) {
  if (!recipientId || !actorId || recipientId === actorId) return;
  try {
    const already = await shouldSkipDuplicateNotification({ recipientId, actorId, type: "new_follower", reelId: null, text: "" });
    if (already) return;
    await addDoc(collection(db, "notifications"), {
      recipientId,
      actorId,
      actorName: actorName || "Someone",
      fromUserId: actorId,
      fromUsername: actorName || "Someone",
      fromUserPhotoURL: actorPhotoURL || "",
      type: "new_follower",
      reelId: null,
      text: "",
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch { /* non-critical */ }
}

// Sent when a challenger's score exceeds the reel creator's best score on that reel.
export async function createChallengeBeatenNotification({ reelCreatorId, actorId, actorName, actorPhotoURL = "", reelId, score }) {
  if (!reelCreatorId || !actorId || reelCreatorId === actorId) return;
  try {
    await addDoc(collection(db, "notifications"), {
      recipientId: reelCreatorId,
      actorId,
      actorName: actorName || "Someone",
      fromUserId: actorId,
      fromUsername: actorName || "Someone",
      fromUserPhotoURL: actorPhotoURL || "",
      type: "challenge_beaten",
      reelId: reelId || null,
      score: score != null ? Number(score) : null,
      text: "",
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch { /* non-critical */ }
}

// Sent when a creator is selected as featured (called from admin flow or featured_creators write).
export async function createFeaturedNotification({ creatorId }) {
  if (!creatorId) return;
  try {
    await addDoc(collection(db, "notifications"), {
      recipientId: creatorId,
      actorId: "system",
      actorName: "GAVANA",
      fromUserId: "system",
      fromUsername: "GAVANA",
      fromUserPhotoURL: "",
      type: "featured",
      reelId: null,
      text: "",
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch { /* non-critical */ }
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
