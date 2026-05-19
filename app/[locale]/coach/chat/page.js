"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { getLocale, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import s from "@/components/coach/coachChatStyles";

// ─── Persona config ───────────────────────────────────────────────────────────
const PERSONAS = [
  {
    id: "drill",
    emoji: "🔥",
    color: RED,
    nameKey: "drillSergeant",
    quickKeys: ["drillQuick1", "drillQuick2", "drillQuick3"],
    greeting: {
      mn: "Бэлэн үү? Асуу.",
      ko: "준비됐어? 물어봐.",
      en: "Ready to work? Ask me.",
    },
  },
  {
    id: "zen",
    emoji: "🧘",
    color: "#3B82F6",
    nameKey: "zenMaster",
    quickKeys: ["zenQuick1", "zenQuick2", "zenQuick3"],
    greeting: {
      mn: "Амьсгалаа авч, асуугаарай.",
      ko: "숨 고르고, 물어봐.",
      en: "Breathe first. Then ask.",
    },
  },
  {
    id: "analyst",
    emoji: "📊",
    color: GOLD,
    nameKey: "analyst",
    quickKeys: ["analystQuick1", "analystQuick2", "analystQuick3"],
    greeting: {
      mn: "Өгөгдөл авъя. Асуу.",
      ko: "데이터 기반으로 분석해줄게. 물어봐.",
      en: "Let's look at the data. Ask away.",
    },
  },
];

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "12px 16px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: color,
            animation: `dotBounce 1.1s ease-in-out ${i * 0.18}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AIChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);

  const [persona, setPersona] = useState("drill");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingIdx, setStreamingIdx] = useState(-1);
  const [streamingText, setStreamingText] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const activePersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];

  useEffect(() => {
    if (user === null) router.replace(`/${locale}/login`);
  }, [user, locale, router]);

  // Load chat history for current persona
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`gavana_chat_${persona}`);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
  }, [persona]);

  // Persist messages (cap at 40 to keep storage light)
  useEffect(() => {
    if (!messages.length) return;
    try {
      localStorage.setItem(`gavana_chat_${persona}`, JSON.stringify(messages.slice(-40)));
    } catch { /* storage full */ }
  }, [messages, persona]);

  // Scroll to bottom on new messages / loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const clearSession = () => {
    setMessages([]);
    try { localStorage.removeItem(`gavana_chat_${persona}`); } catch { /* */ }
  };

  const switchPersona = (id) => {
    setPersona(id);
    // messages reload via useEffect
  };

  const sendMessage = async (overrideText) => {
    const text = (typeof overrideText === "string" ? overrideText : input).trim();
    if (!text || loading) return;
    setInput("");
    inputRef.current?.focus();

    const userMsg = { role: "user", content: text, ts: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, persona, locale }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || data.message || t("coachError");
      const newMsg = { role: "assistant", content: reply, ts: Date.now() };
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        setStreamingIdx(updated.length - 1);
        setStreamingText("");
        return updated;
      });
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("coachError"), ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  // Typewriter effect for the most recent assistant message
  useEffect(() => {
    if (streamingIdx < 0) return;
    const fullText = messages[streamingIdx]?.content || "";
    if (streamingText.length >= fullText.length) {
      setStreamingIdx(-1);
      return;
    }
    const delay = fullText.length > 200 ? 10 : 18;
    const timer = setTimeout(() => {
      setStreamingText(fullText.slice(0, streamingText.length + 1));
    }, delay);
    return () => clearTimeout(timer);
  }, [streamingIdx, streamingText, messages]);

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = activePersona.quickKeys.map((k) => t(k));

  const hasDrillContent = (text) => {
    const lower = text.toLowerCase();
    return /drill|×|mins|minutes|rounds|session|sets|reps|jab|combo|shadow|heavy bag/.test(lower);
  };

  const addToCalendar = (text) => {
    const now = new Date();
    const start = new Date(now.getTime() + 86400000);
    const end = new Date(start.getTime() + 3600000);
    const fmt = (d) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const summary = "GAVANA Training";
    const desc = text.replace(/\n/g, "\\n").slice(0, 200);
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0",
      "BEGIN:VEVENT",
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${desc}`,
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "training.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:0.5} 50%{opacity:0} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
      `}</style>
      {/* ── Header ── */}
      <div style={s.header}>
        <button type="button" style={s.backBtn} onClick={() => router.back()} aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div style={s.headerCenter}>
          <div style={{ ...s.headerDot, background: activePersona.color }} />
          <span style={s.headerTitle}>{t(activePersona.nameKey)}</span>
          <span style={{ ...s.headerAiBadge, color: activePersona.color, borderColor: activePersona.color + "44" }}>
            AI
          </span>
        </div>

        <button type="button" style={s.clearBtn} onClick={clearSession}>
          {t("coachClearChat")}
        </button>
      </div>

      {/* ── Persona selector ── */}
      <div style={s.personaRow}>
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => switchPersona(p.id)}
            style={{
              ...s.personaChip,
              ...(persona === p.id
                ? { background: p.color + "20", borderColor: p.color + "80", color: "#fff", fontWeight: 900 }
                : {}),
            }}
          >
            {p.emoji} {t(p.nameKey)}
          </button>
        ))}
      </div>

      {/* ── Messages ── */}
      <div style={s.messages}>
        {messages.length === 0 && !loading && (
          <div style={s.emptyWrap}>
            <div style={{ ...s.coachAvatar, borderColor: activePersona.color + "55", background: activePersona.color + "15" }}>
              <span style={{ fontSize: 32 }}>{activePersona.emoji}</span>
            </div>
            <p style={s.greeting}>{activePersona.greeting[locale] || activePersona.greeting.en}</p>
            <div style={s.quickGrid}>
              {quickActions.map((qa) => (
                <button key={qa} type="button" style={s.quickChip} onClick={() => sendMessage(qa)}>
                  {qa}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isStreaming = msg.role === "assistant" && i === streamingIdx;
          const displayText = isStreaming ? streamingText : msg.content;
          const isLastAI = msg.role === "assistant" && i === messages.length - 1 && !loading;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: 10,
                padding: "0 16px",
              }}
            >
              {msg.role === "user" ? (
                <div style={s.userBubble}>{displayText}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: "85%" }}>
                  <div style={{ ...s.aiBubble, maxWidth: "100%", borderLeftColor: activePersona.color, boxShadow: `inset 3px 0 0 ${activePersona.color}` }}>
                    {displayText}
                    {isStreaming && <span style={{ opacity: 0.5, animation: "blink 0.7s step-end infinite" }}>▋</span>}
                  </div>
                  {isLastAI && !isStreaming && hasDrillContent(msg.content) && (
                    <button
                      onClick={() => addToCalendar(msg.content)}
                      style={{
                        alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 11px", borderRadius: 999,
                        background: `${goldAlpha(0.1)}`, border: `1px solid ${goldAlpha(0.3)}`,
                        color: GOLD, fontSize: 11, fontWeight: 800, cursor: "pointer",
                      }}
                    >
                      📅 {t("coachAddCalendar")}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10, padding: "0 16px" }}>
            <div style={{ ...s.aiBubble, borderLeftColor: activePersona.color, boxShadow: `inset 3px 0 0 ${activePersona.color}`, padding: 0 }}>
              <TypingIndicator color={activePersona.color} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div style={s.inputArea}>
        {messages.length > 0 && (
          <div style={s.quickRow}>
            {quickActions.map((qa) => (
              <button
                key={qa}
                type="button"
                style={s.quickChipSm}
                disabled={loading}
                onClick={() => sendMessage(qa)}
              >
                {qa}
              </button>
            ))}
          </div>
        )}
        <div style={s.inputRow}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("coachPlaceholder")}
            disabled={loading}
            style={s.input}
          />
          <button
            type="button"
            disabled={!input.trim() || loading}
            style={{
              ...s.sendBtn,
              background: input.trim() && !loading ? activePersona.color : "#1e1e1e",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              boxShadow: input.trim() && !loading ? `0 8px 24px ${activePersona.color}44` : "none",
            }}
            onClick={() => sendMessage()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 12 20 5l-5.2 14-3.1-5.8L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

