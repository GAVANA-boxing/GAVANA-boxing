"use client";

import { RANK_TIERS } from "@/lib/xp";
import { RADIUS , blackAlpha} from "@/lib/tokens";

export default function RankBeltModal({ xp, fighterRank, nextRank, rankProgress, t, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        background: blackAlpha(0.78),
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(100%, 430px)",
          borderRadius: 24,
          background: "rgba(14,14,18,0.98)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: `1px solid ${fighterRank.color}44`,
          boxShadow: fighterRank.glowColor ? `0 32px 80px ${blackAlpha(0.6)}, 0 0 0 1px ${fighterRank.color}22, 0 0 40px ${fighterRank.glowColor}` : `0 32px 80px ${blackAlpha(0.6)}`,
          padding: "26px 22px 22px",
          display: "grid",
          gap: 18,
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{ margin: 0, color: fighterRank.color, fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>{t("rankBeltModalTitle")}</p>
            <h2 style={{ margin: "5px 0 0", color: "#fff", fontSize: 26, fontWeight: 1000, lineHeight: 1 }}>{t(fighterRank.key)}</h2>
            <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.4 }}>{t("rankBeltMotivation")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ flexShrink: 0, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 34, height: 34, color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ×
          </button>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 800 }}>{xp.toLocaleString()} XP</span>
            {nextRank ? (
              <span style={{ color: fighterRank.color, fontSize: 11, fontWeight: 800 }}>
                {nextRank.minXP - xp} XP → {t(nextRank.key)}
              </span>
            ) : (
              <span style={{ color: fighterRank.color, fontSize: 11, fontWeight: 800 }}>{t("rankBeltMaxed")}</span>
            )}
          </div>
          <div style={{ height: 8, borderRadius: RADIUS.full, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: RADIUS.full, background: fighterRank.gradient, transition: "width 600ms ease", boxShadow: fighterRank.glowColor ? `0 0 12px ${fighterRank.glowColor}` : "none" }} />
          </div>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, textAlign: "right" }}>{rankProgress}%</p>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <p style={{ margin: "0 0 6px", color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase" }}>{t("rankBeltAllRanks")}</p>
          {RANK_TIERS.map((tier) => {
            const isCurrent = tier.key === fighterRank.key;
            const isReached = xp >= tier.minXP;
            return (
              <div key={tier.key} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: 12,
                background: isCurrent ? `${tier.color}18` : "rgba(255,255,255,0.03)",
                border: isCurrent ? `1px solid ${tier.color}44` : "1px solid rgba(255,255,255,0.05)",
                opacity: isReached ? 1 : 0.38,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: isReached ? tier.color : "rgba(255,255,255,0.12)", boxShadow: isReached && tier.glowColor ? `0 0 8px ${tier.glowColor}` : "none" }} />
                  <span style={{ color: isReached ? "#fff" : "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: isCurrent ? 900 : 700 }}>{t(tier.key)}</span>
                  {isCurrent && <span style={{ fontSize: 9, fontWeight: 900, color: tier.color, letterSpacing: 1, textTransform: "uppercase" }}>{t("rankBeltCurrent")}</span>}
                </div>
                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700 }}>{tier.minXP.toLocaleString()} XP</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
