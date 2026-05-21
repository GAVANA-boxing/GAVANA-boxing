"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "./AppSidebar";

export default function DashboardLayout({ children, currentLocale }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const locale = currentLocale || pathname?.split("/")?.[1] || "mn";

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!mounted || !isDesktop) return <>{children}</>;

  return (
    <div style={s.shell}>
      <AppSidebar currentLocale={locale} />
      <div className="dash-center" style={s.center}>
        {children}
      </div>
    </div>
  );
}

const s = {
  shell: {
    display: "flex",
    height: "100dvh",
    overflow: "hidden",
    background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,59,48,0.1) 0%, transparent 60%), #0B0B0C",
    color: "#fff",
  },
  center: {
    flex: 1,
    overflowY: "auto",
    scrollbarWidth: "none",
    minWidth: 0,
  },
};
