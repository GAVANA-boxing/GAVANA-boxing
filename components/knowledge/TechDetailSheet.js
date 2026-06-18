"use client";
import { GOLD } from "@/lib/tokens";
import { T, DIFF_COLOR } from "./TechniqueSheetLocale";
import TechDetailHero from "./TechDetailHero";
import TechDetailContent from "./TechDetailContent";

/**
 * Full-screen bottom-sheet for a single technique's details.
 * Composes TechDetailHero (visual zone) + TechDetailContent (scrollable body)
 * and renders the Train CTA button.
 *
 * @param {{ fighter: object, technique: object, onClose: () => void, onBack?: () => void, locale: string, router?: object }} props
 */
export default function TechDetailSheet({ fighter, technique, onClose, onBack, locale, router }) {
  const t = T[locale] || T.en;

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 302, background: "rgba(0,0,0,0.75)" }}
      />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 303,
        background: "#0f0c0d",
        borderRadius: "20px 20px 0 0",
        border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none",
        maxHeight: "82vh",
        display: "flex", flexDirection: "column",
      }}>
        {/* Handle + header */}
        <div style={{ padding: "12px 16px 14px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)", margin: "0 auto 12px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "2px 6px 2px 0", fontSize: 18, lineHeight: 1 }}
              >‹</button>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{technique.title}</p>
                <span style={{
                  fontSize: 9, fontWeight: 900,
                  color: DIFF_COLOR[technique.difficulty] || GOLD,
                  background: `${DIFF_COLOR[technique.difficulty] || GOLD}16`,
                  border: `1px solid ${DIFF_COLOR[technique.difficulty] || GOLD}28`,
                  borderRadius: 6, padding: "2px 7px", textTransform: "uppercase",
                }}>{technique.difficulty}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: fighter.accent, fontWeight: 700 }}>{fighter.name} · {fighter.style}</p>
            </div>
          </div>
        </div>

        <TechDetailHero fighter={fighter} technique={technique} locale={locale} />

        <TechDetailContent fighter={fighter} technique={technique} locale={locale} />

        {/* Train CTA */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "12px 16px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          background: "linear-gradient(to top, #0f0c0d 70%, transparent)",
        }}>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("gavana_lesson_context", JSON.stringify({
                  fighter: { id: fighter.id, name: fighter.name, accent: fighter.accent, style: fighter.style },
                  lesson: { title: technique.title, difficulty: technique.difficulty, bodyCue: technique.bodyCue },
                }));
              }
              onClose();
              if (router) router.push(`/${locale}/train`);
            }}
            style={{
              width: "100%", padding: "14px 0", borderRadius: 12,
              background: `linear-gradient(145deg, ${fighter.accent}, ${fighter.accent}bb)`,
              border: "none", color: "#fff", fontSize: 15, fontWeight: 900,
              letterSpacing: 1, textTransform: "uppercase", cursor: "pointer",
              boxShadow: `0 8px 28px ${fighter.accent}40`,
            }}
          >
            {t.trainCta}
          </button>
        </div>
      </div>
    </>
  );
}
