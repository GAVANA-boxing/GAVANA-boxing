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
            {fighter.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fighter.imageUrl}
                alt={fighter.name}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%" }}
              />
            )}
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.88) 100%), ${fighter.accent}18` }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 12px", textAlign: "left" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: fighter.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
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
