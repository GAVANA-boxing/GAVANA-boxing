"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const lang = navigator.language || "";
    if (lang.startsWith("mn")) { router.replace("/mn"); return; }
    if (lang.startsWith("ko")) { router.replace("/ko"); return; }
    router.replace("/en");
  }, [router]);

  return null;
}
