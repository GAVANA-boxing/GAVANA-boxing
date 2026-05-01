"use client";

import { useState, useRef, useEffect } from "react";

export default function AICoach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState("drill");
  const messagesEndRef = useRef(null);

  const personas = [
    { id: "drill", name: "Drill Sergeant", label: "DS", color: "#C1121F" },
    { id: "zen", name: "Zen Master", label: "ZM", color: "#D4AF37" },
    { id: "analyst", name: "Analyst", label: "AN", color: "#D4AF37" }
  ];

  const quickActions = [
    "Create training plan",
    "Fix my technique",
    "Improve speed"
  ];

  const activePersona = personas.find((p) => p.id === persona) || personas[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePersonaChange = (newPersona) => {
    setPersona(newPersona);
    setMessages([]);
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
          persona: persona
        }),
      });

      const data = await response.json();

      if (data.content && data.content[0]) {
        const aiMessage = {
          role: "assistant",
          content: data.content[0].text
        };
        setMessages([...newMessages, aiMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, something went wrong. Try again in a moment."
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.header}>
          <p style={styles.kicker}>GAVANA BOXING</p>
          <h1 style={styles.title}>AI Coach</h1>
        </div>

        <div style={styles.personas}>
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePersonaChange(p.id)}
              style={{
                ...styles.personaButton,
                ...(persona === p.id ? {
                  border: `1px solid ${p.color}`,
                  background: `linear-gradient(180deg, ${p.color}33, ${p.color}18)`,
                  opacity: 1
                } : {})
              }}
            >
              <span style={styles.personaLabel}>{p.label}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        <div style={styles.quickActions}>
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => handleSend(action)}
              disabled={loading}
              style={{
                ...styles.quickAction,
                opacity: loading ? 0.55 : 1,
                cursor: loading ? "not-allowed" : "pointer"
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
                <div style={styles.emptyTitle}>Ask your coach</div>
                <div style={styles.exampleThread}>
                  <div style={styles.exampleAssistant}>Tell me your goal, schedule, and biggest weakness.</div>
                  <div style={styles.exampleUser}>I have 30 minutes a day and want faster combinations.</div>
                  <div style={styles.exampleAssistant}>Good. I will build a 4-week plan with speed drills, rest, and measurable targets.</div>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: 16,
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                  }}
                >
                  <div style={{
                    maxWidth: "74%",
                    padding: "12px 16px",
                    borderRadius: 18,
                    background: msg.role === "user" ? activePersona.color : "#151515",
                    color: "#fff",
                    fontSize: 14,
                    lineHeight: 1.45,
                    border: msg.role === "user" ? "none" : "1px solid rgba(255,255,255,0.08)"
                  }}>
                    {msg.content}
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
              placeholder="Ask about training, technique, or fight prep..."
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
                opacity: loading || !input.trim() ? 0.7 : 1
              }}
              aria-label="Send message"
            >
              {loading ? "..." : <SendIcon />}
            </button>
          </div>
        </div>
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
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  },
  shell: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "var(--space-6)"
  },
  header: {
    textAlign: "center",
    marginBottom: "var(--space-8)"
  },
  kicker: {
    margin: 0,
    color: "var(--accent-gold)",
    letterSpacing: 2,
    fontSize: 12,
    fontWeight: 700
  },
  title: {
    margin: "10px 0 0",
    fontSize: 38,
    fontWeight: 900,
    color: "var(--text-primary)"
  },
  personas: {
    display: "flex",
    gap: 12,
    marginBottom: "var(--space-4)",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  personaButton: {
    padding: "11px 16px",
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.045)",
    color: "var(--text-primary)",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 8,
    transition: "all var(--motion-fast)",
    opacity: 0.72
  },
  personaLabel: {
    fontSize: 10,
    color: "var(--text-secondary)",
    letterSpacing: 0.8
  },
  quickActions: {
    display: "flex",
    gap: 10,
    marginBottom: "var(--space-6)",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  quickAction: {
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid var(--line)",
    background: "rgba(255,255,255,0.055)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontWeight: 750,
    boxShadow: "var(--shadow-soft)",
    transition: "transform var(--motion-fast), border-color var(--motion-fast), background var(--motion-fast)"
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
    flexDirection: "column"
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    paddingRight: 10
  },
  emptyState: {
    display: "grid",
    alignContent: "center",
    gap: 18,
    height: "100%",
    color: "rgba(247,242,232,0.72)",
    fontSize: 14
  },
  emptyTitle: {
    textAlign: "center",
    color: "var(--text-primary)",
    fontSize: 22,
    fontWeight: 900
  },
  exampleThread: {
    display: "grid",
    gap: 12,
    maxWidth: 520,
    margin: "0 auto",
    width: "100%"
  },
  exampleAssistant: {
    justifySelf: "start",
    maxWidth: "82%",
    padding: "12px 14px",
    borderRadius: 16,
    background: "var(--surface-soft)",
    border: "1px solid var(--line)",
    lineHeight: 1.45
  },
  exampleUser: {
    justifySelf: "end",
    maxWidth: "82%",
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(193,18,31,0.82)",
    lineHeight: 1.45
  },
  inputRow: {
    display: "flex",
    gap: 12,
    alignItems: "center"
  },
  input: {
    flex: 1,
    padding: "14px 18px",
    borderRadius: 14,
    border: "1px solid var(--line)",
    background: "rgba(17,17,17,0.9)",
    color: "var(--text-primary)",
    fontSize: 14,
    outline: "none"
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: "none",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }
};
