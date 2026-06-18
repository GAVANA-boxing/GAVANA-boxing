"use client";

import { getBelt, getBeltProgress, getNextBelt } from "@/lib/belts";
import { GOLD, PURPLE, goldAlpha } from "@/lib/tokens";
import { getWeightClassDisplay } from "@/lib/weightClasses";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { formatScore, getActiveChallengeStreak } from "@/lib/utils";
import styles from "@/components/profile/profilePageStyles";

/**
 * ProfileLicenseCard
 *
 * Props:
 *   profileUser    – Firestore user document object
 *   xp             – number
 *   bestScore      – number | null
 *   pvpStats       – { wins: number, losses: number } | null
 *   challengeRanks – { weeklyRank: number } | null
 *   onShowRankModal – () => void
 *   t              – (key: string) => string
 */
export default function ProfileLicenseCard({
  profileUser,
  xp,
  bestScore,
  pvpStats,
  challengeRanks,
  onShowRankModal,
  t,
}) {
  const belt = getBelt(xp);
  const nextBelt = getNextBelt(xp);
  const beltPct = getBeltProgress(xp);
  const arch = profileUser.fighterArchetype ? ARCHETYPE_DISPLAY[profileUser.fighterArchetype] : null;
  const challengeStreak = getActiveChallengeStreak(profileUser);

  return (
    <div style={{ ...styles.licenseCard, position: "relative" }} className="section-reveal">
      {/* Belt stripe at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: belt.gradient,
          pointerEvents: "none",
        }}
      />

      {/* Left: Belt display */}
      <button type="button" onClick={onShowRankModal} style={styles.licenseRankBlock}>
        {/* Belt ring — shows progress as circle */}
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg width={56} height={56} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={28} cy={28} r={24} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4} />
            <circle
              cx={28}
              cy={28}
              r={24}
              fill="none"
              stroke={belt.color}
              strokeWidth={4}
              strokeDasharray={`${(beltPct / 100) * (2 * Math.PI * 24)} ${2 * Math.PI * 24}`}
              strokeLinecap="round"
              style={{ filter: belt.glow ? `drop-shadow(0 0 4px ${belt.glow})` : "none" }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 20 }}>🥋</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 900,
              color: belt.color,
              letterSpacing: 0.3,
              lineHeight: 1,
            }}
          >
            {t(belt.key)}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div
              style={{
                width: 90,
                height: 4,
                borderRadius: 2,
                background: "rgba(255,255,255,0.07)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${beltPct}%`,
                  height: "100%",
                  borderRadius: 2,
                  background: belt.gradient,
                  transition: "width 0.8s ease",
                }}
              />
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: belt.color }}>{beltPct}%</span>
          </div>
          {nextBelt && (
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)" }}>
              {t("beltNextLabel")} {t(nextBelt.key)}
            </span>
          )}
        </div>
      </button>

      {/* Divider */}
      <div style={styles.licenseDivider} />

      {/* Right: tags grid */}
      <div style={styles.licenseTagsGrid}>
        {arch && (
          <div
            style={{
              ...styles.licenseTag,
              color: arch.color,
              background: `${arch.color}12`,
              borderColor: `${arch.color}35`,
            }}
          >
            {arch.emoji} {arch.name}
          </div>
        )}
        {bestScore !== null && (
          <div
            style={{
              ...styles.licenseTag,
              color: GOLD,
              background: goldAlpha(0.08),
              borderColor: goldAlpha(0.28),
            }}
          >
            ⭐ {formatScore(bestScore)}/10
          </div>
        )}
        {challengeStreak > 0 && (
          <div
            style={{
              ...styles.licenseTag,
              color: "#FB923C",
              background: "rgba(251,146,60,0.1)",
              borderColor: "rgba(251,146,60,0.3)",
            }}
          >
            🔥 {challengeStreak}d
          </div>
        )}
        {profileUser.weightClass && (
          <div
            style={{
              ...styles.licenseTag,
              color: "#60A5FA",
              background: "rgba(96,165,250,0.08)",
              borderColor: "rgba(96,165,250,0.22)",
            }}
          >
            ⚖️ {getWeightClassDisplay(profileUser.weightClass)}
          </div>
        )}
        {profileUser.gym && (
          <div
            style={{
              ...styles.licenseTag,
              color: "rgba(255,255,255,0.5)",
              background: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            🏋️ {profileUser.gym}
          </div>
        )}
        {pvpStats?.wins > 0 && (
          <div
            style={{
              ...styles.licenseTag,
              color: PURPLE,
              background: "rgba(167,139,250,0.08)",
              borderColor: "rgba(167,139,250,0.25)",
            }}
          >
            ⚔️ {pvpStats.wins}W {pvpStats.losses}L
          </div>
        )}
        {challengeRanks?.weeklyRank <= 10 && challengeRanks?.weeklyRank > 0 && (
          <div
            style={{
              ...styles.licenseTag,
              color: GOLD,
              background: goldAlpha(0.08),
              borderColor: goldAlpha(0.28),
            }}
          >
            #{challengeRanks.weeklyRank} Week
          </div>
        )}
      </div>
    </div>
  );
}
