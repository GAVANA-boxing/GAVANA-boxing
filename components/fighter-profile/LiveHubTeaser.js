"use client";

import { useState } from "react";
import { whiteAlpha } from "@/lib/tokens";

const LH_L = {
  en: {
    eyebrow: "TRAINING HUB",
    title:   "Live Group Sessions",
    sub:     "Train together with fighters from your tribe. Live sessions launching soon.",
    soon:    "COMING SOON",
    notify:  "Notify me when live",
    done:    "✓ You're on the list",
  },
  mn: {
    eyebrow: "БЭЛТГЭЛИЙН ТӨВ",
    title:   "Шууд Бүлгийн Тренинг",
    sub:     "Овгийнхоо тулаанчидтай хамт бэлтгэл хийцгээе. Шууд тренинг удахгүй нээгдэнэ.",
    soon:    "УДАХГҮЙ",
    notify:  "Нээгдэхэд мэдэгдэл авах",
    done:    "✓ Бүртгэгдлээ",
  },
  ko: {
    eyebrow: "트레이닝 허브",
    title:   "라이브 그룹 세션",
    sub:     "부족 파이터들과 함께 훈련하세요. 라이브 세션이 곧 출시됩니다.",
    soon:    "출시 예정",
    notify:  "출시 시 알림 받기",
    done:    "✓ 등록 완료",
  },
};

export default function LiveHubTeaser({ locale }) {
  const L = LH_L[locale] || LH_L.en;
  const [notified, setNotified] = useState(false);
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${whiteAlpha(0.07)}`, background: whiteAlpha(0.015), marginTop: 12 }}>
      <div style={{ height: 2, background: `linear-gradient(90deg, ${whiteAlpha(0.1)}, transparent)` }} />
      <div style={{ padding: "18px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.2), textTransform: "uppercase" }}>
            {L.eyebrow}
          </span>
          <span style={{ fontSize: 8, fontWeight: 900, padding: "2px 9px", borderRadius: 999, background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.22)", color: "#FB923C", letterSpacing: 1 }}>
            {L.soon}
          </span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 1000, color: whiteAlpha(0.5), fontFamily: "var(--font-display,'Anton',sans-serif)", textTransform: "uppercase", marginBottom: 8, letterSpacing: "-0.02em" }}>
          📡 {L.title}
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 12, fontWeight: 700, color: whiteAlpha(0.28), lineHeight: 1.55 }}>
          {L.sub}
        </p>
        <button
          type="button"
          onClick={() => setNotified(true)}
          disabled={notified}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10,
            background: notified ? "rgba(52,211,153,0.07)" : whiteAlpha(0.03),
            border: `1px solid ${notified ? "rgba(52,211,153,0.22)" : whiteAlpha(0.09)}`,
            color: notified ? "#34D399" : whiteAlpha(0.35),
            fontSize: 11, fontWeight: 900, cursor: notified ? "default" : "pointer", letterSpacing: 0.5,
          }}
        >
          {notified ? L.done : L.notify}
        </button>
      </div>
    </div>
  );
}
