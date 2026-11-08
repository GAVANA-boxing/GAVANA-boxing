"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import PromptBanner, { isFocusPage } from "@/components/ui/PromptBanner";
import { useAuth } from "@/lib/AuthContext";
import { useFcmToken } from "@/hooks/useFcmToken";
import { getLocaleFromPathname } from "@/lib/i18n";

const PB_L = {
  en: { title: "Turn on reminders", sub: "A nudge before your streak breaks", allow: "Allow", close: "Dismiss" },
  mn: { title: "Сануулга асаах", sub: "Дараалал тасрахаас өмнө сануулна", allow: "Зөвшөөрөх", close: "Хаах" },
  ko: { title: "알림 켜기", sub: "연속 기록이 끊기기 전에 알려드려요", allow: "허용", close: "닫기" },
};

const DISMISS_KEY = "gavana_push_banner_dismissed_at";
const DISMISS_FOR_MS = 7 * 86_400_000;

export default function PushPermissionBanner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const L = PB_L[locale] || PB_L.en;
  const [show, setShow] = useState(false);
  const [granted, setGranted] = useState(false);

  useFcmToken(granted ? user : null, locale);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    // Dismissed → don't ask again for a week (was: every new browser session).
    try {
      const at = Number(localStorage.getItem(DISMISS_KEY));
      if (at && Date.now() - at < DISMISS_FOR_MS) return;
    } catch { /* ignore */ }

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
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
  };

  if (!show || isFocusPage(pathname)) return null;
  return (
    <PromptBanner
      icon="🔔"
      title={L.title}
      sub={L.sub}
      actionLabel={L.allow}
      onAction={handleAllow}
      onDismiss={handleDismiss}
      dismissLabel={L.close}
    />
  );
}
