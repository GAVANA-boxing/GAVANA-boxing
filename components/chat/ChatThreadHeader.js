"use client";

import Image from "next/image";
import { GOLD, BORDER, BORDER_2, RADIUS, whiteAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";

/**
 * Props:
 *   locale          – "mn" | "ko" | "en"
 *   recipientInfo   – { displayName, photoURL }
 *   recipientIsCoach – boolean
 *   onBack          – () => void
 *   onAvatarPress   – () => void
 */
export default function ChatThreadHeader({
  locale,
  recipientInfo,
  recipientIsCoach,
  onBack,
  onAvatarPress,
}) {
  const coachLabel = loc(locale, "Coach", "코치", "Coach");

  return (
    <div style={s.header}>
      <button type="button" aria-label="Back" onClick={onBack} style={s.backBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button type="button" onClick={onAvatarPress} style={s.headerUser}>
        <div style={{ position: "relative" }}>
          {recipientInfo.photoURL
            ? <Image
                src={recipientInfo.photoURL}
                alt=""
                width={34}
                height={34}
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  ...(recipientIsCoach ? { border: `2px solid ${GOLD}` } : {}),
                }}
              />
            : <div style={{ ...s.avatarFallback, ...(recipientIsCoach ? { border: `2px solid ${GOLD}`, background: "#1a1500" } : {}) }}>
                {(recipientInfo.displayName || "?").charAt(0).toUpperCase()}
              </div>
          }
          {recipientIsCoach && (
            <div style={s.coachDot}>🎓</div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
          <span style={s.headerName}>{recipientInfo.displayName || "Fighter"}</span>
          {recipientIsCoach && (
            <span style={s.coachLabel}>{coachLabel}</span>
          )}
        </div>
      </button>

      <div style={{ width: 40 }} />
    </div>
  );
}

const s = {
  header: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "calc(14px + env(safe-area-inset-top)) 16px 12px",
    background: "rgba(9,9,9,0.96)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderBottom: `1px solid ${BORDER}`,
    zIndex: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.full,
    border: `1px solid ${BORDER_2}`, background: whiteAlpha(0.04),
    color: whiteAlpha(0.7), cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  headerUser: {
    display: "flex", alignItems: "center", gap: 9,
    background: "none", border: "none", cursor: "pointer", padding: 0,
  },
  avatarFallback: {
    width: 34, height: 34, borderRadius: "50%",
    background: "#1a1a1a", border: `1px solid ${BORDER_2}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 900, color: "#fff",
  },
  coachDot: {
    position: "absolute", bottom: -2, right: -2,
    width: 14, height: 14, borderRadius: "50%",
    background: GOLD, border: "2px solid #0B0B0C",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 7,
  },
  headerName: { fontSize: 15, fontWeight: 900, color: "#fff" },
  coachLabel: { fontSize: 9, fontWeight: 900, color: GOLD, letterSpacing: 0.5 },
};
