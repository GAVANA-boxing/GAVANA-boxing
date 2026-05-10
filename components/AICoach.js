"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import KnowledgeLibrary from "@/components/KnowledgeLibrary";

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
      color: "#C1121F",
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
      color: "#D4AF37",
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      console.error("Error:", error);
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at top center, rgba(193,18,31,0.05) 0%, transparent 50%), #080808",
    color: "var(--text-primary)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  shell: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "var(--space-6)",
  },
  sectionTabRow: {
    display: "flex",
    gap: 6,
    marginBottom: 24,
    background: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    padding: 4,
  },
  sectionTabActive: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 0",
    borderRadius: 9,
    background: "#C1121F",
    border: "none",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: "0.01em",
    boxShadow: "0 4px 16px rgba(193,18,31,0.3)",
  },
  sectionTabInactive: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "10px 0",
    borderRadius: 9,
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  header: {
    textAlign: "center",
    marginBottom: 28,
  },
  kicker: {
    margin: 0,
    color: "rgba(193,18,31,0.8)",
    letterSpacing: 3,
    fontSize: 9,
    fontWeight: 900,
    textTransform: "uppercase",
  },
  title: {
    margin: "8px 0 0",
    fontSize: 28,
    fontWeight: 900,
    color: "var(--text-primary)",
    letterSpacing: "-0.02em",
  },
  personas: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
    marginBottom: 16,
  },
  personaButton: {
    minHeight: 82,
    padding: "12px 10px",
    borderRadius: 14,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
    color: "var(--text-primary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, opacity 180ms ease",
    opacity: 0.65,
  },
  personaIcon: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 1000,
    flexShrink: 0,
  },
  personaText: {
    display: "grid",
    gap: 4,
    textAlign: "left",
  },
  personaName: {
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 900,
    lineHeight: 1.05,
  },
  personaLabel: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  quickActions: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
    justifyContent: "flex-start",
    flexWrap: "wrap",
  },
  quickAction: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.03)",
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 150ms ease",
  },
  chatBox: {
    background: "rgba(255,255,255,0.02)",
    borderRadius: 16,
    padding: "18px 16px 14px",
    marginBottom: 20,
    height: 500,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    borderTop: "1px solid rgba(255,255,255,0.05)",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    paddingRight: 8,
  },
  userBubble: {
    maxWidth: "74%",
    padding: "11px 15px",
    borderRadius: "18px 18px 4px 18px",
    background: "#C1121F",
    color: "#fff",
    fontSize: 14,
    lineHeight: 1.5,
    border: "none",
    boxShadow: "0 8px 24px rgba(193,18,31,0.2)",
  },
  assistantBubble: {
    maxWidth: "78%",
    padding: "11px 15px",
    borderRadius: "18px 18px 18px 4px",
    background: "rgba(18,18,18,0.95)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 1.55,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.07)",
    borderLeftWidth: 2,
  },
  emptyState: {
    display: "grid",
    alignContent: "center",
    gap: 16,
    height: "100%",
    color: "rgba(247,242,232,0.5)",
    fontSize: 14,
  },
  emptyTitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "0.01em",
  },
  exampleThread: {
    display: "grid",
    gap: 10,
    maxWidth: 520,
    margin: "0 auto",
    width: "100%",
  },
  exampleAssistant: {
    justifySelf: "start",
    maxWidth: "82%",
    padding: "10px 13px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    lineHeight: 1.5,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
  exampleUser: {
    justifySelf: "end",
    maxWidth: "82%",
    padding: "10px 13px",
    borderRadius: 14,
    background: "rgba(193,18,31,0.7)",
    lineHeight: 1.5,
    fontSize: 13,
  },
  inputRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginTop: 12,
  },
  input: {
    flex: 1,
    padding: "13px 16px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    border: "none",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
};
