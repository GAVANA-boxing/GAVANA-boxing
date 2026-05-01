"use client";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function createNotification({
  recipientId,
  actorId,
  actorName,
  type,
  reelId = null,
  text = "",
}) {
  if (!recipientId || !actorId || recipientId === actorId) {
    return;
  }

  try {
    await addDoc(collection(db, "notifications"), {
      recipientId,
      actorId,
      actorName: actorName || "Someone",
      fromUserId: actorId,
      fromUsername: actorName || "Someone",
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
