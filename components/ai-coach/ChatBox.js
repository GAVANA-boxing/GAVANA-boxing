"use client";

import { loc } from "@/lib/loc";
import { blackAlpha } from "@/lib/tokens";
import { translate } from "@/lib/i18n";
import styles from "@/components/aiCoachStyles";
import CoachResponseCard from "@/components/coach/CoachResponseCard";

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12 20 5l-5.2 14-3.1-5.8L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ChatBox({
  messages,
  messagesEndRef,
  input,
  onInputChange,
  onKeyPress,
  onSend,
  loading,
  activePersona,
  locale,
}) {
  const t = (key) => translate(locale, key);

  return (
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
              <p style={styles.introHint}>
                {locale === "mn"
                  ? "ДООРХ ТОВЧЛУУР ДАРАХ ЭСВЭЛ БИЧНЭ ҮҮ"
                  : locale === "ko"
                  ? "빠른 액션을 탭하거나 아래에 입력하세요"
                  : "TAP A QUICK ACTION OR TYPE BELOW"}
              </p>
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
                    whiteSpace: "normal",
                  } : {}),
                }}
              >
                {message.role === "assistant" && message.structured
                  ? <CoachResponseCard structured={message.structured} accentColor={activePersona.color} locale={locale} />
                  : message.content
                }
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
          onChange={onInputChange}
          onKeyPress={onKeyPress}
          placeholder={t("coachPlaceholder")}
          disabled={loading}
          style={{ ...styles.input, borderColor: input ? `${activePersona.color}40` : "rgba(255,255,255,0.08)" }}
        />
        <button
          type="button"
          onClick={onSend}
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
  );
}
