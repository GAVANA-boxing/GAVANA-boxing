"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import KnowledgeLibrary from "@/components/KnowledgeLibrary";
import { RED, GOLD } from "@/lib/tokens";
import styles from "@/components/aiCoachStyles";
import { auth } from "@/lib/firebase";

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
      name: t("drillSergeant"),
      icon: "!",
      label: t("intense"),
      color: RED,
      quickActions: [t("drillQuick1"), t("drillQuick2"), t("drillQuick3")],
    },
    {
      id: "zen",
      name: t("zenMaster"),
      icon: "Z",
      label: t("calm"),
      color: "#3B82F6",
      quickActions: [t("zenQuick1"), t("zenQuick2"), t("zenQuick3")],
    },
    {
      id: "analyst",
      name: t("analyst"),
      icon: "%",
      label: t("data"),
      color: GOLD,
      quickActions: [t("analystQuick1"), t("analystQuick2"), t("analystQuick3")],
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
        body: JSON.stringify({
          messages: newMessages,
          persona,
          locale,
        }),
      });

      const data = await response.json();

      if (data.content && data.content[0]) {
        setMessages([
          ...newMessages,
          {
            role: "assistant",
            content: data.content[0].text,
          },
        ]);
      }
    } catch (error) {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: t("coachError"),
        },
      ]);
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
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <p style={styles.kicker}>GAVANA</p>
          <h1 style={styles.title}>{t("aiCoach")}</h1>
        </div>

        {/* Section sub-tabs: Library / Chat */}
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

        {/* Library section */}
        {activeSection === "library" && (
          <KnowledgeLibrary locale={locale} onAsk={handleAskFromLibrary} />
        )}

        {/* Chat section */}
        {activeSection === "chat" && (
          <>
        <div style={styles.personas}>
          {personas.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePersonaChange(item.id)}
              style={{
                ...styles.personaButton,
                ...(persona === item.id ? {
                  borderColor: item.color,
                  background: `linear-gradient(180deg, ${item.color}24, rgba(11,11,11,0.96))`,
                  boxShadow: `0 0 0 1px ${item.color}55, 0 0 28px ${item.color}33`,
                  opacity: 1,
                  transform: "translateY(-2px)",
                } : {}),
              }}
            >
              <span style={{ ...styles.personaIcon, color: item.color }}>{item.icon}</span>
              <span style={styles.personaText}>
                <span style={styles.personaName}>{item.name}</span>
                <span style={{ ...styles.personaLabel, color: item.color }}>{item.label}</span>
              </span>
            </button>
          ))}
        </div>

        <div style={styles.quickActions}>
          {activePersona.quickActions.map((action) => (
            <button
              key={action}
              onClick={() => handleSend(action)}
              disabled={loading}
              style={{
                ...styles.quickAction,
                opacity: loading ? 0.55 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {action}
            </button>
          ))}
        </div>

        <div style={styles.chatBox}>
          <div style={styles.messages}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyTitle}>{t("askYourCoach")}</div>
                <div style={styles.exampleThread}>
                  <div style={styles.exampleAssistant}>{t("coachExampleAssistant1")}</div>
                  <div style={styles.exampleUser}>{t("coachExampleUser")}</div>
                  <div style={styles.exampleAssistant}>{t("coachExampleAssistant2")}</div>
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
                        boxShadow: `inset 3px 0 0 ${activePersona.color}, 0 14px 34px rgba(0,0,0,0.24)`,
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
              onChange={(event) => setInput(event.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("coachPlaceholder")}
              disabled={loading}
              style={styles.input}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              style={{
                ...styles.sendButton,
                background: loading ? "#4d1117" : activePersona.color,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.7 : 1,
              }}
              aria-label={t("sendMessage")}
            >
              {loading ? "..." : <SendIcon />}
            </button>
          </div>
        </div>
          </>
        )}
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
