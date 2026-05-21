"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { useSparringActions } from "@/hooks/useSparringActions";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import BottomNav from "@/components/BottomNav";
import { RED, GOLD, redAlpha } from "@/lib/tokens";
import PageTopBar from "@/components/PageTopBar";
import s, { c } from "@/components/sparring/sparringStyles";
import { FighterCard, IncomingRequestCard } from "@/components/sparring/SparringCards";
import { formatAgo } from "@/lib/utils";
import { useSparringData } from "@/hooks/useSparringData";
import Image from "next/image";
import { Toast, useToast } from "@/components/ui/Toast";
import { HUDCard } from "@/components/ui";

const ARCHETYPE_KEYS = ["all", "pressure", "counter", "technical", "brawler"];
const WEIGHT_OPTS = ["all", "-54", "-60", "-67", "-75", "-81", "+91"];

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
    <div style={s.page} className="page-enter">

      <PageTopBar
        kicker="COMBAT · SPARRING"
        title={locale === "mn" ? "СПАРРИНГ" : locale === "ko" ? "스파링" : "SPARRING"}
        user={user}
        currentLocale={locale}
        showBack
      />

      {/* Tab bar */}
      <div style={s.tabBar}>
        {[
          { key: "discover", label: locale === "mn" ? "🥊 Хайх"   : locale === "ko" ? "🥊 탐색"   : "🥊 Discover" },
          { key: "requests", label: locale === "mn" ? "📬 Хүсэлт" : locale === "ko" ? "📬 요청"   : "📬 Requests", badge: pendingIncoming.length },
          { key: "mine",     label: locale === "mn" ? "👤 Миний"   : locale === "ko" ? "👤 내 게시물" : "👤 Mine" },
          { key: "history",  label: locale === "mn" ? "📊 Түүх"   : locale === "ko" ? "📊 기록"   : "📊 History" },
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
                    {key === "all" ? (locale === "mn" ? "Бүгд" : locale === "ko" ? "전체" : "All") : `${arch?.emoji} ${arch?.name.split(" ")[0]}`}
                  </button>
                );
              })}
            </div>
            <select value={filterWeight} onChange={(e) => setFilterWeight(e.target.value)} style={s.weightSelect}>
              {WEIGHT_OPTS.map((w) => (
                <option key={w} value={w}>{w === "all" ? (locale === "mn" ? "Жингийн ангилал — Бүгд" : locale === "ko" ? "체급 — 전체" : "Weight Class — All") : w}</option>
              ))}
            </select>
          </div>

          <div style={s.countBar}>
            <span style={s.countTxt}>
              {filtered.length === 0
                ? (locale === "mn" ? "Sparring хайж байгаа тулаанч байхгүй" : locale === "ko" ? "스파링 중인 선수 없음" : "No fighters looking for sparring")
                : locale === "mn" ? `${filtered.length} тулаанч sparring хайж байна` : locale === "ko" ? `${filtered.length}명 스파링 중` : `${filtered.length} fighter${filtered.length > 1 ? "s" : ""} looking for sparring`}
            </span>
          </div>

          <div style={s.list}>
            {filtered.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 52, marginBottom: 8 }}>🥊</div>
                <p style={s.emptyTitle}>
                  {filterArchetype !== "all" || filterWeight !== "all"
                    ? (locale === "mn" ? "Энэ filter-тэй тулаанч алга" : locale === "ko" ? "해당 필터에 선수 없음" : "No fighters match this filter")
                    : (locale === "mn" ? "Одоогоор хэн ч sparring хайж байхгүй" : locale === "ko" ? "현재 스파링 파트너를 찾는 선수가 없습니다" : "No one looking for sparring yet")}
                </p>
                <p style={s.emptySub}>
                  {locale === "mn" ? `"Миний" табаас өөрийгөө бүртгүүлэх боломжтой.` : locale === "ko" ? `"내 게시물" 탭에서 본인을 등록하세요.` : `Go to "Mine" tab to add yourself.`}
                </p>
              </div>
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
              { key: "received", label: locale === "mn" ? "📬 Ирсэн" : locale === "ko" ? "📬 받은" : "📬 Received", count: pendingIncoming.length },
              { key: "sent",     label: locale === "mn" ? "📤 Илгээсэн" : locale === "ko" ? "📤 보낸" : "📤 Sent", count: sentRequests.filter((r) => r.status === "pending").length },
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
                  <span style={{ minWidth: 16, height: 16, borderRadius: 999, background: RED, color: "#fff", fontSize: 9, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {!user ? (
            <div style={s.empty}>
              <p style={s.emptyTitle}>{locale === "mn" ? "Нэвтрэх шаардлагатай" : locale === "ko" ? "로그인이 필요합니다" : "Login required"}</p>
            </div>
          ) : requestsSubTab === "received" ? (
            pendingIncoming.length === 0 && resolvedIncoming.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📬</div>
                <p style={s.emptyTitle}>{locale === "mn" ? "Хүсэлт ирээгүй байна" : locale === "ko" ? "받은 요청 없음" : "No requests received"}</p>
                <p style={s.emptySub}>{locale === "mn" ? "Sparring post идэвхжүүлэхэд хүсэлтүүд энд гарч ирнэ." : locale === "ko" ? "스파링 게시물을 활성화하면 요청이 여기에 표시됩니다." : "Enable your sparring post and requests will appear here."}</p>
              </div>
            ) : (
              <>
                {pendingIncoming.length > 0 && (
                  <>
                    <div style={s.sectionLabel}>
                      {locale === "mn" ? "⏳ Хүлээгдэж байгаа хүсэлтүүд" : locale === "ko" ? "⏳ 대기 중인 요청" : "⏳ Pending requests"}
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
                      {locale === "mn" ? "Дууссан хүсэлтүүд" : locale === "ko" ? "처리된 요청" : "Resolved requests"}
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
                                  {ago && <div style={{ fontSize: 10, color: "#666", marginTop: 2 }}>🕐 {ago}</div>}
                                </div>
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 900, color: col }}>
                                {isAccepted ? (locale === "mn" ? "✓ Зөвшөөрсөн" : locale === "ko" ? "✓ 수락됨" : "✓ Accepted") : (locale === "mn" ? "✕ Татгалзсан" : locale === "ko" ? "✕ 거절됨" : "✕ Declined")}
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
                <div style={{ fontSize: 48, marginBottom: 8 }}>📤</div>
                <p style={s.emptyTitle}>{locale === "mn" ? "Илгээсэн хүсэлт байхгүй" : locale === "ko" ? "보낸 요청 없음" : "No requests sent"}</p>
                <p style={s.emptySub}>{locale === "mn" ? "Discover табаас тулаанч олж sparring хүсэлт илгээгээрэй." : locale === "ko" ? "탐색 탭에서 파이터를 찾아 스파링 요청을 보내세요." : "Find fighters in the Discover tab and send sparring requests."}</p>
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
                              {locale === "mn" ? "Sparring хүсэлт илгээсэн" : locale === "ko" ? "스파링 요청 보냄" : "Sparring request sent"}
                            </div>
                            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                              <span style={{ fontSize: 11, fontWeight: 800, color: col }}>
                                {isAccepted ? (locale === "mn" ? "✓ Зөвшөөрсөн" : locale === "ko" ? "✓ 수락됨" : "✓ Accepted")
                                  : isPending ? (locale === "mn" ? "⏳ Хүлээгдэж байна" : locale === "ko" ? "⏳ 대기 중" : "⏳ Pending")
                                  : (locale === "mn" ? "✕ Татгалзсан" : locale === "ko" ? "✕ 거절됨" : "✕ Declined")}
                              </span>
                              {ago && <span style={{ fontSize: 10, color: "#666" }}>· {ago}</span>}
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
                              {isBusy ? "…" : (locale === "mn" ? "Цуцлах" : locale === "ko" ? "취소" : "Cancel")}
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
              <div style={{ ...s.toggleBanner, background: isOn ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.03)", borderColor: isOn ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.07)" }}>
                <div style={s.toggleLeft}>
                  <div style={{ ...s.toggleDot, background: isOn ? "#34D399" : "rgba(255,255,255,0.2)", boxShadow: isOn ? "0 0 8px #34D399" : "none" }} />
                  <div>
                    <div style={{ ...s.toggleTitle, color: isOn ? "#34D399" : "rgba(255,255,255,0.7)" }}>
                      {isOn
                        ? (locale === "mn" ? "Та sparring хайж байна" : locale === "ko" ? "스파링 파트너 찾는 중" : "You're looking for sparring")
                        : (locale === "mn" ? "Sparring хайж байна уу?" : locale === "ko" ? "스파링 파트너를 찾고 있나요?" : "Looking for a sparring partner?")}
                    </div>
                    <div style={s.toggleSub}>
                      {isOn
                        ? (locale === "mn" ? "Бусад тулаанчид таны бичлэгийг харж хүсэлт илгээх боломжтой" : locale === "ko" ? "다른 선수들이 요청을 보낼 수 있습니다" : "Other fighters can see your post and send requests")
                        : (locale === "mn" ? "Идэвхжүүлбэл тулаанчид чамайг харна" : locale === "ko" ? "활성화하면 선수들이 볼 수 있습니다" : "Enable to let fighters find you")}
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
                  {toggling ? "…" : isOn
                    ? (locale === "mn" ? "Унтраах" : locale === "ko" ? "비활성화" : "Disable")
                    : (locale === "mn" ? "Идэвхжүүлэх" : locale === "ko" ? "활성화" : "Activate")}
                </button>
              </div>
            </div>
          )}

          {/* Own post preview */}
          {myPost && (
            <div style={{ padding: "8px 16px 0" }}>
              <div style={{ ...s.sectionLabel, marginBottom: 8 }}>
                {locale === "mn" ? "Таны зарлал" : locale === "ko" ? "내 게시물" : "Your listing"}
              </div>
              <FighterCard post={myPost} isMe onRequest={() => {}} sent={false} requesting={null} locale={locale} />
            </div>
          )}

          {!user && (
            <div style={s.empty}>
              <p style={s.emptyTitle}>{locale === "mn" ? "Нэвтрэх шаардлагатай" : locale === "ko" ? "로그인이 필요합니다" : "Login required"}</p>
            </div>
          )}

          {user && !myPost && (
            <div style={{ padding: "20px 16px 0" }}>
              <div style={{ textAlign: "center", padding: "32px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.1)" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🥊</div>
                <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 900, color: "#fff" }}>
                  {locale === "mn" ? "Post идэвхгүй байна" : locale === "ko" ? "게시물이 비활성화됨" : "Your post is inactive"}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.55 }}>
                  {locale === "mn" ? "Дээрх товчийг дарж зарлалаа нийтлээрэй." : locale === "ko" ? "위 버튼을 눌러 게시물을 등록하세요." : "Press the button above to publish your listing."}
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
              <div style={{ fontSize: 48, marginBottom: 8 }}>📊</div>
              <p style={s.emptyTitle}>{locale === "mn" ? "Тулааны түүх байхгүй" : locale === "ko" ? "매치 기록 없음" : "No match history yet"}</p>
              <p style={s.emptySub}>{locale === "mn" ? "PvP тулааны дараа энд гарч ирнэ" : locale === "ko" ? "PvP 매치 후 여기에 표시됩니다" : "Complete PvP training sessions to build your history"}</p>
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
                      { label: locale === "mn" ? "Нийт" : locale === "ko" ? "총" : "Matches", value: total, color: "#fff" },
                      { label: locale === "mn" ? "Ялалт" : locale === "ko" ? "승리" : "Wins", value: wins, color: "#34D399" },
                      { label: locale === "mn" ? "Ялалт %" : locale === "ko" ? "승률" : "Win rate", value: `${winPct}%`, color: GOLD },
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
                        vs {match.opponentName || "Opponent"}
                      </div>
                      <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#888", flexWrap: "wrap" }}>
                        <span style={{ color: col, fontWeight: 800 }}>{won ? (locale === "mn" ? "✓ Ялалт" : locale === "ko" ? "✓ 승리" : "✓ Win") : (locale === "mn" ? "✕ Ялагдлт" : locale === "ko" ? "✕ 패배" : "✕ Loss")}</span>
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
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="reels" />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

