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
import { RED, GOLD } from "@/lib/tokens";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function formatMsgTime(ts) {
  const ms = getTs(ts);
  if (!ms) return "";
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function shouldShowDate(prev, curr) {
  if (!prev) return true;
  const p = new Date(getTs(prev.createdAt));
  const c = new Date(getTs(curr.createdAt));
  return p.toDateString() !== c.toDateString();
}

function formatDateLabel(ts, locale) {
  const d = new Date(getTs(ts));
  const today = new Date();
  if (d.toDateString() === today.toDateString())
    return locale === "mn" ? "Өнөөдөр" : locale === "ko" ? "오늘" : "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString())
    return locale === "mn" ? "Өчигдөр" : locale === "ko" ? "어제" : "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}

function getQuickReplies(isUserCoach, recipientIsCoach, locale) {
  if (isUserCoach) {
    return locale === "mn"
      ? ["Маш сайн ажилласан! 🥊", "Дараагийн дасгал хэзээ вэ?", "Гарын байдлаа анхаараарай", "Хурдаа нэмэгдүүл", "Footwork-оо сайжруулья"]
      : locale === "ko"
      ? ["잘 했어요! 🥊", "다음 훈련은 언제인가요?", "가드를 신경 쓰세요", "속도를 높여봐요", "풋워크를 개선해봐요"]
      : ["Great work! 🥊", "When's your next session?", "Watch your guard", "Pick up the speed", "Let's work on footwork"];
  }
  if (recipientIsCoach) {
    return locale === "mn"
      ? ["Хуваарь авах боломжтой юу?", "Хичээлийн үнэ хэд вэ?", "Анхан шатнаас эхлэх боломжтой юу?", "Онлайнаар зааж чадах уу?", "Спарринг бэлтгэлд туслаарай"]
      : locale === "ko"
      ? ["레슨 예약 가능한가요?", "수업료는 얼마인가요?", "초보도 가능한가요?", "온라인 수업 가능한가요?", "스파링 준비 도움을 주세요"]
      : ["Are you available for lessons?", "What are your rates?", "Can you train beginners?", "Do you coach online?", "Help me prep for sparring"];
  }
  return locale === "mn"
    ? ["👋 Сайн уу!", "Спарринг хийх үү?", "Challenge-д оролцох уу?", "Хэр байна?"]
    : locale === "ko"
    ? ["👋 안녕하세요!", "스파링 할래요?", "챌린지 같이 해요?", "어떻게 지내세요?"]
    : ["👋 Hey!", "Want to spar?", "Join me for a challenge?", "How's training?"];
}

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
  const inputRef = useRef(null);
  const [lastSentId, setLastSentId] = useState(null);

  const T = {
    placeholder: locale === "mn" ? "Мессеж бичих…" : locale === "ko" ? "메시지 입력…" : "Message…",
    startChat:   locale === "mn" ? "Анхны мессежээ илгээгээрэй" : locale === "ko" ? "첫 메시지를 보내보세요" : "Send your first message",
    coach:       locale === "mn" ? "Coach" : locale === "ko" ? "코치" : "Coach",
  };

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

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const handleSend = async (msgText) => {
    const trimmed = (msgText || text).trim();
    if (!trimmed || !user?.uid || !conversationId || sending) return;
    setSending(true);
    setText("");
    setShowQuickReplies(false);
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = "auto";
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
    } catch (e) {
      console.error("Send message error:", e);
      setText(trimmed);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (authLoading || loading) {
    return (
      <div style={s.page}>
        {/* Skeleton header */}
        <div style={s.header}>
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

      {/* Header */}
      <div style={s.header}>
        <button type="button" onClick={() => router.push(`/${locale}/inbox`)} style={s.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => recipientId && router.push(`/${locale}/profile/${recipientId}`)}
          style={s.headerUser}
        >
          <div style={{ position: "relative" }}>
            {recipientInfo.photoURL
              ? <img src={recipientInfo.photoURL} alt="" style={{ ...s.headerAvatar, ...(recipientIsCoach ? { border: "2px solid #D4AF37" } : {}) }} />
              : <div style={{ ...s.headerAvatarFallback, ...(recipientIsCoach ? { border: "2px solid #D4AF37", background: "#1a1500" } : {}) }}>
                  {(recipientInfo.displayName || "?").charAt(0).toUpperCase()}
                </div>
            }
            {recipientIsCoach && (
              <div style={{ position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: GOLD, border: "2px solid #070707", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7 }}>🎓</div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <span style={s.headerName}>{recipientInfo.displayName || "Fighter"}</span>
            {recipientIsCoach && (
              <span style={{ fontSize: 9, fontWeight: 900, color: GOLD, letterSpacing: 0.5 }}>{T.coach}</span>
            )}
          </div>
        </button>
        <div style={{ width: 40 }} />
      </div>

      {/* Messages */}
      <div style={s.messages}>
        {messages.length === 0 && (
          <div style={s.emptyThread}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>
              {recipientIsCoach ? "🎓" : "🥊"}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
              {T.startChat}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === user?.uid;
          const showDate = shouldShowDate(messages[i - 1] || null, msg);
          return (
            <div key={msg.id}>
              {showDate && (
                <div style={s.dateDivider}>
                  <span style={s.dateLabel}>{formatDateLabel(msg.createdAt, locale)}</span>
                </div>
              )}
              <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
                <div style={{ ...s.bubbleText, ...(isMe ? s.bubbleTextMe : s.bubbleTextThem) }}>
                  {msg.text}
                </div>
                <div style={{ ...s.bubbleTime, display: "flex", alignItems: "center", gap: 3, ...(isMe ? { justifyContent: "flex-end" } : {}) }}>
                  <span>{formatMsgTime(msg.createdAt)}</span>
                  {isMe && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={msg.id === lastSentId ? RED : "rgba(255,255,255,0.3)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Quick reply chips */}
      {showQuickReplies && (
        <div style={s.quickRepliesWrap}>
          <div style={s.quickRepliesScroll}>
            {quickReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                style={s.quickChip}
                onClick={() => handleSend(reply)}
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div style={s.inputBar}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => { setText(e.target.value); if (e.target.value) setShowQuickReplies(false); }}
          onKeyDown={handleKeyDown}
          placeholder={T.placeholder}
          rows={1}
          style={s.input}
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!text.trim() || sending}
          style={{ ...s.sendBtn, opacity: text.trim() && !sending ? 1 : 0.35 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4 20-7z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const s = {
  page: { height: "100dvh", background: "#070707", color: "#fff", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(14px + env(safe-area-inset-top)) 16px 12px", background: "rgba(7,7,7,0.96)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.06)", zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  headerUser: { display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0 },
  headerAvatar: { width: 34, height: 34, borderRadius: "50%", objectFit: "cover", display: "block" },
  headerAvatarFallback: { width: 34, height: 34, borderRadius: "50%", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" },
  headerName: { fontSize: 15, fontWeight: 900, color: "#fff" },
  messages: { flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 2 },
  emptyThread: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 8 },
  dateDivider: { display: "flex", alignItems: "center", justifyContent: "center", padding: "12px 0" },
  dateLabel: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.04)", padding: "3px 10px", borderRadius: 999, letterSpacing: 0.4 },
  bubble: { display: "flex", flexDirection: "column", maxWidth: "75%", marginBottom: 4 },
  bubbleMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubbleThem: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubbleText: { padding: "10px 14px", borderRadius: 18, fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" },
  bubbleTextMe: { background: "linear-gradient(135deg, #C1121F, #8f0d17)", color: "#fff", borderBottomRightRadius: 4, boxShadow: "0 4px 16px rgba(193,18,31,0.3)" },
  bubbleTextThem: { background: "rgba(255,255,255,0.07)", color: "#fff", borderBottomLeftRadius: 4, border: "1px solid rgba(255,255,255,0.07)" },
  bubbleTime: { fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 3, padding: "0 4px", fontWeight: 600 },
  quickRepliesWrap: { flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(7,7,7,0.97)" },
  quickRepliesScroll: { display: "flex", gap: 8, overflowX: "auto", padding: "10px 14px", scrollbarWidth: "none" },
  quickChip: { flexShrink: 0, padding: "7px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  inputBar: { flexShrink: 0, display: "flex", alignItems: "flex-end", gap: 10, padding: "10px 14px calc(10px + env(safe-area-inset-bottom))", background: "rgba(7,7,7,0.97)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderTop: "1px solid rgba(255,255,255,0.06)" },
  input: { flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, padding: "11px 16px", color: "#fff", fontSize: 14, lineHeight: 1.4, outline: "none", resize: "none", fontFamily: "system-ui, sans-serif", maxHeight: 120, overflowY: "auto" },
  sendBtn: { flexShrink: 0, width: 44, height: 44, borderRadius: "50%", border: "none", background: "linear-gradient(135deg, #C1121F, #8f0d17)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 16px rgba(193,18,31,0.35)" },
};
