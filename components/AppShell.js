"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AppSidebar from "./AppSidebar";
import { redAlpha } from "@/lib/tokens";

// Routes that must NOT have the dashboard shell
const NO_SHELL = new Set(["", "login", "signup", "onboarding", "register"]);

export default function AppShell({ children }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const segments = pathname?.split("/").filter(Boolean) || [];
  const locale = segments[0] || "mn";
  const pageSegment = segments[1] ?? "";
  const isPublic = NO_SHELL.has(pageSegment);

  // Mobile or public page: transparent passthrough — pages keep their own layout
  if (!mounted || !isDesktop || isPublic) return <>{children}</>;

  return (
    <div style={{
      display: "flex",
      height: "100dvh",
      overflow: "hidden",
      background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${redAlpha(0.1)} 0%, transparent 60%), #070707`,
      color: "#fff",
    }}>
      <AppSidebar currentLocale={locale} />
      <div
        className="dash-center"
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
