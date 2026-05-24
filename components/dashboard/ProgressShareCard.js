"use client";

import { useState, useRef, useCallback } from "react";
import { RED, GOLD, redAlpha, goldAlpha, blackAlpha, RADIUS } from "@/lib/tokens";

const AREA_COLOR = {
  Power: "#FF3B30", Speed: "#FB923C", Timing: "#F5C451",
  Footwork: "#60A5FA", Guard: "#A78BFA", Accuracy: "#34D399",
};

// ── Card visual (also used as capture target) ─────────────────────────────────
function CardFace({ username, fighterScore, rank, xp, dailyStreak, radarStats, badgeCount, weekSessions, cardRef }) {
  const strongAreas = Object.entries(radarStats || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const rankColor = rank?.color || RED;
  const rankGradient = rank?.gradient || rankColor;

  return (
    <div
      ref={cardRef}
      style={{
        width: 320,
        background: "linear-gradient(145deg, #111113 0%, #0a0a0b 60%, #080809 100%)",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "20px 20px 18px",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* BG glow */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse at 20% 20%, ${redAlpha(0.12)} 0%, transparent 60%)` }} />
      <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg, transparent, rgba(255,59,48,0.5), transparent)` }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, position: "relative" }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 4, color: RED, textTransform: "uppercase" }}>GAVANA</div>
          <div style={{ fontSize: 6, fontWeight: 700, letterSpacing: 2.5, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginTop: 1 }}>BOXING OS · PROGRESS CARD</div>
        </div>
        <div style={{
          padding: "4px 10px", borderRadius: RADIUS.full,
          background: `${rankColor}15`,
          border: `1px solid ${rankColor}30`,
          fontSize: 8, fontWeight: 900, color: rankColor, letterSpacing: 0.5,
        }}>
          {rank?.label || "Fighter"}
        </div>
      </div>

      {/* Score hero */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 14, position: "relative" }}>
        <div>
          <div style={{ fontSize: 6, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 2 }}>Fighter Score</div>
          <div style={{
            fontSize: 72, fontWeight: 900, lineHeight: 0.85, letterSpacing: "-0.04em",
            color: "#fff",
            textShadow: `0 0 40px ${redAlpha(0.4)}`,
            fontFamily: "var(--font-display,'Anton',sans-serif)",
          }}>
            {fighterScore}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontWeight: 700, marginTop: 2 }}>/100</div>
        </div>
        <div style={{ paddingBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: GOLD, marginBottom: 3 }}>
            {xp.toLocaleString()} XP
          </div>
          {dailyStreak >= 3 && (
            <div style={{ fontSize: 11, fontWeight: 900, color: "#FB923C" }}>
              🔥 {dailyStreak}d streak
            </div>
          )}
        </div>
      </div>

      {/* XP bar */}
      <div style={{ height: 3, borderRadius: RADIUS.full, background: "rgba(255,255,255,0.07)", marginBottom: 14, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, (xp % 1000) / 10)}%`, borderRadius: RADIUS.full, background: rankGradient || rankColor }} />
      </div>

      {/* Radar top skills */}
      {strongAreas.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 6, fontWeight: 900, color: "rgba(255,255,255,0.25)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 7 }}>Top Skills</div>
          <div style={{ display: "flex", gap: 6 }}>
            {strongAreas.map(([area, score]) => (
              <div key={area} style={{
                flex: 1, padding: "7px 0", borderRadius: 10, textAlign: "center",
                background: `${AREA_COLOR[area] || GOLD}12`,
                border: `1px solid ${AREA_COLOR[area] || GOLD}25`,
              }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: AREA_COLOR[area] || GOLD }}>{score.toFixed(1)}</div>
                <div style={{ fontSize: 7, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2 }}>{area}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div style={{
        display: "flex", gap: 0,
        borderRadius: 12, overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
        marginBottom: 16,
      }}>
        {[
          { label: "This Week", value: weekSessions },
          { label: "Badges", value: badgeCount },
        ].map(({ label, value }, i) => (
          <div key={label} style={{ flex: 1, textAlign: "center", padding: "9px 6px", borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", lineHeight: 1, fontFamily: "var(--font-display,'Anton',sans-serif)" }}>{value}</div>
            <div style={{ fontSize: 7, fontWeight: 800, color: "rgba(255,255,255,0.28)", letterSpacing: 1, textTransform: "uppercase", marginTop: 3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.18)", letterSpacing: 1 }}>
          @{username}
        </div>
        <div style={{ fontSize: 7, fontWeight: 800, color: "rgba(255,255,255,0.12)", letterSpacing: 1.5, textTransform: "uppercase" }}>
          gavana.app
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProgressShareCard({ username, fighterScore, rank, xp, dailyStreak, radarStats, badgeCount, weekSessions, locale, onClose }) {
  const cardRef = useRef(null);
  const [state, setState] = useState(null); // null | "capturing" | "sharing" | "done" | "error"
  const [previewUrl, setPreviewUrl] = useState(null);
  const mn = locale === "mn";

  const capture = useCallback(async () => {
    const el = cardRef.current;
    if (!el) throw new Error("no ref");
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(el, {
      scale: 2.5,
      backgroundColor: "#0a0a0b",
      useCORS: false,
      logging: false,
      allowTaint: false,
    });
  }, []);

  const handleShare = useCallback(async () => {
    setState("capturing");
    try {
      const canvas = await capture();
      const blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => b ? res(b) : rej(new Error("blob")), "image/jpeg", 0.95)
      );
      const file = new File([blob], "gavana-progress.jpg", { type: "image/jpeg" });
      const data = {
        files: [file],
        title: "GAVANA Progress Card",
        text: `${username} — Fighter Score ${fighterScore}/100 · ${rank?.label || ""} · ${xp.toLocaleString()} XP`,
      };
      if (typeof navigator.share === "function" && navigator.canShare?.(data)) {
        setState("sharing");
        await navigator.share(data);
        setState("done");
        setTimeout(() => setState(null), 2500);
      } else {
        // Fallback: download + show preview
        const url = canvas.toDataURL("image/jpeg", 0.95);
        setPreviewUrl(url);
        const a = document.createElement("a");
        a.href = url; a.download = "gavana-progress.jpg";
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setState(null);
      }
    } catch (err) {
      if (err?.name === "AbortError") { setState(null); return; }
      setState("error");
      setTimeout(() => setState(null), 2500);
    }
  }, [capture, username, fighterScore, rank, xp]);

  const handleSave = useCallback(async () => {
    setState("capturing");
    try {
      const canvas = await capture();
      const url = canvas.toDataURL("image/jpeg", 0.95);
      setPreviewUrl(url);
      const a = document.createElement("a");
      a.href = url; a.download = "gavana-progress.jpg";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setState(null);
    } catch { setState("error"); setTimeout(() => setState(null), 2000); }
  }, [capture]);

  const busy = state === "capturing" || state === "sharing";

  return (
    <>
      {/* Long-press preview for iOS */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 9600,
            background: "rgba(0,0,0,0.96)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 16, padding: 24,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.45)", textAlign: "center" }}>
            {mn ? "Дарж хадгалах" : "Long press to save to Photos"}
          </p>
          <img src={previewUrl} alt="Progress Card" style={{ maxWidth: "100%", maxHeight: "70dvh", borderRadius: 16, objectFit: "contain" }} />
          <button onClick={() => setPreviewUrl(null)} style={{ padding: "11px 28px", borderRadius: 12, background: RED, border: "none", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
            {mn ? "Хаах" : "Done"}
          </button>
        </div>
      )}

      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9500,
          background: blackAlpha(0.92),
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "flex-start",
          padding: "max(env(safe-area-inset-top),20px) 16px max(env(safe-area-inset-bottom),20px)",
          overflowY: "auto",
        }}
      >
        <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, width: "100%", maxWidth: 360 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 2.5, textTransform: "uppercase" }}>
            {mn ? "Ахиц хуваалцах" : "Share Your Progress"}
          </p>

          <CardFace
            cardRef={cardRef}
            username={username}
            fighterScore={fighterScore}
            rank={rank}
            xp={xp}
            dailyStreak={dailyStreak}
            radarStats={radarStats}
            badgeCount={badgeCount}
            weekSessions={weekSessions}
          />

          {/* Buttons */}
          <div style={{ display: "flex", gap: 8, width: "100%" }}>
            <button type="button" onClick={handleShare} disabled={busy} style={{
              flex: 2, padding: "13px 0", borderRadius: 13,
              background: busy ? redAlpha(0.15) : RED,
              border: "none", color: busy ? redAlpha(0.4) : "#fff",
              fontSize: 13, fontWeight: 900, cursor: busy ? "not-allowed" : "pointer",
              boxShadow: busy ? "none" : `0 4px 18px ${redAlpha(0.35)}`,
            }}>
              {state === "capturing" ? (mn ? "Үүсгэж байна..." : "Generating...") :
               state === "sharing" ? (mn ? "Хуваалцаж байна..." : "Sharing...") :
               state === "done" ? "✓" :
               state === "error" ? (mn ? "Алдаа" : "Error") :
               (mn ? "📤 Хуваалцах" : "📤 Share")}
            </button>
            <button type="button" onClick={handleSave} disabled={busy} style={{
              flex: 1, padding: "13px 0", borderRadius: 13,
              background: goldAlpha(0.08), border: `1px solid ${goldAlpha(0.25)}`,
              color: busy ? goldAlpha(0.25) : GOLD,
              fontSize: 12, fontWeight: 800, cursor: busy ? "not-allowed" : "pointer",
            }}>
              {mn ? "Хадгалах" : "Save"}
            </button>
            <button type="button" onClick={onClose} style={{
              flexShrink: 0, padding: "13px 14px", borderRadius: 13,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}>
              {mn ? "Хаах" : "Close"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
