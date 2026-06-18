"use client";

import { useEffect, useRef } from "react";
import { RED, RED_DARK, SURFACE_1, BORDER, BORDER_2, RADIUS, redAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";

/**
 * Props:
 *   locale   – "mn" | "ko" | "en"
 *   value    – string (controlled)
 *   onChange – (value: string) => void
 *   onSend   – () => void
 *   sending  – boolean
 */
export default function ChatInput({ locale, value, onChange, onSend, sending }) {
  const inputRef = useRef(null);
  const placeholder = loc(locale, "Мессеж бичих…", "메시지 입력…", "Message…");

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div style={s.inputBar}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        style={s.input}
      />
      <button
        type="button"
        aria-label="Send message"
        onClick={onSend}
        disabled={!value.trim() || sending}
        style={{ ...s.sendBtn, opacity: value.trim() && !sending ? 1 : 0.35 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m22 2-7 20-4-9-9-4 20-7z" />
          <path d="M22 2 11 13" />
        </svg>
      </button>
    </div>
  );
}

const s = {
  inputBar: {
    flexShrink: 0, display: "flex", alignItems: "flex-end", gap: 10,
    padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
    background: "rgba(9,9,9,0.98)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
    borderTop: `1px solid ${BORDER}`,
  },
  input: {
    flex: 1, background: SURFACE_1, border: `1px solid ${BORDER_2}`,
    borderRadius: 22, padding: "11px 16px", color: "#fff",
    fontSize: 14, lineHeight: 1.4, outline: "none",
    resize: "none", maxHeight: 120, overflowY: "auto",
  },
  sendBtn: {
    flexShrink: 0, width: 44, height: 44, borderRadius: "50%", border: "none",
    background: `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", boxShadow: `0 4px 16px ${redAlpha(0.4)}`,
  },
};
