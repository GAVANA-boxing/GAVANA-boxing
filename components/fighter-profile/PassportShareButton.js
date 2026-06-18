"use client";

import { useState } from "react";
import { GOLD, RADIUS, whiteAlpha } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";

const SHARE_L = {
  en: { sharePassport: "Share Passport", shared: "Shared!" },
  mn: { sharePassport: "Үнэмлэх хуваалцах", shared: "Хуваалцсан!" },
  ko: { sharePassport: "패스포트 공유", shared: "공유됨!" },
};

/**
 * Props:
 *   dna        – { archetypeKey, archetype, building, styleMix }
 *   sessions   – array of session objects with createdAt + score
 *   streak     – number (pre-computed)
 *   locale     – "en" | "mn" | "ko"
 */
export default function PassportShareButton({ dna, sessions, streak, locale }) {
  const [shared, setShared] = useState(false);
  const L = SHARE_L[locale] || SHARE_L.en;
  const acc = ARCH_TRAINING_COLORS[dna?.archetypeKey] || GOLD;

  const handleShare = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#0a0a0e";
      ctx.fillRect(0, 0, 640, 360);

      // Accent strip
      const accent = ARCH_TRAINING_COLORS[dna?.archetypeKey] || "#F5C451";
      ctx.fillStyle = accent;
      ctx.fillRect(0, 0, 4, 360);

      // GAVANA label
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "bold 11px Arial";
      ctx.letterSpacing = "3px";
      ctx.fillText("GAVANA · FIGHTER PASSPORT", 24, 36);

      // Archetype
      const archLabel = dna?.archetype || "Building…";
      ctx.fillStyle = accent;
      ctx.font = "bold 42px Arial";
      ctx.fillText(archLabel.toUpperCase(), 24, 100);

      // Divider
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(24, 116, 592, 1);

      // Stats
      const stats = [
        ["Sessions", String(sessions?.length || 0)],
        ["Best Score", sessions?.length ? (Math.max(...sessions.map((s) => s.score || 0))).toFixed(1) : "—"],
        ["Streak", `${streak}d`],
      ];
      ctx.font = "bold 10px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      stats.forEach(([label], i) => {
        ctx.fillText(label.toUpperCase(), 24 + i * 160, 148);
      });
      ctx.font = "bold 28px Arial";
      stats.forEach(([, val], i) => {
        ctx.fillStyle = i === 0 ? accent : "#fff";
        ctx.fillText(val, 24 + i * 160, 186);
      });

      // Style Mix bars
      if (dna?.styleMix) {
        const dims = ["pressure", "outboxer", "counter", "explosive", "technician"];
        const DIM_COLORS = { pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981" };
        const DIM_SHORT = { pressure: "PRESS", outboxer: "OUTBX", counter: "CNTR", explosive: "EXPLS", technician: "TECH" };
        ctx.font = "bold 9px Arial";
        dims.forEach((dim, i) => {
          const x = 24 + i * 120;
          const y = 230;
          const val = dna.styleMix[dim] || 0;
          const barH = Math.round((val / 10) * 60);
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.fillRect(x, y, 80, 60);
          ctx.fillStyle = DIM_COLORS[dim];
          ctx.fillRect(x, y + 60 - barH, 80, barH);
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.fillText(DIM_SHORT[dim], x + 8, y + 76);
        });
      }

      // Bottom: gavana.app
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "bold 10px Arial";
      ctx.fillText("gavana.app", 24, 348);

      // Download or share
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "fighter-passport.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My Fighter Passport · GAVANA" });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "fighter-passport.png";
        a.click();
      }
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch { /* silent */ }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      style={{
        width: "100%", marginTop: 14, padding: "10px 0", borderRadius: 11,
        background: shared ? "rgba(52,211,153,0.08)" : dna.building ? whiteAlpha(0.03) : `${acc}0a`,
        border: `1px solid ${shared ? "rgba(52,211,153,0.3)" : dna.building ? whiteAlpha(0.07) : `${acc}25`}`,
        color: shared ? "#34D399" : dna.building ? whiteAlpha(0.25) : acc,
        fontSize: 11, fontWeight: 900, cursor: "pointer", letterSpacing: 0.8,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
        transition: "all 0.2s ease",
      }}
    >
      {shared
        ? <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{L.shared}</>
        : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>{L.sharePassport}</>
      }
    </button>
  );
}
