"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import BottomNav from "@/components/BottomNav";
import { getLocale, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import s from "@/components/coach/coachChatStyles";
import { buildCoachSnapshot, buildCoachContext } from "@/lib/buildCoachContext";

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

  // Fighter profile context for AI personalization
  const [coachContextStr, setCoachContextStr] = useState(null);
  const [coachSnapshot, setCoachSnapshot] = useState(null);
  const [coachMemory, setCoachMemory] = useState(null); // persisted insights from past sessions

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const memorySavedRef = useRef(false);
  const activePersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];
  const greetingInjectedRef = useRef(new Set());

  useEffect(() => {
    if (user === null) router.replace(`/${locale}/login`);
  }, [user, locale, router]);

  // Fetch fighter data and build coach context
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { collection, getDocs, doc, getDoc, query, where } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");

        const [sessSnap, userSnap] = await Promise.all([
          getDocs(query(
            collection(db, "training_sessions"),
            where("userId", "==", user.uid)
          )),
          getDoc(doc(db, "users", user.uid)),
        ]);

        if (!active) return;

        const sessions = sessSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((d) => d.type === "training" && typeof d.score !== "undefined")
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

        const profileData = userSnap.exists() ? userSnap.data() : {};

        const snapshot = buildCoachSnapshot({ sessions, profileData });
        const ctx = buildCoachContext({ snapshot, profileData, locale });

        setCoachSnapshot(snapshot);

        // Load coach memory from Firestore
        let memoryStr = null;
        try {
          const memRef = doc(db, "coach_memory", user.uid);
          const memSnap = await getDoc(memRef);
          if (memSnap.exists()) {
            const insights = memSnap.data().insights || [];
            if (insights.length > 0) {
              const recent = insights.slice(-4).map((m) => `• ${m.text}`).join("\n");
              memoryStr = `── COACH MEMORY (insights from past sessions) ──\n${recent}`;
              setCoachMemory(memoryStr);
            }
          }
        } catch { /* ignore — memory is optional */ }

        const fullCtx = [ctx, memoryStr].filter(Boolean).join("\n\n");
        setCoachContextStr(fullCtx);
      } catch { /* silent — chat still works without context */ }
    })();
    return () => { active = false; };
  }, [user?.uid, locale]);

  // Load chat history for current persona
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`gavana_chat_${persona}`);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setMessages([]);
    }
  }, [persona]);

  // Auto-send from ?q= URL param (deep link from dashboard)
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (autoSentRef.current) return;
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    autoSentRef.current = true;
    window.history.replaceState({}, "", window.location.pathname);
    const timer = setTimeout(() => sendMessage(q), 900);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proactive greeting when snapshot loads and no prior chat
  useEffect(() => {
    if (!coachSnapshot) return;
    if (greetingInjectedRef.current.has(persona)) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      greetingInjectedRef.current.add(persona);
      const weakArea = coachSnapshot.weakAreas[0]?.[0];
      const weakVal = coachSnapshot.weakAreas[0]?.[1]?.toFixed(1);
      const strong = coachSnapshot.strongAreas[0]?.[0];
      let text = "";
      if (locale === "mn") {
        text = `Сайн уу! Таны өгөгдлийг харлаа.\n\n` +
          (weakArea ? `⚠ **${weakArea}** — ${weakVal}/10. Энэ хэсэгт илүү анхаарал хэрэгтэй байна.\n` : "") +
          (strong ? `⚡ **${strong}** хүчтэй байна — үргэлжлүүл.\n\n` : "\n") +
          `Юу дадлагажуулах, хэрхэн сайжруулах талаар асуугаарай.`;
      } else {
        text = `Hey! I checked your training data.\n\n` +
          (weakArea ? `⚠ **${weakArea}** is at ${weakVal}/10 — that's your main growth area right now.\n` : "") +
          (strong ? `⚡ **${strong}** is looking strong — keep building on it.\n\n` : "\n") +
          `Ask me anything about drills, technique, or your next session.`;
      }
      return [{ role: "assistant", content: text, ts: Date.now() }];
    });
  }, [coachSnapshot, persona, locale]);

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
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: next, persona, locale, coachContext: coachContextStr }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || data.message || t("coachError");
      const newMsg = { role: "assistant", content: reply, ts: Date.now(), _source: data._source ?? (data.fallback ? "fallback" : data.aiError ? "error" : "openai") };
      setMessages((prev) => {
        const updated = [...prev, newMsg];
        setStreamingIdx(updated.length - 1);
        setStreamingText("");
        return updated;
      });

      // Save insight to Firestore memory every 4th assistant message
      if (user?.uid && reply && reply.length > 30) {
        const allMsgs = [...messages, { role: "user", content: text }, newMsg];
        const assistantCount = allMsgs.filter((m) => m.role === "assistant").length;
        if (assistantCount % 4 === 0) {
          (async () => {
            try {
              const { doc, setDoc, arrayUnion, serverTimestamp } = await import("firebase/firestore");
              const { db } = await import("@/lib/firebase");
              const snippet = reply.slice(0, 180).replace(/\n+/g, " ").trim();
              await setDoc(
                doc(db, "coach_memory", user.uid),
                {
                  insights: arrayUnion({ text: snippet, ts: Date.now(), persona }),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              );
            } catch { /* silent */ }
          })();
        }
      }
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

      {/* ── Coach Memory panel ── */}
      {coachSnapshot && (
        <div style={{
          margin: "0 14px 8px",
          padding: "9px 12px",
          borderRadius: 11,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.8, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 7 }}>
            Coach sees
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {coachSnapshot.identity && (
              <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.06)", borderRadius: 999, padding: "3px 9px" }}>
                {coachSnapshot.identity.primary}
              </span>
            )}
            {coachSnapshot.weakAreas.slice(0, 2).map(([k, v]) => (
              <span key={k} style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,80,70,0.85)", background: "rgba(255,60,48,0.08)", borderRadius: 999, padding: "3px 8px" }}>
                ⚠ {k} {v.toFixed(1)}
              </span>
            ))}
            {coachSnapshot.strongAreas.slice(0, 1).map(([k, v]) => (
              <span key={k} style={{ fontSize: 10, fontWeight: 800, color: "rgba(245,196,81,0.85)", background: "rgba(245,196,81,0.07)", borderRadius: 999, padding: "3px 8px" }}>
                ⚡ {k} {v.toFixed(1)}
              </span>
            ))}
            <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.22)", fontWeight: 700 }}>
              {coachSnapshot.totalSessions} sessions · avg {coachSnapshot.avgScore.toFixed(1)}
            </span>
          </div>
        </div>
      )}

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
                  {msg._source === "fallback" && (
                    <span style={{ alignSelf: "flex-start", fontSize: 9, fontWeight: 900, letterSpacing: 1.2, color: "rgba(245,196,81,0.5)", background: "rgba(245,196,81,0.07)", border: "1px solid rgba(245,196,81,0.18)", borderRadius: 4, padding: "2px 6px", textTransform: "uppercase" }}>
                      demo · ai unavailable
                    </span>
                  )}
                  {msg._source === "error" && (
                    <span style={{ alignSelf: "flex-start", fontSize: 9, fontWeight: 900, letterSpacing: 1.2, color: "rgba(255,100,100,0.6)", background: "rgba(255,100,100,0.07)", border: "1px solid rgba(255,100,100,0.18)", borderRadius: 4, padding: "2px 6px", textTransform: "uppercase" }}>
                      ai error
                    </span>
                  )}
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

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

