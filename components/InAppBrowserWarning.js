"use client";

import { useEffect, useState } from "react";

function isSocialInAppBrowser(userAgent) {
  return /FBAN|FBAV|FB_IAB|FB4A|FBIOS|Instagram/i.test(userAgent || "");
}

export default function InAppBrowserWarning() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const dismissed = window.localStorage.getItem("gavana_in_app_browser_warning_dismissed");

    if (!dismissed && isSocialInAppBrowser(navigator.userAgent)) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    window.localStorage.setItem("gavana_in_app_browser_warning_dismissed", "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={styles.banner}>
      <div style={styles.content}>
        <strong style={styles.title}>For best experience, open in Safari or Chrome</strong>
        <span style={styles.text}>Tap ⋯ and choose Open in browser</span>
      </div>
      <button type="button" onClick={handleDismiss} style={styles.close} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

const styles = {
  banner: {
    position: "fixed",
    top: "calc(10px + env(safe-area-inset-top))",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2000,
    width: "min(calc(100vw - 24px), 520px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "12px 12px 12px 14px",
    borderRadius: 16,
    background: "rgba(11,11,11,0.86)",
    border: "1px solid rgba(212,175,55,0.2)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.42)",
    color: "#fff",
    backdropFilter: "blur(20px) saturate(150%)",
    WebkitBackdropFilter: "blur(20px) saturate(150%)",
  },
  content: {
    display: "grid",
    gap: 3,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    lineHeight: 1.25,
    fontWeight: 900,
    letterSpacing: 0,
  },
  text: {
    color: "#AAAAAA",
    fontSize: 12,
    lineHeight: 1.3,
    fontWeight: 650,
  },
  close: {
    width: 32,
    height: 32,
    flex: "0 0 32px",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
  },
};
