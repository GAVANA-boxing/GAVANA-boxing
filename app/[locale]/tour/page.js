"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocale } from "@/lib/i18n";
import { useRankData } from "@/hooks/useRankData";
import BottomNav from "@/components/BottomNav";
import TourView from "@/components/tour/TourView";
import { pageBackground } from "@/components/ui/brand";

// World Tour: the rank ladder as a journey of boxing cities, each drawn live
// (local time, sun, season, weather) in 3D. Guests start in Ulaanbaatar.
export default function TourPage() {
  const params = useParams();
  const router = useRouter();
  const locale = getLocale(params?.locale);
  const { user, loading: authLoading } = useAuth();
  const { xp, dataLoading } = useRankData({ user, authLoading });

  // The sky follows the clock: refresh the moment once a minute.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const loading = authLoading || (user && dataLoading);
  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff", padding: "calc(20px + env(safe-area-inset-top)) 16px calc(110px + env(safe-area-inset-bottom))" }}>
      {loading ? (
        <div aria-busy="true" className="shimmer" style={{ maxWidth: 560, margin: "0 auto", height: 420, borderRadius: 22 }} />
      ) : (
        <TourView key={xp ?? 0} xp={xp ?? 0} locale={locale} now={now} go={(path) => router.push(`/${locale}${path}`)} />
      )}
      <BottomNav router={router} user={user} currentLocale={locale} />
    </main>
  );
}
