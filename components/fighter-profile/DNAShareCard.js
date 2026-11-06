"use client";

import { useState } from "react";
import { GOLD, whiteAlpha } from "@/lib/tokens";
import { ARCH_TRAINING_COLORS } from "@/lib/archetypeTraining";
import { buildReferralUrl } from "@/lib/referral";

const SHARE_L = {
  en: { cta: "Share Your DNA", copied: "Shared!", similarTo: "Similar To", mix: "Style Mix", ctaBig: "Discover your Fighter DNA" },
  mn: { cta: "ДНХ-гаа хуваалц", copied: "Хуваалцсан!", similarTo: "Ижил тулаанч", mix: "Хэв маягийн холимог", ctaBig: "Өөрийн Fighter DNA-гаа нээ" },
  ko: { cta: "DNA 공유", copied: "공유됨!", similarTo: "유사 파이터", mix: "스타일 믹스", ctaBig: "나의 파이터 DNA 찾기" },
};

// hex (#RRGGBB) → rgba() string with alpha
function hexA(hex, a) {
  const h = String(hex || "#F5C451").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, r); return; }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function DNAShareCard({ dna, displayName, locale, uid }) {
  const [copied, setCopied] = useState(false);
  if (dna.building || !dna.archetypeKey) return null;

  const acc = ARCH_TRAINING_COLORS[dna.archetypeKey] || GOLD;
  const L = SHARE_L[locale] || SHARE_L.en;
  const confidencePct = Math.round(dna.confidence * 100);
  const topStyles = Object.entries(dna.styleMix || {}).sort(([, a], [, b]) => b - a).slice(0, 3);
  const similarFighters = dna.recommendedFighters?.slice(0, 3) || [];

  // Render a 9:16 Instagram-story poster of the Fighter DNA and share it as an
  // image file, with a referral link baked into the share payload.
  async function renderPoster() {
    const W = 1080, H = 1920, M = 90;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const accent = ARCH_TRAINING_COLORS[dna.archetypeKey] || "#F5C451";

    // Background + accent glow + left strip
    ctx.fillStyle = "#070708"; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 460, 60, W / 2, 460, 780);
    glow.addColorStop(0, hexA(accent, 0.3));
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, 960);
    ctx.fillStyle = accent; ctx.fillRect(0, 0, 8, H);

    // Top brand label
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "800 26px Arial"; ctx.letterSpacing = "6px";
    ctx.fillText("GAVANA · FIGHTER DNA", M, 150);
    ctx.letterSpacing = "0px";

    // Confidence pill (right)
    const pillText = `${confidencePct}% SIGNAL`;
    ctx.font = "900 26px Arial";
    const pw = ctx.measureText(pillText).width + 44;
    const px = W - M - pw, py = 118;
    ctx.fillStyle = hexA(accent, 0.16); rrect(ctx, px, py, pw, 48, 24); ctx.fill();
    ctx.strokeStyle = hexA(accent, 0.5); ctx.lineWidth = 2; rrect(ctx, px, py, pw, 48, 24); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillText(pillText, px + 22, py + 33);

    // Display name
    let y = 310;
    if (displayName) {
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "800 30px Arial"; ctx.letterSpacing = "4px";
      ctx.fillText(displayName.toUpperCase(), M, y);
      ctx.letterSpacing = "0px"; y += 24;
    }

    // Giant archetype name (wrap + shrink to fit, max 2 lines)
    const maxW = W - M * 2;
    const words = String(dna.archetype).toUpperCase().split(" ");
    const linesFor = (size) => {
      ctx.font = `900 ${size}px Arial`;
      const out = []; let cur = "";
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; }
        else cur = test;
      }
      if (cur) out.push(cur);
      return out;
    };
    let fs = 150, lines = linesFor(fs);
    while (fs > 66 && (lines.length > 2 || lines.some((l) => { ctx.font = `900 ${fs}px Arial`; return ctx.measureText(l).width > maxW; }))) {
      fs -= 6; lines = linesFor(fs);
    }
    ctx.font = `900 ${fs}px Arial`; ctx.fillStyle = "#fff";
    ctx.shadowColor = hexA(accent, 0.6); ctx.shadowBlur = 44;
    y += fs;
    for (const line of lines) { ctx.fillText(line, M, y); y += fs * 1.02; }
    ctx.shadowBlur = 0; y += 54;

    // Style mix label + bars (top 5)
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "900 24px Arial"; ctx.letterSpacing = "4px";
    ctx.fillText(L.mix.toUpperCase(), M, y); ctx.letterSpacing = "0px"; y += 44;

    const allStyles = Object.entries(dna.styleMix || {}).sort(([, a], [, b]) => b - a).slice(0, 5);
    const barX = M + 300, barW = W - M - barX - 110;
    for (const [key, val] of allStyles) {
      const c = ARCH_TRAINING_COLORS[key] || "#9CA3AF";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.font = "800 28px Arial";
      ctx.fillText((dna.styleLabels?.[key] || key).toUpperCase(), M, y + 36);
      ctx.fillStyle = "rgba(255,255,255,0.08)"; rrect(ctx, barX, y + 14, barW, 26, 13); ctx.fill();
      ctx.fillStyle = c; rrect(ctx, barX, y + 14, Math.max(26, (val / 10) * barW), 26, 13); ctx.fill();
      ctx.textAlign = "right"; ctx.fillStyle = c; ctx.font = "900 30px Arial";
      ctx.fillText(val.toFixed(1), W - M, y + 38);
      ctx.textAlign = "left"; y += 72;
    }
    y += 34;

    // Similar fighters
    if (similarFighters.length) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "900 24px Arial"; ctx.letterSpacing = "4px";
      ctx.fillText(L.similarTo.toUpperCase(), M, y); ctx.letterSpacing = "0px"; y += 52;
      ctx.font = "900 36px Arial"; ctx.fillStyle = "#fff";
      ctx.fillText(similarFighters.map((f) => f.name.split(" ").slice(-1)[0]).join("   ·   "), M, y);
    }

    // Bottom CTA band
    const by = H - 210;
    ctx.fillStyle = hexA(accent, 0.1); ctx.fillRect(0, by, W, 210);
    ctx.fillStyle = accent; ctx.fillRect(0, by, W, 3);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff"; ctx.font = "900 42px Arial";
    ctx.fillText(L.ctaBig, W / 2, by + 86);
    ctx.fillStyle = hexA(accent, 0.95); ctx.font = "900 34px Arial"; ctx.letterSpacing = "2px";
    ctx.fillText("gavana.app", W / 2, by + 146);
    ctx.letterSpacing = "0px"; ctx.textAlign = "left";

    return canvas;
  }

  async function handleShare() {
    const shareText = locale === "mn"
      ? `Миний Fighter DNA: ${dna.archetype} (${confidencePct}%) 🥊 Чи ямар тулаанч бэ?`
      : locale === "ko"
      ? `내 파이터 DNA: ${dna.archetype} (${confidencePct}%) 🥊 당신은 어떤 파이터?`
      : `My Fighter DNA: ${dna.archetype} (${confidencePct}% signal) 🥊 What's yours?`;
    const refUrl = uid ? buildReferralUrl(uid, locale) : "https://gavana.app";

    try {
      const canvas = await renderPoster();
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "fighter-dna.png", { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: "Fighter DNA — GAVANA", text: shareText, url: refUrl });
      } else if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Fighter DNA — GAVANA", text: `${shareText} ${refUrl}` });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl; a.download = "fighter-dna.png"; a.click();
        try { await navigator.clipboard.writeText(`${shareText} ${refUrl}`); } catch { /* ignore */ }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback to text share if canvas/share fails
      try {
        if (navigator.share) await navigator.share({ title: "Fighter DNA — GAVANA", text: `${shareText} ${refUrl}` });
        else { await navigator.clipboard.writeText(`${shareText} ${refUrl}`); setCopied(true); setTimeout(() => setCopied(false), 2200); }
      } catch { /* silent */ }
    }
  }

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Fighter DNA card — screenshot-worthy */}
      <div style={{
        borderRadius: 18, overflow: "hidden",
        background: `linear-gradient(155deg, rgba(6,6,8,0.96) 0%, ${acc}18 100%)`,
        border: `1px solid ${acc}40`,
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${acc}, ${acc}44, transparent)` }} />

        <div style={{ padding: "18px 20px 0" }}>
          {/* Top row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.25), textTransform: "uppercase" }}>
              GAVANA DNA
            </span>
            <span style={{ padding: "2px 9px", borderRadius: 999, background: `${acc}18`, border: `1px solid ${acc}35`, fontSize: 8, fontWeight: 900, color: acc, letterSpacing: 1 }}>
              {confidencePct}% SIGNAL
            </span>
          </div>

          {/* Fighter name (subtle) */}
          {displayName && (
            <div style={{ fontSize: 9.5, fontWeight: 800, color: whiteAlpha(0.28), letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 5 }}>
              {displayName}
            </div>
          )}

          {/* BIG archetype name */}
          <div style={{
            fontSize: 36, fontWeight: 1000, color: "#fff", lineHeight: 1.0,
            fontFamily: "var(--font-display,'Anton',sans-serif)",
            textTransform: "uppercase", letterSpacing: "-0.02em",
            textShadow: `0 0 48px ${acc}66`,
            marginBottom: 20,
          }}>
            {dna.archetype}
          </div>

          {/* Style bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
            {topStyles.map(([key, val]) => {
              const c = ARCH_TRAINING_COLORS[key] || whiteAlpha(0.5);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 72, fontSize: 8.5, fontWeight: 900, letterSpacing: 1, color: whiteAlpha(0.3), textTransform: "uppercase", textAlign: "right", flexShrink: 0 }}>
                    {dna.styleLabels?.[key] || key}
                  </span>
                  <div style={{ flex: 1, height: 4, background: whiteAlpha(0.07), borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(val / 10) * 100}%`, height: "100%", background: c, borderRadius: 2, boxShadow: `0 0 6px ${c}66` }} />
                  </div>
                  <span style={{ width: 28, textAlign: "right", fontSize: 11, fontWeight: 900, color: c, fontFamily: "var(--stack-mono)", flexShrink: 0 }}>
                    {val.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Similar fighters */}
          {similarFighters.length > 0 && (
            <div style={{ paddingBottom: 14, borderTop: `1px solid ${whiteAlpha(0.05)}`, paddingTop: 12 }}>
              <div style={{ fontSize: 7.5, fontWeight: 900, letterSpacing: 2, color: whiteAlpha(0.22), textTransform: "uppercase", marginBottom: 7 }}>
                {L.similarTo}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {similarFighters.map((f) => (
                  <span key={f.id} style={{
                    fontSize: 10.5, fontWeight: 900, padding: "5px 12px", borderRadius: 999,
                    background: `${f.accent || acc}14`, border: `1px solid ${f.accent || acc}30`,
                    color: f.accent || acc,
                  }}>
                    {f.name.split(" ").slice(-1)[0]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GAVANA watermark */}
        <div style={{ padding: "8px 20px 12px", borderTop: `1px solid ${whiteAlpha(0.04)}`, display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2.5, color: whiteAlpha(0.15), textTransform: "uppercase" }}>GAVANA.APP</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: whiteAlpha(0.12) }}>{new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Share button */}
      <button type="button" onClick={handleShare} style={{
        width: "100%", marginTop: 8, padding: "12px 0", borderRadius: 12,
        background: copied ? "rgba(52,211,153,0.12)" : `${acc}12`,
        border: `1px solid ${copied ? "rgba(52,211,153,0.35)" : `${acc}35`}`,
        color: copied ? "#34D399" : acc,
        fontSize: 13, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "all 0.2s ease",
      }}>
        {copied
          ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        }
        {copied ? L.copied : L.cta}
      </button>
    </div>
  );
}
