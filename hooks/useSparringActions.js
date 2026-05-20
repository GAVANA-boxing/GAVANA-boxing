"use client";
import { useCallback, useState } from "react";
import { addDoc, deleteDoc, doc, setDoc, updateDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import { startConversation } from "@/lib/messaging";
import { getFighterRank } from "@/lib/xp";
import { sendPushNotification } from "@/lib/pushNotification";

export function useSparringActions({ user, router, locale, userData, myPost, onError }) {
  const [cancelling, setCancelling] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [requesting, setRequesting] = useState(null);
  const [accepting, setAccepting] = useState(null);
  const [declining, setDeclining] = useState(null);

  const handleToggle = async () => {
    if (!user) { router.push(`/${locale}/login`); return; }
    if (toggling) return;
    setToggling(true);
    try {
      const ref = doc(db, "sparring_posts", user.uid);
      if (myPost) {
        await deleteDoc(ref);
      } else {
        const xp = Number(userData?.xp) || 0;
        const rank = getFighterRank(xp);
        await setDoc(ref, {
          userId: user.uid,
          displayName: user.displayName || userData?.username || userData?.displayName || "",
          photoURL: user.photoURL || userData?.profileImageUrl || userData?.photoURL || "",
          archetype: userData?.fighterArchetype || null,
          weightClass: userData?.weightClass || null,
          bio: userData?.bio || "",
          rankKey: rank.key,
          rankColor: rank.color,
          location: userData?.location || null,
          lookingForSparring: true,
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      onError?.(locale === "mn" ? "Алдаа гарлаа. Дахин оролдоно уу." : locale === "ko" ? "오류가 발생했습니다. 다시 시도해주세요." : "Something went wrong. Please try again.");
    } finally {
      setToggling(false);
    }
  };

  const handleRequest = async (post) => {
    if (!user) { router.push(`/${locale}/login`); return; }
    if (requesting) return;
    setRequesting(post.userId);
    try {
      const xp = Number(userData?.xp) || 0;
      const rank = getFighterRank(xp);
      await addDoc(collection(db, "sparring_requests"), {
        fromUserId: user.uid,
        fromDisplayName: user.displayName || userData?.username || userData?.displayName || "",
        fromPhotoURL: user.photoURL || userData?.profileImageUrl || userData?.photoURL || "",
        fromArchetype: userData?.fighterArchetype || null,
        fromWeightClass: userData?.weightClass || null,
        fromRankKey: rank.key,
        toUserId: post.userId,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      const actorName = user.displayName || userData?.username || "";
      const notifText = locale === "mn"
        ? `${actorName || "Тулаанч"} sparring хүсэлт илгээлээ`
        : locale === "ko"
        ? `${actorName || "파이터"}님이 스파링을 요청했습니다`
        : `${actorName || "A fighter"} wants to spar with you`;
      await createNotification({
        recipientId: post.userId,
        actorId: user.uid,
        actorName,
        actorPhotoURL: user.photoURL || userData?.photoURL || "",
        type: "sparring_request",
        text: notifText,
      });
      // Fire-and-forget push notification
      const token = await user.getIdToken?.().catch(() => null);
      sendPushNotification({
        recipientId: post.userId,
        title: "🥊 " + (locale === "mn" ? "Sparring хүсэлт" : locale === "ko" ? "스파링 요청" : "Sparring Request"),
        body: notifText,
        url: `/${locale}/sparring`,
        token,
      });
    } catch (e) {
      onError?.(locale === "mn" ? "Хүсэлт илгээхэд алдаа гарлаа." : locale === "ko" ? "요청 전송에 실패했습니다." : "Failed to send request. Try again.");
    } finally {
      setRequesting(null);
    }
  };

  const handleAccept = async (req) => {
    if (accepting) return;
    setAccepting(req.id);
    try {
      await updateDoc(doc(db, "sparring_requests", req.id), { status: "accepted" });
      // Mark both users as having a sparring partner (FighterPath step)
      await Promise.all([
        updateDoc(doc(db, "users", user.uid), { hasSparringPartner: true }),
        updateDoc(doc(db, "users", req.fromUserId), { hasSparringPartner: true }).catch(() => {}),
      ]);
      const actorName = user.displayName || userData?.username || "";
      const acceptText = locale === "mn"
        ? `${actorName || "Тулаанч"} sparring хүсэлтийг зөвшөөрлөө`
        : locale === "ko"
        ? `${actorName || "파이터"}님이 스파링을 수락했습니다`
        : `${actorName || "A fighter"} accepted your sparring request`;
      await createNotification({
        recipientId: req.fromUserId,
        actorId: user.uid,
        actorName,
        actorPhotoURL: user.photoURL || userData?.photoURL || "",
        type: "sparring_accepted",
        text: acceptText,
      });
      // Fire-and-forget push — requester needs to know immediately
      const token = await user.getIdToken?.().catch(() => null);
      sendPushNotification({
        recipientId: req.fromUserId,
        title: "✅ " + (locale === "mn" ? "Sparring зөвшөөрлөө!" : locale === "ko" ? "스파링 수락됨!" : "Sparring Accepted!"),
        body: acceptText,
        url: `/${locale}/sparring`,
        token,
      });
      const convoId = await startConversation(user, req.fromUserId, {
        displayName: req.fromDisplayName,
        photoURL: req.fromPhotoURL,
      });
      router.push(`/${locale}/inbox/${convoId}`);
    } catch (e) {
      onError?.(locale === "mn" ? "Зөвшөөрөхөд алдаа гарлаа." : locale === "ko" ? "수락 중 오류가 발생했습니다." : "Failed to accept. Try again.");
    } finally {
      setAccepting(null);
    }
  };

  const handleDecline = async (req) => {
    if (declining) return;
    setDeclining(req.id);
    try {
      await updateDoc(doc(db, "sparring_requests", req.id), { status: "declined" });
    } catch (e) {
      onError?.(locale === "mn" ? "Татгалзахад алдаа гарлаа." : locale === "ko" ? "거절 중 오류가 발생했습니다." : "Failed to decline. Try again.");
    } finally {
      setDeclining(null);
    }
  };

  const handleCancelSparringRequest = async (req) => {
    if (cancelling) return;
    setCancelling(req.id);
    try {
      await deleteDoc(doc(db, "sparring_requests", req.id));
    } catch (e) {
      onError?.(locale === "mn" ? "Цуцлахад алдаа гарлаа." : locale === "ko" ? "취소 중 오류가 발생했습니다." : "Failed to cancel. Try again.");
    } finally {
      setCancelling(null);
    }
  };

  return { cancelling, toggling, requesting, accepting, declining, handleToggle, handleRequest, handleAccept, handleDecline, handleCancelSparringRequest };
}
