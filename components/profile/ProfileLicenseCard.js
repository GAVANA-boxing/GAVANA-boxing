"use client";

import { getBelt, getBeltProgress, getNextBelt } from "@/lib/belts";
import { GOLD, PURPLE, RED, goldAlpha, redAlpha } from "@/lib/tokens";
import { getWeightClassDisplay } from "@/lib/weightClasses";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { formatScore, getActiveChallengeStreak } from "@/lib/utils";
import styles from "@/components/profile/profilePageStyles";

export default function ProfileLicenseCard({
  profileUser,
  xp,
  bestScore,
  pvpStats,
  challengeRanks,
  onShowRankModal,
  t,
}) {
  const belt          = getBelt(xp);
  const nextBelt      = getNextBelt(xp);
  const beltPct       = getBeltProgress(xp);
  const arch          = profileUser.fighterArchetype ? ARCHETYPE_DISPLAY[profileUser.fighterArchetype] : null;
  const challengeStreak = getActiveChallengeStreak(profileUser);
  const dnaStability  = profileUser.fighterDNA?.stability ?? profileUser.fighterDNA?.confidence ?? null;

  const chips = [
    challengeStreak > 0 && { label: `🔥 ${challengeStreak}d`, color: "#FB923C", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.28)" },
    profileUser.weightClass && { label: `⚖️ ${getWeightClassDisplay(profileUser.weightClass)}`, color: "#60A5FA", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)" },
    pvpStats?.wins > 0 && { label: `⚔️ ${pvpStats.wins}W ${pvpStats.losses}L`, color: PURPLE, bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.22)" },
    profileUser.gym && { label: `🏋️ ${profileUser.gym}`, color: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)" },
    challengeRanks?.weeklyRank > 0 && challengeRanks.weeklyRank <= 20 && { label: `#${challengeRanks.weeklyRank} Week`, color: GOLD, bg: goldAlpha(0.08), border: goldAlpha(0.25) },
  ].filter(Boolean);

  return (
    <div style={{
      position: "relative",
      background: `linear-gradient(160deg, rgba(18,14,16,1) 0%, rgba(10,9,11,1) 100%)`,
      border: `1px solid ${arch ? `${arch.color}28` : "rgba(255,255,255,0.08)"}`,
      borderRadius: 20,
      overflow: "hidden",
      marginBottom: 0,
    }} className="section-reveal">

      {/* Top accent stripe */}
      <div style={{ height: 3, background: arch ? `linear-gradient(90deg, ${arch.color}, transparent)` : belt.gradient }} />

      {/* Header row: FIGHTER LICENSE label + GAVANA badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px" }}>
        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 3, color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>
          FIGHTER LICENSE
        </span>
        <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: redAlpha(0.6), textTransform: "uppercase" }}>
          ✦ GAVANA
        </span>
      </div>

      {/* Main identity block */}
      <div style={{ padding: "0 16px 14px", display: "flex", gap: 14, alignItems: "center" }}>

        {/* Belt ring */}
        <button type="button" onClick={onShowRankModal} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }}>
          <div style={{ position: "relative", width: 60, height: 60 }}>
            <svg width={60} height={60} style={{ transform: "rotate(-90deg)" }}>
              <circle cx={30} cy={30} r={26} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
              <circle
                cx={30} cy={30} r={26} fill="none"
                stroke={belt.color} strokeWidth={4}
                strokeDasharray={`${(beltPct / 100) * (2 * Math.PI * 26)} ${2 * Math.PI * 26}`}
                strokeLinecap="round"
                style={{ filter: belt.glow ? `drop-shadow(0 0 5px ${belt.glow})` : "none" }}
              />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 22 }}>🥋</span>
            </div>
          </div>
        </button>

        {/* Identity text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Archetype — hero element */}
          {arch ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 1000, color: arch.color, letterSpacing: "-0.01em", lineHeight: 1.1, marginBottom: 3, fontFamily: "var(--font-display,'Anton',sans-serif)", textShadow: `0 0 20px ${arch.color}44` }}>
                {arch.name.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: 0.5, marginBottom: 6 }}>
                {arch.emoji} {t(belt.key)} · {beltPct}% → {nextBelt ? t(nextBelt.key) : "MAX"}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 900, color: belt.color, letterSpacing: 0.5, marginBottom: 3 }}>
                {t(belt.key)}
              </div>
              <div style={{ width: 100, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 6 }}>
                <div style={{ width: `${beltPct}%`, height: "100%", borderRadius: 2, background: belt.gradient }} />
              </div>
            </>
          )}

          {/* Stats row: best score + DNA stability */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {bestScore !== null && (
              <span style={{ fontSize: 11, fontWeight: 900, color: GOLD, background: goldAlpha(0.1), border: `1px solid ${goldAlpha(0.25)}`, borderRadius: 6, padding: "2px 8px" }}>
                ⭐ {formatScore(bestScore)}/10
              </span>
            )}
            {dnaStability != null && (
              <span style={{ fontSize: 11, fontWeight: 900, color: "#34D399", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.22)", borderRadius: 6, padding: "2px 8px" }}>
                🧬 {Math.round(dnaStability)}% DNA
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Chips row */}
      {chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "10px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {chips.map(({ label, color, bg, border }) => (
            <span key={label} style={{ fontSize: 10, fontWeight: 800, color, background: bg, border: `1px solid ${border}`, borderRadius: 6, padding: "3px 9px", letterSpacing: 0.3 }}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
