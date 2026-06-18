"use client";

import { RED, BORDER, BORDER_2, RADIUS, redAlpha, whiteAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";

/**
 * Props:
 *   locale      – "mn" | "ko" | "en"
 *   onBack      – () => void
 *   onCompose   – () => void
 */
export default function InboxHeader({ locale, onBack, onCompose }) {
  const title    = loc(locale, "Мессеж", "메시지", "Messages");
  const eyebrow  = loc(locale, "ТЭМЦЭГЧИД", "파이터스", "COMBAT · COMMS");
  const newMsg   = loc(locale, "Шинэ мессеж", "새 메시지", "New Message");

  return (
    <div style={s.header}>
      <button type="button" onClick={onBack} style={s.backBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <div style={s.center}>
        <p style={s.eyebrow}>{eyebrow}</p>
        <span style={s.title}>{title}</span>
      </div>

      <button type="button" aria-label="New message" onClick={onCompose} style={s.composeBtn} title={newMsg}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </button>
    </div>
  );
}

const s = {
  header: {
    position: "sticky", top: 0, zIndex: 20,
    display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", gap: 8,
    padding: "calc(14px + env(safe-area-inset-top)) 16px 14px",
    background: "rgba(9,9,9,0.94)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
    borderBottom: `1px solid ${BORDER}`,
  },
  center: { display: "flex", flexDirection: "column", alignItems: "center", gap: 1 },
  eyebrow: { margin: 0, fontSize: 9, fontWeight: 900, letterSpacing: "2px", textTransform: "uppercase", color: RED },
  title: { fontSize: 17, fontWeight: 950, color: "#fff", letterSpacing: -0.3 },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.sm,
    border: `1px solid ${BORDER_2}`, background: whiteAlpha(0.05),
    color: whiteAlpha(0.75), cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  composeBtn: {
    width: 40, height: 40, borderRadius: RADIUS.sm,
    border: `1px solid ${redAlpha(0.45)}`, background: redAlpha(0.12),
    color: RED, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, justifySelf: "end",
  },
};
