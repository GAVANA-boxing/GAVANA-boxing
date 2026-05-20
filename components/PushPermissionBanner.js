"use client";

import { useEffect, useState } from "react";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
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
    <div style={s.wrap}>
      {/* Red ambient glow behind banner */}
      <div style={s.glow} />

      {/* HUD corner accents */}
      <div style={s.cornerTL} />
      <div style={s.cornerBR} />

      <div style={s.iconWrap}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round">
          <path d="M18 10.5V9a6 6 0 0 0-12 0v1.5c0 2.7-1.2 3.8-2.2 5h16.4c-1-1.2-2.2-2.3-2.2-5Z" />
          <path d="M9.7 18.5a2.5 2.5 0 0 0 4.6 0" />
        </svg>
      </div>

      <div style={s.body}>
        <p style={s.label}>COMBAT ALERTS</p>
        <p style={s.title}>Enable Notifications</p>
        <p style={s.sub}>Know instantly when someone challenges you</p>
      </div>

      <div style={s.actions}>
        <button type="button" onClick={handleAllow} style={s.allowBtn}>
          ALLOW
        </button>
        <button type="button" onClick={handleDismiss} aria-label="Dismiss" style={s.dismissBtn}>
          ✕
        </button>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    position: "fixed",
    top: 16,
    left: 12,
    right: 12,
    zIndex: 9991,
    background: "linear-gradient(135deg, rgba(10,7,10,0.97) 0%, rgba(18,10,12,0.97) 100%)",
    border: `1px solid ${redAlpha(0.28)}`,
    borderRadius: 18,
    padding: "14px 14px 14px 16px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: `0 0 40px ${redAlpha(0.12)}, 0 16px 48px rgba(0,0,0,0.7)`,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -30,
    left: "50%",
    transform: "translateX(-50%)",
    width: 200,
    height: 80,
    background: redAlpha(0.15),
    filter: "blur(30px)",
    pointerEvents: "none",
    borderRadius: "50%",
  },
  cornerTL: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 10,
    height: 10,
    borderTop: `1.5px solid ${redAlpha(0.55)}`,
    borderLeft: `1.5px solid ${redAlpha(0.55)}`,
    borderRadius: "2px 0 0 0",
    pointerEvents: "none",
  },
  cornerBR: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 10,
    height: 10,
    borderBottom: `1.5px solid ${redAlpha(0.55)}`,
    borderRight: `1.5px solid ${redAlpha(0.55)}`,
    borderRadius: "0 0 2px 0",
    pointerEvents: "none",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: redAlpha(0.1),
    border: `1px solid ${redAlpha(0.25)}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
    zIndex: 1,
  },
  body: {
    flex: 1,
    minWidth: 0,
    position: "relative",
    zIndex: 1,
  },
  label: {
    margin: "0 0 2px",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 2.5,
    color: RED,
    textTransform: "uppercase",
    fontFamily: "var(--font-condensed)",
  },
  title: {
    margin: "0 0 2px",
    fontSize: 13,
    fontWeight: 900,
    color: "#fff",
  },
  sub: {
    margin: 0,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    lineHeight: 1.3,
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
    position: "relative",
    zIndex: 1,
  },
  allowBtn: {
    padding: "8px 16px",
    borderRadius: 10,
    border: "none",
    background: `linear-gradient(135deg, #C1121F, #a00f1a)`,
    color: "#fff",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 1.5,
    cursor: "pointer",
    boxShadow: `0 0 14px ${redAlpha(0.4)}`,
    fontFamily: "var(--font-condensed)",
  },
  dismissBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.25)",
    fontSize: 16,
    cursor: "pointer",
    padding: 4,
    lineHeight: 1,
  },
};
