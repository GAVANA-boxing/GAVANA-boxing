"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { GOLD, RED } from "@/lib/tokens";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import RankIcon from "@/components/RankIcon";
import { formatScore } from "@/lib/utils";

// Derive SPD / ACC / STA / STR (1–99) from available profile data
function deriveStats({ bestScore, aiFeedbackHistory, pvpStats, challengeStreak }) {
  const recent = (aiFeedbackHistory || []).slice(0, 5);
  const avgRecent = recent.length
    ? recent.reduce((s, f) => s + Number(f.score || 0), 0) / recent.length
    : 0;
  const wins  = pvpStats?.wins  || 0;
  const total = wins + (pvpStats?.losses || 0);
  const best  = bestScore || 0;

  const spd = clamp(Math.round((avgRecent  / 10) * 65 + 20));
  const acc = clamp(total > 0
    ? Math.round((wins / total) * 65 + 25)
    : Math.round((best / 10) * 55 + 25));
  const sta = clamp(Math.round(Math.min(recent.length * 4 + challengeStreak * 5, 79) + 20));
  const str = clamp(Math.round((best / 10) * 65 + 20));
  return { SPD: spd, ACC: acc, STA: sta, STR: str };
}

function clamp(n) { return Math.max(10, Math.min(99, n)); }

// ── Radar / spider chart (4 axes, pure SVG) ─────────────────────────────────
function RadarChart({ stats, size = 148, color }) {
  const { SPD, ACC, STA, STR } = stats;
  const vals  = [SPD / 99, ACC / 99, STA / 99, STR / 99];
  const labels = ["SPD", "ACC", "STA", "STR"];
  const cx = size / 2, cy = size / 2;
  const R  = (size / 2) * 0.72;
  // top, right, bottom, left
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

  const pt = (angle, frac) => ({
    x: cx + Math.cos(angle) * R * frac,
    y: cy + Math.sin(angle) * R * frac,
  });

  const polygon = (frac) =>
    angles.map((a, i) => pt(a, frac)).map((p, i) =>
      `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`
    ).join(" ") + " Z";

  const dataPts = angles.map((a, i) => pt(a, vals[i]));
  const dataPath = dataPts.map((p, i) =>
    `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`
  ).join(" ") + " Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map((lv) => (
        <path key={lv} d={polygon(lv)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {angles.map((a, i) => {
        const end = pt(a, 1);
        return <line key={i} x1={cx} y1={cy} x2={end.x.toFixed(1)} y2={end.y.toFixed(1)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
      })}
      <path d={dataPath} fill={`${color}28`} stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {dataPts.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3.5" fill={color} />
      ))}
      {angles.map((a, i) => {
        const lp = pt(a, 1.22);
        const vp = pt(a, vals[i] < 0.25 ? vals[i] + 0.22 : vals[i] - 0.16);
        return (
          <g key={i}>
            <text x={lp.x.toFixed(1)} y={lp.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
              fill="rgba(255,255,255,0.45)" fontSize="8.5" fontWeight="900" letterSpacing="1.2">
              {labels[i]}
            </text>
            <text x={vp.x.toFixed(1)} y={vp.y.toFixed(1)} textAnchor="middle" dominantBaseline="middle"
              fill={color} fontSize="8" fontWeight="900">
              {[SPD, ACC, STA, STR][i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── QR code canvas ────────────────────────────────────────────────────────────
function QRCanvas({ url, size = 72 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !url) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(ref.current, url, {
        width: size,
        margin: 1,
        color: { dark: "#ffffff", light: "#00000000" },
      });
    });
  }, [url, size]);

  return <canvas ref={ref} width={size} height={size} style={{ borderRadius: 6 }} />;
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: 1 }}>
      <div style={{
        fontSize: 22, fontWeight: 1000, color, lineHeight: 1,
        textShadow: `0 0 10px ${color}99`,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.38)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
        {label}
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
  pvpStats,
  bestScore,
  challengeStreak,
  challengeRanks,
  aiFeedbackHistory,
  userBadges,
  badgeMeta,
  locale,
  t,
  cardShareCopied,
  onShareCopied,
  onClose,
}) {
  const cardRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const arch        = profileUser.fighterArchetype ? ARCHETYPE_DISPLAY[profileUser.fighterArchetype] : null;
  const accentColor = arch?.color || fighterRank?.color || RED;
  const stats       = deriveStats({ bestScore, aiFeedbackHistory, pvpStats, challengeStreak });
  const lastScore   = (aiFeedbackHistory || [])[0]?.score;

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${locale}/profile/${profileUser.username || profileUser.uid}`
    : "";

  const avatarInitial = (profileUser.displayName || profileUser.username || "F")[0].toUpperCase();

  const handleSaveImage = useCallback(async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        style: { borderRadius: "0px" }, // cleaner PNG edge
      });

      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
        const res  = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], "fighter-card.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: "My GAVANA Fighter Card" });
          setSaving(false);
          return;
        }
      }
      // Fallback: trigger download
      const a = document.createElement("a");
      a.href  = dataUrl;
      a.download = "fighter-card.png";
      a.click();
    } catch (e) {
      console.error("Fighter card save failed:", e);
    } finally {
      setSaving(false);
    }
  }, [saving]);

  const handleShareLink = useCallback(() => {
    const name = profileUser.displayName || profileUser.username;
    const rankLabel = t(fighterRank?.key || "");
    const text = `${name} — ${rankLabel} on GAVANA Boxing | ${xp.toLocaleString()} XP`;
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
      style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 16px 24px", background: "rgba(0,0,0,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", overflowY: "auto" }}
      onClick={onClose}
    >
      {/* ── 9:16 Card ──────────────────────────────────────────────────── */}
      <div
        ref={cardRef}
        style={{
          width: 340,
          minHeight: 600,
          borderRadius: 22,
          background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accentColor}1a 0%, transparent 60%), linear-gradient(180deg, #141014 0%, #0c0a0c 100%)`,
          border: `1px solid ${accentColor}2e`,
          boxShadow: `0 0 0 1px ${accentColor}12, 0 40px 100px rgba(0,0,0,0.8)`,
          padding: "22px 22px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
          flexShrink: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: "3px", color: accentColor, textTransform: "uppercase", lineHeight: 1 }}>GAVANA</span>
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: "2px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>AI COACH</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}>
            <span style={{ fontSize: 8, color: accentColor }}>✦</span>
            <span style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: "1.5px", color: accentColor, textTransform: "uppercase" }}>VERIFIED FIGHTER</span>
          </div>
        </div>

        {/* Avatar with belt ring */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          {/* Outer glow ring */}
          <div style={{ position: "absolute", inset: -4, borderRadius: "50%", background: `conic-gradient(from 0deg, ${accentColor}, ${GOLD}, ${accentColor}, transparent)`, opacity: 0.5, animation: "spin 6s linear infinite" }} />
          <div style={{ width: 90, height: 90, borderRadius: "50%", overflow: "hidden", border: `2.5px solid ${accentColor}80`, background: "#111", position: "relative", zIndex: 1 }}>
            {profileUser.photoURL && !avatarError
              ? <img src={profileUser.photoURL} alt="" width={90} height={90} style={{ objectFit: "cover", width: "100%", height: "100%" }} onError={() => setAvatarError(true)} crossOrigin="anonymous" />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}25`, fontSize: 34, fontWeight: 900, color: accentColor }}>{avatarInitial}</div>
            }
          </div>
          {/* Rank badge */}
          <div style={{ position: "absolute", bottom: -4, right: -4, width: 30, height: 30, borderRadius: "50%", background: "#0c0a0c", border: `1.5px solid ${accentColor}55`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
            <RankIcon rank={fighterRank} size={18} animated={false} />
          </div>
        </div>

        {/* Name + rank */}
        <div style={{ fontSize: 21, fontWeight: 1000, color: "#fff", textAlign: "center", lineHeight: 1.1, marginBottom: 3 }}>
          {profileUser.displayName || profileUser.username}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, marginBottom: 10 }}>
          @{profileUser.username}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          <span style={{ padding: "4px 12px", borderRadius: 999, background: `${fighterRank?.color || accentColor}18`, border: `1px solid ${fighterRank?.color || accentColor}44`, color: fighterRank?.color || accentColor, fontSize: 10.5, fontWeight: 900 }}>
            {t(fighterRank?.key || "")}
          </span>
          {arch && (
            <span style={{ padding: "4px 12px", borderRadius: 999, background: `${arch.color}15`, border: `1px solid ${arch.color}44`, color: arch.color, fontSize: 10.5, fontWeight: 900 }}>
              {arch.emoji} {arch.name}
            </span>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`, marginBottom: 18 }} />

        {/* SPD / ACC / STA / STR stat row */}
        <div style={{ width: "100%", display: "flex", gap: 6, justifyContent: "space-between", marginBottom: 18 }}>
          {Object.entries(stats).map(([label, value]) => (
            <StatPill key={label} label={label} value={value} color={accentColor} />
          ))}
        </div>

        {/* Radar chart */}
        <RadarChart stats={stats} size={148} color={accentColor} />

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}30, transparent)`, margin: "14px 0" }} />

        {/* Last score — neon */}
        {lastScore != null && (
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: "2.5px", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 6 }}>
              LAST SCORE
            </div>
            <div style={{ fontSize: 42, fontWeight: 1000, lineHeight: 1, color: accentColor, textShadow: `0 0 18px ${accentColor}cc, 0 0 40px ${accentColor}66` }}>
              {formatScore(lastScore)}
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>/10</span>
            </div>
          </div>
        )}

        {/* XP bar */}
        <div style={{ width: "100%", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
              {xp.toLocaleString()} XP
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>
              {rankProgress}% → next rank
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${rankProgress}%`, borderRadius: 999, background: `linear-gradient(90deg, ${accentColor}aa, ${accentColor})` }} />
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}25, transparent)`, marginBottom: 16 }} />

        {/* QR code */}
        {profileUrl && (
          <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
            <QRCanvas url={profileUrl} size={64} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 4 }}>
                Scan to Challenge Me
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                gavana.app
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons — outside the captured card */}
      <div style={{ width: 340, display: "flex", gap: 8, marginTop: 14 }}>
        <button
          type="button"
          onClick={handleSaveImage}
          disabled={saving}
          style={{ flex: 2, padding: "13px 0", borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`, color: "#fff", fontSize: 13, fontWeight: 900, cursor: saving ? "default" : "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save Image"}
        </button>
        <button
          type="button"
          onClick={handleShareLink}
          style={{ flex: 1.2, padding: "13px 0", borderRadius: 14, border: `1px solid ${accentColor}30`, background: `${accentColor}10`, color: accentColor, fontSize: 13, fontWeight: 900, cursor: "pointer" }}
        >
          {cardShareCopied ? "Copied!" : "Share Link"}
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{ flex: 0.8, padding: "13px 0", borderRadius: 14, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
