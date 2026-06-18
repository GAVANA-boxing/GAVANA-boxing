"use client";

import Image from "next/image";
import RankBadge from "@/components/RankBadge";
import { GOLD } from "@/lib/tokens";
import { getAvatarUrl } from "@/lib/leaderboardHelpers";
import { getFighterRank } from "@/lib/xp";

const MEDALS = ["🥇", "🥈", "🥉"];
const COLORS = [GOLD, "#C0C0C0", "#CD7F32"];
// Render order: 2nd (left), 1st (center), 3rd (right)
const RENDER_ORDER = [1, 0, 2];
const PODIUM_HEIGHTS = [128, 100, 84]; // indexed by filteredDisplayEntries index (0=1st,1=2nd,2=3rd)

/**
 * Top-3 podium card shown for "week" and "alltime" tabs when ≥ 3 entries exist.
 *
 * Props:
 *   entries   array   – top entries (needs at least 3); index 0 = rank 1
 *   profiles  object  – { [userId]: profileData }
 *   locale    string
 *   t         fn
 *   onSelect  fn(userId) – navigate to profile
 */
export default function LeaderboardPodium({ entries, profiles, locale, t, onSelect }) {
  if (entries.length < 3) return null;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 8, marginBottom: 20, padding: "0 8px" }}>
      {RENDER_ORDER.map((idx) => {
        const entry = entries[idx];
        if (!entry) return null;
        const rank = idx + 1;
        const isFirst = rank === 1;
        const profile = profiles[entry.userId] || {};
        const name = profile.displayName || profile.username || "Fighter";
        const photo = getAvatarUrl(profile);
        const avatarSize = isFirst ? 56 : 44;
        const color = COLORS[rank - 1];
        const glowShadow = isFirst
          ? `0 0 0 2.5px ${color}, 0 0 22px ${color}88`
          : `0 0 8px ${color}44`;
        const podiumH = PODIUM_HEIGHTS[idx];
        const fighterRank = getFighterRank(entry.xp ?? 0);

        return (
          <div
            key={rank}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
            onClick={() => onSelect(entry.userId)}
          >
            <span style={{ fontSize: isFirst ? 20 : 16 }}>{MEDALS[rank - 1]}</span>

            {photo ? (
              <Image
                src={photo}
                alt=""
                width={avatarSize}
                height={avatarSize}
                style={{ borderRadius: "50%", objectFit: "cover", border: `2.5px solid ${color}`, boxShadow: glowShadow }}
              />
            ) : (
              <div style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: `2.5px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isFirst ? 22 : 16, fontWeight: 900, color: "#fff", boxShadow: glowShadow }}>
                {name[0]?.toUpperCase()}
              </div>
            )}

            <span style={{ fontSize: isFirst ? 11 : 10, fontWeight: 800, color: isFirst ? "#fff" : "rgba(255,255,255,0.7)", maxWidth: 72, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center", fontFamily: "var(--font-condensed)" }}>
              {name.split(" ")[0]}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <RankBadge rank={fighterRank} size={isFirst ? 14 : 12} glowEnabled={isFirst} />
              <span style={{ fontSize: 9, fontWeight: 700, color: fighterRank.color, fontFamily: "var(--font-condensed)", letterSpacing: "0.05em", maxWidth: 60, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {t(fighterRank.key)}
              </span>
            </div>

            <span style={{ fontSize: isFirst ? 13 : 11, fontWeight: 900, color, textAlign: "center", fontFamily: "var(--font-display)" }}>
              {entry.bestScore}/10
            </span>

            <div style={{ width: "100%", height: podiumH, borderRadius: "8px 8px 0 0", background: isFirst ? `linear-gradient(180deg, ${color}44, ${color}18)` : `linear-gradient(180deg, ${color}2a, ${color}0e)`, border: `1px solid ${color}${isFirst ? "88" : "44"}`, borderBottom: "none", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isFirst ? `0 -4px 20px ${color}33` : `0 -2px 10px ${color}18` }}>
              <span style={{ fontSize: isFirst ? 22 : 18, fontWeight: 900, color, opacity: isFirst ? 0.8 : 0.5, fontFamily: "var(--font-display)" }}>
                #{rank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
