"use client";

import { RED, RED_DARK, RADIUS, redAlpha, whiteAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";

/**
 * Props:
 *   locale         – "mn" | "ko" | "en"
 *   onFindCoach    – () => void
 */
export default function EmptyInbox({ locale, onFindCoach }) {
  const empty      = loc(locale, "Мессеж байхгүй байна", "메시지가 없습니다", "No messages yet");
  const emptySub   = loc(locale,
    "Coach эсвэл Fighter-тэй холбогдохдоо тэдний profile дээрх «Мессеж» товчийг дарна уу.",
    "코치나 파이터의 프로필에서 '메시지' 버튼을 눌러보세요.",
    "Tap the Message button on a coach or fighter's profile to start chatting."
  );
  const findCoach  = loc(locale, "🎓 Coach хайх", "🎓 코치 찾기", "🎓 Find a Coach");

  return (
    <div style={s.empty}>
      <div style={s.icon}>💬</div>
      <p style={s.title}>{empty}</p>
      <p style={s.sub}>{emptySub}</p>
      <button type="button" style={s.findBtn} onClick={onFindCoach}>
        {findCoach}
      </button>
    </div>
  );
}

const s = {
  empty: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "48px 32px", gap: 14,
  },
  icon: {
    width: 80, height: 80, borderRadius: "50%",
    background: redAlpha(0.08), border: `1px solid ${redAlpha(0.18)}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 36, marginBottom: 6, boxShadow: `0 0 40px ${redAlpha(0.12)}`,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 950, color: "#fff" },
  sub: { margin: 0, fontSize: 13, color: whiteAlpha(0.38), textAlign: "center", lineHeight: 1.65, maxWidth: 270 },
  findBtn: {
    padding: "12px 26px", borderRadius: RADIUS.full, border: "none",
    background: `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
    color: "#fff", fontSize: 13, fontWeight: 900,
    cursor: "pointer", marginTop: 6, boxShadow: `0 6px 20px ${redAlpha(0.35)}`,
  },
};
