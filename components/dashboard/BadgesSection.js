"use client";

import { useMemo, useState } from "react";
import { ACHIEVEMENT_BADGES, TIER_COLOR, computeEarnedBadges } from "@/lib/badges";
import { GOLD } from "@/lib/tokens";
import { loc } from "@/lib/loc";

export default function BadgesSection({ sessionCount, bestScore, streakDays, studiedCount, totalFighters, radarStats, locale }) {
  const [showAll, setShowAll] = useState(false);

  const earnedIds = useMemo(() =>
    new Set(computeEarnedBadges({ sessionCount, bestScore, streakDays, studiedCount, totalFighters, radarStats })),
    [sessionCount, bestScore, streakDays, studiedCount, totalFighters, radarStats]
  );

  const earned = ACHIEVEMENT_BADGES.filter((b) => earnedIds.has(b.id));
  const locked = ACHIEVEMENT_BADGES.filter((b) => !earnedIds.has(b.id));
  const visible = showAll ? locked : locked.slice(0, 3);

  if (sessionCount < 1) return null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `2.5px solid ${GOLD}`,
      borderRadius: "3px 16px 16px 3px",
      marginBottom: 28,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.045)",
        background: "rgba(0,0,0,0.18)",
      }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, boxShadow: `0 0 7px ${GOLD}` }} />
        <span style={{ fontSize: 10, fontWeight: 900, flex: 1, color: "rgba(255,255,255,0.55)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          {loc(locale, "Амжилтууд", "업적", "Achievements")}
        </span>
        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.22)", fontWeight: 700 }}>
          {earned.length}/{ACHIEVEMENT_BADGES.length}
        </span>
      </div>

      <div style={{ padding: "12px 14px 14px" }}>

        {/* Earned badges */}
        {earned.length > 0 && (
          <div style={{ marginBottom: locked.length > 0 ? 16 : 0 }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 10 }}>
              {locale === "mn" ? "Олсон" : "Earned"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {earned.map((badge) => (
                <BadgeTile key={badge.id} badge={badge} earned locale={locale} />
              ))}
            </div>
          </div>
        )}

        {/* Locked badges — show up to 3, expandable */}
        {locked.length > 0 && (
          <div>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.18)", textTransform: "uppercase", marginBottom: 10 }}>
              {locale === "mn" ? "Нээгдэх" : "Locked"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {visible.map((badge) => (
                <BadgeTile key={badge.id} badge={badge} earned={false} locale={locale} />
              ))}
            </div>
            {locked.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAll((s) => !s)}
                style={{ marginTop: 10, width: "100%", padding: "8px 0", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
              >
                {showAll
                  ? (locale === "mn" ? "Хураах" : "Show less")
                  : (locale === "mn" ? `+ ${locked.length - 3} нэмэх` : `+ ${locked.length - 3} more`)}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function BadgeTile({ badge, earned, locale }) {
  const tierColor = TIER_COLOR[badge.tier] || "#fff";
  const name = locale === "mn" ? badge.nameMn : badge.name;
  const desc = locale === "mn" ? badge.descMn : badge.desc;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
      padding: "10px 6px 8px",
      borderRadius: 13,
      background: earned ? `${tierColor}10` : "rgba(255,255,255,0.02)",
      border: `1px solid ${earned ? tierColor + "30" : "rgba(255,255,255,0.05)"}`,
      position: "relative",
      opacity: earned ? 1 : 0.45,
      textAlign: "center",
    }}>
      <span style={{ fontSize: 22, filter: earned ? "none" : "grayscale(1)", lineHeight: 1 }}>{badge.icon}</span>
      <span style={{ fontSize: 9, fontWeight: 900, color: earned ? tierColor : "rgba(255,255,255,0.35)", letterSpacing: 0.3, lineHeight: 1.2 }}>
        {name}
      </span>
      <span style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", lineHeight: 1.3 }}>
        {desc}
      </span>
      {earned && (
        <div style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: tierColor, boxShadow: `0 0 5px ${tierColor}` }} />
      )}
    </div>
  );
}
