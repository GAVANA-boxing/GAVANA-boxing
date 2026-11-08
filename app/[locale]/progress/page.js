"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile } from "@/context/UserProfileProvider";
import { getLocale, translate } from "@/lib/i18n";
import { getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import { computeFighterDNA } from "@/lib/fighterDNA";
import { progressStats } from "@/lib/progressStats";
import { useRankData } from "@/hooks/useRankData";
import { useCombatMemory } from "@/hooks/useCombatMemory";
import BottomNav from "@/components/BottomNav";
import RankPromotionModal from "@/components/RankPromotionModal";
import ProgressView from "@/components/progress/ProgressView";

// Progress: one place for "how am I doing" — the rank ladder (one XP number,
// one ladder), the key numbers, the score trend, the punch mix, Fighter DNA and
// the latest sessions. Replaces /rank and /dashboard (redirected here); /history
// and /fighter-profile stay as the detail pages.

export default function ProgressPage() {
  const params = useParams();
  const router = useRouter();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();
  const { profile } = useUserProfile();

  const { xp, dataLoading } = useRankData({ user, authLoading });
  const { sessions, loading: sessionsLoading } = useCombatMemory({ user, maxSessions: 200 });
  const loading = authLoading || dataLoading || sessionsLoading;

  const currentXP = xp ?? 0;
  const rank = getFighterRank(currentXP);
  const nextRank = getNextRank(currentXP);
  const rankPct = getRankProgress(currentXP);
  const stats = useMemo(() => progressStats(sessions), [sessions]);
  const dna = useMemo(() => computeFighterDNA({ sessions, locale }), [sessions, locale]);

  // Rank-up celebration (kept from the old /rank page).
  const [promotion, setPromotion] = useState(null);
  useEffect(() => {
    if (loading || !user?.uid || !rank) return;
    const key = `gavana_rank_${user.uid}`;
    try {
      const last = localStorage.getItem(key);
      if (last && last !== rank.key) setPromotion(rank);
      localStorage.setItem(key, rank.key);
    } catch { /* private mode */ }
  }, [loading, user?.uid, rank]);

  const go = (path) => router.push(`/${locale}${path}`);

  return (
    <main style={page}>
      {promotion && <RankPromotionModal rank={promotion} rankName={t(promotion.key)} onDismiss={() => setPromotion(null)} />}

      <ProgressView
        locale={locale} t={t} loading={loading}
        currentXP={currentXP} rank={rank} nextRank={nextRank} rankPct={rankPct}
        stats={stats} dna={dna} sessions={sessions} go={go} streak={Number(profile?.dailyStreak) || 0}
      />

      <BottomNav router={router} user={user} currentLocale={locale} />
    </main>
  );
}

const page = {
  minHeight: "100dvh",
  color: "#fff",
  background: "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(255,59,48,0.16) 0%, transparent 60%), #08080a",
};
