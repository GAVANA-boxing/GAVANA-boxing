"use client";

export default function ProPriorityMatchingBanner({ userArchetype, userTier, locale, router }) {
  if (!userArchetype) return null;

  const isPro = userTier === "pro" || userTier === "champion";
  if (isPro) return null;

  return (
    <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 14, background: "rgba(245,196,81,0.05)", border: "1px solid rgba(245,196,81,0.2)", display: "flex", gap: 12, alignItems: "center" }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(245,196,81,0.7)", textTransform: "uppercase", marginBottom: 3 }}>
          {locale === "mn" ? "ПРО ДАВУУ ЭРХ" : locale === "ko" ? "프로 특혜" : "PRO BENEFIT"}
        </div>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
          {locale === "mn" ? "ДНХ-д суурилсан тренерийн тохирол" : locale === "ko" ? "DNA 기반 코치 매칭" : "DNA-matched coach recommendations"}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
          {locale === "mn" ? "Про болоход таны архетиптэй тохирох тренерийг шууд харна" : locale === "ko" ? "프로 업그레이드 시 아키타입에 맞는 코치를 바로 확인" : "Pro members see coaches matched to their archetype first"}
        </div>
      </div>
      <button
        type="button"
        onClick={() => router.push(`/${locale}/fighter-profile?tab=dna`)}
        style={{ padding: "8px 12px", borderRadius: 10, background: "linear-gradient(135deg,#F5C451,#D4A017)", border: "none", color: "#000", fontSize: 10, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}
      >
        Pro →
      </button>
    </div>
  );
}
