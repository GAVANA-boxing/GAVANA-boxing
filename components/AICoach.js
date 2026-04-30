"use client";

import { useState, useRef, useEffect } from "react";

export default function AICoach() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [persona, setPersona] = useState("drill");
  const messagesEndRef = useRef(null);

  const personas = [
    { id: "drill", name: "Drill Sergeant", emoji: "💢", color: "#E8002D" },
    { id: "zen", name: "Zen Master", emoji: "🧘", color: "#00A3FF" },
    { id: "analyst", name: "Analyst", emoji: "📊", color: "#FFD700" }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePersonaChange = (newPersona) => {
    setPersona(newPersona);
    setMessages([]); // Clear chat when persona changes
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
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
        content: "Уучлаарай, алдаа гарлаа. Дахин оролдоно уу."
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
    <div style={{
      minHeight: "100vh",
      background: "#080808",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "20px"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <p style={{
            margin: 0,
            color: "#E8002D",
            letterSpacing: 2,
            fontSize: 12,
            fontWeight: 700
          }}>
            GAVANA BOXING
          </p>
          <h1 style={{
            margin: "10px 0 0",
            fontSize: 28,
            fontWeight: 900,
            color: "#fff"
          }}>
            AI Coach
          </h1>
        </div>

        {/* Persona Selection */}
        <div style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          justifyContent: "center"
        }}>
          {personas.map((p) => (
            <button
              key={p.id}
              onClick={() => handlePersonaChange(p.id)}
              style={{
                padding: "12px 20px",
                borderRadius: 25,
                border: "none",
                background: persona === p.id ? p.color : "#1a1a1a",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s ease",
                opacity: persona === p.id ? 1 : 0.7
              }}
            >
              <span>{p.emoji}</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>

        {/* Chat Container */}
        <div style={{
          background: "#0d0d0d",
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          height: 500,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: 10
          }}>
            {messages.length === 0 ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#666",
                fontSize: 16
              }}>
                {personas.find(p => p.id === persona)?.emoji} {personas.find(p => p.id === persona)?.name}-тай ярилцаж эхлээрэй
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
                    maxWidth: "70%",
                    padding: "12px 16px",
                    borderRadius: 18,
                    background: msg.role === "user"
                      ? personas.find(p => p.id === persona)?.color || "#E8002D"
                      : "#1a1a1a",
                    color: "#fff",
                    fontSize: 14,
                    lineHeight: 1.4
                  }}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{
            display: "flex",
            gap: 12,
            alignItems: "center"
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Боксны талаар асууна уу..."
              disabled={loading}
              style={{
                flex: 1,
                padding: "14px 18px",
                borderRadius: 25,
                border: "1px solid #333",
                background: "#131313",
                color: "#fff",
                fontSize: 14,
                outline: "none"
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                padding: "14px 24px",
                borderRadius: 25,
                border: "none",
                background: loading ? "#6d0f0f" : personas.find(p => p.id === persona)?.color || "#E8002D",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              {loading ? "..." : "Илгээх"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}