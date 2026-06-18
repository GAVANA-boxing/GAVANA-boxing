"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getFighterRank, getNextRank, getRankProgress } from "@/lib/xp";
import { getLocale, translate } from "@/lib/i18n";
import RankPromotionModal from "@/components/RankPromotionModal";
import BottomNav from "@/components/BottomNav";
import PageTopBar from "@/components/PageTopBar";
import { pageBg } from "@/lib/tokens";
import { useRankData } from "@/hooks/useRankData";
import RankCurrentCard from "@/components/rank/RankCurrentCard";
import RankLadder from "@/components/rank/RankLadder";
import HowToEarnXP from "@/components/rank/HowToEarnXP";

export default function RankPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const { xp, sessionCount, dataLoading } = useRankData({ user, authLoading });

  const currentXP = xp ?? 0;
  const fighterRank = getFighterRank(currentXP);
  const nextRank = getNextRank(currentXP);
  const rankProgress = getRankProgress(currentXP);
  const xpToNext = nextRank ? nextRank.minXP - currentXP : 0;

  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionRank, setPromotionRank] = useState(null);

  useEffect(() => {
    if (dataLoading || !user?.uid || !fighterRank) return;
    const storageKey = `gavana_rank_${user.uid}`;
    const lastRankKey = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (lastRankKey && lastRankKey !== fighterRank.key) {
      setPromotionRank(fighterRank);
      setShowPromotion(true);
    }
    localStorage.setItem(storageKey, fighterRank.key);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, user?.uid, fighterRank?.key]);

  return (
    <main style={styles.page} className="page-enter cinematic-bg">
      {showPromotion && promotionRank && (
        <RankPromotionModal
          rank={promotionRank}
          rankName={t(promotionRank.key)}
          onDismiss={() => setShowPromotion(false)}
        />
      )}

      <PageTopBar kicker="COMBAT · RANK" title={t("rankPageTitle") || "RANK"} user={user} currentLocale={locale} showBack />

      <div style={styles.content}>
        <RankCurrentCard
          fighterRank={fighterRank}
          nextRank={nextRank}
          rankProgress={rankProgress}
          currentXP={currentXP}
          xpToNext={xpToNext}
          sessionCount={sessionCount}
          dataLoading={dataLoading}
          locale={locale}
          t={t}
        />

        <RankLadder
          fighterRank={fighterRank}
          currentXP={currentXP}
          rankProgress={rankProgress}
          dataLoading={dataLoading}
          t={t}
        />

        <HowToEarnXP locale={locale} t={t} />
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: pageBg(),
    color: "#fff",
    paddingBottom: "calc(88px + env(safe-area-inset-bottom))",
  },
  content: {
    maxWidth: 540,
    margin: "0 auto",
    padding: "20px 16px",
  },
};
