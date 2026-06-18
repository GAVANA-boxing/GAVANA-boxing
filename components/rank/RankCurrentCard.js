"use client";

import RankIcon from "@/components/RankIcon";

export default function RankCurrentCard({
  fighterRank,
  nextRank,
  rankProgress,
  currentXP,
  xpToNext,
  sessionCount,
  dataLoading,
  locale,
  t,
}) {
  const lbl = (mn, ko, en) =>
    locale === "mn" ? mn : locale === "ko" ? ko : en;

  const tierXPStart = fighterRank.minXP;
  const tierXPEnd = nextRank?.minXP ?? fighterRank.minXP;
  const tierXPDone = currentXP - tierXPStart;
  const tierXPRange = tierXPEnd - tierXPStart;

  if (dataLoading) {
    return (
      <div style={{ marginBottom: 28 }}>
        <div className="shimmer" style={{ height: 160, borderRadius: 20 }} />
      </div>
    );
  }

  return (
    <div
      className="hud-corners section-reveal"
      style={{
        ...styles.currentCard,
        borderColor: fighterRank.glowColor
          ? fighterRank.glowColor.replace(/[\d.]+\)$/, "0.5)")
          : `${fighterRank.color}55`,
        background: fighterRank.glowColor
          ? fighterRank.glowColor.replace(/[\d.]+\)$/, "0.08)")
          : `${fighterRank.color}12`,
        boxShadow: fighterRank.pulse
          ? `0 0 32px ${fighterRank.glowColor?.replace(/[\d.]+\)$/, "0.22)")}`
          : "none",
      }}
    >
      <div style={styles.currentTop}>
        <RankIcon rank={fighterRank} size={64} animated />
        <div style={styles.currentInfo}>
          <p style={styles.currentKicker}>{t("rankCurrentLabel")}</p>
          <h2 style={{ ...styles.currentName, color: fighterRank.color }}>
            {t(fighterRank.key)}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <p style={styles.currentXP} className="num-reveal">
              {currentXP.toLocaleString()} {t("xpLabel")}
            </p>
            {sessionCount > 0 && (
              <span style={{ fontSize: 11, color: "#555", fontWeight: 700 }}>
                · {sessionCount} {lbl("сесс", "세션", "sessions")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div style={styles.xpBarWrap}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: "#666", fontWeight: 700 }}>
            {tierXPDone.toLocaleString()} / {tierXPRange > 0 ? tierXPRange.toLocaleString() : "MAX"}
          </span>
          <span style={{ fontSize: 10, fontWeight: 900, color: fighterRank.color }}>
            {nextRank ? `${rankProgress}%` : "MAX"}
          </span>
        </div>
        <div style={styles.xpTrack}>
          <div
            className="xp-fill-anim"
            style={{
              ...styles.xpFill,
              width: `${rankProgress}%`,
              background: fighterRank.gradient,
            }}
          />
        </div>
        <p style={styles.xpBarLabel}>
          {nextRank
            ? `${xpToNext.toLocaleString()} XP → ${t(nextRank.key)}`
            : t("atMaxRank")}
        </p>
      </div>
    </div>
  );
}

const styles = {
  currentCard: {
    padding: "20px 18px",
    borderRadius: "var(--r-xl)",
    border: "1px solid",
    marginBottom: 28,
    transition: "box-shadow 0.4s",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  },
  currentTop: {
    display: "flex",
    alignItems: "center",
    gap: 18,
    marginBottom: 16,
  },
  currentInfo: { flex: 1, minWidth: 0 },
  currentKicker: {
    margin: "0 0 3px",
    fontSize: "var(--text-xs)",
    fontWeight: "var(--fw-black)",
    letterSpacing: "0.22em",
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  currentName: {
    margin: "0 0 5px",
    fontSize: "var(--text-2xl)",
    fontWeight: "var(--fw-ultra)",
    lineHeight: "var(--lh-tight)",
    textTransform: "uppercase",
    letterSpacing: "var(--ls-tight)",
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  currentXP: {
    margin: 0,
    fontSize: "var(--text-base)",
    color: "rgba(255,255,255,0.45)",
    fontWeight: "var(--fw-bold)",
  },
  xpBarWrap: {},
  xpTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginBottom: 6,
  },
  xpFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 700ms ease",
  },
  xpBarLabel: {
    margin: 0,
    fontSize: "var(--text-sm)",
    color: "rgba(255,255,255,0.38)",
    textAlign: "right",
    fontWeight: "var(--fw-bold)",
    letterSpacing: "var(--ls-wide)",
  },
};
