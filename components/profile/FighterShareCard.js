"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GOLD, RED, RADIUS, blackAlpha, whiteAlpha } from "@/lib/tokens";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import RankBadge from "@/components/RankBadge";
import { useCombatMemory } from "@/hooks/useCombatMemory";
import { computeMovementProfile } from "@/lib/combatMemory";

// ── Movement radar SVG ────────────────────────────────────────────────────────
function MovementRadar({ profile, color, size = 120 }) {
  if (!profile) return null;
  const cx = size / 2, cy = size / 2;
  const R  = (size / 2) * 0.72;
  const keys   = ["pressure", "lateral", "headMovement", "guardUnstable", "balanceShift"];
  const labels = ["PRESS", "LAT", "HEAD", "GUARD", "BAL"];
  const cap    = 3;
  const angles = keys.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / keys.length);
  const pt = (a, f) => ({ x: cx + Math.cos(a) * R * f, y: cy + Math.sin(a) * R * f });
  const poly = (f) => angles.map((a) => pt(a, f))
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
  const vals    = keys.map((k) => Math.min(1, (profile[k] || 0) / cap));
  const dataPts = angles.map((a, i) => pt(a, Math.max(0.06, vals[i])));
  const dataPath = dataPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      {[0.25, 0.5, 0.75, 1].map((lv) => (
        <path key={lv} d={poly(lv)} fill="none" stroke={whiteAlpha(lv === 1 ? 0.1 : 0.045)} strokeWidth="1" />
      ))}
      {angles.map((a, i) => {
        const e = pt(a, 1);
        return <line key={i} x1={cx} y1={cy} x2={e.x.toFixed(1)} y2={e.y.toFixed(1)} stroke={whiteAlpha(0.07)} strokeWidth="1" />;
      })}
      <path d={dataPath} fill={`${color}1e`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {dataPts.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="2.5"
          fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      ))}
      {angles.map((a, i) => {
        const lp = pt(a, 1.3);
        return (
          <text key={i} x={lp.x.toFixed(1)} y={lp.y.toFixed(1)}
            textAnchor="middle" dominantBaseline="middle"
            fill={whiteAlpha(0.3)} fontSize="6" fontWeight="800" letterSpacing="0.5">
            {labels[i]}
          </text>
        );
      })}
    </svg>
  );
}

// ── Signature bar ─────────────────────────────────────────────────────────────
function SignatureBar({ label, value, cap = 3, invert = false, compact = false }) {
  const pct      = Math.min(100, (value / cap) * 100);
  const isEmpty  = value === 0;
  const lvl      = value >= 2 ? "HIGH" : value >= 1 ? "MED" : "LOW";
  const barColor = isEmpty ? whiteAlpha(0.07)
    : !invert
      ? (value >= 2 ? GOLD : value >= 1 ? "rgba(255,255,255,0.38)" : whiteAlpha(0.12))
      : (value >= 2 ? "#F87171" : value >= 1 ? "rgba(255,180,60,0.7)" : "#34D399");
  const labelW = compact ? 46 : 54;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2.5px 0" }}>
      <span style={{ width: labelW, fontSize: compact ? 7 : 7.5, fontWeight: 800, letterSpacing: 0.8, color: whiteAlpha(0.28), textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 2, background: whiteAlpha(0.06), borderRadius: 2, overflow: "hidden" }}>
        {!isEmpty && <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 2 }} />}
      </div>
      <span style={{ width: 20, fontSize: 7, fontWeight: 900, color: isEmpty ? whiteAlpha(0.18) : barColor, textAlign: "right", flexShrink: 0 }}>
        {isEmpty ? "—" : lvl}
      </span>
    </div>
  );
}

// ── QR + URL ──────────────────────────────────────────────────────────────────
function ProfileUrlBlock({ url, color, qrSize = 72 }) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!url || !canvasRef.current) return;
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      if (cancelled || !canvasRef.current) return;
      QRCode.toCanvas(canvasRef.current, url, {
        width: qrSize, margin: 1,
        color: { dark: "#ffffff", light: "#00000000" },
        errorCorrectionLevel: "M",
      }).catch(() => {});
    });
    return () => { cancelled = true; };
  }, [url, qrSize]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
      <div style={{ width: qrSize, height: qrSize, borderRadius: 10, flexShrink: 0, border: `1px solid ${color}30`, background: blackAlpha(0.5), display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 3 }}>
        <canvas ref={canvasRef} style={{ borderRadius: 6 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: "#fff", marginBottom: 2, letterSpacing: "0.08em", textTransform: "uppercase" }}>Scan to Challenge</div>
        <div style={{ fontSize: 9, color: whiteAlpha(0.25), fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 8 }}>
          {url.replace(/^https?:\/\//, "")}
        </div>
        <button type="button"
          onClick={() => navigator?.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); })}
          style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${color}28`, background: `${color}0f`, color, fontSize: 9.5, fontWeight: 900, cursor: "pointer", letterSpacing: 0.3 }}>
          {copied ? "✓ Copied" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FighterShareCard({
  profileUser, fighterRank, xp, rankProgress,
  locale, t, cardShareCopied, onShareCopied, onClose,
}) {
  const [avatarError, setAvatarError] = useState(false);
  const [isDesktop, setIsDesktop]     = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const h = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const arch        = profileUser.fighterArchetype ? ARCHETYPE_DISPLAY[profileUser.fighterArchetype] : null;
  const accentColor = arch?.color || fighterRank?.color || RED;

  const { sessions, tendency, loading } = useCombatMemory({ user: profileUser, maxSessions: 20 });
  const profile     = computeMovementProfile(sessions);
  const totalSessions = sessions.length;
  const avgScore  = totalSessions ? (sessions.reduce((a, s) => a + (s.score || 0), 0) / totalSessions).toFixed(1) : "—";
  const bestScore = totalSessions ? Math.max(...sessions.map((s) => s.score || 0)).toFixed(1) : "—";

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${locale}/profile/${profileUser.username || profileUser.uid}`
    : "";

  const avatarInitial = (profileUser.displayName || profileUser.username || "F")[0].toUpperCase();
  const avatarSize    = isDesktop ? 96 : 76;

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

  // Responsive widths
  const cardW   = isDesktop ? "min(580px, calc(100vw - 64px))" : "min(360px, calc(100vw - 32px))";
  const btnW    = isDesktop ? "min(580px, calc(100vw - 64px))" : "min(360px, calc(100vw - 32px))";
  const radarSz = isDesktop ? 150 : 112;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9500,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "flex-start",
        padding: isDesktop
          ? "40px 32px 40px"
          : `max(env(safe-area-inset-top), 16px) 16px calc(max(env(safe-area-inset-bottom), 16px) + 16px)`,
        background: blackAlpha(0.94),
        backdropFilter: "blur(28px)", WebkitBackdropFilter: "blur(28px)",
        overflowY: "auto", WebkitOverflowScrolling: "touch",
      }}
    >
      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: cardW,
          borderRadius: isDesktop ? 28 : 24,
          background: `radial-gradient(ellipse 90% 50% at 50% 0%, ${accentColor}1c 0%, transparent 52%), linear-gradient(180deg, #171719 0%, #0e0e10 100%)`,
          border: `1px solid ${accentColor}28`,
          boxShadow: `0 0 0 1px ${accentColor}0c, 0 40px 100px ${blackAlpha(0.9)}, inset 0 1px 0 ${whiteAlpha(0.07)}`,
          padding: isDesktop ? "28px 28px 24px" : "20px 20px 18px",
          display: "flex", flexDirection: "column", gap: 0,
          flexShrink: 0, position: "relative", overflow: "hidden",
        }}
      >
        {/* Top ambient line */}
        <div style={{ position: "absolute", top: 0, left: "8%", right: "8%", height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)`, pointerEvents: "none" }} />

        {/* ── Header row ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isDesktop ? 22 : 16 }}>
          <div>
            <div style={{ fontSize: isDesktop ? 9 : 7.5, fontWeight: 900, letterSpacing: 3.5, color: accentColor, textTransform: "uppercase", lineHeight: 1 }}>GAVANA</div>
            <div style={{ fontSize: isDesktop ? 7.5 : 6.5, fontWeight: 700, letterSpacing: 2.5, color: whiteAlpha(0.22), textTransform: "uppercase" }}>AI COACH</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: RADIUS.full, background: `${accentColor}10`, border: `1px solid ${accentColor}24` }}>
            <span style={{ fontSize: isDesktop ? 8.5 : 7, color: accentColor }}>✦</span>
            <span style={{ fontSize: isDesktop ? 8.5 : 7, fontWeight: 900, letterSpacing: 1.5, color: accentColor, textTransform: "uppercase" }}>VERIFIED FIGHTER</span>
          </div>
        </div>

        {/* ── Identity section — desktop: flex row with equal columns ── */}
        <div style={{
          display: "flex",
          flexDirection: isDesktop ? "row" : "column",
          gap: isDesktop ? 24 : 0,
          marginBottom: isDesktop ? 22 : 16,
          alignItems: isDesktop ? "flex-start" : "unset",
        }}>
          {/* Left: avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: isDesktop ? 16 : 14, flexShrink: 0 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: `conic-gradient(from 0deg, ${accentColor}, ${GOLD}, ${accentColor}, transparent)`, opacity: 0.42, animation: "spin 7s linear infinite" }} />
              <div style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${accentColor}65`, background: "#111", position: "relative", zIndex: 1 }}>
                {profileUser.photoURL && !avatarError
                  ? <img src={profileUser.photoURL} alt="" width={avatarSize} height={avatarSize} style={{ objectFit: "cover", width: "100%", height: "100%" }} onError={() => setAvatarError(true)} crossOrigin="anonymous" />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}1e`, fontSize: avatarSize * 0.38, fontWeight: 900, color: accentColor }}>{avatarInitial}</div>
                }
              </div>
              <div style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: "50%", background: "#0e0e10", border: `1.5px solid ${accentColor}40`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                <RankBadge rank={fighterRank} size={16} glowEnabled={false} />
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: isDesktop ? 22 : 18, fontWeight: 1000, color: "#fff", lineHeight: 1.05, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
                {profileUser.displayName || profileUser.username}
              </div>
              <div style={{ fontSize: isDesktop ? 11 : 10, color: whiteAlpha(0.3), fontWeight: 600, marginBottom: 8 }}>@{profileUser.username}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 9px", borderRadius: RADIUS.full, background: `${fighterRank?.color || accentColor}14`, border: `1px solid ${fighterRank?.color || accentColor}35`, color: fighterRank?.color || accentColor, fontSize: isDesktop ? 10 : 9, fontWeight: 900 }}>
                  {t(fighterRank?.key || "")}
                </span>
                {arch && (
                  <span style={{ padding: "3px 9px", borderRadius: RADIUS.full, background: `${arch.color}10`, border: `1px solid ${arch.color}33`, color: arch.color, fontSize: isDesktop ? 10 : 9, fontWeight: 900 }}>
                    {arch.emoji} {arch.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right (desktop only): combat style */}
          {isDesktop && tendency && (
            <div style={{ flex: 1, minWidth: 0, padding: "14px 16px", borderRadius: RADIUS.lg, background: `${accentColor}0a`, border: `1px solid ${accentColor}1c`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: accentColor, textTransform: "uppercase", marginBottom: 5 }}>Combat Style</div>
              <div style={{ fontSize: 16, fontWeight: 1000, color: "#fff", letterSpacing: "-0.015em", fontFamily: "var(--font-display, 'Anton', sans-serif)", wordBreak: "break-word", lineHeight: 1.2, marginBottom: 4 }}>
                {tendency.title}
              </div>
              <div style={{ fontSize: 11, color: whiteAlpha(0.32), fontWeight: 700 }}>{tendency.sub}</div>
            </div>
          )}
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`, marginBottom: isDesktop ? 20 : 14 }} />

        {/* ── Combat style — mobile only ── */}
        {!isDesktop && tendency && (
          <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: RADIUS.lg, background: `${accentColor}0a`, border: `1px solid ${accentColor}1c`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle, ${accentColor}12 0%, transparent 70%)`, pointerEvents: "none" }} />
            <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2, color: accentColor, textTransform: "uppercase", marginBottom: 4 }}>Combat Style</div>
            <div style={{ fontSize: 14, fontWeight: 1000, color: "#fff", letterSpacing: "-0.015em", fontFamily: "var(--font-display, 'Anton', sans-serif)", wordBreak: "break-word", lineHeight: 1.2, marginBottom: 2 }}>
              {tendency.title}
            </div>
            <div style={{ fontSize: 9.5, color: whiteAlpha(0.32), fontWeight: 700 }}>{tendency.sub}</div>
          </div>
        )}
        {!isDesktop && !loading && !tendency && (
          <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: RADIUS.lg, background: whiteAlpha(0.02), border: `1px solid ${whiteAlpha(0.05)}` }}>
            <div style={{ fontSize: 9.5, color: whiteAlpha(0.25), fontWeight: 700 }}>Train more sessions to unlock combat style</div>
          </div>
        )}

        {/* ── Session stats ── */}
        {!loading && totalSessions > 0 && (
          <div style={{
            display: "flex", gap: 0, marginBottom: isDesktop ? 20 : 14,
            borderRadius: RADIUS.lg, overflow: "hidden",
            border: `1px solid ${whiteAlpha(0.06)}`, background: whiteAlpha(0.02),
          }}>
            {[
              { label: "Sessions",  value: totalSessions, accent: "#fff" },
              { label: "Avg Score", value: avgScore,      accent: whiteAlpha(0.82) },
              { label: "Best",      value: bestScore,     accent: GOLD },
            ].map(({ label, value, accent }, i) => (
              <div key={label} style={{ flex: 1, textAlign: "center", padding: isDesktop ? "13px 8px" : "10px 6px", borderLeft: i > 0 ? `1px solid ${whiteAlpha(0.05)}` : "none" }}>
                <div style={{ fontSize: isDesktop ? 22 : 17, fontWeight: 1000, color: accent, lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)", textShadow: `0 0 12px ${accent}40`, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: isDesktop ? 8 : 7, fontWeight: 900, letterSpacing: 1.5, color: whiteAlpha(0.24), textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Radar + movement bars ── */}
        {profile && (
          <div style={{ display: "flex", gap: isDesktop ? 20 : 14, alignItems: "center", marginBottom: isDesktop ? 20 : 14 }}>
            <div style={{ flexShrink: 0 }}>
              <MovementRadar profile={profile} color={accentColor} size={radarSz} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: isDesktop ? 8.5 : 7.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.24), textTransform: "uppercase", marginBottom: isDesktop ? 8 : 5 }}>Movement Signature</div>
              <SignatureBar label="Pressure" value={profile.pressure}     compact={!isDesktop} />
              <SignatureBar label="Lateral"  value={profile.lateral}      compact={!isDesktop} />
              <SignatureBar label="Head"     value={profile.headMovement} compact={!isDesktop} />
              <SignatureBar label="Guard"    value={profile.guardUnstable} invert compact={!isDesktop} />
              <SignatureBar label="Balance"  value={profile.balanceShift} invert compact={!isDesktop} />
            </div>
          </div>
        )}

        {/* ── XP progress ── */}
        <div style={{ width: "100%", marginBottom: isDesktop ? 20 : 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: isDesktop ? 10 : 8.5, fontWeight: 800, color: whiteAlpha(0.32), textTransform: "uppercase", letterSpacing: 0.8 }}>
              {xp.toLocaleString()} XP
            </span>
            <span style={{ fontSize: isDesktop ? 10 : 8.5, fontWeight: 700, color: whiteAlpha(0.2) }}>
              {rankProgress}% to next rank
            </span>
          </div>
          <div style={{ height: isDesktop ? 4 : 3, borderRadius: RADIUS.full, background: whiteAlpha(0.07), overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: RADIUS.full, background: `linear-gradient(90deg, ${accentColor}80, ${accentColor})`, boxShadow: `0 0 10px ${accentColor}55` }} />
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}1e, transparent)`, marginBottom: isDesktop ? 20 : 14 }} />

        {/* ── QR / URL block ── */}
        {profileUrl && <ProfileUrlBlock url={profileUrl} color={accentColor} qrSize={isDesktop ? 88 : 68} />}
      </div>

      {/* ── Action buttons ── */}
      <div style={{ width: btnW, display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" onClick={handleShare}
          style={{ flex: 2, padding: isDesktop ? "14px 0" : "13px 0", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${accentColor}, ${accentColor}c0)`, color: "#fff", fontSize: isDesktop ? 14 : 13, fontWeight: 900, cursor: "pointer", boxShadow: `0 6px 20px ${accentColor}30` }}>
          {cardShareCopied ? "Copied!" : "Share Card"}
        </button>
        <button type="button" onClick={onClose}
          style={{ flex: 1, padding: isDesktop ? "14px 0" : "13px 0", borderRadius: 14, border: `1px solid ${whiteAlpha(0.09)}`, background: whiteAlpha(0.03), color: whiteAlpha(0.4), fontSize: isDesktop ? 14 : 13, fontWeight: 700, cursor: "pointer" }}>
          Close
        </button>
      </div>
    </div>
  );
}
