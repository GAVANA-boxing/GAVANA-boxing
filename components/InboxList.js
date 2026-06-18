"use client";

import { useEffect, useRef, useState } from "react";
import { loc } from "@/lib/loc";
import { useRouter, usePathname } from "next/navigation";
import { collection, query, where, onSnapshot, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname } from "@/lib/i18n";
import { startConversation } from "@/lib/messaging";
import BottomNav from "@/components/BottomNav";
import { redAlpha } from "@/lib/tokens";
import { Toast, useToast } from "@/components/ui/Toast";
import { getTs } from "@/components/chat/chatUtils";
import InboxHeader from "@/components/chat/InboxHeader";
import ConversationRow from "@/components/chat/ConversationRow";
import EmptyInbox from "@/components/chat/EmptyInbox";
import ComposeSheet from "@/components/chat/ComposeSheet";

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
  const searchTimerRef = useRef(null);

  // Load conversations
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

  // Reset compose search when sheet closes
  useEffect(() => {
    if (!showCompose) {
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
            where("username", "<=", lower + ""),
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
    } catch {
      showToast(loc(locale, "Мессеж эхлүүлэхэд алдаа гарлаа.", "대화를 시작하는 데 실패했습니다.", "Failed to start conversation. Try again."));
    } finally {
      setStarting(null);
    }
  };

  const getOther = (convo) => {
    const otherId = convo.members?.find((m) => m !== user.uid);
    return { id: otherId, ...(convo.memberDetails?.[otherId] || {}) };
  };

  if (authLoading || loading) {
    return (
      <div style={s.page}>
        <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.shimmer{background:linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%);background-size:800px 100%;animation:shimmer 1.6s infinite;}`}</style>
        <div style={s.skeletonHeader}>
          <div style={{ width: 40 }} />
          <span style={s.skeletonTitle}>
            {loc(locale, "Мессеж", "메시지", "Messages")}
          </span>
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

  return (
    <div style={s.page} className="page-enter">
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}.shimmer{background:linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%);background-size:800px 100%;animation:shimmer 1.6s infinite;}@keyframes sheetUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <InboxHeader
        locale={locale}
        onBack={() => router.back()}
        onCompose={() => setShowCompose(true)}
      />

      {conversations.length === 0 ? (
        <EmptyInbox
          locale={locale}
          onFindCoach={() => router.push(`/${locale}/coach`)}
        />
      ) : (
        <div style={s.list} className="stagger-list">
          {conversations.map((convo) => {
            const other = getOther(convo);
            return (
              <ConversationRow
                key={convo.id}
                convo={convo}
                other={other}
                currentUid={user.uid}
                locale={locale}
                onClick={() => router.push(`/${locale}/inbox/${convo.id}`)}
              />
            );
          })}
        </div>
      )}

      {showCompose && (
        <ComposeSheet
          locale={locale}
          search={search}
          onSearchChange={setSearch}
          searching={searching}
          searchResults={searchResults}
          starting={starting}
          onSelect={handleStartConvo}
          onClose={() => setShowCompose(false)}
        />
      )}

      <Toast message={toast?.message} type={toast?.type} onDismiss={hideToast} />
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="alerts" />
    </div>
  );
}

const s = {
  page: { minHeight: "100dvh", background: `radial-gradient(ellipse at 50% -8%, ${redAlpha(0.08)} 0%, transparent 48%), #090909`, color: "#fff", display: "flex", flexDirection: "column", paddingBottom: "calc(88px + env(safe-area-inset-bottom))" },
  skeletonHeader: { position: "sticky", top: 0, zIndex: 20, display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", gap: 8, padding: "calc(14px + env(safe-area-inset-top)) 16px 14px", background: "rgba(9,9,9,0.94)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  skeletonTitle: { fontSize: 17, fontWeight: 950, color: "#fff", letterSpacing: -0.3, textAlign: "center" },
  list: { display: "flex", flexDirection: "column", padding: "8px 16px", gap: 8 },
};
