"use client";

import FighterPortrait from "@/components/FighterPortrait";
import { translate } from "@/lib/i18n";
import s from "@/components/fighters/fighterStyles";

// ─── Fighter detail hero block ────────────────────────────────────────────────
// Props: fighter, locale, studied, identity (localized string), onBack (function)
export default function FighterHero({ fighter, locale, studied, identity, onBack }) {
  const t = (key) => translate(locale, key);
  const acc = fighter.accent;

  return (
    <div style={s.hero} className="hero-enter">
      {/* Portrait — dominant visual (full width, tall) */}
      <div style={s.heroPortraitWrap}>
        <FighterPortrait
          fighterId={fighter.id}
          fighter={fighter}
          height={300}
          flagSize={80}
          showName={false}
          showLabel={false}
        />
        {/* Overlay gradient — fades to page bg at bottom */}
        <div style={{ ...s.heroPortraitFade, background: `linear-gradient(to bottom, transparent 40%, ${acc}08 65%, #0B0B0C 100%)` }} />
        {/* Back button — floats over portrait */}
        <button style={s.backPill} onClick={onBack}>← {t("back")}</button>
        {/* Studied badge */}
        {studied && (
          <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)", backdropFilter: "blur(8px)" }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span style={{ fontSize: 9.5, fontWeight: 900, color: "#34D399", letterSpacing: 0.8 }}>
              {locale === "mn" ? "Судалсан" : "Studied"}
            </span>
          </div>
        )}
        {/* Top accent bar */}
        <div style={{ ...s.heroTopBar, background: `linear-gradient(90deg, ${acc} 0%, ${acc}66 60%, transparent 100%)` }} />
      </div>

      {/* Text block below portrait */}
      <div style={s.heroCenter}>
        <p style={s.heroKicker}>COMBAT · FIGHTER</p>
        <h1 style={{ ...s.heroNameBig, textShadow: `0 0 40px ${acc}44` }}>
          {fighter.name.toUpperCase()}
        </h1>
        <p style={s.heroNickname}>&ldquo;{fighter.nickname}&rdquo;</p>
        <div style={s.heroMeta}>
          <span style={{ ...s.heroStyleBadge, background: acc + "1e", color: acc, borderColor: acc + "40" }}>
            {fighter.style}
          </span>
          <span style={s.heroWeightClass}>{fighter.weightClass}</span>
        </div>
      </div>

      {/* Identity line */}
      <p style={s.heroIdentity}>{identity}</p>

      {/* Bio */}
      {fighter.bio?.[locale] && (
        <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.65, color: "rgba(255,255,255,0.55)", fontWeight: 500, padding: "0 20px" }}>
          {fighter.bio[locale]}
        </p>
      )}

      {/* Key weapon */}
      <div style={s.heroWeapon}>
        <svg width="11" height="14" viewBox="0 0 13 16" fill={acc} style={{ flexShrink: 0, opacity: 0.8 }}>
          <path d="M7 0L0 9h6l-1 7 7-9H6L7 0z"/>
        </svg>
        <span style={{ ...s.heroWeaponText, color: acc }}>{fighter.keyWeapon}</span>
      </div>

      {/* Bottom accent line */}
      <div style={{ ...s.heroAccentLine, background: `linear-gradient(90deg, ${acc} 0%, ${acc}55 50%, transparent 100%)` }} />
    </div>
  );
}
