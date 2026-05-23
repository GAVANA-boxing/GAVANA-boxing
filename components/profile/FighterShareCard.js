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
const CRED   = "#B01810";
const CGOLD  = "#C9A234";
const CSTEEL = "rgba(200,208,218,0.09)";
const CTEXT  = "rgba(210,215,225,0.28)";

// ── Combat profile radar (centered, no stat bars) ────────────────────────────
function CombatRadar({ stats, size = 160, uid = "fc" }) {
  const cx = size / 2, cy = size / 2;
  const maxR = (size / 2) * 0.58;
  const angles = RADAR_ANGLES.map((d) => (d * Math.PI) / 180);
  const pt = (a, r) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });

  const gridPoly = (scale) =>
    angles.map((a) => { const p = pt(a, maxR * scale); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");

  const dataPoints = RADAR_KEYS.map((key, i) => {
    const val = Math.max(0, Math.min(10, stats[key] || 0));
    return pt(angles[i], (val / 10) * maxR);
  });
  const dataPoly = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const labelR = maxR + (size <= 140 ? 15 : 19);
  const fs = size <= 140 ? 6.5 : 7.5;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      <defs>
        <radialGradient id={`rcg-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(176,24,16,0.30)" />
          <stop offset="100%" stopColor="rgba(176,24,16,0.04)" />
        </radialGradient>
        <filter id={`rcf-${uid}`} x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {[0.25, 0.5, 0.75, 1.0].map((sc) => (
        <polygon key={sc} points={gridPoly(sc)} fill="none"
          stroke={sc === 1.0 ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.045)"}
          strokeWidth={sc === 1.0 ? 0.8 : 0.5} />
      ))}
      {angles.map((a, i) => {
        const outer = pt(a, maxR);
        return <line key={i} x1={cx.toFixed(1)} y1={cy.toFixed(1)}
          x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="0.7" />;
      })}
      <polygon points={dataPoly}
        fill={`url(#rcg-${uid})`} stroke={CRED} strokeWidth="1.5"
        strokeLinejoin="round" filter={`url(#rcf-${uid})`} />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
          r="2.5" fill={CGOLD} stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" opacity="0.92" />
      ))}
      {RADAR_KEYS.map((key, i) => {
        const lp = pt(angles[i], labelR);
        const ta = lp.x < cx - 6 ? "end" : lp.x > cx + 6 ? "start" : "middle";
        const val = Math.max(0, Math.min(10, stats[key] || 0));
        const vc = val >= 7 ? CGOLD : val >= 5 ? "rgba(215,220,230,0.6)" : "rgba(200,80,70,0.85)";
        return (
          <g key={key}>
            <text x={lp.x.toFixed(1)} y={(lp.y - 3).toFixed(1)}
              textAnchor={ta} dominantBaseline="auto"
              fontSize={fs} fontWeight="900" fill="rgba(200,208,218,0.5)" letterSpacing="0.4">
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
          style={{ padding: "4px 11px", borderRadius: 6, border: `1px solid rgba(176,24,16,0.3)`, background: "rgba(176,24,16,0.08)", color: "rgba(215,100,90,0.9)", fontSize: 9, fontWeight: 900, cursor: "pointer" }}>
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
  shared:          "Card shared",
  "no-file-share": "Image saved — open in Safari to share directly",
  copied:          "Profile link copied",
  error:           "Could not generate image",
};

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FighterShareCard({
  profileUser, fighterRank, xp, rankProgress, trainingSessions = [], locale, t, onClose,
}) {
  const [avatarSrc, setAvatarSrc]         = useState(null);
  const [avatarError, setAvatarError]     = useState(false);
  const [isDesktop, setIsDesktop]         = useState(false);
  const [shareState, setShareState]       = useState(null);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const h = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  // Pre-fetch avatar as data URL — avoids CORS issues with html2canvas
  useEffect(() => {
    const url = profileUser?.photoURL;
    if (!url) return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.onerror = rej;
        reader.readAsDataURL(blob);
      }))
      .then((dataUrl) => { if (!cancelled) setAvatarSrc(dataUrl); })
      .catch(() => { if (!cancelled) setAvatarError(true); });
    return () => { cancelled = true; };
  }, [profileUser?.photoURL]);

  // ── Combat identity (from combat memory sessions) ────────────────────────
  const { sessions } = useCombatMemory({ user: profileUser, maxSessions: 30 });
  const profile  = computeMovementProfile(sessions);
  const identity = profile ? deriveCombatIdentity(profile, sessions) : null;

  // ── Radar stats: same source as Dashboard (trainingSessions prop, type="training") ──
  const dashScores    = trainingSessions.map((s) => Number(s.score)).filter(Number.isFinite);
  const streakDays    = Number(profileUser?.dailyStreak || profileUser?.streakCount) || 0;
  const radarStats    = deriveRadarStats(dashScores, trainingSessions, streakDays);
  const isPlaceholder = dashScores.length < 3;

  // ── Session summary stats ────────────────────────────────────────────────
  const totalSessions = trainingSessions.length;
  const avgScore = totalSessions
    ? (trainingSessions.reduce((a, s) => a + (Number(s.score) || 0), 0) / totalSessions).toFixed(1) : "—";
  const bestScore = totalSessions
    ? Math.max(...trainingSessions.map((s) => Number(s.score) || 0)).toFixed(1) : "—";

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${locale}/profile/${profileUser.username || profileUser.uid}`
    : "";

  const avatarInitial = (profileUser.displayName || profileUser.username || "F")[0].toUpperCase();
  const avatarSize    = isDesktop ? 92 : 68;
  const rankColor     = fighterRank?.color || CRED;
  const arch          = profileUser.fighterArchetype ? ARCHETYPE_DISPLAY[profileUser.fighterArchetype] : null;

  // ── Image capture ────────────────────────────────────────────────────────
  const captureCard = useCallback(async () => {
    const el = cardRef.current;
    if (!el) throw new Error("no ref");
    const html2canvas = (await import("html2canvas")).default;
    // Temporarily flatten box-shadow (can cause capture artifacts on some browsers)
    const prev = { shadow: el.style.boxShadow, overflow: el.style.overflow };
    el.style.boxShadow = "none";
    el.style.overflow = "hidden";
    try {
      return await html2canvas(el, {
        scale: 2,
        backgroundColor: "#0a0a0b",
        useCORS: true,
        logging: false,
        allowTaint: false,
        removeContainer: true,
      });
    } finally {
      el.style.boxShadow = prev.shadow;
      el.style.overflow = prev.overflow;
    }
  }, []);

  const showPreview = useCallback((canvas) => {
    // Shows image as <img> for "long press to save" — works in Instagram WebView
    setPreviewDataUrl(canvas.toDataURL("image/jpeg", 0.93));
  }, []);

  const triggerDownload = useCallback((canvas) => {
    const dataUrl = canvas.toDataURL("image/jpeg", 0.93);
    const name = `${(profileUser.displayName || "fighter").replace(/\s+/g, "-")}-gavana-card.jpg`;
    try {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch { /* ignore — preview fallback will show */ }
    // Always show preview so user can long-press on mobile
    setPreviewDataUrl(dataUrl);
  }, [profileUser.displayName]);

  const endState = useCallback((state) => {
    setShareState(state);
    setTimeout(() => setShareState(null), 3500);
  }, []);

  const handleShare = useCallback(async () => {
    setShareState("capturing");
    try {
      const canvas = await captureCard();
      // Try native file share (iOS Safari 15+, Android Chrome)
      const blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => b ? res(b) : rej(new Error("no blob")), "image/jpeg", 0.93)
      );
      const file = new File([blob],
        `${(profileUser.displayName || "fighter").replace(/\s+/g, "-")}-gavana-card.jpg`,
        { type: "image/jpeg" }
      );
      const shareData = {
        files: [file],
        title: "GAVANA Fighter Card",
        text: `${profileUser.displayName || profileUser.username} — ${t(fighterRank?.key || "")} | ${xp.toLocaleString()} XP`,
      };
      if (typeof navigator.share === "function" && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        endState("shared");
      } else {
        // Fallback: download + preview
        triggerDownload(canvas);
        endState("no-file-share");
      }
    } catch (err) {
      if (err?.name === "AbortError") {
        setShareState(null); // user cancelled — not an error
      } else {
        // html2canvas or share failed — show preview so user can save manually
        endState("error");
      }
    }
  }, [captureCard, triggerDownload, profileUser, fighterRank, xp, t, endState]);

  const handleDownload = useCallback(async () => {
    setShareState("downloading");
    try {
      const canvas = await captureCard();
      triggerDownload(canvas);
      setShareState(null);
    } catch {
      endState("error");
    }
  }, [captureCard, triggerDownload, endState]);

  const isBusy   = shareState === "capturing" || shareState === "downloading";
  const shareMsg = SHARE_MSG[shareState] || null;
  const cardW    = isDesktop ? "min(560px, calc(100vw - 64px))" : "min(360px, calc(100vw - 32px))";

  return (
    <>
      {/* ── Long-press image preview (Instagram/iOS fallback) ─────────────── */}
      {previewDataUrl && (
        <div
          onClick={() => setPreviewDataUrl(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9600,
            background: "rgba(0,0,0,0.95)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "24px 16px", gap: 14,
          }}
        >
          <p style={{ color: CTEXT, fontSize: 12, fontWeight: 700, textAlign: "center", margin: 0 }}>
            Long press the image to save to Photos
          </p>
          <img
            src={previewDataUrl}
            alt="Fighter Card"
            style={{ maxWidth: "100%", maxHeight: "70dvh", borderRadius: 16, objectFit: "contain", display: "block" }}
          />
          <button
            onClick={() => setPreviewDataUrl(null)}
            style={{ padding: "10px 28px", borderRadius: 12, border: "none", background: CRED, color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
          >
            Done
          </button>
        </div>
      )}

      {/* ── Main overlay ──────────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9500,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "flex-start",
          padding: isDesktop
            ? "40px 32px"
            : `max(env(safe-area-inset-top), 16px) 16px calc(max(env(safe-area-inset-bottom), 16px) + 16px)`,
          background: blackAlpha(0.96),
          backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)",
          overflowY: "auto", WebkitOverflowScrolling: "touch",
        }}
      >
        {/* ── Card ── */}
        <div
          ref={cardRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: cardW,
            borderRadius: isDesktop ? 22 : 18,
            background: "linear-gradient(160deg, #111113 0%, #0a0a0b 60%, #080809 100%)",
            border: `1px solid ${CSTEEL}`,
            boxShadow: `0 32px 80px ${blackAlpha(0.95)}, inset 0 1px 0 rgba(255,255,255,0.04)`,
            padding: isDesktop ? "24px 24px 20px" : "16px 16px 14px",
            display: "flex", flexDirection: "column",
            flexShrink: 0, position: "relative",
          }}
        >
          {/* Top rule */}
          <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 1, background: `linear-gradient(90deg, transparent, rgba(176,24,16,0.5), transparent)`, pointerEvents: "none" }} />

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isDesktop ? 18 : 13 }}>
            <div>
              <div style={{ fontSize: isDesktop ? 8.5 : 7, fontWeight: 900, letterSpacing: 4, color: CRED, textTransform: "uppercase" }}>GAVANA</div>
              <div style={{ fontSize: isDesktop ? 6.5 : 5.5, fontWeight: 700, letterSpacing: 2.8, color: CTEXT, textTransform: "uppercase", marginTop: 1 }}>BOXING OS</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: RADIUS.full, background: "rgba(176,24,16,0.08)", border: `1px solid rgba(176,24,16,0.22)` }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: CRED, flexShrink: 0 }} />
              <span style={{ fontSize: isDesktop ? 7.5 : 6, fontWeight: 900, letterSpacing: 1.8, color: "rgba(215,95,85,0.9)", textTransform: "uppercase" }}>VERIFIED FIGHTER</span>
            </div>
          </div>

          {/* ── Identity row ── */}
          <div style={{
            display: "flex",
            flexDirection: isDesktop ? "row" : "column",
            gap: isDesktop ? 18 : 0,
            marginBottom: isDesktop ? 16 : 12,
            alignItems: isDesktop ? "flex-start" : "unset",
          }}>
            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: isDesktop ? 13 : 10, flexShrink: 0 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div style={{
                  width: avatarSize, height: avatarSize, borderRadius: "50%",
                  overflow: "hidden", border: `2px solid rgba(176,24,16,0.4)`, background: "#111",
                }}>
                  {avatarSrc && !avatarError
                    ? <img src={avatarSrc} alt="" width={avatarSize} height={avatarSize}
                        style={{ objectFit: "cover", width: "100%", height: "100%" }}
                        onError={() => setAvatarError(true)} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(176,24,16,0.12)", fontSize: avatarSize * 0.36, fontWeight: 900, color: "rgba(215,95,85,0.8)" }}>
                        {avatarInitial}
                      </div>
                  }
                </div>
                <div style={{ position: "absolute", bottom: -3, right: -3, width: 22, height: 22, borderRadius: "50%", background: "#0c0c0e", border: `1px solid ${CSTEEL}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                  <RankBadge rank={fighterRank} size={13} glowEnabled={false} />
                </div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: isDesktop ? 20 : 16, fontWeight: 1000, color: "#fff", lineHeight: 1.05, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
                  {profileUser.displayName || profileUser.username}
                </div>
                <div style={{ fontSize: isDesktop ? 10 : 8.5, color: CTEXT, fontWeight: 600, marginBottom: 6 }}>@{profileUser.username}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <span style={{ padding: "2px 8px", borderRadius: RADIUS.full, background: `${rankColor}12`, border: `1px solid ${rankColor}28`, color: rankColor, fontSize: isDesktop ? 9 : 8, fontWeight: 900 }}>
                    {t(fighterRank?.key || "")}
                  </span>
                  {arch && (
                    <span style={{ padding: "2px 8px", borderRadius: RADIUS.full, background: "rgba(201,162,52,0.08)", border: `1px solid rgba(201,162,52,0.2)`, color: "rgba(201,162,52,0.82)", fontSize: isDesktop ? 9 : 8, fontWeight: 900 }}>
                      {arch.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop: combat identity right column */}
            {isDesktop && identity && (
              <div style={{ flex: 1, minWidth: 0, padding: "11px 13px", borderRadius: RADIUS.lg, background: "rgba(176,24,16,0.05)", border: `1px solid rgba(176,24,16,0.13)` }}>
                <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 2, color: CTEXT, textTransform: "uppercase", marginBottom: 4 }}>Movement Identity</div>
                <div style={{ fontSize: 14, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display, 'Anton', sans-serif)", lineHeight: 1.2, marginBottom: 4 }}>
                  {identity.primary}
                </div>
                <div style={{ fontSize: 8, color: "rgba(201,162,52,0.7)", fontWeight: 800, marginBottom: 5, fontFamily: "monospace" }}>
                  {Math.round(identity.confidence * 100)}% signal confidence
                </div>
                {identity.secondary.slice(0, 2).map((trait, i) => (
                  <span key={i} style={{ display: "inline-block", fontSize: 7.5, fontWeight: 800, color: CTEXT, background: CSTEEL, borderRadius: RADIUS.full, padding: "2px 7px", marginRight: 3, marginBottom: 3 }}>
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(176,24,16,0.22), transparent)`, marginBottom: isDesktop ? 14 : 10 }} />

          {/* ── Mobile: combat identity ── */}
          {!isDesktop && identity && (
            <div style={{ marginBottom: 10, padding: "9px 11px", borderRadius: RADIUS.lg, background: "rgba(176,24,16,0.05)", border: `1px solid rgba(176,24,16,0.12)` }}>
              <div style={{ fontSize: 6, fontWeight: 900, letterSpacing: 2, color: CTEXT, textTransform: "uppercase", marginBottom: 3 }}>Movement Identity</div>
              <div style={{ fontSize: 12, fontWeight: 1000, color: "#fff", fontFamily: "var(--font-display, 'Anton', sans-serif)", lineHeight: 1.2, marginBottom: 3 }}>
                {identity.primary}
              </div>
              <div style={{ fontSize: 7.5, color: "rgba(201,162,52,0.7)", fontWeight: 800, fontFamily: "monospace" }}>
                {Math.round(identity.confidence * 100)}% signal confidence
              </div>
            </div>
          )}

          {/* ── Combat profile radar — centered, no stat bars ── */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            marginBottom: isDesktop ? 14 : 10,
            padding: isDesktop ? "16px 12px 12px" : "12px 8px 8px",
            borderRadius: RADIUS.lg,
            background: "rgba(6,6,8,0.6)",
            border: `1px solid ${CSTEEL}`,
          }}>
            <div style={{ fontSize: 7, fontWeight: 900, letterSpacing: 2, color: CTEXT, textTransform: "uppercase", marginBottom: isDesktop ? 8 : 6 }}>
              Combat Profile{isPlaceholder ? " · building" : ""}
            </div>
            <CombatRadar stats={radarStats} size={isDesktop ? 190 : 150} uid="fc" />
          </div>

          {/* ── Session stats ── */}
          {totalSessions > 0 && (
            <div style={{
              display: "flex", gap: 0, marginBottom: isDesktop ? 14 : 10,
              borderRadius: RADIUS.lg, overflow: "hidden",
              border: `1px solid ${CSTEEL}`, background: "rgba(255,255,255,0.012)",
            }}>
              {[
                { label: "Sessions",  value: totalSessions,          color: "rgba(220,225,235,0.88)" },
                { label: "Avg Score", value: avgScore,               color: "rgba(220,225,235,0.6)" },
                { label: "Best",      value: bestScore,              color: CGOLD },
              ].map(({ label, value, color }, i) => (
                <div key={label} style={{ flex: 1, textAlign: "center", padding: isDesktop ? "10px 6px" : "8px 4px", borderLeft: i > 0 ? `1px solid ${CSTEEL}` : "none" }}>
                  <div style={{ fontSize: isDesktop ? 18 : 14, fontWeight: 1000, color, lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)", marginBottom: 3 }}>{value}</div>
                  <div style={{ fontSize: isDesktop ? 7 : 6, fontWeight: 900, letterSpacing: 1.5, color: CTEXT, textTransform: "uppercase" }}>{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── XP bar ── */}
          <div style={{ width: "100%", marginBottom: isDesktop ? 14 : 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: isDesktop ? 9 : 7.5, fontWeight: 800, color: CTEXT, textTransform: "uppercase", letterSpacing: 0.8 }}>
                {xp.toLocaleString()} XP
              </span>
              <span style={{ fontSize: isDesktop ? 9 : 7.5, fontWeight: 700, color: "rgba(200,205,215,0.18)" }}>
                {rankProgress}% to next rank
              </span>
            </div>
            <div style={{ height: isDesktop ? 3 : 2.5, borderRadius: RADIUS.full, background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: RADIUS.full, background: `linear-gradient(90deg, rgba(140,20,14,0.9) 0%, ${CGOLD} 100%)` }} />
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${CSTEEL}, transparent)`, marginBottom: isDesktop ? 14 : 10 }} />

          {/* ── QR / URL ── */}
          {profileUrl && <ProfileUrlBlock url={profileUrl} qrSize={isDesktop ? 80 : 60} />}
        </div>

        {/* ── Action buttons ── */}
        <div style={{ width: cardW, display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={handleShare} disabled={isBusy}
              style={{
                flex: 2, padding: isDesktop ? "14px 0" : "13px 0", borderRadius: 14,
                border: "none",
                background: isBusy ? "rgba(176,24,16,0.2)" : `linear-gradient(135deg, #8B1208, ${CRED})`,
                color: isBusy ? "rgba(215,95,85,0.45)" : "#fff",
                fontSize: isDesktop ? 14 : 13, fontWeight: 900,
                cursor: isBusy ? "wait" : "pointer",
                boxShadow: isBusy ? "none" : `0 6px 20px rgba(176,24,16,0.3)`,
              }}>
              {shareState === "capturing" ? "Generating…" : "Share Card"}
            </button>
            <button type="button" onClick={handleDownload} disabled={isBusy}
              style={{
                flex: 1, padding: isDesktop ? "14px 0" : "13px 0", borderRadius: 14,
                border: `1px solid rgba(201,162,52,0.22)`,
                background: "rgba(201,162,52,0.05)",
                color: isBusy ? "rgba(201,162,52,0.3)" : "rgba(201,162,52,0.82)",
                fontSize: isDesktop ? 13 : 12, fontWeight: 800,
                cursor: isBusy ? "wait" : "pointer",
              }}>
              {shareState === "downloading" ? "…" : "Save Image"}
            </button>
            <button type="button" onClick={onClose}
              style={{
                flexShrink: 0, padding: isDesktop ? "14px 18px" : "13px 14px", borderRadius: 14,
                border: `1px solid ${CSTEEL}`,
                background: "rgba(255,255,255,0.02)",
                color: CTEXT, fontSize: isDesktop ? 13 : 12, fontWeight: 700, cursor: "pointer",
              }}>
              Close
            </button>
          </div>

          {shareMsg && (
            <div style={{
              textAlign: "center", fontSize: 11, fontWeight: 700,
              color: shareState === "error" ? "rgba(200,80,70,0.7)" : CTEXT,
              padding: "2px 0",
            }}>
              {shareMsg}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
