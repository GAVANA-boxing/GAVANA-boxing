"use client";

import { RED, RED_DARK, SURFACE_2, BORDER_2, RADIUS, redAlpha, whiteAlpha } from "@/lib/tokens";
import { formatMsgTime, formatDateLabel, shouldShowDate } from "./chatUtils";

/**
 * Props:
 *   msg          – Firestore message object { id, senderId, text, createdAt, read }
 *   prevMsg      – previous message (or null) — used to decide if date divider shows
 *   isMe         – boolean
 *   lastSentId   – id of the most recently sent message (for checkmark highlight)
 *   locale       – "mn" | "ko" | "en"
 */
export default function MessageBubble({ msg, prevMsg, isMe, lastSentId, locale }) {
  const showDate = shouldShowDate(prevMsg, msg);

  return (
    <div>
      {showDate && (
        <div style={s.dateDivider}>
          <span style={s.dateLabel}>{formatDateLabel(msg.createdAt, locale)}</span>
        </div>
      )}
      <div style={{ ...s.bubble, ...(isMe ? s.bubbleMe : s.bubbleThem) }}>
        <div style={{ ...s.bubbleText, ...(isMe ? s.bubbleTextMe : s.bubbleTextThem) }}>
          {msg.text}
        </div>
        <div style={{ ...s.bubbleTime, display: "flex", alignItems: "center", gap: 3, ...(isMe ? { justifyContent: "flex-end" } : {}) }}>
          <span>{formatMsgTime(msg.createdAt)}</span>
          {isMe && (
            <svg
              width="12" height="12"
              viewBox="0 0 24 24" fill="none"
              stroke={msg.id === lastSentId ? RED : "rgba(255,255,255,0.3)"}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  dateDivider: { display: "flex", alignItems: "center", gap: 10, padding: "14px 0" },
  dateLabel: {
    fontSize: 11, fontWeight: 700, color: whiteAlpha(0.28),
    background: whiteAlpha(0.04), padding: "3px 10px",
    borderRadius: RADIUS.full, letterSpacing: 0.4, flexShrink: 0,
  },
  bubble: { display: "flex", flexDirection: "column", maxWidth: "75%", marginBottom: 4 },
  bubbleMe: { alignSelf: "flex-end", alignItems: "flex-end" },
  bubbleThem: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubbleText: { padding: "11px 15px", borderRadius: 20, fontSize: 14, lineHeight: 1.5, wordBreak: "break-word" },
  bubbleTextMe: {
    background: `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
    color: "#fff", borderBottomRightRadius: 5,
    boxShadow: `0 4px 20px ${redAlpha(0.32)}`,
  },
  bubbleTextThem: {
    background: SURFACE_2, color: "#fff",
    borderBottomLeftRadius: 5, border: `1px solid ${BORDER_2}`,
  },
  bubbleTime: { fontSize: 10, color: whiteAlpha(0.28), marginTop: 3, padding: "0 4px", fontWeight: 600 },
};
