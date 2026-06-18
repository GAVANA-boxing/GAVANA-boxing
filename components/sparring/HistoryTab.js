"use client";

import { GOLD } from "@/lib/tokens";
import { formatAgo } from "@/lib/utils";
import s from "@/components/sparring/sparringStyles";
import { HUDCard } from "@/components/ui";

/**
 * Props:
 *   locale         – locale string
 *   t              – translate(locale, key) shorthand
 *   matchHistory   – array of match objects
 *   historyLoading – bool
 *   router         – Next.js router (for reelId navigation)
 */
export default function HistoryTab({ locale, t, matchHistory, historyLoading, router }) {
  return (
    <div style={{ ...s.list, padding: "8px 16px 0" }}>
      {historyLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
          {[1, 2, 3].map((i) => <div key={i} className="shimmer" style={{ height: 72, borderRadius: 12 }} />)}
        </div>
      ) : matchHistory.length === 0 ? (
        <div style={s.empty}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>📊</div>
          <p style={s.emptyTitle}>{t("sparringNoHistory")}</p>
          <p style={s.emptySub}>{t("sparringNoHistorySub")}</p>
        </div>
      ) : (
        <>
          {/* Win/loss summary strip */}
          {(() => {
            const wins = matchHistory.filter((m) => m.result === "win").length;
            const total = matchHistory.length;
            const winPct = total > 0 ? Math.round((wins / total) * 100) : 0;
            return (
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                {[
                  { label: t("sparringMatchTotal"), value: total, color: "#fff" },
                  { label: t("sparringMatchWins"), value: wins, color: "#34D399" },
                  { label: t("sparringMatchWinRate"), value: `${winPct}%`, color: GOLD },
                ].map(({ label, value, color }) => (
                  <HUDCard key={label} corners style={{ flex: 1, minWidth: 80, padding: "12px 10px", textAlign: "center" }}>
                    <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color, fontFamily: "var(--font-display)" }}>{value}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "var(--font-condensed)" }}>{label}</p>
                  </HUDCard>
                ))}
              </div>
            );
          })()}
          {matchHistory.map((match) => {
            const won = match.result === "win";
            const col = won ? "#34D399" : "#F87171";
            const ago = formatAgo(match.createdAt, locale);
            return (
              <div
                key={match.id}
                style={{ background: "rgba(255,255,255,0.025)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${col}`, borderRadius: "3px 12px 12px 3px", padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, cursor: match.reelId ? "pointer" : "default" }}
                onClick={() => match.reelId && router.push(`/${locale}/reels?reelId=${match.reelId}&source=pvp`)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 3 }}>
                    vs {match.opponentName || t("sparringOpponentFallback")}
                  </div>
                  <div style={{ display: "flex", gap: 8, fontSize: 11, color: "rgba(255,255,255,0.45)", flexWrap: "wrap" }}>
                    <span style={{ color: col, fontWeight: 800 }}>{won ? t("sparringWin") : t("sparringLoss")}</span>
                    <span>{match.challengerScore?.toFixed(1)} vs {match.opponentScore?.toFixed(1)}</span>
                    {ago && <span>{ago}</span>}
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: col, flexShrink: 0 }}>
                  {won ? "🏆" : "💪"}
                </div>
              </div>
            );
          })}
        </>
      )}
      <div style={{ height: "calc(80px + env(safe-area-inset-bottom))" }} />
    </div>
  );
}
