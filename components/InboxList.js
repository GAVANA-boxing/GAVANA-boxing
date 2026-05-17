"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";

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

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const T = {
    title:    locale === "mn" ? "Мессеж" : locale === "ko" ? "메시지" : "Messages",
    you:      locale === "mn" ? "Та: " : locale === "ko" ? "나: " : "You: ",
    start:    locale === "mn" ? "Яриа эхлүүл…" : locale === "ko" ? "대화를 시작하세요…" : "Start a conversation…",
    empty:    locale === "mn" ? "Мессеж байхгүй байна" : locale === "ko" ? "메시지가 없습니다" : "No messages yet",
    emptySub: locale === "mn" ? "Coach эсвэл Fighter-тэй холбогдохдоо тэдний profile дээрх «Мессеж» товчийг дарна уу." : locale === "ko" ? "코치나 파이터의 프로필에서 '메시지' 버튼을 눌러보세요." : "Tap the Message button on a coach or fighter's profile to start chatting.",
    findCoach: locale === "mn" ? "🎓 Coach хайх" : locale === "ko" ? "🎓 코치 찾기" : "🎓 Find a Coach",
    coach:    locale === "mn" ? "Coach" : locale === "ko" ? "코치" : "Coach",
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
      <style>{`@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} } .shimmer{background:linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%);background-size:800px 100%;animation:shimmer 1.6s infinite;}`}</style>

      {/* Header */}
      <div style={s.header}>
        <button type="button" onClick={() => router.back()} style={s.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <span style={s.title}>{T.title}</span>
        <div style={{ width: 40 }} />
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
                {/* Avatar */}
                <div style={s.avatarWrap}>
                  {other.photoURL
                    ? <img src={other.photoURL} alt="" style={{ ...s.avatar, ...(isCoach ? { border: "2px solid #D4AF37" } : {}) }} />
                    : <div style={{ ...s.avatarFallback, ...(isCoach ? { border: "2px solid #D4AF37", background: "#1a1500" } : {}) }}>
                        {(other.displayName || "?").charAt(0).toUpperCase()}
                      </div>
                  }
                  {isCoach && (
                    <div style={s.coachBadge}>🎓</div>
                  )}
                  {!isCoach && unread > 0 && <div style={s.unreadDot} />}
                </div>

                {/* Text */}
                <div style={s.rowBody}>
                  <div style={s.rowTop}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ ...s.name, ...(unread > 0 ? { color: "#fff", fontWeight: 900 } : {}) }}>
                        {other.displayName || "Fighter"}
                      </span>
                      {isCoach && (
                        <span style={s.coachTag}>{T.coach}</span>
                      )}
                    </div>
                    <span style={s.time}>{formatTime(convo.lastMessageAt, locale)}</span>
                  </div>
                  <div style={{ ...s.preview, ...(unread > 0 ? { color: "rgba(255,255,255,0.7)" } : {}) }}>
                    {convo.lastMessage
                      ? `${isMe ? T.you : ""}${convo.lastMessage}`
                      : T.start}
                  </div>
                </div>

                {unread > 0 && (
                  <div style={s.badge}>{unread > 9 ? "9+" : unread}</div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="alerts" />
    </div>
  );
}

const s = {
  page: { minHeight: "100dvh", background: "#070707", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", paddingBottom: "calc(64px + env(safe-area-inset-bottom))" },
  header: { position: "sticky", top: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(16px + env(safe-area-inset-top)) 16px 14px", background: "rgba(7,7,7,0.96)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  backBtn: { width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  title: { fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: -0.2 },
  list: { display: "flex", flexDirection: "column" },
  row: { display: "flex", alignItems: "center", gap: 13, padding: "13px 16px", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", width: "100%", textAlign: "left", WebkitTapHighlightColor: "transparent" },
  rowUnread: { background: "rgba(193,18,31,0.04)", borderBottomColor: "rgba(193,18,31,0.07)" },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatar: { width: 48, height: 48, borderRadius: "50%", objectFit: "cover", display: "block", background: "#1a1a1a" },
  avatarFallback: { width: 48, height: 48, borderRadius: "50%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#fff" },
  coachBadge: { position: "absolute", bottom: -2, right: -2, width: 18, height: 18, borderRadius: "50%", background: "#D4AF37", border: "2px solid #070707", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 },
  unreadDot: { position: "absolute", bottom: 1, right: 1, width: 11, height: 11, borderRadius: "50%", background: "#C1121F", border: "2px solid #070707" },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 },
  name: { fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", lineHeight: 1 },
  coachTag: { fontSize: 9, fontWeight: 900, color: "#D4AF37", background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 999, padding: "1px 5px", letterSpacing: 0.3 },
  time: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600, flexShrink: 0 },
  preview: { fontSize: 13, color: "rgba(255,255,255,0.38)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 },
  badge: { flexShrink: 0, minWidth: 20, height: 20, borderRadius: 999, background: "#C1121F", color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" },
  empty: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", gap: 12 },
  emptyIcon: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { margin: 0, fontSize: 17, fontWeight: 900, color: "#fff" },
  emptySub: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.38)", textAlign: "center", lineHeight: 1.6, maxWidth: 280 },
  findCoachBtn: { padding: "11px 24px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, #C1121F, #7d0812)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", marginTop: 4 },
};
