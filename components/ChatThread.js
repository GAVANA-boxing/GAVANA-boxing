"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  collection, query, where, onSnapshot,
  addDoc, doc, updateDoc, getDoc, serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname } from "@/lib/i18n";
import { RED, redAlpha } from "@/lib/tokens";
import { getTs, getQuickReplies } from "@/components/chat/chatUtils";
import ChatThreadHeader from "@/components/chat/ChatThreadHeader";
import MessageBubble from "@/components/chat/MessageBubble";
import QuickReplies from "@/components/chat/QuickReplies";
import ChatInput from "@/components/chat/ChatInput";

export default function ChatThread({ conversationId }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);

  const [messages, setMessages] = useState([]);
  const [convo, setConvo] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const bottomRef = useRef(null);
  const [lastSentId, setLastSentId] = useState(null);

  // Load conversation metadata
  useEffect(() => {
    if (!conversationId) return;
    getDoc(doc(db, "conversations", conversationId)).then((snap) => {
      if (snap.exists()) setConvo({ id: snap.id, ...snap.data() });
    }).catch(() => {});
  }, [conversationId]);

  // Real-time messages
  useEffect(() => {
    if (!conversationId || !user?.uid) return;
    const q = query(collection(db, "messages"), where("conversationId", "==", conversationId));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => getTs(a.createdAt) - getTs(b.createdAt));
      setMessages(msgs);
      setLoading(false);
      if (msgs.length > 0) setShowQuickReplies(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [conversationId, user?.uid]);

  // Mark as read when entering thread
  useEffect(() => {
    if (!conversationId || !user?.uid) return;
    updateDoc(doc(db, "conversations", conversationId), {
      [`unreadCount.${user.uid}`]: 0,
    }).catch(() => {});
  }, [conversationId, user?.uid]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const recipientId = convo?.members?.find((m) => m !== user?.uid);
  const recipientInfo = convo?.memberDetails?.[recipientId] || {};
  const recipientIsCoach = !!(recipientInfo.isCoach || recipientInfo.coachVerified);
  const isUserCoach = !!(convo?.memberDetails?.[user?.uid]?.isCoach || convo?.memberDetails?.[user?.uid]?.coachVerified);
  const quickReplies = getQuickReplies(isUserCoach, recipientIsCoach, locale);

  const handleSend = async (msgText) => {
    const trimmed = (msgText || text).trim();
    if (!trimmed || !user?.uid || !conversationId || sending) return;
    setSending(true);
    setText("");
    setShowQuickReplies(false);
    try {
      const ref = await addDoc(collection(db, "messages"), {
        conversationId,
        senderId: user.uid,
        text: trimmed,
        createdAt: serverTimestamp(),
        read: false,
      });
      setLastSentId(ref.id);
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: trimmed,
        lastMessageAt: serverTimestamp(),
        lastMessageSenderId: user.uid,
        ...(recipientId ? { [`unreadCount.${recipientId}`]: increment(1) } : {}),
      });
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div style={s.page}>
        <style>{`@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} } .shimmer{background:linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%);background-size:800px 100%;animation:shimmer 1.6s infinite;}`}</style>
        {/* Skeleton header */}
        <div style={s.skeletonHeader}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ width: 100, height: 14, borderRadius: 6, background: "rgba(255,255,255,0.06)" }} />
          </div>
          <div style={{ width: 40 }} />
        </div>
        {/* Skeleton messages */}
        <div style={{ flex: 1, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {[{ w: "55%", side: "left" }, { w: "70%", side: "right" }, { w: "45%", side: "left" }, { w: "60%", side: "right" }].map(({ w, side }, i) => (
            <div key={i} className="shimmer" style={{ height: 42, width: w, borderRadius: 18, background: "rgba(255,255,255,0.06)", alignSelf: side === "right" ? "flex-end" : "flex-start" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{`@keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} } .shimmer{background:linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.09) 50%,rgba(255,255,255,0.04) 100%);background-size:800px 100%;animation:shimmer 1.6s infinite;}`}</style>

      <ChatThreadHeader
        locale={locale}
        recipientInfo={recipientInfo}
        recipientIsCoach={recipientIsCoach}
        onBack={() => router.push(`/${locale}/inbox`)}
        onAvatarPress={() => recipientId && router.push(`/${locale}/profile/${recipientId}`)}
      />

      {/* Messages */}
      <div style={s.messages}>
        {messages.length === 0 && (
          <div style={s.emptyThread}>
            <div style={s.emptyThreadIcon}>
              <span style={{ fontSize: 36 }}>{recipientIsCoach ? "🎓" : "🥊"}</span>
            </div>
            <p style={s.emptyThreadTitle}>{recipientInfo.displayName || "Fighter"}</p>
            <p style={s.emptyThreadSub}>
              {locale === "mn" ? "Анхны мессежээ илгээгээрэй" : locale === "ko" ? "첫 메시지를 보내보세요" : "Send your first message"}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={msg.id}
            msg={msg}
            prevMsg={messages[i - 1] || null}
            isMe={msg.senderId === user?.uid}
            lastSentId={lastSentId}
            locale={locale}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {showQuickReplies && (
        <QuickReplies
          replies={quickReplies}
          onSelect={(reply) => handleSend(reply)}
        />
      )}

      <ChatInput
        locale={locale}
        value={text}
        onChange={(val) => { setText(val); if (val) setShowQuickReplies(false); }}
        onSend={handleSend}
        sending={sending}
      />
    </div>
  );
}

const s = {
  page: { height: "100dvh", background: "#090909", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" },
  skeletonHeader: {
    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "calc(14px + env(safe-area-inset-top)) 16px 12px",
    background: "rgba(9,9,9,0.96)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  messages: { flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 2 },
  emptyThread: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 10 },
  emptyThreadIcon: {
    width: 80, height: 80, borderRadius: "50%",
    background: redAlpha(0.08), border: `1px solid ${redAlpha(0.18)}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: `0 0 40px ${redAlpha(0.1)}`, marginBottom: 4,
  },
  emptyThreadTitle: { margin: 0, fontSize: 17, fontWeight: 900, color: "#fff" },
  emptyThreadSub: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center" },
};
