"use client";

import { FIGHTERS } from "@/lib/fighters";
import { sectionLabel } from "@/components/ui/brand";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";

const TECH_Q = {
  en: (fighter, tech) => `Coach, teach me ${fighter.name}'s "${tech.title}" technique. What are the key points I must focus on?`,
  mn: (fighter, tech) => `Coach, ${fighter.name}-ийн "${tech.title}" техникийг заагаарай. Яг юунд анхаарах ёстой вэ?`,
  ko: (fighter, tech) => `코치님, ${fighter.name}의 "${tech.title}" 기술을 가르쳐주세요. 핵심 포인트는 무엇인가요?`,
};

const SECTION_LABELS = {
  mn: "Техник асуух",
  ko: "기술 질문하기",
  en: "Ask About a Technique",
};

export default function TechniqueQuickAsk({ locale, router }) {
  const qFn = TECH_Q[locale] || TECH_Q.en;
  const cards = (FIGHTERS || []).flatMap((f) =>
    (FIGHTER_TECHNIQUES?.[f.id] || []).slice(0, 2).map((tech) => ({ fighter: f, tech }))
  );

  return (
    <section>
      <p style={{ ...sectionLabel, padding: "0 16px", marginBottom: 12 }}>{SECTION_LABELS[locale] || SECTION_LABELS.en}</p>
      <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "0 16px 4px", scrollSnapType: "x mandatory", scrollPaddingLeft: 16, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
        {cards.map(({ fighter, tech }) => (
          <button
            key={`${fighter.id}-${tech.title}`}
            type="button"
            onClick={() => router.push(`/${locale}/coach/chat?q=${encodeURIComponent(qFn(fighter, tech))}`)}
            style={{
              flexShrink: 0, scrollSnapAlign: "start",
              width: 148, height: 196, padding: 0,
              borderRadius: 24, overflow: "hidden",
              position: "relative", cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#0a0a0c", fontFamily: "inherit",
            }}
          >
            {/* No fighter photos (no rights): a graphic card in the style's accent colour. */}
            <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 80% at 80% 0%, ${fighter.accent}55 0%, ${fighter.accent}12 45%, transparent 70%), linear-gradient(160deg, #141418 0%, #0a0a0c 100%)` }} />
            <svg aria-hidden="true" viewBox="0 0 64 64" width="56" height="56" style={{ position: "absolute", top: 18, left: 14, opacity: 0.9 }}>
              <path d="M18 30c0-9 6-15 15-15h6c7 0 12 5 12 12v9c0 8-6 14-14 14H27c-5 0-9-4-9-9v-11z" fill="none" stroke={fighter.accent} strokeWidth="3" />
              <path d="M18 34h-4c-3 0-5-2-5-5s2-5 5-5h4" fill="none" stroke={fighter.accent} strokeWidth="3" />
              <path d="M24 50v6h18v-6" fill="none" stroke={fighter.accent} strokeWidth="3" />
            </svg>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 12px", textAlign: "left" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: fighter.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                {fighter.name}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", lineHeight: 1.25 }}>
                {tech.title}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
