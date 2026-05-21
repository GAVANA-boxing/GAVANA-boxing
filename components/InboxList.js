"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { collection, query, where, onSnapshot, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname } from "@/lib/i18n";
import { startConversation } from "@/lib/messaging";
import BottomNav from "@/components/BottomNav";
import { RED, GOLD , redAlpha, goldAlpha} from "@/lib/tokens";
import Image from "next/image";
import { Toast, useToast } from "@/components/ui/Toast";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function formatTime(ts, locale) {
  const ms = getTs(ts);
  if (!ms) return "";
  const diff = Date.now() - ms;
  if (diff < 60000) return locale === "mn" ? "Одоо" : locale === "ko" ? "방금" : "Now";
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000);
    return locale === "mn" ? `${m}м` : locale === "ko" ? `${m}분` : `${m}m`;
  }
  if (diff < 86400000) {
    const h = Math.floor(diff / 3600000);
    return locale === "mn" ? `${h}ц` : locale === "ko" ? `${h}시간` : `${h}h`;
  }
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function InboxList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);

  const { toast, showToast, hideToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState(null);
  const searchRef = useRef(null);
  const searchTimerRef = useRef(null);

  const T = {
    title:    locale === "mn" ? "Мессеж" : locale === "ko" ? "메시지" : "Messages",
    you:      locale === "mn" ? "Та: " : locale === "ko" ? "나: " : "You: ",
    start:    locale === "mn" ? "Яриа эхлүүл…" : locale === "ko" ? "대화를 시작하세요…" : "Start a conversation…",
    empty:    locale === "mn" ? "Мессеж байхгүй байна" : locale === "ko" ? "메시지가 없습니다" : "No messages yet",
    emptySub: locale === "mn" ? "Coach эсвэл Fighter-тэй холбогдохдоо тэдний profile дээрх «Мессеж» товчийг дарна уу." : locale === "ko" ? "코치나 파이터의 프로필에서 '메시지' 버튼을 눌러보세요." : "Tap the Message button on a coach or fighter's profile to start chatting.",
    findCoach: locale === "mn" ? "🎓 Coach хайх" : locale === "ko" ? "🎓 코치 찾기" : "🎓 Find a Coach",
    coach:    locale === "mn" ? "Coach" : locale === "ko" ? "코치" : "Coach",
    newMsg:   locale === "mn" ? "Шинэ мессеж" : locale === "ko" ? "새 메시지" : "New Message",
    searchPlaceholder: locale === "mn" ? "Username хайх…" : locale === "ko" ? "유저 검색…" : "Search by username…",
    noResults: locale === "mn" ? "Хэрэглэгч олдсонгүй" : locale === "ko" ? "사용자를 찾을 수 없습니다" : "No users found",
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { router.replace(`/${locale}/login`); return; }

    const q = query(collection(db, "conversations"), where("members", "array-contains", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const convos = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => getTs(b.lastMessageAt) - getTs(a.lastMessageAt));
      setConversations(convos);
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, [authLoading, user?.uid, locale, router]);

  // Focus search input when compose opens
  useEffect(() => {
    if (showCompose) {
      setTimeout(() => searchRef.current?.focus(), 80);
    } else {
      setSearch("");
      setSearchResults([]);
    }
  }, [showCompose]);

  // Debounced user search
  useEffect(() => {
    clearTimeout(searchTimerRef.current);
    if (!search.trim()) { setSearchResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const lower = search.trim().toLowerCase();
        const snap = await getDocs(
          query(
            collection(db, "users"),
            where("username", ">=", lower),
            where("username", "<=", lower + ""),
            limit(12)
          )
        );
        const results = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.id !== user.uid);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 320);
    return () => clearTimeout(searchTimerRef.current);
  }, [search, user?.uid]);

  const handleStartConvo = async (recipient) => {
    if (starting) return;
    setStarting(recipient.id);
    try {
      const convoId = await startConversation(user, recipient.id, {
        displayName: recipient.displayName || recipient.username || "",
        photoURL: recipient.photoURL || recipient.profileImageUrl || "",
      });
      setShowCompose(false);
      router.push(`/${locale}/inbox/${convoId}`);
    } catch (e) {
      showToast(locale === "mn" ? "Мессеж эхлүүлэхэд алдаа гарлаа." : locale === "ko" ? "대화를 시작하는 데 실패했습니다." : "Failed to start conversation. Try again.");
    } finally {
      setStarting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={{ width: 40 }} />
          <span style={s.title}>{T.title}</span>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "8px 0" }}>
              <div className="shimmer" style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
                <div className="shimmer" style={{ height: 13, width: "55%", borderRadius: 6, background: "rgba(255,255,255,0.06)" }} />
                <div className="shimmer" style={{ height: 11, width: "80%", borderRadius: 6, background: "rgba(255,255,255,0.04)" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getOther = (convo) => {
    const otherId = convo.members?.find((m) => m !== user.uid);
    return { id: otherId, ...(convo.memberDetails?.[otherId] || {}) };
  };

  return (
    <div style={s.page}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.shimmer{background:linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%);background-size:800px 100%;animation:shimmer 1.6s infinite;}@keyframes sheetUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={s.header}>
        <button type="button" onClick={() => router.back()} style={s.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span style={s.title}>{T.title}</span>
        <button type="button" aria-label="New message" onClick={() => setShowCompose(true)} style={s.composeBtn} title={T.newMsg}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
      </div>

      {/* List */}
      {conversations.length === 0 ? (
        <div style={s.empty}>
          <div style={s.emptyIcon}>💬</div>
          <p style={s.emptyTitle}>{T.empty}</p>
          <p style={s.emptySub}>{T.emptySub}</p>
          <button type="button" style={s.findCoachBtn} onClick={() => router.push(`/${locale}/coach`)}>
            {T.findCoach}
          </button>
        </div>
      ) : (
        <div style={s.list}>
          {conversations.map((convo) => {
            const other = getOther(convo);
            const isCoach = other.isCoach || other.coachVerified;
            const unread = convo.unreadCount?.[user.uid] || 0;
            const isMe = convo.lastMessageSenderId === user.uid;
            return (
              <button
                key={convo.id}
                type="button"
                onClick={() => router.push(`/${locale}/inbox/${convo.id}`)}
                style={{ ...s.row, ...(unread > 0 ? s.rowUnread : {}) }}
              >
                <div style={s.avatarWrap}>
                  {other.photoURL
                    ? <Image src={other.photoURL} alt="" width={52} height={52} style={{ borderRadius: "50%", objectFit: "cover", ...(isCoach ? { border: `2px solid ${GOLD}` } : {}) }} />
                    : <div style={{ ...s.avatarFallback, ...(isCoach ? { border: `2px solid ${GOLD}`, background: "#1a1500" } : {}) }}>
                        {(other.displayName || "?").charAt(0).toUpperCase()}
                      </div>
                  }
                  {isCoach && <div style={s.coachBadge}>🎓</div>}
                  {!isCoach && unread > 0 && <div style={s.unreadDot} />}
                </div>

                <div style={s.rowBody}>
                  <div style={s.rowTop}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ ...s.name, ...(unread > 0 ? { color: "#fff", fontWeight: 900 } : {}) }}>
                        {other.displayName || "Fighter"}
                      </span>
                      {isCoach && <span style={s.coachTag}>{T.coach}</span>}
                    </div>
                    <span style={s.time}>{formatTime(convo.lastMessageAt, locale)}</span>
                  </div>
                  <div style={{ ...s.preview, ...(unread > 0 ? { color: "rgba(255,255,255,0.7)" } : {}) }}>
                    {convo.lastMessage ? `${isMe ? T.you : ""}${convo.lastMessage}` : T.start}
                  </div>
                </div>

                {unread > 0 && <div style={s.badge}>{unread > 9 ? "9+" : unread}</div>}
              </button>
            );
          })}
        </div>
      )}

      {/* Compose sheet */}
      {showCompose && (
        <div style={s.composeOverlay} onClick={() => setShowCompose(false)}>
          <div style={s.composeSheet} onClick={(e) => e.stopPropagation()}>
            <div style={s.composeHandle} />
            <div style={s.composeHeader}>
              <span style={s.composeTitle}>{T.newMsg}</span>
              <button type="button" aria-label="Close" onClick={() => setShowCompose(false)} style={s.composeClose}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div style={s.composeSearchWrap}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={T.searchPlaceholder}
                style={s.composeSearch}
              />
              {searching && <div style={s.searchSpinner} />}
            </div>

            <div style={s.composeResults}>
              {!search.trim() && (
                <p style={s.composeHint}>
                  {locale === "mn" ? "Username оруулж хэрэглэгч хайна уу" : locale === "ko" ? "유저명을 입력하세요" : "Type a username to find fighters and coaches"}
                </p>
              )}
              {search.trim() && !searching && searchResults.length === 0 && (
                <p style={s.composeHint}>{T.noResults}</p>
              )}
              {searchResults.map((u) => {
                const isCoach = u.isCoach || u.coachVerified;
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={!!starting}
                    onClick={() => handleStartConvo(u)}
                    style={s.composeUserRow}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {u.photoURL || u.profileImageUrl
                        ? <Image src={u.photoURL || u.profileImageUrl} alt="" width={42} height={42} style={{ borderRadius: "50%", objectFit: "cover", border: isCoach ? "2px solid #D4AF37" : "none" }} />
                        : <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#1a1a1a", border: isCoach ? "2px solid #D4AF37" : "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#fff" }}>
                            {(u.displayName || u.username || "?").charAt(0).toUpperCase()}
                          </div>
                      }
                    </div>
                    <div style={{ flex: 1, textAlign: "left" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{u.displayName || u.username}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>
                        @{u.username}{isCoach ? ` · ${T.coach}` : ""}
                      </div>
                    </div>
                    {starting === u.id
                      ? <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>…</span>
                      : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
                    }
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onDismiss={hideToast} />
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="alerts" />
    </div>
  );
}

const s = {
  page: { minHeight: "100dvh", background: "#0B0B0C", color: "#fff", display: "flex", flexDirection: "column", paddingBottom: "calc(88px + env(safe-area-inset-bottom))" },
  header: { position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(16px + env(safe-area-inset-top)) 16px 14px", background: "rgba(7,7,7,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  backBtn: { width: 40, height: 40, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  composeBtn: { width: 40, height: 40, borderRadius: 12, border: `1px solid ${redAlpha(0.45)}`, background: `${redAlpha(0.12)}`, color: RED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  title: { fontSize: 17, fontWeight: 950, color: "#fff", letterSpacing: -0.3 },
  list: { display: "flex", flexDirection: "column", padding: "8px 0" },
  row: { display: "flex", alignItems: "center", gap: 13, padding: "11px 16px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.035)", cursor: "pointer", width: "100%", textAlign: "left", WebkitTapHighlightColor: "transparent", transition: "background 120ms ease" },
  rowUnread: { background: `${redAlpha(0.06)}`, borderBottomColor: `${redAlpha(0.08)}` },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: { width: 52, height: 52, borderRadius: "50%", objectFit: "cover", display: "block", background: "#1a1a1a" },
  avatarFallback: { width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(145deg, ${redAlpha(0.6)}, #1a1a1a)`, border: `1px solid ${redAlpha(0.3)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: "#fff" },
  coachBadge: { position: "absolute", bottom: -2, right: -2, width: 20, height: 20, borderRadius: "50%", background: GOLD, border: "2px solid #0B0B0C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 },
  unreadDot: { position: "absolute", bottom: 1, right: 1, width: 12, height: 12, borderRadius: "50%", background: RED, border: "2px solid #0B0B0C", boxShadow: `0 0 6px ${redAlpha(0.8)}` },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  name: { fontSize: 14, fontWeight: 750, color: "rgba(255,255,255,0.82)", lineHeight: 1 },
  coachTag: { fontSize: 9, fontWeight: 900, color: GOLD, background: `${goldAlpha(0.12)}`, border: `1px solid ${goldAlpha(0.35)}`, borderRadius: 999, padding: "2px 6px", letterSpacing: 0.3 },
  time: { fontSize: 11, color: "rgba(255,255,255,0.28)", fontWeight: 600, flexShrink: 0 },
  preview: { fontSize: 13, color: "rgba(255,255,255,0.36)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 },
  badge: { flexShrink: 0, minWidth: 22, height: 22, borderRadius: 999, background: `linear-gradient(135deg, ${RED}, #7d0812)`, color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", boxShadow: `0 2px 8px ${redAlpha(0.5)}` },
  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", gap: 12 },
  emptyIcon: { fontSize: 56, marginBottom: 6, filter: `drop-shadow(0 4px 16px ${redAlpha(0.4)})` },
  emptyTitle: { margin: 0, fontSize: 18, fontWeight: 950, color: "#fff" },
  emptySub: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.38)", textAlign: "center", lineHeight: 1.65, maxWidth: 270 },
  findCoachBtn: { padding: "12px 26px", borderRadius: 999, border: "none", background: `linear-gradient(135deg, ${RED}, #7d0812)`, color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", marginTop: 6, boxShadow: `0 6px 20px ${redAlpha(0.35)}` },
  // Compose sheet
  composeOverlay: { position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "flex-end" },
  composeSheet: { width: "100%", maxHeight: "85dvh", background: "#0f0f0f", borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none", display: "flex", flexDirection: "column", animation: "sheetUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards", paddingBottom: "env(safe-area-inset-bottom)" },
  composeHandle: { width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)", margin: "12px auto 0" },
  composeHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px" },
  composeTitle: { fontSize: 15, fontWeight: 950, color: "#fff" },
  composeClose: { width: 32, height: 32, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  composeSearchWrap: { display: "flex", alignItems: "center", gap: 10, margin: "0 16px 6px", padding: "11px 14px", borderRadius: 14, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" },
  composeSearch: { flex: 1, background: "none", border: "none", outline: "none", color: "#fff", fontSize: 14 },
  searchSpinner: { width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", borderTopColor: "rgba(255,255,255,0.6)", animation: "spin 0.7s linear infinite", flexShrink: 0 },
  composeResults: { flex: 1, overflowY: "auto", padding: "4px 0 12px" },
  composeHint: { margin: "24px 0", fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center" },
  composeUserRow: { display: "flex", alignItems: "center", gap: 12, padding: "11px 18px", width: "100%", background: "none", border: "none", cursor: "pointer", WebkitTapHighlightColor: "transparent" },
};
