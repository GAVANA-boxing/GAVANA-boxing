"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { useSparringActions } from "@/hooks/useSparringActions";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import BottomNav from "@/components/BottomNav";
import { RED, RED_DARK, GOLD, redAlpha, RADIUS} from "@/lib/tokens";
import { loc } from "@/lib/loc";
import PageTopBar from "@/components/PageTopBar";
import s, { c } from "@/components/sparring/sparringStyles";
import { FighterCard, IncomingRequestCard } from "@/components/sparring/SparringCards";
import { formatAgo } from "@/lib/utils";
import { useSparringData } from "@/hooks/useSparringData";
import Image from "next/image";
import { Toast, useToast } from "@/components/ui/Toast";
import { HUDCard } from "@/components/ui";
import SparringIntelligence from "@/components/sparring/SparringIntelligence";

const ARCHETYPE_KEYS = ["all", "pressure", "counter", "technical", "brawler"];
const WEIGHT_OPTS = ["all", "-54", "-60", "-67", "-75", "-81", "+91"];

// Demo fighters shown when no real users are available — not actionable
const DEMO_FIGHTERS = [
  { id: "demo-1", isDemo: true, userId: "demo-1", displayName: "Alex R.", archetype: "pressure", weightClass: "-67", rankKey: "rankAmateurBelt", rankColor: "#F87171", bio: "4 years boxing. Looking for technical sparring.", location: "Ulaanbaatar" },
  { id: "demo-2", isDemo: true, userId: "demo-2", displayName: "Kim S.", archetype: "counter",  weightClass: "-60", rankKey: "rankRookieGloves", rankColor: "#fff", bio: "Former national team member. Counter-punching style.", location: "Seoul" },
  { id: "demo-3", isDemo: true, userId: "demo-3", displayName: "M. Bat", archetype: "technical", weightClass: "-75", rankKey: "rankAmateurBelt", rankColor: "#F87171", bio: "Technical boxer, footwork focus. Weekend sessions only.", location: "Ulaanbaatar" },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function SparringPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);

  const [tab, setTab] = useState("discover");
  const [requestsSubTab, setRequestsSubTab] = useState("received");
  const [filterArchetype, setFilterArchetype] = useState("all");
  const [filterWeight, setFilterWeight] = useState("all");

  const {
    posts,
    myPost,
    incomingRequests,
    sentRequestToIds,
    sentRequests,
    userData,
    loading,
    matchHistory,
    historyLoading,
  } = useSparringData({ user, tab });

  const { toast, showToast, hideToast } = useToast();
  const { cancelling, toggling, requesting, accepting, declining, handleToggle, handleRequest, handleAccept, handleDecline, handleCancelSparringRequest } = useSparringActions({ user, router, locale, userData, myPost, onError: showToast });

  const filtered = posts.filter((p) => {
    if (filterArchetype !== "all" && p.archetype !== filterArchetype) return false;
    if (filterWeight !== "all" && !p.weightClass?.includes(filterWeight)) return false;
    return true;
  });

  const pendingIncoming = incomingRequests.filter((r) => r.status === "pending");
  const resolvedIncoming = incomingRequests.filter((r) => r.status !== "pending");

  if (authLoading || loading) {
    return (
      <div style={{ ...s.page, padding: "calc(60px + env(safe-area-inset-top)) 16px 16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3].map((i) => <div key={i} className="shimmer" style={{ height: 110, borderRadius: 14 }} />)}
        </div>
      </div>
    );
  }

  const isOn = !!myPost;

  return (
    <div style={s.page} className="page-enter cinematic-bg">

      <PageTopBar
        kicker="COMBAT · SPARRING"
        title={loc(locale, "СПАРРИНГ", "스파링", "SPARRING")}
        user={user}
        currentLocale={locale}
        showBack
      />

      {/* Tab bar */}
      <div style={s.tabBar}>
        {[
          { key: "discover", label: t("sparringTabDiscover") },
          { key: "requests", label: t("sparringTabRequests"), badge: pendingIncoming.length },
          { key: "mine",     label: t("sparringTabMine") },
          { key: "history",  label: t("sparringTabHistory") },
        ].map(({ key, label, badge }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            style={{ ...s.tabBtn, ...(tab === key ? s.tabBtnActive : {}) }}
          >
            {label}
            {badge > 0 && (
              <span style={s.tabBadge}>{badge > 9 ? "9+" : badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── DISCOVER TAB ── */}
      {tab === "discover" && (
        <>
          {/* Sparring Intelligence (8B) */}
          <div style={{ padding: "0 16px", maxWidth: 640, margin: "0 auto" }}>
            <SparringIntelligence user={user} locale={locale} />
          </div>

          {/* Arena live banner */}
          <div style={s.arenaBanner}>
            <div style={s.arenaBannerLeft}>
              <p style={s.arenaKicker}>⚔️ LIVE ARENA</p>
              <h2 style={s.arenaTitle}>
                {t("sparringGymFloor")}
              </h2>
              <div style={s.arenaLiveRow}>
                <span style={s.arenaLiveDot} className="live-pulse" />
                <span style={s.arenaLiveCount}>{posts.length}</span>
                <span style={s.arenaLiveSub}>
                  {t("sparringFightersActive")}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={toggling}
              style={{
                ...s.arenaToggleBtn,
                background: isOn
                  ? "rgba(52,211,153,0.12)"
                  : `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
                border: isOn ? "1px solid rgba(52,211,153,0.3)" : "none",
                color: isOn ? "#34D399" : "#fff",
                boxShadow: isOn ? "none" : `0 6px 18px ${redAlpha(0.3)}`,
                opacity: toggling ? 0.6 : 1,
              }}
            >
              {toggling ? "…" : isOn ? t("sparringStatusActive") : t("sparringStatusJoin")}
            </button>
          </div>

          {/* Filters */}
          <div style={s.filterSection}>
            <div style={s.filterRow}>
              {ARCHETYPE_KEYS.map((key) => {
                const arch = ARCHETYPE_DISPLAY[key];
                const active = filterArchetype === key;
                return (
                  <button key={key} type="button" onClick={() => setFilterArchetype(key)} style={{
                    ...s.filterChip,
                    ...(active ? { background: arch ? `${arch.color}18` : `${redAlpha(0.15)}`, border: `1px solid ${arch ? arch.color : RED}55`, color: arch ? arch.color : "#fff" } : {}),
                  }}>
                    {key === "all" ? loc(locale, "Бүгд", "전체", "All") : `${arch?.emoji} ${arch?.name.split(" ")[0]}`}
                  </button>
                );
              })}
            </div>
            <select value={filterWeight} onChange={(e) => setFilterWeight(e.target.value)} style={s.weightSelect}>
              {WEIGHT_OPTS.map((w) => (
                <option key={w} value={w}>{w === "all" ? loc(locale, "Жингийн ангилал — Бүгд", "체급 — 전체", "Weight Class — All") : w}</option>
              ))}
            </select>
          </div>

          <div style={s.countBar}>
            <span style={s.countTxt}>
              {filtered.length === 0
                ? t("sparringNoFighters")
                : loc(locale, `${filtered.length} тулаанч sparring хайж байна`, `${filtered.length}명 스파링 중`, `${filtered.length} fighter${filtered.length > 1 ? "s" : ""} looking for sparring`)}
            </span>
          </div>

          <div key={tab} style={s.list} className="section-reveal stagger-list">
            {filtered.length === 0 ? (
              filterArchetype !== "all" || filterWeight !== "all" ? (
                // Filter active + no results
                <div style={s.empty}>
                  <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>🥊</div>
                  <p style={s.emptyTitle}>{t("sparringFilterNoMatch")}</p>
                </div>
              ) : (
                // No real users — show demo fighters so the feature is understandable
                <>
                  <div style={{ padding: "12px 16px 4px", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>
                      {t("sparringDemoFighters")}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontWeight: 700 }}>
                      {t("sparringDemoHint")}
                    </span>
                  </div>
                  {DEMO_FIGHTERS.map((post) => (
                    <div key={post.id} style={{ padding: "0 16px 8px", opacity: 0.72 }}>
                      <FighterCard
                        post={post}
                        isMe={false}
                        onRequest={() => {}} // no-op for demo
                        sent={false}
                        requesting={null}
                        locale={locale}
                        isDemo
                      />
                    </div>
                  ))}
                  <p style={{ ...s.emptySub, textAlign: "center", padding: "4px 24px 8px" }}>
                    {t("sparringAddMineHint")}
                  </p>
                </>
              )
            ) : (
              filtered.map((post) => (
                <div key={post.id} style={{ padding: "0 16px 8px" }}>
                  <FighterCard
                    post={post}
                    isMe={false}
                    onRequest={handleRequest}
                    sent={sentRequestToIds.has(post.userId)}
                    requesting={requesting}
                    locale={locale}
                  />
                </div>
              ))
            )}
            <div style={{ height: "calc(24px + env(safe-area-inset-bottom))" }} />
          </div>
        </>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <div style={s.list}>
          {/* Sent / Received sub-tabs */}
          <div style={{ display: "flex", gap: 0, margin: "10px 16px 4px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
            {[
              { key: "received", label: t("sparringTabReceived"), count: pendingIncoming.length },
              { key: "sent",     label: t("sparringTabSent"), count: sentRequests.filter((r) => r.status === "pending").length },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setRequestsSubTab(key)}
                style={{
                  flex: 1, padding: "10px 8px", border: "none",
                  background: requestsSubTab === key ? `${redAlpha(0.2)}` : "transparent",
                  color: requestsSubTab === key ? "#fff" : "rgba(255,255,255,0.4)",
                  fontSize: 12, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {label}
                {count > 0 && (
                  <span style={{ minWidth: 16, height: 16, borderRadius: RADIUS.full, background: RED, color: "#fff", fontSize: 9, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {!user ? (
            <div style={s.empty}>
              <p style={s.emptyTitle}>{t("sparringLoginRequired")}</p>
            </div>
          ) : requestsSubTab === "received" ? (
            pendingIncoming.length === 0 && resolvedIncoming.length === 0 ? (
              <div style={s.empty}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>📬</div>
                <p style={s.emptyTitle}>{t("sparringReceivedEmpty")}</p>
                <p style={s.emptySub}>{t("sparringActivateHint")}</p>
              </div>
            ) : (
              <>
                {pendingIncoming.length > 0 && (
                  <>
                    <div style={s.sectionLabel}>
                      {t("sparringPendingRequests")}
                    </div>
                    {pendingIncoming.map((req) => (
                      <div key={req.id} style={{ padding: "0 16px 8px" }}>
                        <IncomingRequestCard
                          req={req}
                          onAccept={handleAccept}
                          onDecline={handleDecline}
                          accepting={accepting}
                          declining={declining}
                          locale={locale}
                        />
                      </div>
                    ))}
                  </>
                )}
                {resolvedIncoming.length > 0 && (
                  <>
                    <div style={s.sectionLabel}>
                      {t("sparringResolvedRequests")}
                    </div>
                    {resolvedIncoming.map((req) => {
                      const isAccepted = req.status === "accepted";
                      const col = isAccepted ? "#34D399" : "#F87171";
                      const ago = formatAgo(req.createdAt, locale);
                      return (
                        <div key={req.id} style={{ padding: "0 16px 8px" }}>
                          <div style={{ ...c.card, borderLeft: `2.5px solid ${col}`, opacity: 0.65 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {req.fromPhotoURL
                                  ? <Image src={req.fromPhotoURL} alt="" width={36} height={36} style={{ ...c.avatar, width: 36, height: 36 }} />
                                  : <div style={{ ...c.avatarFallback, width: 36, height: 36, fontSize: 14 }}>{(req.fromDisplayName || "?").charAt(0).toUpperCase()}</div>
                                }
                                <div>
                                  <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{req.fromDisplayName || "Fighter"}</span>
                                  {ago && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>🕐 {ago}</div>}
                                </div>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 900, color: col }}>
                                {isAccepted ? t("sparringStatusAccepted") : t("sparringStatusDeclined")}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )
          ) : (
            // Sent requests sub-tab
            sentRequests.length === 0 ? (
              <div style={s.empty}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>📤</div>
                <p style={s.emptyTitle}>{t("sparringSentEmpty")}</p>
                <p style={s.emptySub}>{t("sparringDiscoverHint")}</p>
              </div>
            ) : (
              <>
                {sentRequests.map((req) => {
                  const isPending = req.status === "pending";
                  const isAccepted = req.status === "accepted";
                  const col = isAccepted ? "#34D399" : isPending ? "#F59E0B" : "#F87171";
                  const ago = formatAgo(req.createdAt, locale);
                  const isBusy = cancelling === req.id;
                  return (
                    <div key={req.id} style={{ padding: "0 16px 8px" }}>
                      <div style={{ ...c.card, borderLeft: `2.5px solid ${col}` }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
                              {t("sparringSentRequest")}
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: col }}>
                                {isAccepted ? t("sparringStatusAccepted") : isPending ? t("sparringStatusPending") : t("sparringStatusDeclined")}
                              </span>
                              {ago && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.38)" }}>· {ago}</span>}
                            </div>
                          </div>
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => !isBusy && handleCancelSparringRequest(req)}
                              disabled={isBusy}
                              style={{
                                flexShrink: 0, padding: "7px 12px", borderRadius: 8,
                                border: "1px solid rgba(248,113,113,0.3)",
                                background: "rgba(248,113,113,0.07)",
                                color: "#F87171", fontSize: 11, fontWeight: 900,
                                cursor: isBusy ? "wait" : "pointer", opacity: isBusy ? 0.6 : 1,
                              }}
                            >
                              {isBusy ? "…" : t("sparringCancelBtn")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )
          )}
          <div style={{ height: "calc(24px + env(safe-area-inset-bottom))" }} />
        </div>
      )}

      {/* ── MINE TAB ── */}
      {tab === "mine" && (
        <div style={s.list}>
          {/* Toggle banner */}
          {user && (
            <div style={{ padding: "12px 16px 4px" }}>
              <div className="hud-corners" style={{ ...s.toggleBanner, background: isOn ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)", borderColor: isOn ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.07)" }}>
                <div style={s.toggleLeft}>
                  <div style={{ ...s.toggleDot, background: isOn ? "#34D399" : "rgba(255,255,255,0.2)", boxShadow: isOn ? "0 0 8px #34D399" : "none" }} />
                  <div>
                    <div style={{ ...s.toggleTitle, color: isOn ? "#34D399" : "rgba(255,255,255,0.7)" }}>
                      {isOn ? t("sparringLookingActive") : t("sparringLookingInactive")}
                    </div>
                    <div style={s.toggleSub}>
                      {isOn ? t("sparringVisibleDesc") : t("sparringHiddenDesc")}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggle}
                  disabled={toggling}
                  style={{
                    ...s.toggleBtn,
                    background: isOn ? "rgba(52,211,153,0.15)" : RED,
                    border: isOn ? "1px solid rgba(52,211,153,0.3)" : "none",
                    color: isOn ? "#34D399" : "#fff",
                    opacity: toggling ? 0.6 : 1,
                  }}
                >
                  {toggling ? "…" : isOn ? t("sparringDisableBtn") : t("sparringActivateBtn")}
                </button>
              </div>
            </div>
          )}

          {/* Own post preview */}
          {myPost && (
            <div style={{ padding: "8px 16px 0" }}>
              <div style={{ ...s.sectionLabel, marginBottom: 8 }}>
                {t("sparringYourListing")}
              </div>
              <FighterCard post={myPost} isMe onRequest={() => {}} sent={false} requesting={null} locale={locale} />
            </div>
          )}

          {!user && (
            <div style={s.empty}>
              <p style={s.emptyTitle}>{t("sparringLoginRequired")}</p>
            </div>
          )}

          {user && !myPost && (
            <div style={{ padding: "20px 16px 0" }}>
              <div style={{ textAlign: "center", padding: "32px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 12px" }}>🥊</div>
                <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: "#fff" }}>
                  {t("sparringListingInactive")}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>
                  {t("sparringToggleHint")}
                </p>
              </div>
            </div>
          )}

          <div style={{ height: "calc(24px + env(safe-area-inset-bottom))" }} />
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div style={{ ...s.list, padding: "8px 16px 0" }}>
          {historyLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
              {[1,2,3].map((i) => <div key={i} className="shimmer" style={{ height: 72, borderRadius: 12 }} />)}
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
      )}

      <Toast message={toast?.message} type={toast?.type} onDismiss={hideToast} />
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="sparring" />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

