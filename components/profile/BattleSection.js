"use client";

import { RED, GOLD , PURPLE, redAlpha} from "@/lib/tokens";

function getTimestampMs(timestamp) {
  if (!timestamp) return 0;
  if (timestamp.toMillis) return timestamp.toMillis();
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function formatScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(1).replace(/\.0$/, "");
}

export default function BattleSection({ pvpStats, sparringRecord, isOwnProfile, locale, t, onGoToSparring }) {
  return (
    <section style={{ padding: "16px 16px 32px" }}>
      {pvpStats && (pvpStats.wins > 0 || pvpStats.losses > 0) ? (
        <>
          <div style={{
            background: "linear-gradient(145deg, #0a0a0a, #111)",
            border: "1px solid rgba(167,139,250,0.15)",
            borderLeft: `3px solid ${PURPLE}`,
            borderRadius: "3px 16px 16px 3px",
            padding: "18px 16px", marginBottom: 14,
          }}>
            <p style={{ margin: "0 0 14px", fontSize: 9, fontWeight: 900, color: PURPLE, letterSpacing: 2.5, textTransform: "uppercase" }}>
              ⚔️ {t("profilePvpRecord")}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-around" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 42, fontWeight: 900, color: "#34D399", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{pvpStats.wins}</div>
                <div style={{ fontSize: 10, color: "#555", fontWeight: 800, marginTop: 4, letterSpacing: 1 }}>{t("profileWinsLabel")}</div>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 42, fontWeight: 900, color: "#F87171", fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{pvpStats.losses}</div>
                <div style={{ fontSize: 10, color: "#555", fontWeight: 800, marginTop: 4, letterSpacing: 1 }}>{t("profileLossesLabel")}</div>
              </div>
              {pvpStats.bestWinScore !== null && (
                <>
                  <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 42, fontWeight: 900, color: GOLD, fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>{formatScore(pvpStats.bestWinScore)}</div>
                    <div style={{ fontSize: 10, color: "#555", fontWeight: 800, marginTop: 4, letterSpacing: 1 }}>{t("profileBestLabel")}</div>
                  </div>
                </>
              )}
            </div>
            {(() => {
              const total = pvpStats.wins + pvpStats.losses;
              const winPct = total > 0 ? Math.round((pvpStats.wins / total) * 100) : 0;
              return (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#555", letterSpacing: 1.5, textTransform: "uppercase" }}>
                      {t("profileWinRate")}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: winPct >= 50 ? "#34D399" : "#F87171" }}>{winPct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "rgba(248,113,113,0.25)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      width: `${winPct}%`,
                      background: winPct >= 50 ? "linear-gradient(90deg, #34D399, #059669)" : "linear-gradient(90deg, #F87171, #dc2626)",
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              );
            })()}
          </div>

          {pvpStats.recentBattles?.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 900, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>
                {t("profileRecentBattles")}
              </p>
              {pvpStats.recentBattles.map((battle) => {
                const isWin = battle.result === "win";
                const col = isWin ? "#34D399" : "#F87171";
                const dateLabel = battle.createdAt
                  ? new Date(getTimestampMs(battle.createdAt)).toLocaleDateString()
                  : "";
                return (
                  <div key={battle.id} style={{
                    background: "linear-gradient(145deg, #111012, #0a0a0a)",
                    border: `1px solid ${col}22`,
                    borderLeft: `3px solid ${col}`,
                    borderRadius: "3px 14px 14px 3px",
                    padding: "12px 14px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>vs {battle.opponentName}</div>
                      <div style={{ fontSize: 10, color: "#444" }}>{dateLabel}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {battle.reelId && (
                        <a
                          href={`/${locale}/reels?id=${battle.reelId}`}
                          style={{
                            fontSize: 10, fontWeight: 800, color: PURPLE,
                            textDecoration: "none", padding: "3px 8px",
                            border: "1px solid rgba(167,139,250,0.3)",
                            borderRadius: 6, background: "rgba(167,139,250,0.08)",
                          }}
                        >
                          {t("profileWatchBtn")}
                        </a>
                      )}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 900, color: col }}>
                          {isWin ? t("profileWinResult") : t("profileLossResult")}
                        </div>
                        <div style={{ fontSize: 11, color: "#555" }}>{formatScore(battle.challengerScore)} vs {formatScore(battle.opponentScore)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <a
            href={`/${locale}/sparring`}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginTop: 14, padding: "11px 0", borderRadius: 12,
              background: "linear-gradient(135deg, rgba(167,139,250,0.12), rgba(167,139,250,0.06))",
              border: "1px solid rgba(167,139,250,0.25)",
              color: PURPLE, fontSize: 13, fontWeight: 800,
              textDecoration: "none", letterSpacing: "0.02em",
            }}
          >
            ⚔️ {t("profileFindOpponent")}
          </a>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "52px 20px 40px" }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>⚔️</div>
          <p style={{ color: "#555", fontSize: 14, fontWeight: 800, margin: "0 0 6px" }}>
            {t("profileNoFightRecord")}
          </p>
          <p style={{ color: "#333", fontSize: 12, margin: "0 0 20px" }}>
            {t("profileFightRecordHint")}
          </p>
          <a
            href={`/${locale}/sparring`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 22px", borderRadius: 12,
              background: `linear-gradient(135deg, ${PURPLE}, #7c3aed)`,
              color: "#fff", fontSize: 13, fontWeight: 800,
              textDecoration: "none", letterSpacing: "0.02em",
            }}
          >
            ⚔️ {t("profileFindOpponent")}
          </a>
        </div>
      )}

      {sparringRecord !== null && (
        <div style={{
          marginTop: 14,
          background: "linear-gradient(145deg, #0a0a0a, #111)",
          border: `1px solid ${redAlpha(0.15)}`,
          borderLeft: "3px solid #C1121F",
          borderRadius: "3px 16px 16px 3px",
          padding: "18px 16px",
        }}>
          <p style={{ margin: "0 0 14px", fontSize: 9, fontWeight: 900, color: RED, letterSpacing: 2.5, textTransform: "uppercase" }}>
            🥊 {t("profileSparringRecord")}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-around", marginBottom: 14 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: RED, fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>
                {sparringRecord.totalAccepted}
              </div>
              <div style={{ fontSize: 10, color: "#555", fontWeight: 800, marginTop: 4, letterSpacing: 1 }}>
                {t("profileSparringLabel")}
              </div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.07)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: GOLD, fontFamily: "var(--font-display,'Anton',sans-serif)", lineHeight: 1 }}>
                {sparringRecord.sentPending}
              </div>
              <div style={{ fontSize: 10, color: "#555", fontWeight: 800, marginTop: 4, letterSpacing: 1 }}>
                {t("profilePendingLabel")}
              </div>
            </div>
          </div>
          {sparringRecord.totalAccepted === 0 && sparringRecord.sentPending === 0 && (
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#444", textAlign: "center" }}>
              {t("profileNoSparring")}
            </p>
          )}
          {isOwnProfile && (
            <button
              type="button"
              onClick={onGoToSparring}
              style={{
                width: "100%", padding: "11px 0", borderRadius: 11,
                background: "linear-gradient(135deg, #C1121F, #7d0812)",
                border: "none", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
              }}
            >
              {t("profileFindSparring")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
