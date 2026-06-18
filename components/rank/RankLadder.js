"use client";

import { RANK_TIERS } from "@/lib/xp";
import RankIcon from "@/components/RankIcon";
import { GOLD } from "@/lib/tokens";

export default function RankLadder({
  fighterRank,
  currentXP,
  rankProgress,
  dataLoading,
  t,
}) {
  return (
    <>
      <h2 style={styles.ladderHeading}>{t("rankPageKicker")}</h2>

      <div style={styles.ladder} className="stagger-list">
        {RANK_TIERS.map((tier) => {
          const isCurrent = fighterRank.key === tier.key;
          const isUnlocked = !dataLoading && currentXP >= tier.minXP;

          return (
            <div
              key={tier.key}
              style={{
                ...styles.row,
                ...(isCurrent
                  ? {
                      ...styles.rowCurrent,
                      borderColor: tier.glowColor
                        ? tier.glowColor.replace(/[\d.]+\)$/, "0.5)")
                        : `${tier.color}55`,
                      background: tier.glowColor
                        ? tier.glowColor.replace(/[\d.]+\)$/, "0.1)")
                        : `${tier.color}18`,
                    }
                  : {}),
                ...(!isUnlocked ? styles.rowLocked : {}),
              }}
            >
              <div style={styles.rowIcon}>
                <RankIcon rank={tier} size={36} animated={isCurrent} />
              </div>

              <div style={styles.rowInfo}>
                <div style={styles.rowNameLine}>
                  <span style={{ ...styles.rowName, color: isUnlocked ? tier.color : "#555" }}>
                    {t(tier.key)}
                  </span>
                  {isCurrent && (
                    <span style={{ ...styles.currentBadge, background: tier.gradient }}>
                      {t("rankCurrentLabel")}
                    </span>
                  )}
                  {!isUnlocked && !dataLoading && (
                    <span style={styles.lockIcon}>🔒</span>
                  )}
                </div>
                <p style={{ ...styles.rowXP, color: isUnlocked ? "#888" : "#444" }}>
                  {tier.minXP === 0
                    ? t("rankStarterLabel")
                    : t("rankXPRequired").replace("{xp}", tier.minXP.toLocaleString())}
                </p>
              </div>

              {isCurrent && (
                <div style={styles.rowProgress}>
                  <div
                    style={{
                      ...styles.rowProgressFill,
                      width: `${rankProgress}%`,
                      background: tier.gradient,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

const styles = {
  ladderHeading: {
    margin: "0 0 12px",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-black)",
    letterSpacing: "0.3em",
    color: GOLD,
    textTransform: "uppercase",
  },
  ladder: {
    display: "grid",
    gap: 7,
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "13px 15px",
    borderRadius: "var(--r-lg)",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    position: "relative",
    overflow: "hidden",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  rowCurrent: {
    border: "1px solid",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  rowLocked: {
    opacity: 0.38,
  },
  rowIcon: { flexShrink: 0 },
  rowInfo: { flex: 1, minWidth: 0 },
  rowNameLine: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  rowName: {
    fontSize: "var(--text-md)",
    fontWeight: "var(--fw-black)",
    textTransform: "uppercase",
    letterSpacing: "var(--ls-wide)",
  },
  currentBadge: {
    padding: "2px 8px",
    borderRadius: "var(--r-full)",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-black)",
    color: "#fff",
    letterSpacing: "var(--ls-wider)",
    textTransform: "uppercase",
  },
  lockIcon: { fontSize: 12 },
  rowXP: {
    margin: "3px 0 0",
    fontSize: "var(--text-sm)",
    fontWeight: "var(--fw-bold)",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "var(--ls-wide)",
  },
  rowProgress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    background: "rgba(255,255,255,0.06)",
    borderRadius: "0 0 16px 16px",
    overflow: "hidden",
  },
  rowProgressFill: {
    height: "100%",
    transition: "width 700ms ease",
  },
};
