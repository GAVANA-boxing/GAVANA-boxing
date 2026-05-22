"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import KnowledgeLibrary from "@/components/KnowledgeLibrary";
import { RED, GOLD, PURPLE , blackAlpha} from "@/lib/tokens";
import styles from "@/components/aiCoachStyles";
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
        body: JSON.stringify({ messages: newMessages, persona, locale }),
      });

      const data = await response.json();

      if (data.content && data.content[0]) {
        setMessages([...newMessages, { role: "assistant", content: data.content[0].text }]);
      }
    } catch {
      setMessages([...newMessages, { role: "assistant", content: t("coachError") }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.shell}>
        <div style={styles.header}>
          <p style={styles.kicker}>COMBAT · AI</p>
          <h1 style={styles.title}>{t("aiCoach")}</h1>
        </div>

        {/* Section sub-tabs */}
        <div style={styles.sectionTabRow}>
          {[
            { key: "library", label: t("libraryTabLabel"), emoji: "📚" },
            { key: "chat",    label: t("chatTabLabel"),    emoji: "💬" },
          ].map(({ key, label, emoji }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveSection(key)}
              style={activeSection === key ? styles.sectionTabActive : styles.sectionTabInactive}
            >
              <span>{emoji}</span> {label}
            </button>
          ))}
        </div>

        {activeSection === "library" && (
          <KnowledgeLibrary locale={locale} onAsk={handleAskFromLibrary} />
        )}

        {activeSection === "chat" && (<>

          {/* ── Persona character cards ── */}
          <p style={styles.personaSectionLabel}>CHOOSE YOUR COACH</p>
          <div style={styles.personaGrid}>
            {personas.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePersonaChange(p.id)}
                style={{
                  ...styles.personaCard,
                  ...(persona === p.id ? {
                    ...styles.personaCardActive,
                    borderColor: p.color,
                    background: `linear-gradient(145deg, ${p.color}20, rgba(11,11,12,0.98))`,
                    boxShadow: `0 0 0 1px ${p.color}44, 0 8px 24px ${p.color}18`,
                  } : {}),
                }}
              >
                <span style={{ ...styles.personaAvatar, background: `${p.color}1A`, color: p.color }}>
                  {p.emoji}
                </span>
                <div style={styles.personaCardContent}>
                  <span style={styles.personaCardName}>{p.name}</span>
                  <span style={styles.personaCardTagline}>{p.tagline}</span>
                  <div style={styles.personaCardTags}>
                    {p.tags.map((tag) => (
                      <span key={tag} style={{ ...styles.personaCardTag, color: p.color, borderColor: `${p.color}40` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                {persona === p.id && (
                  <span style={{ ...styles.personaCheckBadge, background: p.color }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Active coach banner ── */}
          <div style={{ ...styles.personaBanner, borderColor: `${activePersona.color}30`, background: `${activePersona.color}08` }}>
            <span style={{ ...styles.personaBannerEmoji, background: `${activePersona.color}1A` }}>
              {activePersona.emoji}
            </span>
            <div style={styles.personaBannerInfo}>
              <p style={{ ...styles.personaBannerName, color: activePersona.color }}>{activePersona.name}</p>
              <p style={styles.personaBannerSub}>Coaching you now</p>
            </div>
            <span style={styles.personaBannerDot} />
          </div>

          {/* ── Quick actions ── */}
          <div style={styles.quickActions}>
            {activePersona.quickActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => handleSend(action)}
                disabled={loading}
                style={{
                  ...styles.quickAction,
                  borderColor: `${activePersona.color}30`,
                  opacity: loading ? 0.45 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {action}
              </button>
            ))}
          </div>

          {/* ── Chat box ── */}
          <div style={styles.chatBox}>
            <div style={styles.messages}>
              {messages.length === 0 ? (
                <div style={styles.emptyState}>
                  <div style={styles.introWrap}>
                    <div style={{
                      ...styles.introBubble,
                      borderLeftColor: activePersona.color,
                      boxShadow: `inset 2px 0 0 ${activePersona.color}`,
                    }}>
                      {activePersona.intro}
                    </div>
                    <p style={styles.introHint}>TAP A QUICK ACTION OR TYPE BELOW</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: 16,
                      display: "flex",
                      justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        ...(message.role === "user" ? styles.userBubble : styles.assistantBubble),
                        ...(message.role === "assistant" ? {
                          borderLeftColor: activePersona.color,
                          boxShadow: `inset 3px 0 0 ${activePersona.color}, 0 14px 34px ${blackAlpha(0.24)}`,
                        } : {}),
                      }}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={styles.inputRow}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t("coachPlaceholder")}
                disabled={loading}
                style={{ ...styles.input, borderColor: input ? `${activePersona.color}40` : "rgba(255,255,255,0.08)" }}
              />
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                style={{
                  ...styles.sendButton,
                  background: loading ? "#4d1117" : activePersona.color,
                  cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !input.trim() ? 0.65 : 1,
                }}
                aria-label={t("sendMessage")}
              >
                {loading ? "…" : <SendIcon />}
              </button>
            </div>
          </div>

        </>)}
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12 20 5l-5.2 14-3.1-5.8L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
