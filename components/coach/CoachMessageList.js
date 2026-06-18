"use client";

import { GOLD, goldAlpha } from "@/lib/tokens";
import s from "@/components/coach/coachChatStyles";
import CoachBubbleContent from "@/components/coach/CoachBubbleContent";
import CoachThinking from "@/components/coach/CoachThinking";
import CoachResponseCard from "@/components/coach/CoachResponseCard";

/**
 * Scrollable message list — user bubbles, AI bubbles, thinking indicator.
 *
 * Props:
 *   messages         {Array<{ role, content, ts, _source, structured }>}
 *   loading          {boolean}
 *   streamingIdx     {number}
 *   streamingText    {string}
 *   activePersona    {{ color, emoji }}
 *   locale           {string}
 *   messagesEndRef   {React.Ref}
 *   addToCalendarLabel {string}
 *   onAddToCalendar  {(text: string) => void}
 */
export default function CoachMessageList({
  messages,
  loading,
  streamingIdx,
  streamingText,
  activePersona,
  locale,
  messagesEndRef,
  addToCalendarLabel,
  onAddToCalendar,
}) {
  const hasDrillContent = (text) => {
    const lower = text.toLowerCase();
    return /drill|×|mins|minutes|rounds|session|sets|reps|jab|combo|shadow|heavy bag/.test(lower);
  };

  return (
    <div style={s.messages}>
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
                <div style={{
                  ...s.aiBubble,
                  maxWidth: "100%",
                  borderLeftColor: activePersona.color,
                  boxShadow: `inset 3px 0 0 ${activePersona.color}`,
                  whiteSpace: "normal",
                }}>
                  {msg.structured && !isStreaming
                    ? <CoachResponseCard structured={msg.structured} accentColor={activePersona.color} locale={locale} />
                    : <CoachBubbleContent text={displayText} isStreaming={isStreaming} accentColor={activePersona.color} />
                  }
                </div>
                {msg._source === "fallback" && (
                  <span style={{
                    alignSelf: "flex-start", fontSize: 9, fontWeight: 900, letterSpacing: 1.2,
                    color: "rgba(245,196,81,0.5)", background: "rgba(245,196,81,0.07)",
                    border: "1px solid rgba(245,196,81,0.18)", borderRadius: 4,
                    padding: "2px 6px", textTransform: "uppercase",
                  }}>
                    demo · ai unavailable
                  </span>
                )}
                {msg._source === "error" && (
                  <span style={{
                    alignSelf: "flex-start", fontSize: 9, fontWeight: 900, letterSpacing: 1.2,
                    color: "rgba(255,100,100,0.6)", background: "rgba(255,100,100,0.07)",
                    border: "1px solid rgba(255,100,100,0.18)", borderRadius: 4,
                    padding: "2px 6px", textTransform: "uppercase",
                  }}>
                    ai error
                  </span>
                )}
                {isLastAI && !isStreaming && hasDrillContent(msg.content) && (
                  <button
                    onClick={() => onAddToCalendar(msg.content)}
                    style={{
                      alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 11px", borderRadius: 999,
                      background: goldAlpha(0.1), border: `1px solid ${goldAlpha(0.3)}`,
                      color: GOLD, fontSize: 11, fontWeight: 800, cursor: "pointer",
                    }}
                  >
                    📅 {addToCalendarLabel}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {loading && (
        <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 10, padding: "0 16px" }}>
          <div style={{
            ...s.aiBubble,
            borderLeftColor: activePersona.color,
            boxShadow: `inset 3px 0 0 ${activePersona.color}`,
            padding: 0,
            minWidth: 200,
          }}>
            <CoachThinking persona={activePersona} />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
