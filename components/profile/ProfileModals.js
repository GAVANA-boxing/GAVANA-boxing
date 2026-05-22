"use client";

import dynamic from "next/dynamic";
import BottomSheet from "@/components/BottomSheet";

const RankUpModal = dynamic(() => import("@/components/RankUpModal"), { ssr: false });
const RankBeltModal = dynamic(() => import("@/components/profile/RankBeltModal"), { ssr: false });
const StreakDetailModal = dynamic(() => import("@/components/profile/StreakDetailModal"), { ssr: false });
const FighterShareCard = dynamic(() => import("@/components/profile/FighterShareCard"), { ssr: false });
const WeeklyRecapModal = dynamic(() => import("@/components/profile/WeeklyModals").then(m => m.WeeklyRecapModal), { ssr: false });
const WeeklyLeaderboardModal = dynamic(() => import("@/components/profile/WeeklyModals").then(m => m.WeeklyLeaderboardModal), { ssr: false });
import { PURPLE } from "@/lib/tokens";
import { getActiveChallengeStreak } from "@/lib/utils";

export function ProfileModals({
  rankUpRank, setRankUpRank,
  deleteConfirmReel, setDeleteConfirmReel, handleDeleteReel,
  showStreakModal, setShowStreakModal, profileUser, trainingSessions,
  showRankModal, setShowRankModal, xp, fighterRank, nextRank, rankProgress,
  showWeeklyRecap, setShowWeeklyRecap, aiFeedbackHistory,
  showChallengeModal, setShowChallengeModal, isOwnProfile, challengeSent, challengeSending, handleSendChallenge,
  showFighterCard, setShowFighterCard, pvpStats, bestScore, challengeRanks, userBadges, badgeMeta,
  showWeeklyModal, setShowWeeklyModal,
  locale, router, t,
  cardShareCopied, setCardShareCopied,
}) {
  return (
    <>
      {rankUpRank && (
        <RankUpModal rank={rankUpRank} onClose={() => setRankUpRank(null)} t={t} />
      )}

      <BottomSheet
        open={!!deleteConfirmReel}
        onClose={() => setDeleteConfirmReel(null)}
        centered
        zIndex={9999}
        maxWidth={340}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
          <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "#fff" }}>
            {t("profileDeleteTitle")}
          </p>
          <p style={{ margin: "0 0 24px", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            {t("profileDeleteWarning")}
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setDeleteConfirmReel(null)}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              {t("profileCancelBtn")}
            </button>
            <button
              type="button"
              onClick={async () => { const reel = deleteConfirmReel; setDeleteConfirmReel(null); await handleDeleteReel({ stopPropagation: () => {} }, reel); }}
              style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.15)", color: "#F87171", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
            >
              {t("profileDeleteBtn")}
            </button>
          </div>
        </div>
      </BottomSheet>

      {showStreakModal && (
        <StreakDetailModal
          profile={profileUser}
          trainingSessions={trainingSessions}
          t={t}
          onClose={() => setShowStreakModal(false)}
        />
      )}

      {showRankModal && (
        <RankBeltModal
          xp={xp}
          fighterRank={fighterRank}
          nextRank={nextRank}
          rankProgress={rankProgress}
          t={t}
          onClose={() => setShowRankModal(false)}
        />
      )}

      {showWeeklyRecap && (
        <WeeklyRecapModal
          aiFeedbackHistory={aiFeedbackHistory}
          profileUser={profileUser}
          t={t}
          onClose={() => setShowWeeklyRecap(false)}
        />
      )}

      {showChallengeModal && !isOwnProfile && (
        <BottomSheet
          open
          onClose={() => setShowChallengeModal(false)}
          zIndex={999}
          accent={PURPLE}
          maxWidth={480}
        >
          <div>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 900, color: PURPLE, letterSpacing: 1.4, textTransform: "uppercase" }}>GAVANA PvP</p>
            <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 900, color: "#fff" }}>
              {t("profileSendChallenge")}
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)" }}>
            {t("profilePickChallenge")}
          </p>
          {challengeSent ? (
            <div style={{ textAlign: "center", padding: "24px 0", fontSize: 15, fontWeight: 900, color: "#34D399" }}>
              {t("profileChallengeSent")}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { id: "jab-minute", emoji: "👊", label: t("profileChallengeJabMinute"), desc: t("profileChallengeJabDesc") },
                { id: "speed-test", emoji: "⚡", label: t("profileChallengeSpeedTest"), desc: t("profileChallengeSpeedDesc") },
                { id: "combo-master", emoji: "🔥", label: t("profileChallengeComboMaster"), desc: t("profileChallengeComboDesc") },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  disabled={challengeSending}
                  onClick={() => handleSendChallenge(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, border: "1px solid rgba(167,139,250,0.2)", background: challengeSending ? "rgba(167,139,250,0.04)" : "rgba(167,139,250,0.08)", cursor: challengeSending ? "not-allowed" : "pointer", textAlign: "left", width: "100%", transition: "background 0.15s" }}
                >
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{c.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{c.desc}</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 16, color: "rgba(167,139,250,0.6)", flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          )}
        </BottomSheet>
      )}

      {showFighterCard && (
        <FighterShareCard
          profileUser={profileUser}
          fighterRank={fighterRank}
          xp={xp}
          rankProgress={rankProgress}
          pvpStats={pvpStats}
          bestScore={bestScore}
          challengeStreak={getActiveChallengeStreak(profileUser)}
          challengeRanks={challengeRanks}
          aiFeedbackHistory={aiFeedbackHistory}
          userBadges={userBadges}
          badgeMeta={badgeMeta}
          locale={locale}
          t={t}
          cardShareCopied={cardShareCopied}
          onShareCopied={setCardShareCopied}
          onClose={() => setShowFighterCard(false)}
        />
      )}

      {showWeeklyModal && challengeRanks && (
        <WeeklyLeaderboardModal
          challengeRanks={challengeRanks}
          t={t}
          onClose={() => setShowWeeklyModal(false)}
          onGoToChallenges={() => { setShowWeeklyModal(false); router.push(`/${locale}/challenges`); }}
        />
      )}
    </>
  );
}
