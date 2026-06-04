"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";
import { GOLD, RED, redAlpha, goldAlpha, blackAlpha, whiteAlpha } from "@/lib/tokens";
import DiagramPlaceholder from "@/components/visual/DiagramPlaceholder";
import FighterSilhouette from "@/components/visual/FighterSilhouette";
import { BLOCK_DIAGRAM_TYPE } from "@/lib/visualAssets";

const DIFF_COLOR = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#F87171" };
const BLOCK_ICON = { FOOT: "👟", WEIGHT: "⚖️", ANGLE: "📐", GUARD: "🛡️" };

// ── Fighter technique list sheet ──────────────────────────────────────────────
function FighterTechSheet({ fighter, onClose, onSelectTech, locale }) {
  const techniques = FIGHTER_TECHNIQUES[fighter.id] || [];
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.7)" }} />
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 301,
        background: "#0f0c0d",
        borderRadius: "20px 20px 0 0",
        border: "1px solid rgba(255,255,255,0.09)", borderBottom: "none",
        maxHeight: "72vh",
        display: "flex", flexDirection: "column",
      }}>
        {/* Handle */}
        <div style={{ padding: "12px 16px 10px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)", margin: "0 auto 12px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: `${fighter.accent}20`, border: `1.5px solid ${fighter.accent}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 900, color: fighter.accent,
            }}>
              {fighter.name.split(" ").map(w => w[0]).join("").slice(0, 2)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>{fighter.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: fighter.accent, fontWeight: 700 }}>{fighter.style}</p>
            </div>
          </div>
        </div>
        {/* Technique list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
          {techniques.length === 0 && (
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
              {locale === "mn" ? "Техник хоосон байна" : "No techniques available"}
            </p>
          )}
          {techniques.map((tech, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectTech(fighter, tech)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, padding: "12px 13px", marginBottom: 8,
                borderRadius: 12, border: `1px solid rgba(255,255,255,0.08)`,
                background: "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "left",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 3px", fontSize: 13, fontWeight: 800, color: "#fff", lineHeight: 1.3 }}>{tech.title}</p>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.3 }}>
                  {(tech.teachingBlocks || []).map(b => b.type).join(" · ")}
                </p>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 900, letterSpacing: 0.5,
                color: DIFF_COLOR[tech.difficulty] || GOLD,
                background: `${DIFF_COLOR[tech.difficulty] || GOLD}16`,
                border: `1px solid ${DIFF_COLOR[tech.difficulty] || GOLD}28`,
                borderRadius: 6, padding: "3px 8px", textTransform: "uppercase", flexShrink: 0,
              }}>{tech.difficulty}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Single technique detail sheet ─────────────────────────────────────────────
function TechDetailSheet({ fighter, technique, onClose, onBack, locale, router }) {
  const SECTION = (emoji, label, children) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.45)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>{emoji}</span>{label}
      </div>
      {children}
    </div>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 302, background: "rgba(0,0,0,0.75)" }} />
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
              <button type="button" onClick={onBack} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "2px 6px 2px 0", fontSize: 18, lineHeight: 1 }}>‹</button>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{technique.title}</p>
                <span style={{
                  fontSize: 9, fontWeight: 900, color: DIFF_COLOR[technique.difficulty] || GOLD,
                  background: `${DIFF_COLOR[technique.difficulty] || GOLD}16`, border: `1px solid ${DIFF_COLOR[technique.difficulty] || GOLD}28`,
                  borderRadius: 6, padding: "2px 7px", textTransform: "uppercase",
                }}>{technique.difficulty}</span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: fighter.accent, fontWeight: 700 }}>{fighter.name} · {fighter.style}</p>
            </div>
          </div>
        </div>

        {/* ── Technique hero visual zone ── */}
        {(() => {
          const firstBlockType = technique.teachingBlocks?.[0]?.type;
          const diagramType = BLOCK_DIAGRAM_TYPE[firstBlockType] || "ring";
          const acc = fighter.accent;
          return (
            <div style={{
              flexShrink: 0, position: "relative", overflow: "hidden",
              borderBottom: `1px solid rgba(255,255,255,0.06)`,
            }}>
              <div style={{ width: "100%", height: 108, background: `${acc}08`, display: "flex", overflow: "hidden" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <DiagramPlaceholder type={diagramType} accent={acc} width="100%" height={108} />
                </div>
                <div style={{ width: 72, flexShrink: 0 }}>
                  <FighterSilhouette fighterId={fighter.id} accent={fighter.accent} width={72} height={108} />
                </div>
              </div>
              {/* Gradient overlay — only left side; right is silhouette zone */}
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, rgba(15,12,13,0.78) 0%, transparent 55%)`, pointerEvents: "none" }} />
              {/* Difficulty badge */}
              <div style={{ position: "absolute", top: 10, left: 14 }}>
                <span style={{
                  fontSize: 8, fontWeight: 900, letterSpacing: 1,
                  color: DIFF_COLOR[technique.difficulty] || GOLD,
                  background: `${DIFF_COLOR[technique.difficulty] || GOLD}18`,
                  border: `1px solid ${DIFF_COLOR[technique.difficulty] || GOLD}30`,
                  borderRadius: 6, padding: "3px 8px", textTransform: "uppercase",
                }}>
                  {technique.difficulty}
                </span>
              </div>
              {/* Teaching block types */}
              <div style={{ position: "absolute", bottom: 10, left: 14, display: "flex", gap: 5 }}>
                {(technique.teachingBlocks || []).map((b) => (
                  <span key={b.type} style={{
                    fontSize: 7.5, fontWeight: 900, color: acc,
                    background: `${acc}18`, border: `1px solid ${acc}30`,
                    borderRadius: 4, padding: "2px 6px", letterSpacing: 0.8, textTransform: "uppercase",
                  }}>
                    {b.type}
                  </span>
                ))}
              </div>
              {/* Video button / coming-soon pill */}
              {technique.videoId ? (
                <a
                  href={`https://www.youtube.com/watch?v=${technique.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    position: "absolute", top: 10, right: 14,
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 20,
                    background: "rgba(255,0,0,0.18)", border: "1px solid rgba(255,80,80,0.4)",
                    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                    textDecoration: "none",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF4444" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <span style={{ fontSize: 8, fontWeight: 900, color: "#FF8080", letterSpacing: 0.8 }}>
                    {locale === "mn" ? "Видео үзэх" : locale === "ko" ? "영상 보기" : "Watch Tutorial"}
                  </span>
                </a>
              ) : (
                <div style={{
                  position: "absolute", top: 10, right: 14,
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "3px 9px", borderRadius: 20,
                  background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)",
                  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                }}>
                  <span style={{ fontSize: 10 }}>🎬</span>
                  <span style={{ fontSize: 7.5, fontWeight: 900, color: "rgba(255,255,255,0.45)", letterSpacing: 0.8 }}>
                    {locale === "mn" ? "Видео удахгүй" : locale === "ko" ? "영상 출시 예정" : "Video coming soon"}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
          {/* What it is */}
          {technique.explanation && SECTION("📖", locale === "mn" ? "Тайлбар" : "What it is",
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.72)", lineHeight: 1.6 }}>{technique.explanation}</p>
          )}

          {/* Teaching blocks */}
          {(technique.teachingBlocks || []).length > 0 && SECTION("⚡", locale === "mn" ? "Зааварчилгаа" : "How to do it",
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {technique.teachingBlocks.map((block, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{BLOCK_ICON[block.type] || "▸"}</span>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>{block.type}</p>
                    <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.45 }}>{block.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Body cue */}
          {technique.bodyCue && SECTION("🤸", locale === "mn" ? "Бие мэдрэмж" : "Body feel",
            <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, fontStyle: "italic" }}>&ldquo;{technique.bodyCue}&rdquo;</p>
          )}

          {/* What you should feel */}
          {(technique.whatYouShouldFeel || []).length > 0 && SECTION("✋", locale === "mn" ? "Юу мэдрэх вэ" : "What you should feel",
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {technique.whatYouShouldFeel.map((cue, i) => (
                <div key={i} style={{ display: "flex", gap: 8, padding: "8px 12px", borderRadius: 8, background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.18)" }}>
                  <span style={{ color: "#60A5FA", flexShrink: 0, fontSize: 13 }}>·</span>
                  <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.45, fontStyle: "italic" }}>{cue}</p>
                </div>
              ))}
            </div>
          )}

          {/* Common mistake */}
          {technique.commonMistake && SECTION("⚠️", locale === "mn" ? "Нийтлэг алдаа" : "Common mistake",
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.22)" }}>
              <p style={{ margin: 0, fontSize: 12.5, color: "#fca5a5", lineHeight: 1.45 }}>{technique.commonMistake}</p>
            </div>
          )}

          {/* Drill */}
          {(technique.drillSteps || []).length > 0 && SECTION("🎯", locale === "mn" ? "Дасгал" : "Drill",
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {technique.drillSteps.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: `${GOLD}18`, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: GOLD, flexShrink: 0 }}>{i + 1}</span>
                  <p style={{ margin: 0, fontSize: 12.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.45 }}>{step}</p>
                </div>
              ))}
            </div>
          )}

          {/* Coach notes */}
          {technique.coachNotes && SECTION("💡", locale === "mn" ? "Коучийн зөвлөгөө" : "Coach notes",
            <p style={{ margin: 0, fontSize: 12.5, color: GOLD, lineHeight: 1.5 }}>{technique.coachNotes}</p>
          )}

          {/* Scoring metrics */}
          {(technique.scoringMetrics || []).length > 0 && SECTION("📊", locale === "mn" ? "GAVANA оноо өгөх аргачлал" : "How GAVANA scores this",
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {technique.scoringMetrics.map((m, i) => (
                <div key={i} style={{ padding: "9px 12px", borderRadius: 8, background: "rgba(245,196,81,0.06)", border: "1px solid rgba(245,196,81,0.18)" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 900, color: GOLD, letterSpacing: 0.5 }}>{m.metric}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{m.description}</p>
                </div>
              ))}
            </div>
          )}

          <div style={{ height: "calc(80px + env(safe-area-inset-bottom))" }} />
        </div>

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
            {locale === "mn" ? "⚡ Энэ техникийг дасгалдах" : locale === "ko" ? "⚡ 이 기술 훈련하기" : "⚡ Train This Technique"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main export — manages sheet stack ─────────────────────────────────────────
export default function TechniqueSheet({ fighter, onClose, locale, router }) {
  const [mounted, setMounted] = useState(false);
  const [selectedTech, setSelectedTech] = useState(null);
  useEffect(() => { setMounted(true); }, []);
  if (!fighter || !mounted) return null;

  const content = selectedTech ? (
    <TechDetailSheet
      fighter={fighter}
      technique={selectedTech}
      onClose={onClose}
      onBack={() => setSelectedTech(null)}
      locale={locale}
      router={router}
    />
  ) : (
    <FighterTechSheet
      fighter={fighter}
      onClose={onClose}
      onSelectTech={(f, t) => setSelectedTech(t)}
      locale={locale}
    />
  );

  return createPortal(content, document.body);
}
