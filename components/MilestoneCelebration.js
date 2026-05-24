"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GOLD, goldAlpha } from "@/lib/tokens";

const MILESTONES = [10, 25, 50, 100, 200, 500];

const MILESTONE_META = {
  10:  { icon: "🥊", tier: "#FB923C", en: "10 Sessions Complete!", mn: "10 дасгал дуусгалаа!" },
  25:  { icon: "🔥", tier: GOLD,      en: "25 Sessions — On Fire!", mn: "25 дасгал — Идэвхтэй!" },
  50:  { icon: "⚡", tier: "#60A5FA", en: "50 Sessions — Half Century!", mn: "50 дасгал — Тэнцүү зуун!" },
  100: { icon: "🏆", tier: GOLD,      en: "100 Sessions — Champion!", mn: "100 дасгал — Чемпион!" },
  200: { icon: "💎", tier: "#A78BFA", en: "200 Sessions — Elite!", mn: "200 дасгал — Элит!" },
  500: { icon: "👑", tier: "#F472B6", en: "500 Sessions — Legend!", mn: "500 дасгал — Домог!" },
};

export default function MilestoneCelebration({ sessionCount, userId, locale }) {
  const [milestone, setMilestone] = useState(null);

  useEffect(() => {
    if (!sessionCount || !userId) return;
    const hit = MILESTONES.find((m) => m === sessionCount);
    if (!hit) return;

    let active = true;
    getDoc(doc(db, "users", userId)).then((snap) => {
      if (!active) return;
      const lastCelebrated = snap.data()?.lastMilestoneCelebrated || 0;
      if (lastCelebrated >= hit) return;
      setMilestone(hit);
      updateDoc(doc(db, "users", userId), { lastMilestoneCelebrated: hit }).catch(() => {});
    }).catch(() => {});
    return () => { active = false; };
  }, [sessionCount, userId]);

  if (!milestone) return null;
  const meta = MILESTONE_META[milestone] || MILESTONE_META[10];
  const mn = locale === "mn";

  return (
    <div
      onClick={() => setMilestone(null)}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.92)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      <style>{`
        @keyframes milePop { from { opacity:0; transform:scale(0.6) translateY(30px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes confettiFall { from { transform: translateY(-20px) rotate(0deg); opacity:1; } to { transform: translateY(100vh) rotate(720deg); opacity:0; } }
        .confetti-piece { position:fixed; top:-10px; width:8px; height:8px; border-radius:2px; animation: confettiFall linear forwards; }
      `}</style>

      {/* Confetti */}
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i / 24) * 100}%`,
            background: ["#FF3B30","#F5C451","#34D399","#60A5FA","#A78BFA","#FB923C"][i % 6],
            animationDuration: `${1.2 + (i % 5) * 0.3}s`,
            animationDelay: `${(i % 8) * 0.08}s`,
            width: 6 + (i % 3) * 4, height: 6 + (i % 3) * 4,
          }}
        />
      ))}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          textAlign: "center",
          animation: "milePop 0.5s cubic-bezier(0.16,1,0.3,1) both",
          padding: "40px 32px 32px",
          borderRadius: 28,
          background: "linear-gradient(145deg, #111 0%, #0B0B0C 100%)",
          border: `2px solid ${meta.tier}40`,
          maxWidth: 320, width: "100%",
          boxShadow: `0 0 60px ${meta.tier}30`,
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16, lineHeight: 1 }}>{meta.icon}</div>
        <div style={{ fontSize: 11, fontWeight: 900, color: meta.tier, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
          {mn ? "Амжилт!" : "Achievement Unlocked"}
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 8 }}>
          {mn ? meta.mn : meta.en}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600, marginBottom: 28 }}>
          {mn
            ? "Хатуу зориг, тогтвортой дасгал — үргэлжлүүл!"
            : "Hard work and consistency — keep pushing!"}
        </div>
        <button
          type="button"
          onClick={() => setMilestone(null)}
          style={{
            width: "100%", padding: "14px 0", borderRadius: 14,
            background: meta.tier, border: "none",
            color: "#000", fontSize: 15, fontWeight: 900, cursor: "pointer",
          }}
        >
          {mn ? "Үргэлжлүүл 💪" : "Keep Going 💪"}
        </button>
      </div>
    </div>
  );
}
