"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { locale } = useParams();
  const router = useRouter();

  // Redirect to dynamic profile route
  useEffect(() => {
    if (loading) return;

    if (user) {
      router.replace(`/${locale}/profile/${user.uid}`);
    } else if (!user) {
      router.push(`/${locale}/login`);
    }
  }, [user, loading, locale, router]);

  // Show loading while redirecting
  return (
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff"
    }}>
      Loading profile...
    </div>
  );
}
