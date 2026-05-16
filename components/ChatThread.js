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

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function formatMsgTime(ts) {
  const ms = getTs(ts);
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function shouldShowDate(prev, curr) {
  if (!prev) return true;
  const p = new Date(getTs(prev.createdAt));
  const c = new Date(getTs(curr.createdAt));
  return p.toDateString() !== c.toDateString();
}

function formatDateLabel(ts) {
  const d = new Date(getTs(ts));
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Өнөөдөр";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Өчигдөр";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
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
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

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

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !user?.uid || !conversationId || sending) return;
    setSending(true);
    setText("");
    try {
      await addDoc(collection(db, "messages"), {
        conversationId,
        senderId: user.uid,
        text: trimmed,
        createdAt: serverTimestamp(),
        read: false,
      });
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
      <div style={s.loadWrap}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s.spinner} />
      </div>
    );
  }

  return (
    <div style={s.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
          {recipientInfo.photoURL
            ? <img src={recipientInfo.photoURL} alt="" style={s.headerAvatar} />
            : <div style={s.headerAvatarFallback}>{(recipientInfo.displayName || "?").charAt(0).toUpperCase()}</div>
          }
          <span style={s.headerName}>{recipientInfo.displayName || "Fighter"}</span>
        </button>
        <div style={{ width: 40 }} />
      </div>

      {/* Messages */}
      <div style={s.messages}>
        {messages.length === 0 && (
          <div style={s.emptyThread}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🥊</div>
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
              Яриа эхлүүл — анхны мессежээ илгээгээрэй.
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
                  <span style={s.dateLabel}>{formatDateLabel(msg.createdAt)}</span>
                </div>
              )}
              <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
                <div style={{ ...s.bubbleText, ...(isMe ? s.bubbleTextMe : s.bubbleTextThem) }}>
                  {msg.text}
                </div>
                <div style={{ ...s.bubbleTime, ...(isMe ? { textAlign: "right" } : {}) }}>
                  {formatMsgTime(msg.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={s.inputBar}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Мессеж бичих..."
          rows={1}
          style={s.input}
        />
        <button
          type="button"
          onClick={handleSend}
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
  page: {
    height: "100dvh",
    background: "#070707",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  loadWrap: {
    height: "100dvh",
    background: "#070707",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 26,
    height: 26,
    border: "2px solid #C1121F",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  header: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "calc(14px + env(safe-area-inset-top)) 16px 12px",
    background: "rgba(7,7,7,0.96)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.7)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerUser: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    objectFit: "cover",
    display: "block",
  },
  headerAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#1a1a1a",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 900,
    color: "#fff",
  },
  headerName: {
    fontSize: 15,
    fontWeight: 900,
    color: "#fff",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 16px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  emptyThread: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    gap: 8,
  },
  dateDivider: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "12px 0",
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "rgba(255,255,255,0.28)",
    background: "rgba(255,255,255,0.04)",
    padding: "3px 10px",
    borderRadius: 999,
    letterSpacing: 0.4,
  },
  bubble: {
    display: "flex",
    flexDirection: "column",
    maxWidth: "75%",
    marginBottom: 4,
  },
  bubbleMe: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  bubbleThem: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  bubbleText: {
    padding: "10px 14px",
    borderRadius: 18,
    fontSize: 14,
    lineHeight: 1.5,
    wordBreak: "break-word",
  },
  bubbleTextMe: {
    background: "linear-gradient(135deg, #C1121F, #8f0d17)",
    color: "#fff",
    borderBottomRightRadius: 4,
    boxShadow: "0 4px 16px rgba(193,18,31,0.3)",
  },
  bubbleTextThem: {
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    borderBottomLeftRadius: 4,
    border: "1px solid rgba(255,255,255,0.07)",
  },
  bubbleTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.28)",
    marginTop: 3,
    padding: "0 4px",
    fontWeight: 600,
  },
  inputBar: {
    flexShrink: 0,
    display: "flex",
    alignItems: "flex-end",
    gap: 10,
    padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
    background: "rgba(7,7,7,0.97)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  },
  input: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 22,
    padding: "11px 16px",
    color: "#fff",
    fontSize: 14,
    lineHeight: 1.4,
    outline: "none",
    resize: "none",
    fontFamily: "system-ui, sans-serif",
    maxHeight: 120,
    overflowY: "auto",
  },
  sendBtn: {
    flexShrink: 0,
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #C1121F, #8f0d17)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(193,18,31,0.35)",
  },
};
