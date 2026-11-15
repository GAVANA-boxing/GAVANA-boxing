"use client";

// Home, top of the screen: the fighter (GAVANA's own 3D boxer — never a real person's photo),
// the rank in big type, XP toward the next rank as a bar, and the ONE primary action. Two
// layouts over the same data: "card" (the fighter breaks out of a red card) and "poster" (the
// fighter fills the top, glass panel below). Presentational — the page feeds it real data.
import Image from "next/image";
import { loc } from "@/lib/loc";
import { BRAND } from "@/components/ui/brand";
import { RingGauge, ArcGauge, WeekDots } from "@/components/ui/gauges";

const DISP = "var(--font-display, 'Anton', sans-serif)";
export const homeBackground = "radial-gradient(120% 55% at 50% -8%, #5e161b 0%, #2c0d10 40%, #120708 78%)";
export const glass = {
  borderRadius: 26,
  background: "linear-gradient(160deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.04) 100%)",
  border: "1px solid rgba(255,255,255,0.13)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
};
const fighterSrc = (avatar) => `/images/hero-fighter-${avatar === "f" ? "f" : "m"}.webp`;

/** White pill with a dark arrow circle — the screen's one primary action. */
export function ArrowPill({ children, onClick, testId, style }) {
  return (
    <button type="button" data-testid={testId} onClick={onClick}
      style={{ display: "inline-flex", alignItems: "center", gap: 12, minHeight: 54, padding: "6px 6px 6px 22px", borderRadius: 999, border: "none", background: "#fff", color: "#16090a", fontFamily: "inherit", fontSize: 16.5, fontWeight: 800, whiteSpace: "nowrap", cursor: "pointer", boxShadow: "0 12px 30px rgba(0,0,0,0.35)", ...style }}>
      <span>{children}</span>
      <span aria-hidden="true" style={{ width: 42, height: 42, borderRadius: "50%", background: "#16090a", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
    </button>
  );
}

function XpBar({ pct, color }) {
  return (
    <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: "100%", borderRadius: 4, background: color }} />
    </div>
  );
}

export function HomeHero({ layout = "card", locale = "en", name, rankName, xp = 0, rankPct = 0, nextRankName = null, streak = 0, avatar = "m", onStart }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const start = L("Раунд эхлэх", "라운드 시작", "Start a round");
  const xpLine = (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 7, fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.82)", fontVariantNumeric: "tabular-nums" }}>
      <span>{Number(xp).toLocaleString()} XP</span>
      {nextRankName && <span style={{ color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>→ {nextRankName}</span>}
    </div>
  );
  const streakChip = streak > 0 && (
    <span data-testid="home-streak" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "#FBE9A9", color: "#3a2606", fontSize: 13.5, fontWeight: 800 }}>
      🔥 {streak} {L("өдөр", "일", streak === 1 ? "day" : "days")}
    </span>
  );

  if (layout === "poster") {
    return (
      <section data-testid="home-hero" style={{ position: "relative" }}>
        {/* the fighter fills the top of the screen */}
        <div style={{ position: "relative", height: 330, overflow: "hidden", margin: "0 -16px", padding: "0 16px" }}>
          <div aria-hidden="true" style={{ position: "absolute", right: -40, top: 20, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,59,48,0.5) 0%, rgba(255,59,48,0) 68%)" }} />
          <div aria-hidden="true" style={{ position: "absolute", right: 0, top: 0, filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.55))" }}>
            <Image src={fighterSrc(avatar)} alt="" width={465} height={718} priority style={{ display: "block", height: 400, width: "auto", WebkitMaskImage: "linear-gradient(180deg,#000 68%,transparent 96%)", maskImage: "linear-gradient(180deg,#000 68%,transparent 96%)" }} />
          </div>
          <div style={{ position: "absolute", left: 16, top: 18, maxWidth: "56%" }}>
            <div style={{ fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>{L("Сайн уу,", "안녕하세요,", "Hi,")}</div>
            <div style={{ fontFamily: DISP, fontSize: 38, lineHeight: 1, textTransform: "uppercase", color: "#fff", overflowWrap: "anywhere" }}>{name}</div>
            <div style={{ marginTop: 14 }}>{streakChip}</div>
          </div>
        </div>
        <div style={{ ...glass, position: "relative", marginTop: -74, padding: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)" }}>{L("Цол", "등급", "Rank")}</div>
          <div data-testid="home-rank" style={{ fontFamily: DISP, fontSize: 34, lineHeight: 1.05, textTransform: "uppercase", color: "#fff", marginTop: 2 }}>{rankName}</div>
          <div style={{ marginTop: 12 }}><XpBar pct={rankPct} color={BRAND.gold} />{xpLine}</div>
          <ArrowPill testId="home-start" onClick={onStart} style={{ marginTop: 16, width: "100%", justifyContent: "space-between" }}>{start}</ArrowPill>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="home-hero" style={{ position: "relative", marginTop: 54, borderRadius: 30, padding: "20px 18px 18px", minHeight: 252, background: "linear-gradient(135deg, #c8372d 0%, #8f1a1c 46%, #47100f 100%)", boxShadow: "0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.22)" }}>
      {/* the fighter breaks out of the top of the card; the wrapper follows the card's bottom corner */}
      <div aria-hidden="true" style={{ position: "absolute", right: 0, bottom: 0, height: 322, width: "62%", overflow: "hidden", borderBottomRightRadius: 30, pointerEvents: "none", filter: "drop-shadow(-12px 14px 22px rgba(0,0,0,0.4))" }}>
        <Image src={fighterSrc(avatar)} alt="" width={465} height={718} priority style={{ position: "absolute", right: -8, top: 0, height: 400, width: "auto" }} />
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", minHeight: 214 }}>
        {streakChip || <span style={{ height: 30 }} />}
        <div style={{ marginTop: 14, maxWidth: "56%", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.78)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        <div data-testid="home-rank" style={{ maxWidth: "56%", fontFamily: DISP, fontSize: 36, lineHeight: 1.02, textTransform: "uppercase", color: "#fff", marginTop: 2, overflowWrap: "anywhere" }}>{rankName}</div>
        <div style={{ width: "54%", marginTop: 12 }}><XpBar pct={rankPct} color="#FBE9A9" />{xpLine}</div>
        <div style={{ flex: 1 }} />
        <ArrowPill testId="home-start" onClick={onStart} style={{ marginTop: 14 }}>{start}</ArrowPill>
      </div>
    </section>
  );
}

/** Three glass tiles: this week, average score, best score — gauges, a label, nothing to read. */
export function HomeStats({ locale = "en", week = [], todayIndex = -1, weekLabels = [], avg = null, best = null, onOpen }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const tile = { ...glass, borderRadius: 22, padding: "14px 10px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 0 };
  const cap = { fontSize: 12.5, fontWeight: 700, color: "rgba(255,255,255,0.7)", textAlign: "center" };
  const fmt = (v) => Number(v).toFixed(1);
  return (
    <section data-testid="home-stats" style={{ display: "grid", gap: 10 }}>
      <button type="button" onClick={onOpen} aria-label={L("Ахиц дэлгэрэнгүй", "성장 자세히", "Progress details")} style={{ ...glass, borderRadius: 22, padding: "14px 14px 12px", color: "#fff", fontFamily: "inherit", cursor: "pointer", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={cap}>{L("Энэ 7 хоног", "이번 주", "This week")}</span>
          <span style={{ fontFamily: DISP, fontSize: 20, lineHeight: 1 }}>{week.filter(Boolean).length}<span style={{ fontSize: 13, color: "rgba(255,255,255,0.55)" }}>/7</span></span>
        </div>
        <WeekDots days={week} todayIndex={todayIndex} labels={weekLabels} color={BRAND.red} />
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={tile}><ArcGauge value={avg} max={10} color={BRAND.red} label={L("Дундаж оноо", "평균 점수", "Average score")} format={fmt} /><span style={cap}>{L("Дундаж оноо", "평균 점수", "Average")}</span></div>
        <div style={tile}><RingGauge value={best} max={10} color={BRAND.gold} label={L("Шилдэг оноо", "최고 점수", "Best score")} format={fmt} /><span style={cap}>{L("Шилдэг оноо", "최고 점수", "Best")}</span></div>
      </div>
    </section>
  );
}
