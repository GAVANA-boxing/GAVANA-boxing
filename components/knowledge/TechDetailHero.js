"use client";
import DiagramPlaceholder from "@/components/visual/DiagramPlaceholder";
import FighterSilhouette from "@/components/visual/FighterSilhouette";
import { BLOCK_DIAGRAM_TYPE } from "@/lib/visualAssets";
import { GOLD } from "@/lib/tokens";
import { T, DIFF_COLOR, BLOCK_ICON } from "./TechniqueSheetLocale";

/**
 * Hero visual zone for a technique detail sheet.
 * Renders video loop > fighter photo > diagram+silhouette fallback,
 * with overlaid badges and teaching-block chips.
 *
 * @param {{ fighter: object, technique: object, locale: string }} props
 */
export default function TechDetailHero({ fighter, technique, locale }) {
  const t = T[locale] || T.en;
  const firstBlockType = technique.teachingBlocks?.[0]?.type;
  const diagramType = BLOCK_DIAGRAM_TYPE[firstBlockType] || "ring";
  const acc = fighter.accent;
  const hasVideo = !!technique.videoUrl;
  const hasFighterPhoto = !!fighter.imageUrl;
  const heroHeight = (hasVideo || hasFighterPhoto) ? 200 : 108;

  return (
    <div style={{
      flexShrink: 0, position: "relative", overflow: "hidden",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      height: heroHeight,
    }}>
      {/* ── Video loop (priority 1) ── */}
      {hasVideo ? (
        <>
          <video
            src={technique.videoUrl}
            autoPlay muted loop playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: `${acc}18`, pointerEvents: "none" }} />
        </>
      ) : hasFighterPhoto ? (
        /* ── Fighter HD photo (priority 2) ── */
        <>
          <img
            src={fighter.imageUrl}
            alt={fighter.name}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 15%" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.82) 100%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, background: `${acc}28`, pointerEvents: "none" }} />
        </>
      ) : (
        /* ── Fallback: diagram + silhouette ── */
        <>
          <div style={{ width: "100%", height: heroHeight, background: `${acc}08`, display: "flex", overflow: "hidden" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <DiagramPlaceholder type={diagramType} accent={acc} width="100%" height={heroHeight} />
            </div>
            <div style={{ width: 72, flexShrink: 0 }}>
              <FighterSilhouette fighterId={fighter.id} accent={fighter.accent} width={72} height={heroHeight} />
            </div>
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(15,12,13,0.78) 0%, transparent 55%)", pointerEvents: "none" }} />
        </>
      )}

      {/* Difficulty badge */}
      <div style={{ position: "absolute", top: 10, left: 14 }}>
        <span style={{
          fontSize: 8, fontWeight: 900, letterSpacing: 1,
          color: DIFF_COLOR[technique.difficulty] || GOLD,
          background: "rgba(0,0,0,0.6)",
          border: `1px solid ${DIFF_COLOR[technique.difficulty] || GOLD}50`,
          borderRadius: 6, padding: "3px 8px", textTransform: "uppercase",
          backdropFilter: "blur(4px)",
        }}>
          {technique.difficulty}
        </span>
      </div>

      {/* Fighter name badge (photo/video mode) */}
      {(hasFighterPhoto || hasVideo) && (
        <div style={{ position: "absolute", top: 10, right: 14, display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: "rgba(0,0,0,0.55)", border: `1px solid ${acc}40`, backdropFilter: "blur(8px)" }}>
          <span style={{ fontSize: 9, fontWeight: 900, color: acc, letterSpacing: 0.5 }}>{fighter.name}</span>
        </div>
      )}

      {/* Technique title + style overlay (photo/video mode) */}
      {(hasFighterPhoto || hasVideo) && (
        <div style={{ position: "absolute", bottom: 28, left: 14, right: 14 }}>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 4, opacity: 0.85 }}>
            {fighter.style}
          </div>
          <div style={{
            fontSize: 22, fontWeight: 1000, color: "#fff",
            fontFamily: "var(--font-display,'Anton',sans-serif)",
            textTransform: "uppercase", letterSpacing: "-0.01em",
            textShadow: "0 2px 16px rgba(0,0,0,0.9)",
            lineHeight: 1.1,
          }}>
            {technique.title}
          </div>
        </div>
      )}

      {/* Teaching block type chips */}
      <div style={{ position: "absolute", bottom: 10, left: 14, display: "flex", gap: 5 }}>
        {(technique.teachingBlocks || []).map((b) => (
          <span key={b.type} style={{
            fontSize: 7.5, fontWeight: 900, color: acc,
            background: "rgba(0,0,0,0.55)", border: `1px solid ${acc}50`,
            borderRadius: 4, padding: "2px 6px", letterSpacing: 0.8, textTransform: "uppercase",
            backdropFilter: "blur(4px)",
          }}>
            {BLOCK_ICON[b.type] || ""} {b.type}
          </span>
        ))}
      </div>

      {/* YouTube link */}
      {!hasVideo && technique.videoId && (
        <a
          href={`https://www.youtube.com/watch?v=${technique.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ position: "absolute", top: hasFighterPhoto ? "auto" : 10, right: 14, display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: "rgba(255,0,0,0.18)", border: "1px solid rgba(255,80,80,0.4)", backdropFilter: "blur(8px)", textDecoration: "none" }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF4444" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span style={{ fontSize: 8, fontWeight: 900, color: "#FF8080", letterSpacing: 0.8 }}>{t.videoWatch}</span>
        </a>
      )}

      {/* Coming soon (no photo, no video, no videoId) */}
      {!hasFighterPhoto && !hasVideo && !technique.videoId && (
        <div style={{ position: "absolute", top: 10, right: 14, display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
          <span style={{ fontSize: 10 }}>🎬</span>
          <span style={{ fontSize: 7.5, fontWeight: 900, color: "rgba(255,255,255,0.45)", letterSpacing: 0.8 }}>{t.videoSoon}</span>
        </div>
      )}
    </div>
  );
}
