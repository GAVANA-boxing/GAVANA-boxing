"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { translate } from "@/lib/i18n";

export default function ProfileRedirectClient() {
  const { user, loading } = useAuth();
  const { locale } = useParams();
  const router = useRouter();
  const t = (key) => translate(locale, key);

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
        minHeight: "100dvh",
        background: "#0B0B0C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
      }}
    >
      {t("loadingProfile")}
    </div>
  );
}
