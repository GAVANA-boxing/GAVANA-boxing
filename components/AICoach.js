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
          <p style={styles.kicker}>GAVANA BOXING</p>
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
    background: "linear-gradient(180deg, var(--background) 0%, var(--surface) 100%)",
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
    gap: 8,
    marginBottom: 24,
    background: "#161616",
    border: "1px solid #222",
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
    color: "#666",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  header: {
    textAlign: "center",
    marginBottom: "var(--space-8)",
  },
  kicker: {
    margin: 0,
    color: "var(--accent-gold)",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: 700,
  },
  title: {
    margin: "10px 0 0",
    fontSize: 38,
    fontWeight: 900,
    color: "var(--text-primary)",
  },
  personas: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
    marginBottom: "var(--space-4)",
  },
  personaButton: {
    minHeight: 94,
    padding: "14px 12px",
    borderRadius: 18,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.04)",
    color: "var(--text-primary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
    transition: "transform var(--motion-fast), border-color var(--motion-fast), background var(--motion-fast), box-shadow var(--motion-fast), opacity var(--motion-fast)",
    opacity: 0.72,
  },
  personaIcon: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 1000,
    flexShrink: 0,
  },
  personaText: {
    display: "grid",
    gap: 5,
    textAlign: "left",
  },
  personaName: {
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 900,
    lineHeight: 1.05,
  },
  personaLabel: {
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  quickActions: {
    display: "flex",
    gap: 10,
    marginBottom: "var(--space-6)",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  quickAction: {
    padding: "10px 14px",
    borderRadius: 999,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "var(--line)",
    background: "rgba(255,255,255,0.055)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 750,
    boxShadow: "var(--shadow-soft)",
    transition: "transform var(--motion-fast), border-color var(--motion-fast), background var(--motion-fast)",
  },
  chatBox: {
    background: "radial-gradient(circle at 50% 0%, rgba(193,18,31,0.13), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018)), var(--surface)",
    border: "1px solid rgba(212,175,55,0.16)",
    boxShadow: "var(--shadow-soft)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-6)",
    marginBottom: "var(--space-6)",
    height: 520,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    paddingRight: 10,
  },
  userBubble: {
    maxWidth: "74%",
    padding: "12px 16px",
    borderRadius: "18px 18px 4px 18px",
    background: "#C1121F",
    color: "#fff",
    fontSize: 14,
    lineHeight: 1.45,
    border: "none",
    boxShadow: "0 12px 30px rgba(193,18,31,0.22)",
  },
  assistantBubble: {
    maxWidth: "78%",
    padding: "12px 16px",
    borderRadius: "18px 18px 18px 4px",
    background: "rgba(21,21,21,0.98)",
    color: "#fff",
    fontSize: 14,
    lineHeight: 1.45,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "rgba(255,255,255,0.08)",
    borderLeftWidth: 3,
  },
  emptyState: {
    display: "grid",
    alignContent: "center",
    gap: 18,
    height: "100%",
    color: "rgba(247,242,232,0.72)",
    fontSize: 14,
  },
  emptyTitle: {
    textAlign: "center",
    color: "var(--text-primary)",
    fontSize: 22,
    fontWeight: 900,
  },
  exampleThread: {
    display: "grid",
    gap: 12,
    maxWidth: 520,
    margin: "0 auto",
    width: "100%",
  },
  exampleAssistant: {
    justifySelf: "start",
    maxWidth: "82%",
    padding: "12px 14px",
    borderRadius: 16,
    background: "var(--surface-soft)",
    border: "1px solid var(--line)",
    lineHeight: 1.45,
  },
  exampleUser: {
    justifySelf: "end",
    maxWidth: "82%",
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(193,18,31,0.82)",
    lineHeight: 1.45,
  },
  inputRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: 14,
    border: "1px solid var(--line)",
    background: "rgba(17,17,17,0.9)",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none",
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: "none",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
