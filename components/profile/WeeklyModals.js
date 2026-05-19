"use client";

import { GOLD , goldAlpha} from "@/lib/tokens";

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.78)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  zIndex: 300,
  display: "flex",
  alignItems: "flex-end",
};
const sheet = {
  width: "100%",
  background: "#111",
  borderRadius: "18px 18px 0 0",
  padding: "20px 20px 40px",
  maxHeight: "60vh",
  overflowY: "auto",
};
const handle = { width: 40, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.18)", margin: "0 auto 16px" };
const header = { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 };
const title = { fontSize: 16, fontWeight: 900, color: "#fff" };
const closeBtn = { background: "transparent", border: "none", color: "#888", fontSize: 18, cursor: "pointer", padding: "4px 8px" };

export function WeeklyRecapModal({ aiFeedbackHistory, profileUser, t, onClose }) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const getMs = (ts) => { if (!ts) return 0; if (ts.toMillis) return ts.toMillis(); return Number(ts) || 0; };
  const weekFeedback = (aiFeedbackHistory || []).filter((f) => getMs(f.createdAt) >= sevenDaysAgo);
  const weekXP = weekFeedback.reduce((s, f) => s + Math.round((Number(f.score) || 0) * (Number(f.score) || 0) * 10), 0);
  const weekChallenges = weekFeedback.length;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={handle} />
        <div style={header}>
          <span style={title}>📅 {t("weeklyRecapTitle")}</span>
          <button type="button" style={closeBtn} aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "4px 0 8px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, color: GOLD }}>+{weekXP}</span>
            <span style={{ fontSize: 9, color: "#888", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{t("weeklyRecapXP")}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, color: "#34D399" }}>{weekChallenges}</span>
            <span style={{ fontSize: 9, color: "#888", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{t("weeklyRecapChallenges")}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 900, lineHeight: 1, color: "#FB923C" }}>{profileUser?.challengeStreak || 0}</span>
            <span style={{ fontSize: 9, color: "#888", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{t("dayStreak").replace("{n}", "")}</span>
          </div>
        </div>
        <button
          type="button"
          style={{ ...closeBtn, width: "100%", padding: "11px 0", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "none", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }}
          onClick={onClose}
        >
          {t("weeklyRecapClose")}
        </button>
      </div>
    </div>
  );
}

export function WeeklyLeaderboardModal({ challengeRanks, t, onClose, onGoToChallenges }) {
  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={handle} />
        <div style={header}>
          <span style={title}>🏆 {t("weeklySeasonModalTitle")}</span>
          <button type="button" style={closeBtn} aria-label="Close" onClick={onClose}>✕</button>
        </div>

        {challengeRanks.weeklyRank && challengeRanks.weeklyRank <= 3 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 20, padding: "16px 0", background: `${goldAlpha(0.06)}`, borderRadius: 12, border: `1px solid ${goldAlpha(0.2)}` }}>
            <div style={{ fontSize: 44, lineHeight: 1 }}>
              {challengeRanks.weeklyRank === 1 ? "🥇" : challengeRanks.weeklyRank === 2 ? "🥈" : "🥉"}
            </div>
            <div style={{
              fontSize: 16, fontWeight: 900, letterSpacing: 0.5,
              color: challengeRanks.weeklyRank === 1 ? GOLD : challengeRanks.weeklyRank === 2 ? "#9CA3AF" : "#FB923C",
            }}>
              {challengeRanks.weeklyRank === 1
                ? t("weeklyChampionBadge")
                : challengeRanks.weeklyRank === 2
                ? t("weeklySilverBadge")
                : t("weeklyBronzeBadge")}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-around", gap: 12, marginBottom: 16, padding: "14px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 12 }}>
          {challengeRanks.weeklyRank && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>#{challengeRanks.weeklyRank}</span>
              <span style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{t("seasonCurrentWeek")}</span>
            </div>
          )}
          {challengeRanks.bestWeeklyScore != null && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{challengeRanks.bestWeeklyScore}/10</span>
              <span style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{t("seasonBestWeeklyScore")}</span>
            </div>
          )}
          {challengeRanks.allTimeRank && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>#{challengeRanks.allTimeRank}</span>
              <span style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>{t("seasonAllTime")}</span>
            </div>
          )}
        </div>

        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888", lineHeight: 1.55, textAlign: "center" }}>{t("weeklySeasonModalDesc")}</p>

        <button
          type="button"
          style={{ width: "100%", padding: "14px 0", borderRadius: 12, background: "linear-gradient(135deg, #C1121F, #9B0D18)", border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5 }}
          onClick={onGoToChallenges}
        >
          {t("weeklySeasonModalCta")}
        </button>
      </div>
    </div>
  );
}
