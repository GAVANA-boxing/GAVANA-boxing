"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GOLD, RED, RADIUS, blackAlpha, whiteAlpha } from "@/lib/tokens";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import RankBadge from "@/components/RankBadge";
import { useCombatMemory } from "@/hooks/useCombatMemory";
import { computeMovementProfile } from "@/lib/combatMemory";

// ── Mini movement radar (5-axis SVG) ─────────────────────────────────────────
function MovementRadar({ profile, color, size = 120 }) {
  if (!profile) return null;
  const cx = size / 2, cy = size / 2;
  const R = (size / 2) * 0.74;
  const keys = ["pressure", "lateral", "headMovement", "guardUnstable", "balanceShift"];
  const cap = 3;
  const angles = keys.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / keys.length);

  const pt = (angle, frac) => ({
    x: cx + Math.cos(angle) * R * frac,
    y: cy + Math.sin(angle) * R * frac,
  });

  const polygon = (frac) =>
    angles.map((a) => pt(a, frac))
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ") + " Z";

  const vals = keys.map((k) => Math.min(1, (profile[k] || 0) / cap));
  const dataPts = angles.map((a, i) => pt(a, Math.max(0.05, vals[i])));
  const dataPath = dataPts.map((p, i) =>
    `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  ).join(" ") + " Z";

  const axisLabels = ["PRESS", "LAT", "HEAD", "GUARD", "BAL"];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {[0.25, 0.5, 0.75, 1].map((lv) => (
        <path key={lv} d={polygon(lv)} fill="none" stroke={whiteAlpha(lv === 1 ? 0.1 : 0.05)} strokeWidth="1" />
      ))}
      {angles.map((a, i) => {
        const end = pt(a, 1);
        return <line key={i} x1={cx} y1={cy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} stroke={whiteAlpha(0.08)} strokeWidth="1" />;
      })}
      <path d={dataPath} fill={`${color}22`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {dataPts.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5" fill={color} style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      ))}
      {angles.map((a, i) => {
        const lp = pt(a, 1.28);
        return (
          <text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
            fill={whiteAlpha(0.28)} fontSize="6.5" fontWeight="800" letterSpacing="0.8">
            {axisLabels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ── Compact stat block ────────────────────────────────────────────────────────
function StatBlock({ label, value, accent }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 1000, color: accent || "#fff", lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)", textShadow: `0 0 12px ${accent || "#fff"}55` }}>
        {value}
      </div>
      <div style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: 1.5, color: whiteAlpha(0.28), textTransform: "uppercase", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

// ── Movement signature bar ────────────────────────────────────────────────────
function SignatureBar({ label, value, cap = 3, invert = false }) {
  const pct = Math.min(100, (value / cap) * 100);
  const isEmpty = value === 0;
  const lvl = value >= 2 ? "HIGH" : value >= 1 ? "MED" : "LOW";
  const barColor = isEmpty ? whiteAlpha(0.08)
    : !invert
      ? (value >= 2 ? GOLD : value >= 1 ? "rgba(255,255,255,0.4)" : whiteAlpha(0.14))
      : (value >= 2 ? "#F87171" : value >= 1 ? "rgba(255,180,60,0.7)" : "#34D399");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0" }}>
      <span style={{ width: 58, fontSize: 8, fontWeight: 800, letterSpacing: 0.8, color: whiteAlpha(0.3), textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 2, background: whiteAlpha(0.06), borderRadius: 2, overflow: "hidden" }}>
        {!isEmpty && <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 2 }} />}
      </div>
      <span style={{ width: 22, fontSize: 7.5, fontWeight: 900, color: isEmpty ? whiteAlpha(0.2) : barColor, textAlign: "right", flexShrink: 0, letterSpacing: 0.3 }}>
        {isEmpty ? "—" : lvl}
      </span>
    </div>
  );
}

// ── QR + URL block ────────────────────────────────────────────────────────────
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
        width: 64, margin: 1,
        color: { dark: "#ffffff", light: "#00000000" },
        errorCorrectionLevel: "M",
      }).catch(() => {});
    });
    return () => { cancelled = true; };
  }, [url]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
      <div style={{ width: 64, height: 64, borderRadius: 8, flexShrink: 0, border: `1px solid ${color}33`, background: blackAlpha(0.5), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 2 }}>
        <canvas ref={canvasRef} style={{ borderRadius: 4 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: "#fff", marginBottom: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>Scan to Challenge</div>
        <div style={{ fontSize: 8.5, color: whiteAlpha(0.25), fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 6 }}>{short}</div>
        <button type="button" onClick={() => navigator?.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); })}
          style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${color}30`, background: `${color}10`, color, fontSize: 9, fontWeight: 900, cursor: "pointer", letterSpacing: 0.3 }}>
          {copied ? "✓ Copied" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function FighterShareCard({
  profileUser, fighterRank, xp, rankProgress,
  locale, t, cardShareCopied, onShareCopied, onClose,
}) {
  const [avatarError, setAvatarError] = useState(false);

  const arch        = profileUser.fighterArchetype ? ARCHETYPE_DISPLAY[profileUser.fighterArchetype] : null;
  const accentColor = arch?.color || fighterRank?.color || RED;

  const { sessions, tendency, loading } = useCombatMemory({ user: profileUser, maxSessions: 20 });
  const profile = computeMovementProfile(sessions);
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
    const name = profileUser.displayName || profileUser.username;
    const rank = t(fighterRank?.key || "");
    const text = `${name} — ${rank} on GAVANA Boxing | ${xp.toLocaleString()} XP`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "GAVANA Fighter Card", text, url: profileUrl }).catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${text}\n${profileUrl}`).then(() => {
        onShareCopied(true); setTimeout(() => onShareCopied(false), 2500);
      }).catch(() => {});
    }
  }, [profileUser, fighterRank, xp, profileUrl, t, onShareCopied]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9500, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: `max(env(safe-area-inset-top), 20px) 16px calc(max(env(safe-area-inset-bottom), 16px) + 16px)`, background: blackAlpha(0.94), backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", overflowY: "auto", WebkitOverflowScrolling: "touch" }}
    >
      {/* ── Card ───────────────────────────────────────────────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(340px, calc(100vw - 32px))", borderRadius: 24,
          background: `radial-gradient(ellipse 100% 55% at 50% 0%, ${accentColor}1e 0%, transparent 55%), linear-gradient(180deg, #161618 0%, #0d0d0f 100%)`,
          border: `1px solid ${accentColor}2a`,
          boxShadow: `0 0 0 1px ${accentColor}0e, 0 32px 80px ${blackAlpha(0.85)}, inset 0 1px 0 ${whiteAlpha(0.06)}`,
          padding: "20px 20px 18px",
          display: "flex", flexDirection: "column", gap: 0,
          flexShrink: 0,
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Ambient glow strip */}
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)`, pointerEvents: "none" }} />

        {/* ── Header: GAVANA / Verified ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 3, color: accentColor, textTransform: "uppercase", lineHeight: 1 }}>GAVANA</div>
            <div style={{ fontSize: 6.5, fontWeight: 700, letterSpacing: 2, color: whiteAlpha(0.25), textTransform: "uppercase" }}>AI COACH</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: RADIUS.full, background: `${accentColor}12`, border: `1px solid ${accentColor}28` }}>
            <span style={{ fontSize: 7, color: accentColor }}>✦</span>
            <span style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1.5, color: accentColor, textTransform: "uppercase" }}>VERIFIED FIGHTER</span>
          </div>
        </div>

        {/* ── Avatar + name row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: -3, borderRadius: "50%", background: `conic-gradient(from 0deg, ${accentColor}, ${GOLD}, ${accentColor}, transparent)`, opacity: 0.45, animation: "spin 7s linear infinite" }} />
            <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: `2px solid ${accentColor}70`, background: "#111", position: "relative", zIndex: 1 }}>
              {profileUser.photoURL && !avatarError
                ? <img src={profileUser.photoURL} alt="" width={72} height={72} style={{ objectFit: "cover", width: "100%", height: "100%" }} onError={() => setAvatarError(true)} crossOrigin="anonymous" />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}20`, fontSize: 28, fontWeight: 900, color: accentColor }}>{avatarInitial}</div>
              }
            </div>
            <div style={{ position: "absolute", bottom: -3, right: -3, width: 24, height: 24, borderRadius: "50%", background: "#0d0d0f", border: `1.5px solid ${accentColor}44`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
              <RankBadge rank={fighterRank} size={15} glowEnabled={false} />
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 1000, color: "#fff", lineHeight: 1.1, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
              {profileUser.displayName || profileUser.username}
            </div>
            <div style={{ fontSize: 10, color: whiteAlpha(0.32), fontWeight: 600, marginBottom: 6 }}>@{profileUser.username}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              <span style={{ padding: "2px 8px", borderRadius: RADIUS.full, background: `${fighterRank?.color || accentColor}14`, border: `1px solid ${fighterRank?.color || accentColor}38`, color: fighterRank?.color || accentColor, fontSize: 9, fontWeight: 900 }}>
                {t(fighterRank?.key || "")}
              </span>
              {arch && (
                <span style={{ padding: "2px 8px", borderRadius: RADIUS.full, background: `${arch.color}12`, border: `1px solid ${arch.color}38`, color: arch.color, fontSize: 9, fontWeight: 900 }}>
                  {arch.emoji} {arch.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}35, transparent)`, marginBottom: 16 }} />

        {/* ── Combat style hero block ── */}
        {tendency ? (
          <div style={{ marginBottom: 16, padding: "12px 14px", borderRadius: RADIUS.lg, background: `${accentColor}0c`, border: `1px solid ${accentColor}1e`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle, ${accentColor}15 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2, color: accentColor, textTransform: "uppercase", marginBottom: 4 }}>Combat Style</div>
            <div style={{ fontSize: 14, fontWeight: 1000, color: "#fff", letterSpacing: "-0.015em", fontFamily: "var(--font-display, 'Anton', sans-serif)", wordBreak: "break-word", lineHeight: 1.2, marginBottom: 2 }}>
              {tendency.title}
            </div>
            <div style={{ fontSize: 9.5, color: whiteAlpha(0.35), fontWeight: 700 }}>{tendency.sub}</div>
          </div>
        ) : !loading && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: RADIUS.lg, background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.06)}` }}>
            <div style={{ fontSize: 9.5, color: whiteAlpha(0.28), fontWeight: 700 }}>Train more sessions to unlock combat style</div>
          </div>
        )}

        {/* ── Session stats row ── */}
        {!loading && totalSessions > 0 && (
          <div style={{ display: "flex", gap: 0, marginBottom: 16, borderRadius: RADIUS.lg, overflow: "hidden", border: `1px solid ${whiteAlpha(0.06)}`, background: whiteAlpha(0.02) }}>
            {[
              { label: "Sessions", value: totalSessions, accent: "#fff" },
              { label: "Avg Score", value: avgScore, accent: whiteAlpha(0.8) },
              { label: "Best", value: bestScore, accent: GOLD },
            ].map(({ label, value, accent }, i) => (
              <div key={label} style={{ flex: 1, textAlign: "center", padding: "10px 6px", borderLeft: i > 0 ? `1px solid ${whiteAlpha(0.05)}` : "none" }}>
                <div style={{ fontSize: 17, fontWeight: 1000, color: accent, lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)", textShadow: `0 0 10px ${accent}44`, marginBottom: 3 }}>{value}</div>
                <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.25), textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Radar + Movement signature ── */}
        {profile && (
          <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
            {/* Mini radar */}
            <div style={{ flexShrink: 0 }}>
              <MovementRadar profile={profile} color={accentColor} size={110} />
            </div>
            {/* Bars */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.25), textTransform: "uppercase", marginBottom: 6 }}>Movement</div>
              <SignatureBar label="Pressure" value={profile.pressure} />
              <SignatureBar label="Lateral"  value={profile.lateral} />
              <SignatureBar label="Head"     value={profile.headMovement} />
              <SignatureBar label="Guard"    value={profile.guardUnstable} invert />
              <SignatureBar label="Balance"  value={profile.balanceShift} invert />
            </div>
          </div>
        )}

        {/* ── XP bar ── */}
        <div style={{ width: "100%", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 8.5, fontWeight: 800, color: whiteAlpha(0.3), textTransform: "uppercase", letterSpacing: 0.8 }}>{xp.toLocaleString()} XP</span>
            <span style={{ fontSize: 8.5, fontWeight: 700, color: whiteAlpha(0.22) }}>{rankProgress}% to next rank</span>
          </div>
          <div style={{ height: 3, borderRadius: RADIUS.full, background: whiteAlpha(0.07), overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: RADIUS.full, background: `linear-gradient(90deg, ${accentColor}88, ${accentColor})`, boxShadow: `0 0 8px ${accentColor}66` }} />
          </div>
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}22, transparent)`, marginBottom: 16 }} />

        {/* ── QR block ── */}
        {profileUrl && <ProfileUrlBlock url={profileUrl} color={accentColor} />}
      </div>

      {/* ── Action buttons ── */}
      <div style={{ width: "min(340px, calc(100vw - 32px))", display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={handleShare}
          style={{ flex: 2, padding: "13px 0", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`, color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", boxShadow: `0 6px 20px ${accentColor}33` }}>
          {cardShareCopied ? "Copied!" : "Share Card"}
        </button>
        <button type="button" onClick={onClose}
          style={{ flex: 1, padding: "13px 0", borderRadius: 14, border: `1px solid ${whiteAlpha(0.08)}`, background: "transparent", color: whiteAlpha(0.38), fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
}
