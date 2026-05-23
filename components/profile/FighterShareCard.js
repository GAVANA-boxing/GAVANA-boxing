"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GOLD, RED, RADIUS, blackAlpha, whiteAlpha } from "@/lib/tokens";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import RankBadge from "@/components/RankBadge";
import { useCombatMemory } from "@/hooks/useCombatMemory";
import { computeMovementProfile } from "@/lib/combatMemory";

// ── Movement signature bar ─────────────────────────────────────────────────────
function MovementBar({ label, value, cap = 3, invertGood = false }) {
  const pct     = Math.min(100, (value / cap) * 100);
  const isEmpty = value === 0;
  const level   = value >= 2 ? "HIGH" : value >= 1 ? "MED" : "LOW";
  const goodHigh = !invertGood;
  const levelColor = isEmpty
    ? whiteAlpha(0.18)
    : goodHigh
      ? (value >= 2 ? GOLD : value >= 1 ? "rgba(255,255,255,0.55)" : whiteAlpha(0.28))
      : (value >= 2 ? "#F87171" : value >= 1 ? "rgba(255,180,60,0.8)" : "#34D399");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
      <span style={{ width: 72, fontSize: 8.5, fontWeight: 800, letterSpacing: 1, color: whiteAlpha(0.35), textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 2, background: whiteAlpha(0.06), borderRadius: 2, overflow: "hidden" }}>
        {!isEmpty && (
          <div style={{ height: "100%", width: `${pct}%`, background: levelColor, borderRadius: 2 }} />
        )}
      </div>
      <span style={{ width: 26, fontSize: 8, fontWeight: 900, color: levelColor, textAlign: "right", flexShrink: 0, letterSpacing: 0.5 }}>
        {isEmpty ? "—" : level}
      </span>
    </div>
  );
}

// ── Session stat chip ─────────────────────────────────────────────────────────
function StatChip({ label, value, accent }) {
  return (
    <div style={{ flex: 1, textAlign: "center", padding: "7px 4px", borderRadius: RADIUS.md, background: whiteAlpha(0.03), border: `1px solid ${whiteAlpha(0.06)}` }}>
      <div style={{ fontSize: 16, fontWeight: 1000, color: accent || "#fff", lineHeight: 1, marginBottom: 3, fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
        {value}
      </div>
      <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.28), textTransform: "uppercase" }}>
        {label}
      </div>
    </div>
  );
}

// ── QR Code + URL block ────────────────────────────────────────────────────────
function ProfileUrlBlock({ url, color }) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);
  const short = url.replace(/^https?:\/\//, "");

  useEffect(() => {
    if (!url || !canvasRef.current) return;
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      if (cancelled || !canvasRef.current) return;
      QRCode.toCanvas(canvasRef.current, url, {
        width: 72,
        margin: 1,
        color: { dark: "#ffffff", light: "#00000000" },
        errorCorrectionLevel: "M",
      }).catch(() => {});
    });
    return () => { cancelled = true; };
  }, [url]);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {});
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
      <div style={{
        width: 72, height: 72, borderRadius: 10, flexShrink: 0,
        border: `1.5px solid ${color}44`,
        background: blackAlpha(0.6),
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        padding: 2,
      }}>
        <canvas ref={canvasRef} style={{ borderRadius: 6 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: "#fff", marginBottom: 3, letterSpacing: "0.08em" }}>
          SCAN TO CHALLENGE
        </div>
        <div style={{
          fontSize: 9, color: whiteAlpha(0.28), fontWeight: 600,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          marginBottom: 7,
        }}>
          {short}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            padding: "5px 12px", borderRadius: 7, border: `1px solid ${color}35`,
            background: `${color}12`, color: color, fontSize: 10, fontWeight: 900, cursor: "pointer",
            letterSpacing: "0.05em",
          }}
        >
          {copied ? "✓ COPIED" : "COPY LINK"}
        </button>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FighterShareCard({
  profileUser,
  fighterRank,
  xp,
  rankProgress,
  locale,
  t,
  cardShareCopied,
  onShareCopied,
  onClose,
}) {
  const [avatarError, setAvatarError] = useState(false);

  const arch        = profileUser.fighterArchetype ? ARCHETYPE_DISPLAY[profileUser.fighterArchetype] : null;
  const accentColor = arch?.color || fighterRank?.color || RED;

  const { sessions, tendency, loading } = useCombatMemory({ user: profileUser, maxSessions: 20 });

  const profile     = computeMovementProfile(sessions);
  const totalSessions = sessions.length;
  const avgScore = totalSessions
    ? (sessions.reduce((a, s) => a + (s.score || 0), 0) / totalSessions).toFixed(1)
    : "—";
  const bestScore = totalSessions
    ? Math.max(...sessions.map((s) => s.score || 0)).toFixed(1)
    : "—";

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${locale}/profile/${profileUser.username || profileUser.uid}`
    : "";

  const avatarInitial = (profileUser.displayName || profileUser.username || "F")[0].toUpperCase();

  const handleShare = useCallback(() => {
    const name      = profileUser.displayName || profileUser.username;
    const rankLabel = t(fighterRank?.key || "");
    const text      = `${name} — ${rankLabel} on GAVANA Boxing | ${xp.toLocaleString()} XP`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "GAVANA Fighter Card", text, url: profileUrl }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${profileUrl}`).then(() => {
        onShareCopied(true);
        setTimeout(() => onShareCopied(false), 2500);
      }).catch(() => {});
    }
  }, [profileUser, fighterRank, xp, profileUrl, t, onShareCopied]);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 16px 24px", background: blackAlpha(0.92), backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", overflowY: "auto" }}
      onClick={onClose}
    >
      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div
        style={{
          width: 340, borderRadius: 22,
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accentColor}1a 0%, transparent 60%), linear-gradient(180deg, #141014 0%, #0c0a0c 100%)`,
          border: `1px solid ${accentColor}2e`,
          boxShadow: `0 0 0 1px ${accentColor}12, 0 40px 100px ${blackAlpha(0.8)}`,
          padding: "22px 22px 20px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "3px", color: accentColor, textTransform: "uppercase", lineHeight: 1 }}>GAVANA</span>
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: "2px", color: whiteAlpha(0.3), textTransform: "uppercase" }}>AI COACH</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: RADIUS.full, background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
            <span style={{ fontSize: 8, color: accentColor }}>✦</span>
            <span style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: "1.5px", color: accentColor, textTransform: "uppercase" }}>VERIFIED FIGHTER</span>
          </div>
        </div>

        {/* Avatar */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: `conic-gradient(from 0deg, ${accentColor}, ${GOLD}, ${accentColor}, transparent)`, opacity: 0.5, animation: "spin 6s linear infinite" }} />
          <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${accentColor}80`, background: "#111", position: "relative", zIndex: 1 }}>
            {profileUser.photoURL && !avatarError
              ? <img src={profileUser.photoURL} alt="" width={90} height={90} style={{ objectFit: "cover", width: "100%", height: "100%" }} onError={() => setAvatarError(true)} crossOrigin="anonymous" />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}25`, fontSize: 34, fontWeight: 900, color: accentColor }}>{avatarInitial}</div>
            }
          </div>
          <div style={{ position: "absolute", bottom: -4, right: -4, width: 30, height: 30, borderRadius: "50%", background: "#0c0a0c", border: `1.5px solid ${accentColor}55`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
            <RankBadge rank={fighterRank} size={18} glowEnabled={false} />
          </div>
        </div>

        {/* Name */}
        <div style={{ fontSize: 21, fontWeight: 1000, color: "#fff", textAlign: "center", lineHeight: 1.1, marginBottom: 3 }}>
          {profileUser.displayName || profileUser.username}
        </div>
        <div style={{ fontSize: 11, color: whiteAlpha(0.35), fontWeight: 600, marginBottom: 10 }}>
          @{profileUser.username}
        </div>

        {/* Rank + Archetype badges */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          <span style={{ padding: "4px 12px", borderRadius: RADIUS.full, background: `${fighterRank?.color || accentColor}18`, border: `1px solid ${fighterRank?.color || accentColor}44`, color: fighterRank?.color || accentColor, fontSize: 10.5, fontWeight: 900 }}>
            {t(fighterRank?.key || "")}
          </span>
          {arch && (
            <span style={{ padding: "4px 12px", borderRadius: RADIUS.full, background: `${arch.color}15`, border: `1px solid ${arch.color}44`, color: arch.color, fontSize: 10.5, fontWeight: 900 }}>
              {arch.emoji} {arch.name}
            </span>
          )}
        </div>

        <div style={{ width: "100%", height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`, marginBottom: 16 }} />

        {/* Session stats */}
        {!loading && totalSessions > 0 && (
          <div style={{ width: "100%", display: "flex", gap: 6, marginBottom: 16 }}>
            <StatChip label="Sessions" value={totalSessions} />
            <StatChip label="Avg Score" value={avgScore} accent={whiteAlpha(0.85)} />
            <StatChip label="Best" value={bestScore} accent={GOLD} />
          </div>
        )}

        {/* Combat style label from tendency */}
        {tendency && (
          <div style={{ width: "100%", marginBottom: 14 }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 5 }}>
              Combat Style
            </div>
            <div style={{ padding: "8px 12px", borderRadius: RADIUS.md, background: `${accentColor}0f`, border: `1px solid ${accentColor}22` }}>
              <div style={{ fontSize: 13, fontWeight: 1000, color: accentColor, letterSpacing: "-0.01em", fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
                {tendency.title}
              </div>
              <div style={{ fontSize: 9.5, color: whiteAlpha(0.35), fontWeight: 700, marginTop: 2 }}>
                {tendency.sub}
              </div>
            </div>
          </div>
        )}

        {/* Movement signature bars */}
        {profile && (
          <div style={{ width: "100%", marginBottom: 14 }}>
            <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.28), textTransform: "uppercase", marginBottom: 8 }}>
              Movement Signature
            </div>
            <MovementBar label="Pressure"    value={profile.pressure} />
            <MovementBar label="Lateral"     value={profile.lateral} />
            <MovementBar label="Head Mvmt"   value={profile.headMovement} />
            <MovementBar label="Guard"       value={profile.guardUnstable} invertGood />
            <MovementBar label="Balance"     value={profile.balanceShift} invertGood />
          </div>
        )}

        {/* XP bar */}
        <div style={{ width: "100%", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: whiteAlpha(0.3), textTransform: "uppercase", letterSpacing: "0.8px" }}>{xp.toLocaleString()} XP</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: whiteAlpha(0.25) }}>{rankProgress}% → next rank</span>
          </div>
          <div style={{ height: 4, borderRadius: RADIUS.full, background: whiteAlpha(0.08), overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: RADIUS.full, background: `linear-gradient(90deg, ${accentColor}aa, ${accentColor})` }} />
          </div>
        </div>

        <div style={{ width: "100%", height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}25, transparent)`, marginBottom: 16 }} />

        {/* Profile URL block */}
        {profileUrl && <ProfileUrlBlock url={profileUrl} color={accentColor} />}
      </div>

      {/* Action buttons */}
      <div style={{ width: 340, display: "flex", gap: 8, marginTop: 14 }}>
        <button
          type="button"
          onClick={handleShare}
          style={{ flex: 2, padding: "13px 0", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`, color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer" }}
        >
          {cardShareCopied ? "Copied!" : "Share Card"}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: `1px solid ${whiteAlpha(0.08)}`, background: "transparent", color: whiteAlpha(0.4), fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
