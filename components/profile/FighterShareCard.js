"use client";

import { useState } from "react";
import { formatScore } from "@/lib/utils";
import RankIcon from "@/components/RankIcon";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { RED, GOLD , goldAlpha} from "@/lib/tokens";
import Image from "next/image";

export default function FighterShareCard({
  profileUser,
  fighterRank,
  xp,
  rankProgress,
  pvpStats,
  bestScore,
  challengeStreak,
  challengeRanks,
  aiFeedbackHistory,
  userBadges,
  badgeMeta,
  locale,
  t,
  cardShareCopied,
  onShareCopied,
  onClose,
}) {
  const arch = profileUser.fighterArchetype ? ARCHETYPE_DISPLAY[profileUser.fighterArchetype] : null;
  const accentColor = arch?.color || fighterRank.color || RED;

  const handleShare = () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = locale === "mn"
      ? `${profileUser.displayName || profileUser.username} — GAVANA-д ${t(fighterRank.key)} зэрэгтэй боксчин | ${xp.toLocaleString()} XP`
      : locale === "ko"
      ? `${profileUser.displayName || profileUser.username} — GAVANA에서 ${t(fighterRank.key)} | ${xp.toLocaleString()} XP`
      : `${profileUser.displayName || profileUser.username} is a ${t(fighterRank.key)} on GAVANA Boxing | ${xp.toLocaleString()} XP`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "GAVANA Fighter Card", text, url }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${url}`).then(() => {
        onShareCopied(true);
        setTimeout(() => onShareCopied(false), 2500);
      }).catch(() => {});
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 16px", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      onClick={onClose}
    >
      <div
        style={{ width: "min(100%, 360px)", borderRadius: 24, background: `radial-gradient(ellipse at top, ${accentColor}18 0%, transparent 55%), linear-gradient(160deg, #131013 0%, #0b0b0b 100%)`, border: `1px solid ${accentColor}33`, boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${accentColor}1a`, padding: "22px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 3, color: accentColor, textTransform: "uppercase", opacity: 0.7, marginBottom: 14 }}>
          GAVANA BOXING
        </div>

        <div style={{ position: "relative", marginBottom: 14 }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${accentColor}66`, background: "#111" }}>
            {profileUser.photoURL
              ? <Image src={profileUser.photoURL} alt="" width={88} height={88} style={{ objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}22`, fontSize: 32, fontWeight: 900 }}>
                  {(profileUser.displayName || profileUser.username || "?")[0].toUpperCase()}
                </div>}
          </div>
          <div style={{ position: "absolute", bottom: -6, right: -6, width: 32, height: 32, borderRadius: "50%", background: "#0b0b0b", border: `1.5px solid ${accentColor}55`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RankIcon rank={fighterRank} size={20} animated={false} />
          </div>
        </div>

        <div style={{ fontSize: 20, fontWeight: 1000, color: "#fff", textAlign: "center", lineHeight: 1.1, marginBottom: 4 }}>
          {profileUser.displayName || profileUser.username}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginBottom: 12 }}>
          @{profileUser.username}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 16 }}>
          <span style={{ padding: "4px 12px", borderRadius: 999, background: `${fighterRank.color}18`, border: `1px solid ${fighterRank.color}44`, color: fighterRank.color, fontSize: 11, fontWeight: 900 }}>
            {t(fighterRank.key)}
          </span>
          {arch && (
            <span style={{ padding: "4px 12px", borderRadius: 999, background: `${arch.color}15`, border: `1px solid ${arch.color}44`, color: arch.color, fontSize: 11, fontWeight: 900 }}>
              {arch.emoji} {arch.name}
            </span>
          )}
        </div>

        <div style={{ width: "100%", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              {t("profileExperience")}
            </span>
            <span style={{ fontSize: 12, fontWeight: 900, color: fighterRank.color }}>{xp.toLocaleString()} XP</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.14)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: 999, background: fighterRank.gradient || accentColor, transition: "width 600ms ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{rankProgress}% → {fighterRank.label}</span>
          </div>
        </div>

        <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { label: t("profileStatWins"), value: pvpStats?.wins ?? "—", color: "#34D399" },
            { label: t("profileStatStreak"), value: challengeStreak > 0 ? `🔥${challengeStreak}` : "—", color: "#FB923C" },
            { label: t("profileStatBestScore"), value: bestScore !== null ? `${formatScore(bestScore)}/10` : "—", color: GOLD },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "10px 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <span style={{ fontSize: 18, fontWeight: 1000, color, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
            </div>
          ))}
        </div>

        {(challengeRanks?.weeklyRank || challengeRanks?.allTimeRank) && (
          <div style={{ width: "100%", padding: "12px 16px", borderRadius: 10, background: `${goldAlpha(0.06)}`, border: `1px solid ${goldAlpha(0.15)}`, display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: 14 }}>
            {challengeRanks.weeklyRank && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 1000, color: GOLD }}>#{challengeRanks.weeklyRank}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase" }}>{t("profileThisWeek")}</div>
              </div>
            )}
            {challengeRanks.weeklyRank && challengeRanks.allTimeRank && <div style={{ width: 1, background: "rgba(255,255,255,0.08)" }} />}
            {challengeRanks.allTimeRank && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 1000, color: GOLD }}>#{challengeRanks.allTimeRank}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase" }}>{t("profileAllTime")}</div>
              </div>
            )}
          </div>
        )}

        {aiFeedbackHistory.length > 0 && (
          <div style={{ width: "100%", borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: 12, marginTop: 2, marginBottom: 14 }}>
            <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center" }}>
              {t("profileRecentSessions")}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {aiFeedbackHistory.slice(0, 4).map((f, i) => {
                const sc = Number(f.score);
                const col = sc >= 9 ? GOLD : sc >= 7 ? "#34D399" : sc >= 5 ? "#60A5FA" : "#FB923C";
                return (
                  <div key={f.id || i} style={{ textAlign: "center", background: `${col}12`, border: `1px solid ${col}33`, borderRadius: 10, padding: "6px 10px" }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: col, lineHeight: 1 }}>{formatScore(f.score)}</div>
                    <div style={{ fontSize: 8, color: "#555", fontWeight: 700, marginTop: 2 }}>/10</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {userBadges.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginBottom: 14 }}>
            {userBadges.slice(0, 5).map((b) => {
              const bm = badgeMeta[b.badgeId] || { icon: "🏅", color: GOLD };
              return (
                <span key={b.badgeId} style={{ fontSize: 18, filter: "drop-shadow(0 0 4px rgba(255,255,255,0.15))" }} title={bm.label}>
                  {bm.icon}
                </span>
              );
            })}
          </div>
        )}

        <div style={{ width: "100%", height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}33, transparent)`, marginBottom: 14 }} />

        <div style={{ width: "100%", display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleShare}
            style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${accentColor}, ${accentColor}aa)`, color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
          >
            {cardShareCopied ? t("profileCopied") : t("profileShare")}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            {t("profileClose")}
          </button>
        </div>
      </div>
    </div>
  );
}
