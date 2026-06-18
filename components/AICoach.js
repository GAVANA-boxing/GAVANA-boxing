"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, GOLD, PURPLE } from "@/lib/tokens";
import KnowledgeLibrary from "@/components/KnowledgeLibrary";
import styles from "@/components/aiCoachStyles";
import TodayMissionBanner from "@/components/ai-coach/TodayMissionBanner";
import SectionTabRow from "@/components/ai-coach/SectionTabRow";
import PersonaSelector from "@/components/ai-coach/PersonaSelector";
import ActivePersonaBanner from "@/components/ai-coach/ActivePersonaBanner";
import QuickActions from "@/components/ai-coach/QuickActions";
import ChatBox from "@/components/ai-coach/ChatBox";
import { auth } from "@/lib/firebase";

const BLUE = "#3B82F6";

export default function AICoach() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState("drill");
  const [activeSection, setActiveSection] = useState("library");
  const messagesEndRef = useRef(null);

  const personas = [
    {
      id: "drill",
      emoji: "🎯",
      name: t("drillSergeant"),
      tagline: t("drillTagline") || "Sharp. Zero fluff.",
      tags: [t("intense") || "Intense", t("direct") || "Direct"],
      color: RED,
      intro: t("drillIntro") || "Listen up. I don't do motivational speeches. Tell me your problem — I'll fix it. What are you working on?",
      quickActions: [t("drillQuick1"), t("drillQuick2"), t("drillQuick3")],
    },
    {
      id: "zen",
      emoji: "🌊",
      name: t("zenMaster"),
      tagline: t("zenTagline") || "Breathe first. Then punch.",
      tags: [t("calm") || "Calm", t("flow") || "Flow"],
      color: BLUE,
      intro: t("zenIntro") || "Close your eyes for a second. Feel your feet on the ground. Now — what do you want to work on today?",
      quickActions: [t("zenQuick1"), t("zenQuick2"), t("zenQuick3")],
    },
    {
      id: "analyst",
      emoji: "📊",
      name: t("analyst"),
      tagline: t("analystTagline") || "Data doesn't lie.",
      tags: [t("data") || "Data", t("patterns") || "Patterns"],
      color: GOLD,
      intro: t("analystIntro") || "Let's look at the numbers. Share your session data or describe what you're struggling with — I'll find the pattern.",
      quickActions: [t("analystQuick1"), t("analystQuick2"), t("analystQuick3")],
    },
    {
      id: "champion",
      emoji: "🥊",
      name: t("oldChampion") || "Old Champion",
      tagline: t("championTagline") || "I've been in that ring.",
      tags: [t("wisdom") || "Wisdom", t("stories") || "Stories"],
      color: PURPLE,
      intro: t("championIntro") || "I've taken every punch you're about to face. Ask me anything — there's nothing in that gym I haven't seen before.",
      quickActions: [
        t("championQuick1") || "How do I handle pressure?",
        t("championQuick2") || "What separates good from great?",
        t("championQuick3") || "How did you stay motivated?",
      ],
    },
  ];

  const activePersona = personas.find((p) => p.id === persona) || personas[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePersonaChange = (newPersona) => {
    setPersona(newPersona);
    setMessages([]);
  };

  const handleAskFromLibrary = (prompt) => {
    setActiveSection("chat");
    handleSend(prompt);
  };

  const handleSend = async (presetPrompt) => {
    const prompt = (typeof presetPrompt === "string" ? presetPrompt : input).trim();
    if (!prompt || loading) return;

    const userMessage = { role: "user", content: prompt };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: newMessages, persona, locale, json_mode: true }),
      });

      const data = await response.json();

      if (data.content && data.content[0]) {
        setMessages([...newMessages, {
          role: "assistant",
          content: data.content[0].text,
          structured: data.structured ?? null,
          _source: data._source ?? (data.aiError ? "error" : "openai"),
        }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: t("coachError") }]);
    } finally {
      setLoading(false);
    }
  };

  const SECTION_TABS = [
    { key: "library", label: t("libraryTabLabel"), emoji: "📚" },
    { key: "chat",    label: t("chatTabLabel"),    emoji: "💬" },
  ];

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.shell}>
        <div style={styles.header}>
          <p style={styles.kicker}>COMBAT · AI</p>
          <h1 style={styles.title}>{t("aiCoach")}</h1>
        </div>

        {/* Today's Mission banner */}
        <TodayMissionBanner
          locale={locale}
          onAsk={handleSend}
          onSwitchToChat={() => setActiveSection("chat")}
        />

        {/* Section sub-tabs */}
        <SectionTabRow
          activeSection={activeSection}
          onSelect={setActiveSection}
          tabs={SECTION_TABS}
        />

        {activeSection === "library" && (
          <KnowledgeLibrary locale={locale} onAsk={handleAskFromLibrary} />
        )}

        {activeSection === "chat" && (<>

          {/* ── Persona character cards ── */}
          <PersonaSelector
            personas={personas}
            persona={persona}
            locale={locale}
            onSelect={handlePersonaChange}
          />

          {/* ── Active coach banner ── */}
          <ActivePersonaBanner activePersona={activePersona} locale={locale} />

          {/* ── Quick actions ── */}
          <QuickActions
            actions={activePersona.quickActions}
            color={activePersona.color}
            loading={loading}
            onAction={handleSend}
          />

          {/* ── Chat box ── */}
          <ChatBox
            messages={messages}
            messagesEndRef={messagesEndRef}
            input={input}
            onInputChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            onSend={handleSend}
            loading={loading}
            activePersona={activePersona}
            locale={locale}
          />

        </>)}
      </div>
    </div>
  );
}
