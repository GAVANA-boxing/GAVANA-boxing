"use client";

import { useEffect, useState } from "react";
import { GOLD, goldAlpha } from "@/lib/tokens";
import { useAuth } from "@/lib/AuthContext";
import { useFcmToken } from "@/hooks/useFcmToken";

export default function PushPermissionBanner() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [granted, setGranted] = useState(false);

  useFcmToken(granted ? user : null);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (sessionStorage.getItem("push-banner-dismissed")) return;

    const timer = setTimeout(() => setShow(true), 6000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleAllow = async () => {
    setShow(false);
    try {
      const result = await Notification.requestPermission();
      if (result === "granted") setGranted(true);
    } catch { /* unsupported */ }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem("push-banner-dismissed", "1");
  };

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      top: 16,
      left: 12,
      right: 12,
      zIndex: 9991,
      background: "linear-gradient(135deg, #111 0%, #1a1500 100%)",
      border: `1px solid ${goldAlpha(0.3)}`,
      borderRadius: 18,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${goldAlpha(0.1)}`,
    }}>
      <div style={{ fontSize: 28, flexShrink: 0 }}>🔔</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 2 }}>
          Get Challenge Alerts
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.35 }}>
          Know instantly when someone challenges you
        </div>
      </div>
      <button
        type="button"
        onClick={handleAllow}
        style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: GOLD, color: "#000", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}
      >
        Allow
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 18, cursor: "pointer", flexShrink: 0, padding: 4, lineHeight: 1 }}
      >
        ✕
      </button>
    </div>
  );
}
