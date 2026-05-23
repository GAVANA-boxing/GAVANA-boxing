"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { RADIUS, blackAlpha, whiteAlpha } from "@/lib/tokens";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import RankBadge from "@/components/RankBadge";
import { useCombatMemory } from "@/hooks/useCombatMemory";
import { computeMovementProfile } from "@/lib/combatMemory";
import { deriveCombatIdentity } from "@/lib/combatIdentity";
import { RADAR_KEYS, RADAR_ANGLES, deriveRadarStats } from "@/lib/dashboardHelpers";

// ── Combat card palette ───────────────────────────────────────────────────────
const CRED    = "#B01810";           // blood red
const CGOLD   = "#C9A234";          // muted gold
const CSTEEL  = "rgba(200,208,218,0.09)";  // steel border
const CTEXT   = "rgba(210,215,225,0.28)";  // secondary text

// ── Combat profile radar ──────────────────────────────────────────────────────
function CombatRadar({ stats, size = 130, uid = "fc" }) {
  const cx = size / 2, cy = size / 2;
  const maxR = (size / 2) * 0.60;
  const angles = RADAR_ANGLES.map((d) => (d * Math.PI) / 180);

  const pt = (a, r) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

  const gridPoly = (scale) =>
    angles.map((a) => {
      const p = pt(a, maxR * scale);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");

  const dataPoints = RADAR_KEYS.map((key, i) => {
    const val = Math.max(0, Math.min(10, stats[key] || 0));
    return pt(angles[i], (val / 10) * maxR);
  });
  const dataPoly = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const labelR = maxR + (size <= 120 ? 13 : 17);
  const fs = size <= 120 ? 5.8 : 7;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      <defs>
        <radialGradient id={`rcg-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(176,24,16,0.28)" />
          <stop offset="100%" stopColor="rgba(176,24,16,0.04)" />
        </radialGradient>
        <filter id={`rcf-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {[0.25, 0.5, 0.75, 1.0].map((sc) => (
        <polygon key={sc} points={gridPoly(sc)} fill="none"
          stroke={sc === 1.0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"}
          strokeWidth={sc === 1.0 ? 0.75 : 0.45}
        />
      ))}

      {angles.map((a, i) => {
        const outer = pt(a, maxR);
        return <line key={i} x1={cx.toFixed(1)} y1={cy.toFixed(1)}
          x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
          stroke="rgba(255,255,255,0.045)" strokeWidth="0.7" />;
      })}

      <polygon points={dataPoly}
        fill={`url(#rcg-${uid})`}
        stroke={CRED}
        strokeWidth="1.4"
        strokeLinejoin="round"
        filter={`url(#rcf-${uid})`}
      />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
          r="2.2" fill={CGOLD} stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" opacity="0.9" />
      ))}

      {RADAR_KEYS.map((key, i) => {
        const lp = pt(angles[i], labelR);
        const ta = lp.x < cx - 6 ? "end" : lp.x > cx + 6 ? "start" : "middle";
        const val = Math.max(0, Math.min(10, stats[key] || 0));
        const vc = val >= 7 ? CGOLD : val >= 5 ? "rgba(215,220,230,0.55)" : "rgba(200,80,70,0.8)";
        return (
          <g key={key}>
            <text x={lp.x.toFixed(1)} y={(lp.y - 3).toFixed(1)}
              textAnchor={ta} dominantBaseline="auto"
              fontSize={fs} fontWeight="900" fill="rgba(200,208,218,0.48)" letterSpacing="0.4">
              {key.toUpperCase()}
            </text>
            <text x={lp.x.toFixed(1)} y={(lp.y + fs - 1).toFixed(1)}
              textAnchor={ta} dominantBaseline="auto"
              fontSize={fs - 1} fontWeight="700" fill={vc}>
              {val.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── QR + URL ──────────────────────────────────────────────────────────────────
function ProfileUrlBlock({ url, qrSize = 72 }) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!url || !canvasRef.current) return;
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      if (cancelled || !canvasRef.current) return;
      QRCode.toCanvas(canvasRef.current, url, {
        width: qrSize, margin: 1,
        color: { dark: "#d8dce6", light: "#00000000" },
        errorCorrectionLevel: "M",
      }).catch(() => {});
    });
    return () => { cancelled = true; };
  }, [url, qrSize]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
      <div style={{ width: qrSize, height: qrSize, borderRadius: 8, flexShrink: 0, border: `1px solid ${CSTEEL}`, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 3 }}>
        <canvas ref={canvasRef} style={{ borderRadius: 4 }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9.5, fontWeight: 900, color: "rgba(215,220,228,0.7)", marginBottom: 2, letterSpacing: "0.1em", textTransform: "uppercase" }}>Scan to Challenge</div>
        <div style={{ fontSize: 8.5, color: CTEXT, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 8 }}>
          {url.replace(/^https?:\/\//, "")}
        </div>
        <button type="button"
          onClick={() => navigator?.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); })}
          style={{ padding: "4px 11px", borderRadius: 6, border: `1px solid rgba(176,24,16,0.3)`, background: "rgba(176,24,16,0.08)", color: "rgba(215,100,90,0.9)", fontSize: 9, fontWeight: 900, cursor: "pointer", letterSpacing: 0.3 }}>
          {copied ? "✓ Copied" : "Copy Link"}
        </button>
      </div>
    </div>
  );
}

// ── Share state messages ──────────────────────────────────────────────────────
const SHARE_MSG = {
  capturing:       "Generating card…",
  downloading:     "Generating image…",
  downloaded:      "Saved — upload to your Instagram Story",
  shared:          "Card shared",
  "no-file-share": "Image saved — open in Safari to share image directly",
  copied:          "Profile link copied",
  error:           "Could not generate image",
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FighterShareCard({
  profileUser, fighterRank, xp, rankProgress,
  locale, t, onClose,
}) {
  const [avatarError, setAvatarError] = useState(false);
  const [isDesktop, setIsDesktop]     = useState(false);
  const [shareState, setShareState]   = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const h = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  const arch = profileUser.fighterArchetype ? ARCHETYPE_DISPLAY[profileUser.fighterArchetype] : null;
  // Rank color used only for rank chip — structural palette is fixed dark combat
  const rankColor = fighterRank?.color || CRED;

  const { sessions, loading } = useCombatMemory({ user: profileUser, maxSessions: 20 });
  const profile      = computeMovementProfile(sessions);
  const identity     = profile ? deriveCombatIdentity(profile, sessions) : null;
  const scores       = sessions.map((s) => s.score).filter((v) => v != null && Number.isFinite(Number(v))).map(Number);
  const radarStats   = deriveRadarStats(scores, sessions, profileUser.streakCount || 0);
  const isPlaceholder = scores.length < 3;
  const totalSessions = sessions.length;
  const avgScore   = totalSessions ? (sessions.reduce((a, s) => a + (s.score || 0), 0) / totalSessions).toFixed(1) : "—";
  const bestScore  = totalSessions ? Math.max(...sessions.map((s) => s.score || 0)).toFixed(1) : "—";

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${locale}/profile/${profileUser.username || profileUser.uid}`
    : "";

  const avatarInitial = (profileUser.displayName || profileUser.username || "F")[0].toUpperCase();
  const avatarSize    = isDesktop ? 96 : 72;

  // ── Image capture ────────────────────────────────────────────────────────
  const captureCard = useCallback(async () => {
    if (!cardRef.current) throw new Error("no ref");
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: "#0a0a0b",
      useCORS: true,
      logging: false,
      allowTaint: false,
    });
  }, []);

  const triggerDownload = useCallback((canvas) => {
    const a = document.createElement("a");
    a.download = `${(profileUser.displayName || "fighter").replace(/\s+/g, "-")}-gavana-card.jpg`;
    a.href = canvas.toDataURL("image/jpeg", 0.93);
    a.click();
  }, [profileUser.displayName]);

  const toFile = (canvas) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("no blob")); return; }
      const name = (profileUser.displayName || "fighter").replace(/\s+/g, "-");
      resolve(new File([blob], `${name}-gavana-card.jpg`, { type: "image/jpeg" }));
    }, "image/jpeg", 0.93);
  });

  const endState = (state) => {
    setShareState(state);
    setTimeout(() => setShareState(null), 3500);
  };

  const handleShare = useCallback(async () => {
    setShareState("capturing");
    try {
      const canvas = await captureCard();
      const file = await toFile(canvas);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "GAVANA Fighter Card",
          text: `${profileUser.displayName || profileUser.username} — ${t(fighterRank?.key || "")} | ${xp.toLocaleString()} XP`,
        });
        endState("shared");
      } else {
        triggerDownload(canvas);
        await navigator?.clipboard?.writeText(profileUrl).catch(() => {});
        endState("no-file-share");
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        setShareState(null);
      } else {
        await navigator?.clipboard?.writeText(profileUrl).catch(() => {});
        endState("copied");
      }
    }
  }, [captureCard, triggerDownload, profileUser, fighterRank, xp, profileUrl, t]);

  const handleDownload = useCallback(async () => {
    setShareState("downloading");
    try {
      const canvas = await captureCard();
      triggerDownload(canvas);
      endState("downloaded");
    } catch {
      endState("error");
    }
  }, [captureCard, triggerDownload]);

  const isBusy   = shareState === "capturing" || shareState === "downloading";
  const shareMsg = SHARE_MSG[shareState] || null;
  const cardW    = isDesktop ? "min(580px, calc(100vw - 64px))" : "min(360px, calc(100vw - 32px))";
  const btnW     = cardW;

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
        background: blackAlpha(0.96),
        backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
        overflowY: "auto", WebkitOverflowScrolling: "touch",
      }}
    >
      {/* ── Card (captured as image) ──────────────────────────────────────── */}
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: cardW,
          borderRadius: isDesktop ? 24 : 20,
          background: "linear-gradient(160deg, #111113 0%, #0a0a0b 60%, #080809 100%)",
          border: `1px solid ${CSTEEL}`,
          boxShadow: `0 0 0 1px rgba(176,24,16,0.08), 0 32px 80px ${blackAlpha(0.95)}, inset 0 1px 0 rgba(255,255,255,0.045)`,
          padding: isDesktop ? "26px 26px 22px" : "18px 18px 16px",
          display: "flex", flexDirection: "column",
          flexShrink: 0, position: "relative", overflow: "hidden",
        }}
      >
        {/* Ambient red glow — top */}
        <div style={{ position: "absolute", top: -60, left: "20%", right: "20%", height: 120, background: `radial-gradient(ellipse, rgba(176,24,16,0.14) 0%, transparent 70%)`, pointerEvents: "none" }} />
        {/* Top rule line */}
        <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, rgba(176,24,16,0.55), transparent)`, pointerEvents: "none" }} />

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isDesktop ? 20 : 14 }}>
          <div>
            <div style={{ fontSize: isDesktop ? 8.5 : 7, fontWeight: 900, letterSpacing: 4, color: CRED, textTransform: "uppercase", lineHeight: 1 }}>GAVANA</div>
            <div style={{ fontSize: isDesktop ? 7 : 6, fontWeight: 700, letterSpacing: 2.8, color: CTEXT, textTransform: "uppercase", marginTop: 1 }}>BOXING OS</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: RADIUS.full, background: "rgba(176,24,16,0.08)", border: `1px solid rgba(176,24,16,0.22)` }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: CRED, boxShadow: `0 0 5px ${CRED}` }} />
            <span style={{ fontSize: isDesktop ? 8 : 6.5, fontWeight: 900, letterSpacing: 1.8, color: "rgba(215,95,85,0.9)", textTransform: "uppercase" }}>VERIFIED FIGHTER</span>
          </div>
        </div>

        {/* ── Identity row ── */}
        <div style={{
          display: "flex",
          flexDirection: isDesktop ? "row" : "column",
          gap: isDesktop ? 20 : 0,
          marginBottom: isDesktop ? 18 : 14,
          alignItems: isDesktop ? "flex-start" : "unset",
        }}>
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: isDesktop ? 14 : 12, flexShrink: 0 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: avatarSize, height: avatarSize, borderRadius: "50%",
                overflow: "hidden",
                border: `2px solid rgba(176,24,16,0.45)`,
                background: "#111",
                boxShadow: `0 0 0 1px rgba(176,24,16,0.15), 0 0 20px rgba(176,24,16,0.12)`,
              }}>
                {profileUser.photoURL && !avatarError
                  ? <img src={profileUser.photoURL} alt="" width={avatarSize} height={avatarSize}
                      style={{ objectFit: "cover", width: "100%", height: "100%" }}
                      onError={() => setAvatarError(true)} crossOrigin="anonymous" />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(176,24,16,0.14)", fontSize: avatarSize * 0.36, fontWeight: 900, color: "rgba(215,95,85,0.8)" }}>
                      {avatarInitial}
                    </div>
                }
              </div>
              <div style={{ position: "absolute", bottom: -3, right: -3, width: 24, height: 24, borderRadius: "50%", background: "#0c0c0e", border: `1px solid ${CSTEEL}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                <RankBadge rank={fighterRank} size={14} glowEnabled={false} />
              </div>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: isDesktop ? 21 : 17, fontWeight: 1000, color: "#fff", lineHeight: 1.05, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-display, 'Anton', sans-serif)", letterSpacing: "-0.01em" }}>
                {profileUser.displayName || profileUser.username}
              </div>
              <div style={{ fontSize: isDesktop ? 10 : 9, color: CTEXT, fontWeight: 600, marginBottom: 7 }}>@{profileUser.username}</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 8px", borderRadius: RADIUS.full, background: `${rankColor}12`, border: `1px solid ${rankColor}30`, color: rankColor, fontSize: isDesktop ? 9.5 : 8.5, fontWeight: 900 }}>
                  {t(fighterRank?.key || "")}
                </span>
                {arch && (
                  <span style={{ padding: "2px 8px", borderRadius: RADIUS.full, background: "rgba(201,162,52,0.08)", border: `1px solid rgba(201,162,52,0.22)`, color: "rgba(201,162,52,0.85)", fontSize: isDesktop ? 9.5 : 8.5, fontWeight: 900 }}>
                    {arch.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Combat identity — desktop right column */}
          {isDesktop && identity && (
            <div style={{ flex: 1, minWidth: 0, padding: "12px 14px", borderRadius: RADIUS.lg, background: "rgba(176,24,16,0.06)", border: `1px solid rgba(176,24,16,0.14)` }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2, color: CTEXT, textTransform: "uppercase", marginBottom: 5 }}>Movement Identity</div>
              <div style={{ fontSize: 15, fontWeight: 1000, color: "#fff", letterSpacing: "-0.015em", fontFamily: "var(--font-display, 'Anton', sans-serif)", lineHeight: 1.2, marginBottom: 5 }}>
                {identity.primary}
              </div>
              <div style={{ fontSize: 8.5, color: "rgba(201,162,52,0.75)", fontWeight: 800, marginBottom: 5, fontFamily: "monospace" }}>
                {Math.round(identity.confidence * 100)}% signal confidence
              </div>
              {identity.secondary.slice(0, 2).map((trait, i) => (
                <span key={i} style={{ display: "inline-block", fontSize: 8, fontWeight: 800, color: CTEXT, background: CSTEEL, border: `1px solid ${CSTEEL}`, borderRadius: RADIUS.full, padding: "2px 7px", marginRight: 4, marginBottom: 3 }}>
                  {trait}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Steel divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(176,24,16,0.25), transparent)`, marginBottom: isDesktop ? 16 : 12 }} />

        {/* ── Combat identity — mobile ── */}
        {!isDesktop && identity && (
          <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: RADIUS.lg, background: "rgba(176,24,16,0.06)", border: `1px solid rgba(176,24,16,0.13)` }}>
            <div style={{ fontSize: 6.5, fontWeight: 900, letterSpacing: 2, color: CTEXT, textTransform: "uppercase", marginBottom: 3 }}>Movement Identity</div>
            <div style={{ fontSize: 13, fontWeight: 1000, color: "#fff", letterSpacing: "-0.015em", fontFamily: "var(--font-display, 'Anton', sans-serif)", lineHeight: 1.2, marginBottom: 3 }}>
              {identity.primary}
            </div>
            <div style={{ fontSize: 7.5, color: "rgba(201,162,52,0.72)", fontWeight: 800, marginBottom: 4, fontFamily: "monospace" }}>
              {Math.round(identity.confidence * 100)}% signal confidence
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {identity.secondary.slice(0, 2).map((trait, i) => (
                <span key={i} style={{ fontSize: 7, fontWeight: 800, color: CTEXT, background: CSTEEL, border: `1px solid ${CSTEEL}`, borderRadius: RADIUS.full, padding: "2px 6px" }}>
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Combat profile radar ── */}
        <div style={{
          display: "flex", gap: isDesktop ? 18 : 12,
          alignItems: "center",
          marginBottom: isDesktop ? 16 : 12,
          padding: isDesktop ? "14px 16px" : "10px 10px",
          borderRadius: RADIUS.lg,
          background: "rgba(8,8,10,0.5)",
          border: `1px solid ${CSTEEL}`,
        }}>
          <div style={{ flexShrink: 0 }}>
            <CombatRadar stats={radarStats} size={isDesktop ? 155 : 112} uid="fc" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: isDesktop ? 9 : 6 }}>
              <span style={{ fontSize: isDesktop ? 8 : 7, fontWeight: 900, letterSpacing: 2, color: CTEXT, textTransform: "uppercase" }}>
                Combat Profile
              </span>
              {isPlaceholder && (
                <span style={{ fontSize: 6.5, fontWeight: 700, color: "rgba(200,205,215,0.18)" }}>
                  · building
                </span>
              )}
            </div>
            {RADAR_KEYS.map((key) => {
              const val = Math.max(0, Math.min(10, radarStats[key] || 0));
              const pct = (val / 10) * 100;
              const vc  = val >= 7 ? CGOLD : val >= 5 ? "rgba(200,208,218,0.5)" : "rgba(185,75,65,0.85)";
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: isDesktop ? 3.5 : 2.5 }}>
                  <span style={{ width: isDesktop ? 48 : 40, fontSize: isDesktop ? 7.5 : 6.5, fontWeight: 800, letterSpacing: 0.7, color: CTEXT, textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>
                    {key}
                  </span>
                  <div style={{ flex: 1, height: 1.5, background: "rgba(255,255,255,0.06)", borderRadius: 1, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, rgba(120,16,10,0.9), ${CGOLD})`, borderRadius: 1 }} />
                  </div>
                  <span style={{ width: 19, fontSize: isDesktop ? 7.5 : 6.5, fontWeight: 900, color: vc, textAlign: "right", flexShrink: 0, fontFamily: "monospace" }}>
                    {val.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Session stats ── */}
        {!loading && totalSessions > 0 && (
          <div style={{
            display: "flex", gap: 0, marginBottom: isDesktop ? 16 : 12,
            borderRadius: RADIUS.lg, overflow: "hidden",
            border: `1px solid ${CSTEEL}`, background: "rgba(255,255,255,0.015)",
          }}>
            {[
              { label: "Sessions",  value: totalSessions, color: "rgba(220,225,235,0.9)" },
              { label: "Avg Score", value: avgScore,      color: "rgba(220,225,235,0.65)" },
              { label: "Best",      value: bestScore,     color: CGOLD },
            ].map(({ label, value, color }, i) => (
              <div key={label} style={{ flex: 1, textAlign: "center", padding: isDesktop ? "11px 6px" : "9px 4px", borderLeft: i > 0 ? `1px solid ${CSTEEL}` : "none" }}>
                <div style={{ fontSize: isDesktop ? 20 : 15, fontWeight: 1000, color, lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)", marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: isDesktop ? 7.5 : 6.5, fontWeight: 900, letterSpacing: 1.5, color: CTEXT, textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── XP progress ── */}
        <div style={{ width: "100%", marginBottom: isDesktop ? 16 : 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: isDesktop ? 9.5 : 8, fontWeight: 800, color: CTEXT, textTransform: "uppercase", letterSpacing: 0.8 }}>
              {xp.toLocaleString()} XP
            </span>
            <span style={{ fontSize: isDesktop ? 9.5 : 8, fontWeight: 700, color: "rgba(200,205,215,0.2)" }}>
              {rankProgress}% to next rank
            </span>
          </div>
          <div style={{ height: isDesktop ? 3 : 2.5, borderRadius: RADIUS.full, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: RADIUS.full, background: `linear-gradient(90deg, rgba(140,20,14,0.9) 0%, ${CGOLD} 100%)`, boxShadow: `0 0 8px rgba(201,162,52,0.35)` }} />
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${CSTEEL}, transparent)`, marginBottom: isDesktop ? 16 : 12 }} />

        {/* ── QR / URL ── */}
        {profileUrl && <ProfileUrlBlock url={profileUrl} qrSize={isDesktop ? 84 : 64} />}
      </div>

      {/* ── Actions ── */}
      <div style={{ width: btnW, display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Share Card */}
          <button
            type="button"
            onClick={handleShare}
            disabled={isBusy}
            style={{
              flex: 2, padding: isDesktop ? "14px 0" : "13px 0", borderRadius: 14,
              border: "none",
              background: isBusy
                ? "rgba(176,24,16,0.2)"
                : `linear-gradient(135deg, #8B1208, ${CRED})`,
              color: isBusy ? "rgba(215,95,85,0.5)" : "#fff",
              fontSize: isDesktop ? 14 : 13, fontWeight: 900, cursor: isBusy ? "wait" : "pointer",
              boxShadow: isBusy ? "none" : `0 6px 20px rgba(176,24,16,0.35)`,
              letterSpacing: 0.3,
            }}
          >
            {shareState === "capturing" ? "Generating…" : "Share Card"}
          </button>

          {/* Save Image */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={isBusy}
            style={{
              flex: 1, padding: isDesktop ? "14px 0" : "13px 0", borderRadius: 14,
              border: `1px solid rgba(201,162,52,0.25)`,
              background: "rgba(201,162,52,0.06)",
              color: shareState === "downloading" ? "rgba(201,162,52,0.4)" : `rgba(201,162,52,0.85)`,
              fontSize: isDesktop ? 13 : 12, fontWeight: 800, cursor: isBusy ? "wait" : "pointer",
            }}
          >
            {shareState === "downloading" ? "…" : "Save Image"}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            style={{
              flexShrink: 0, padding: isDesktop ? "14px 18px" : "13px 16px", borderRadius: 14,
              border: `1px solid ${CSTEEL}`,
              background: "rgba(255,255,255,0.025)",
              color: CTEXT, fontSize: isDesktop ? 13 : 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>

        {/* Status / fallback message */}
        {shareMsg && (
          <div style={{
            textAlign: "center", fontSize: 11, fontWeight: 700,
            color: shareState === "error" ? "rgba(200,80,70,0.7)" : "rgba(200,205,215,0.4)",
            letterSpacing: 0.3, padding: "2px 0",
          }}>
            {shareMsg}
          </div>
        )}
      </div>
    </div>
  );
}
