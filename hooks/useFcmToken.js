"use client";

import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const VAPID_KEY = process.env.NEXT_PUBLIC_FCM_VAPID_KEY;

// Registers an FCM web push token for the logged-in user.
// Only runs when notification permission is already granted.
// Requires NEXT_PUBLIC_FCM_VAPID_KEY env var.
export function useFcmToken(user) {
  useEffect(() => {
    if (!user?.uid || !VAPID_KEY) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    let cancelled = false;

    async function register() {
      try {
        const [{ getMessaging, getToken }, { getApp }] = await Promise.all([
          import("firebase/messaging"),
          import("firebase/app"),
        ]);
        const swReg = await navigator.serviceWorker.ready;
        const messaging = getMessaging(getApp());
        const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });
        if (!cancelled && token) {
          await setDoc(
            doc(db, "users", user.uid, "fcmTokens", token.slice(-20)),
            { token, platform: "web", updatedAt: new Date().toISOString() },
            { merge: true }
          );
        }
      } catch {
        // FCM unavailable or blocked — fail silently
      }
    }

    register();
    return () => { cancelled = true; };
  }, [user?.uid]);
}
