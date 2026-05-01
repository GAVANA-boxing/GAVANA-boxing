"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useRouter } from "next/navigation";

export default function ProfileRedirectClient() {
  const { user, loading } = useAuth();
  const { locale } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace(`/${locale}/profile/${user.uid}`);
    } else {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, locale, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#070707",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      Loading profile...
    </div>
  );
}
