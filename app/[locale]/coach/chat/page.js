"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import BottomNav from "@/components/BottomNav";
import { getLocale, translate } from "@/lib/i18n";
import s from "@/components/coach/coachChatStyles";
import { buildCoachSnapshot, buildCoachContext } from "@/lib/buildCoachContext";
import { buildLastSessionMessage } from "@/lib/techniqueReview";

import CoachHeader from "@/components/coach/CoachHeader";
import CoachPersonaSelector from "@/components/coach/CoachPersonaSelector";
import CoachMemoryPanel from "@/components/coach/CoachMemoryPanel";
import CoachEmptyState from "@/components/coach/CoachEmptyState";
import CoachMessageList from "@/components/coach/CoachMessageList";
import CoachInputArea from "@/components/coach/CoachInputArea";

// ─── Persona config ───────────────────────────────────────────────────────────
const PERSONAS = [
  {
    id: "drill",
    emoji: "🔥",
    color: "#E53E3E",
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
    color: "#F5C451",
    nameKey: "analyst",
    quickKeys: ["analystQuick1", "analystQuick2", "analystQuick3"],
    greeting: {
      mn: "Өгөгдөл авъя. Асуу.",
      ko: "데이터 기반으로 분석해줄게. 물어봐.",
      en: "Let's look at the data. Ask away.",
    },
  },
];

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
  const [lastSessionData, setLastSessionData] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const greetingInjectedRef = useRef(new Set());

  const activePersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];

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

        // Store last session for "Review my last session" quick action
        const lastSess = sessions[0];
        if (lastSess?.poseMetrics && lastSess?.score != null) {
          setLastSessionData({
            poseMetrics: lastSess.poseMetrics,
            result: {
              score: lastSess.score,
              breakdown: lastSess.breakdown || null,
            },
            techniqueReview: lastSess.techniqueReview || null,
          });
        }

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
        body: JSON.stringify({ messages: next, persona, locale, coachContext: coachContextStr, json_mode: true }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || data.message || t("coachError");
      const newMsg = {
        role: "assistant", content: reply, ts: Date.now(),
        _source: data._source ?? (data.fallback ? "fallback" : data.aiError ? "error" : "openai"),
        structured: data.structured ?? null,
      };
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

  const sendReviewRequest = async () => {
    if (!lastSessionData || reviewLoading || loading) return;
    setReviewLoading(true);
    const msg = buildLastSessionMessage({ ...lastSessionData, locale });
    if (msg) await sendMessage(msg);
    setReviewLoading(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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

  const quickActions = activePersona.quickKeys.map((k) => t(k));

  const reviewLabel =
    locale === "mn" ? "Session шинжилгээ"
    : locale === "ko" ? "세션 리뷰"
    : "Review session";

  return (
    <div style={s.page}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:0.5} 50%{opacity:0} }
        @keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes shimmerFade { 0%,100%{opacity:0.4} 50%{opacity:0.9} }
      `}</style>

      <CoachHeader
        activePersona={activePersona}
        personaLabel={t(activePersona.nameKey)}
        onBack={() => router.back()}
        onClear={clearSession}
        clearLabel={t("coachClearChat")}
      />

      <CoachPersonaSelector
        personas={PERSONAS}
        activePersonaId={persona}
        onSelect={setPersona}
        t={t}
      />

      <CoachMemoryPanel coachSnapshot={coachSnapshot} />

      <div style={s.messages}>
        {messages.length === 0 && !loading && (
          <CoachEmptyState
            activePersona={activePersona}
            locale={locale}
            quickActions={quickActions}
            lastSessionData={lastSessionData}
            reviewLoading={reviewLoading}
            loading={loading}
            onQuickAction={sendMessage}
            onReview={sendReviewRequest}
          />
        )}

        <CoachMessageList
          messages={messages}
          loading={loading}
          streamingIdx={streamingIdx}
          streamingText={streamingText}
          activePersona={activePersona}
          locale={locale}
          messagesEndRef={messagesEndRef}
          addToCalendarLabel={t("coachAddCalendar")}
          onAddToCalendar={addToCalendar}
        />
      </div>

      <CoachInputArea
        input={input}
        onInputChange={setInput}
        onKeyDown={onKeyDown}
        onSend={() => sendMessage()}
        loading={loading}
        reviewLoading={reviewLoading}
        inputRef={inputRef}
        activePersona={activePersona}
        quickActions={quickActions}
        hasMessages={messages.length > 0}
        lastSessionData={lastSessionData}
        onQuickAction={sendMessage}
        onReview={sendReviewRequest}
        placeholder={t("coachPlaceholder")}
        reviewLabel={reviewLabel}
      />

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
    </div>
  );
}
