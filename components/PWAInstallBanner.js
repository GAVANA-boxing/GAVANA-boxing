"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import PromptBanner, { isFocusPage } from "@/components/ui/PromptBanner";

const T = {
  mn: { title: "GAVANA-г утсандаа суулга", sub: "Нүүр дэлгэцнээс нэг товшилтоор нээ", action: "Суулгах", close: "Хаах" },
  ko: { title: "GAVANA를 홈 화면에 추가", sub: "한 번의 탭으로 바로 열기", action: "설치", close: "닫기" },
  en: { title: "Add GAVANA to your home screen", sub: "Open it in one tap", action: "Install", close: "Dismiss" },
};

// Captures the beforeinstallprompt event and offers to install the app.
// Not on the camera / sign-up screens, where it would cover the controls.
export default function PWAInstallBanner() {
  const pathname = usePathname() || "";
  const t = T[getLocaleFromPathname(pathname)] || T.mn;
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    try { if (sessionStorage.getItem("pwa-banner-dismissed")) return; } catch { /* ignore */ }
    let timer;
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      timer = setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => { window.removeEventListener("beforeinstallprompt", handler); clearTimeout(timer); };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem("pwa-banner-dismissed", "1"); } catch { /* ignore */ }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
    if (outcome === "dismissed") dismiss();
  };

  if (!visible || isFocusPage(pathname)) return null;
  return <PromptBanner icon="🥊" title={t.title} sub={t.sub} actionLabel={t.action} onAction={install} onDismiss={dismiss} dismissLabel={t.close} />;
}
