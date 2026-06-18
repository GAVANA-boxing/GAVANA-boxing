"use client";

import styles from "@/components/leaderboard/leaderboardStyles";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { GOLD, redAlpha } from "@/lib/tokens";

const WEIGHT_CLASSES = ["all", "-54", "-60", "-67", "-75", "-81", "+91"];

/**
 * Collapsible archetype + weight filter panel.
 *
 * Props:
 *   archetypeFilter  string  – current archetype key or "all"
 *   setArchetypeFilter fn
 *   weightFilter     string  – current weight key or "all"
 *   setWeightFilter  fn
 *   showFilters      boolean
 *   setShowFilters   fn
 *   t                fn      – translate(key)
 */
export default function LeaderboardFilters({
  archetypeFilter,
  setArchetypeFilter,
  weightFilter,
  setWeightFilter,
  showFilters,
  setShowFilters,
  t,
}) {
  const hasActiveFilter = archetypeFilter !== "all" || weightFilter !== "all";

  const archetypeOptions = [
    { key: "all",       label: t("lbAllArchetype") },
    { key: "pressure",  label: `${ARCHETYPE_DISPLAY.pressure.emoji} Pressure` },
    { key: "counter",   label: `${ARCHETYPE_DISPLAY.counter.emoji} Counter` },
    { key: "technical", label: `${ARCHETYPE_DISPLAY.technical.emoji} Technical` },
    { key: "brawler",   label: `${ARCHETYPE_DISPLAY.brawler.emoji} Brawler` },
  ];

  return (
    <div style={styles.filterWrap}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 10,
            border: `1px solid ${hasActiveFilter ? redAlpha(0.55) : "rgba(255,255,255,0.1)"}`,
            background: hasActiveFilter ? redAlpha(0.1) : "rgba(255,255,255,0.04)",
            color: hasActiveFilter ? "#F87171" : "rgba(255,255,255,0.5)",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {t("lbFilter") || "Шүүлтүүр"}
          {hasActiveFilter && (
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F87171", flexShrink: 0 }} />
          )}
        </button>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={() => { setArchetypeFilter("all"); setWeightFilter("all"); }}
            style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
          >
            ✕ {t("lbClearFilter") || "Арилгах"}
          </button>
        )}
      </div>

      {showFilters && (
        <>
          {/* Archetype row */}
          <div style={styles.filterRow}>
            {archetypeOptions.map(({ key, label }) => {
              const isActive = archetypeFilter === key;
              const color = key === "all" ? GOLD : ARCHETYPE_DISPLAY[key]?.color;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setArchetypeFilter(key)}
                  style={{
                    ...styles.filterChip,
                    ...(isActive ? { background: `${color}22`, border: `1px solid ${color}`, color } : {}),
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Weight class row */}
          <div style={styles.filterRow}>
            {WEIGHT_CLASSES.map((wt) => (
              <button
                key={wt}
                type="button"
                onClick={() => setWeightFilter(wt)}
                style={{
                  ...styles.filterChip,
                  ...(weightFilter === wt ? styles.filterChipActiveWeight : {}),
                }}
              >
                {wt === "all" ? t("lbAllWeights") : `${wt}kg`}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
