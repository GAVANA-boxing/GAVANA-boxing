"use client";

import s from "@/components/coach/coachChatStyles";

/**
 * Input bar at the bottom of the chat page:
 * quick-action chips (when messages exist), text input, send button.
 *
 * Props:
 *   input            {string}
 *   onInputChange    {(value: string) => void}
 *   onKeyDown        {(e: KeyboardEvent) => void}
 *   onSend           {() => void}
 *   loading          {boolean}
 *   reviewLoading    {boolean}
 *   inputRef         {React.Ref}
 *   activePersona    {{ color: string }}
 *   quickActions     {string[]}  — translated labels
 *   hasMessages      {boolean}
 *   lastSessionData  {object|null}
 *   onQuickAction    {(text: string) => void}
 *   onReview         {() => void}
 *   placeholder      {string}
 *   reviewLabel      {string}
 */
export default function CoachInputArea({
  input,
  onInputChange,
  onKeyDown,
  onSend,
  loading,
  reviewLoading,
  inputRef,
  activePersona,
  quickActions,
  hasMessages,
  lastSessionData,
  onQuickAction,
  onReview,
  placeholder,
  reviewLabel,
}) {
  return (
    <div style={s.inputArea}>
      {hasMessages && (
        <div style={s.quickRow}>
          {lastSessionData && (
            <button
              type="button"
              style={{
                ...s.quickChipSm,
                color: activePersona.color,
                borderColor: `${activePersona.color}44`,
                background: `${activePersona.color}0f`,
              }}
              disabled={loading || reviewLoading}
              onClick={onReview}
            >
              📋 {reviewLabel}
            </button>
          )}
          {quickActions.map((qa) => (
            <button
              key={qa}
              type="button"
              style={s.quickChipSm}
              disabled={loading}
              onClick={() => onQuickAction(qa)}
            >
              {qa}
            </button>
          ))}
        </div>
      )}
      <div style={s.inputRow}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={loading}
          style={s.input}
        />
        <button
          type="button"
          disabled={!input.trim() || loading}
          style={{
            ...s.sendBtn,
            background: input.trim() && !loading ? activePersona.color : "#1e1e1e",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            boxShadow: input.trim() && !loading ? `0 8px 24px ${activePersona.color}44` : "none",
          }}
          onClick={onSend}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 12 20 5l-5.2 14-3.1-5.8L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
