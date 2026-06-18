"use client";

import Image from "next/image";
import { RED, RED_DARK, GOLD, SURFACE_1, BORDER, BORDER_2, RADIUS, redAlpha, goldAlpha, blackAlpha, whiteAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";
import { formatTime } from "./chatUtils";

/**
 * Props:
 *   convo      – Firestore conversation object
 *   other      – { id, displayName, photoURL, isCoach, coachVerified }
 *   currentUid – current user's uid
 *   locale     – "mn" | "ko" | "en"
 *   onClick    – () => void
 */
export default function ConversationRow({ convo, other, currentUid, locale, onClick }) {
  const isCoach = other.isCoach || other.coachVerified;
  const unread  = convo.unreadCount?.[currentUid] || 0;
  const isMe    = convo.lastMessageSenderId === currentUid;

  const youPrefix  = loc(locale, "Та: ", "나: ", "You: ");
  const startLabel = loc(locale, "Яриа эхлүүл…", "대화를 시작하세요…", "Start a conversation…");
  const coachLabel = loc(locale, "Coach", "코치", "Coach");

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...s.row, ...(unread > 0 ? s.rowUnread : {}) }}
    >
      <div style={s.avatarWrap}>
        {other.photoURL
          ? <Image
              src={other.photoURL}
              alt=""
              width={52}
              height={52}
              style={{
                borderRadius: "50%", objectFit: "cover",
                ...(isCoach ? { border: `2px solid ${GOLD}` } : {}),
              }}
            />
          : <div style={{ ...s.avatarFallback, ...(isCoach ? { border: `2px solid ${GOLD}`, background: "#1a1500" } : {}) }}>
              {(other.displayName || "?").charAt(0).toUpperCase()}
            </div>
        }
        {isCoach && <div style={s.coachBadge}>🎓</div>}
        {!isCoach && unread > 0 && <div style={s.unreadDot} />}
      </div>

      <div style={s.rowBody}>
        <div style={s.rowTop}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ ...s.name, ...(unread > 0 ? { color: "#fff", fontWeight: 900 } : {}) }}>
              {other.displayName || "Fighter"}
            </span>
            {isCoach && <span style={s.coachTag}>{coachLabel}</span>}
          </div>
          <span style={s.time}>{formatTime(convo.lastMessageAt, locale)}</span>
        </div>
        <div style={{ ...s.preview, ...(unread > 0 ? { color: "rgba(255,255,255,0.7)" } : {}) }}>
          {convo.lastMessage ? `${isMe ? youPrefix : ""}${convo.lastMessage}` : startLabel}
        </div>
      </div>

      {unread > 0 && <div style={s.badge}>{unread > 9 ? "9+" : unread}</div>}
    </button>
  );
}

const s = {
  row: {
    display: "flex", alignItems: "center", gap: 13,
    padding: "13px 14px",
    background: SURFACE_1, border: `1px solid ${BORDER}`,
    borderLeft: "2.5px solid transparent",
    borderRadius: `2px ${RADIUS.lg}px ${RADIUS.lg}px 2px`,
    cursor: "pointer", width: "100%", textAlign: "left",
    WebkitTapHighlightColor: "transparent",
    transition: "background 120ms ease",
    boxShadow: `0 2px 12px ${blackAlpha(0.2)}`,
  },
  rowUnread: {
    background: `linear-gradient(90deg, ${redAlpha(0.1)}, ${SURFACE_1})`,
    borderLeftColor: RED,
    borderColor: redAlpha(0.12),
  },
  avatarWrap: { position: "relative", flexShrink: 0 },
  avatarFallback: {
    width: 52, height: 52, borderRadius: "50%",
    background: `linear-gradient(145deg, ${redAlpha(0.6)}, #1a1a1a)`,
    border: `1px solid ${redAlpha(0.3)}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, fontWeight: 900, color: "#fff",
  },
  coachBadge: {
    position: "absolute", bottom: -2, right: -2,
    width: 20, height: 20, borderRadius: "50%",
    background: GOLD, border: "2px solid #090909",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
  },
  unreadDot: {
    position: "absolute", bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: "50%",
    background: RED, border: "2px solid #090909",
    boxShadow: `0 0 8px ${redAlpha(0.9)}`,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  name: { fontSize: 14, fontWeight: 800, color: "#fff", lineHeight: 1 },
  coachTag: {
    fontSize: 9, fontWeight: 900, color: GOLD,
    background: goldAlpha(0.12), border: `1px solid ${goldAlpha(0.35)}`,
    borderRadius: RADIUS.full, padding: "2px 6px", letterSpacing: 0.3,
  },
  time: { fontSize: 11, color: whiteAlpha(0.3), fontWeight: 600, flexShrink: 0 },
  preview: {
    fontSize: 13, color: whiteAlpha(0.38),
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3,
  },
  badge: {
    flexShrink: 0, minWidth: 22, height: 22, borderRadius: RADIUS.full,
    background: `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
    color: "#fff", fontSize: 10, fontWeight: 900,
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "0 6px", boxShadow: `0 2px 8px ${redAlpha(0.5)}`,
  },
};
