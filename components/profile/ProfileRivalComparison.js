"use client";

import { RED, PURPLE } from "@/lib/tokens";
import { formatScore, getActiveChallengeStreak } from "@/lib/utils";

export default function ProfileRivalComparison({ isOwnProfile, myStats, profileUser, xp, bestScore, t }) {
  if (isOwnProfile || !myStats) return null;

  const opponentName = (profileUser.displayName || profileUser.username || "Fighter").split(" ")[0];

  return (
    <div style={{ padding: "0 16px 4px" }}>
      <div style={{ background: "linear-gradient(145deg, #0d0b0d, #0a0a0a)", border: "1px solid rgba(167,139,250,0.15)", borderLeft: `3px solid ${PURPLE}`, borderRadius: "3px 16px 16px 3px", padding: "14px 16px" }}>
        <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, color: PURPLE, letterSpacing: 2, textTransform: "uppercase" }}>
          ⚔️ {t("profileYouVs")}{opponentName}
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
          <div style={{ textAlign: "center", fontSize: 9, fontWeight: 900, color: RED, letterSpacing: 0.5, paddingBottom: 8 }}>
            {t("profileYouLabel")}
          </div>
          <div />
          <div style={{ textAlign: "center", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5, paddingBottom: 8 }}>
            {opponentName.toUpperCase().slice(0, 8)}
          </div>
          {[
            { label: "XP", my: myStats.xp, their: xp, fmt: v => v.toLocaleString() },
            { label: t("profileStatBest"), my: myStats.bestScore, their: bestScore, fmt: v => v !== null ? `${formatScore(v)}/10` : "—" },
            { label: t("profileStatStreak"), my: myStats.streak, their: getActiveChallengeStreak(profileUser), fmt: v => v > 0 ? `🔥${v}d` : "—" },
          ].map((stat, i) => {
            const myNum = Number(stat.my) || 0;
            const theirNum = Number(stat.their) || 0;
            const myWins = myNum > theirNum;
            const theirWins = theirNum > myNum;
            const sep = i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none";
            return (
              <div key={i} style={{ display: "contents" }}>
                <div style={{ textAlign: "center", padding: "7px 0", borderTop: sep }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: myWins ? "#34D399" : "#fff" }}>{stat.fmt(stat.my)}</span>
                </div>
                <div style={{ textAlign: "center", fontSize: 9, fontWeight: 700, color: "#555", paddingTop: i > 0 ? 7 : 0, borderTop: sep }}>
                  {stat.label}
                </div>
                <div style={{ textAlign: "center", padding: "7px 0", borderTop: sep }}>
                  <span style={{ fontSize: 15, fontWeight: 900, color: theirWins ? "#34D399" : "#fff" }}>{stat.fmt(stat.their)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
