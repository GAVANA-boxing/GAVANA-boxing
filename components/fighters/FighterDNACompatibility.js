"use client";

import { GOLD } from "@/lib/tokens";
import { computeFighterCompatibility } from "@/lib/fighterDNA";

// ─── DNA Compatibility Score panel ───────────────────────────────────────────
// Props: fighter, userDNA (from Firestore), locale
export default function FighterDNACompatibility({ fighter, userDNA, locale }) {
  if (!userDNA?.styleMix) return null;

  const compat = computeFighterCompatibility(fighter, userDNA.styleMix);
  if (!compat) return null;

  const compatColor =
    compat.pct >= 80 ? "#34D399" :
    compat.pct >= 60 ? GOLD :
    compat.pct >= 40 ? "#F59E0B" : "#94A3B8";

  const insight =
    compat.pct >= 80
      ? (locale === "mn" ? "Таны ДНХ энэ хэв маягтай өндөр нийцтэй" : locale === "ko" ? "당신의 DNA와 높은 호환성" : "Your DNA is highly aligned with this style")
      : compat.pct >= 60
      ? (locale === "mn" ? "Сайн нийцэл — гол шинж чанарууд таарч байна" : locale === "ko" ? "좋은 호환성 — 핵심 스타일 연결" : "Good match — key style aspects connect")
      : compat.pct >= 40
      ? (locale === "mn" ? "Хэсэгчлэн нийцэлтэй — судлах нь үнэ цэнэтэй" : locale === "ko" ? "부분 일치 — 학습 가치 있음" : "Partial alignment — valuable to study")
      : (locale === "mn" ? "Эсрэг хэв маяг — хүрээгээ өргөтгөхийн тулд судал" : locale === "ko" ? "반대 스타일 — 범위 확장을 위해 학습" : "Opposite styles — study to expand your range");

  const heading =
    locale === "mn" ? "ДНХ НИЙЦЭЛ" :
    locale === "ko" ? "DNA 호환성" :
    "DNA COMPATIBILITY";

  return (
    <div style={{ marginBottom: 16, padding: "13px 16px", borderRadius: 14, background: `${compatColor}08`, border: `1px solid ${compatColor}28` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: compatColor, textTransform: "uppercase" }}>
          {heading}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 1000, color: compatColor, fontFamily: "monospace", lineHeight: 1 }}>{compat.pct}%</span>
          {compat.rank <= 3 && (
            <span style={{ fontSize: 9, fontWeight: 900, color: GOLD }}>★ #{compat.rank}</span>
          )}
        </div>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: `${compat.pct}%`, height: "100%", background: compatColor, borderRadius: 2, boxShadow: `0 0 8px ${compatColor}55`, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
      </div>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{insight}</p>
    </div>
  );
}
