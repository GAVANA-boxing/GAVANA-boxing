"use client";

import { useEffect, useState } from "react";
import { RED, redAlpha } from "@/lib/tokens";

// Captures the beforeinstallprompt event and shows a banner to add GAVANA to the home screen.
export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone display mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const dismissed = sessionStorage.getItem("pwa-banner-dismissed");
    if (dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after a brief delay so it doesn't feel intrusive
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (outcome === "dismissed") sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem("pwa-banner-dismissed", "1");
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 80,
      left: 12,
      right: 12,
      zIndex: 9990,
      background: "linear-gradient(135deg, #141014, #1a0f1a)",
      border: `1px solid ${redAlpha(0.35)}`,
      borderRadius: 18,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      gap: 12,
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${redAlpha(0.15)}`,
    }}>
      <div style={{ fontSize: 32, flexShrink: 0 }}>🥊</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 2 }}>
          Add to Home Screen
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.35 }}>
          Train anywhere — works offline
        </div>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: RED, color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}
      >
        Install
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
