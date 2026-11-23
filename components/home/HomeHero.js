"use client";

// Home, design v2 (from the owner's references): the fighter breaking out of a card, the rank in
// big type, XP left to the next rank, ONE primary action; then the week and the scores as dials.
// The fighter is GAVANA's own 3D boxer (public/models, rendered to public/images) — never a
// photograph of a real person. Presentational: lib/homeView.js supplies real numbers, and a value
// that is not known draws nothing.
import Image from "next/image";
import { loc } from "@/lib/loc";
import { BRAND } from "@/components/ui/brand";
import { ScoreDial, WeekDots } from "@/components/ui/gauges";

const DISP = "var(--font-display, 'Anton', sans-serif)";
export const homeBackground = "radial-gradient(120% 50% at 50% -8%, #5e161b 0%, #2c0d10 42%, transparent 80%), radial-gradient(90% 40% at 80% 62%, rgba(120,26,30,0.38) 0%, transparent 70%), #120708";
export const glass = {
  borderRadius: 24,
  background: "linear-gradient(160deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 100%)",
  border: "1px solid rgba(255,255,255,0.13)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  boxShadow: "0 18px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.22)",
};
// A new render gets a new file name (-v2, -v3 …): the image optimizer and browsers cache by URL.
const fighterSrc = (avatar) => `/images/hero-fighter-${avatar === "f" ? "f" : "m"}-v2.webp`;

const Flame = ({ size = 16 }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M12.6 2.2c.5 3.4-1.2 5-2.9 6.900C8 11 6.500 12.800 6.500 15.300 6.500 18.700 9 21.500 12 21.500s5.500-2.600 5.500-6c0-2.300-1.100-4-2.300-5.400-.3 1.500-.9 2.500-1.900 3.100.6-3.700-.1-7.700-.7-11z" /></svg>
);

/** White pill, arrow in a dark circle — the screen's one primary action. */
export function ArrowPill({ children, onClick, testId, style }) {
  return (
    <button type="button" data-testid={testId} onClick={onClick}
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, width: "100%", minHeight: 56, padding: "6px 7px 6px 22px", borderRadius: 999, border: "none", background: "#fff", color: "#16090a", fontFamily: "inherit", fontSize: 17, fontWeight: 800, whiteSpace: "nowrap", cursor: "pointer", boxShadow: "0 14px 34px rgba(0,0,0,0.45)", ...style }}>
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{children}</span>
      <span aria-hidden="true" style={{ width: 42, height: 42, borderRadius: "50%", background: "#16090a", color: "#fff", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </span>
    </button>
  );
}

// The rank is the headline: as large as fits its lane on one or two lines, whatever its length.
const rankSize = (name) => { const n = String(name || "").length; return n <= 8 ? 46 : n <= 11 ? 40 : n <= 15 ? 34 : 29; };

export function HomeHero({ locale = "en", name, rankName, xp = 0, rankPct = 0, nextRankName = null, xpToNext = null, streak = 0, avatar = "m", onStart }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const left = Number.isFinite(xpToNext) && nextRankName;
  return (
    <section data-testid="home-hero" style={{ position: "relative", marginTop: 46, borderRadius: 30, padding: "18px 18px 18px", background: "linear-gradient(105deg, #c8372d 0%, #8f1a1c 38%, #3a0d10 74%, #2a0b0c 100%)", boxShadow: "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.22)" }}>
      {/* warm light behind the shoulders, so the figure stands off the card */}
      <div aria-hidden="true" style={{ position: "absolute", right: 0, top: -30, width: "62%", height: 250, borderRadius: "50%", background: "radial-gradient(circle at 55% 45%, rgba(245,196,81,0.34) 0%, rgba(245,196,81,0) 66%)", pointerEvents: "none" }} />
      {/* the fighter breaks out of the top of the card and fades into its foot */}
      <div aria-hidden="true" style={{ position: "absolute", right: 0, bottom: 0, top: -70, width: "60%", overflow: "hidden", borderBottomRightRadius: 30, pointerEvents: "none" }}>
        <Image src={fighterSrc(avatar)} alt="" width={465} height={718} priority style={{ position: "absolute", right: 6, top: 0, height: 410, width: "auto", WebkitMaskImage: "linear-gradient(180deg,#000 62%,transparent 92%)", maskImage: "linear-gradient(180deg,#000 62%,transparent 92%)" }} />
      </div>

      <div style={{ position: "relative", width: "54%", minHeight: 150 }}>
        {streak > 0 && (
          <span data-testid="home-streak" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px 6px 9px", borderRadius: 999, background: "#FBE9A9", color: "#3a2606", fontSize: "clamp(12px, 3.4vw, 13.5px)", fontWeight: 800, whiteSpace: "nowrap", marginBottom: 12 }}>
            <Flame /> {streak} {L("өдөр дараалан", "일 연속", streak === 1 ? "day in a row" : "days in a row")}
          </span>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        <div data-testid="home-rank" style={{ fontFamily: DISP, fontSize: `min(${rankSize(rankName)}px, ${(rankSize(rankName) / 3.9).toFixed(2)}vw)`, lineHeight: 1, textTransform: "uppercase", color: "#fff", marginTop: 4, overflowWrap: "anywhere" }}>{rankName}</div>
        <div style={{ marginTop: 14, height: 10, borderRadius: 5, background: "rgba(0,0,0,0.3)", overflow: "hidden" }} role="img" aria-label={`${rankPct}%`}>
          <div style={{ width: `${Math.min(100, Math.max(0, rankPct))}%`, height: "100%", borderRadius: 5, background: "linear-gradient(90deg, #FBE9A9, #F5C451)" }} />
        </div>
        {/* the number first, on its own line; what it counts toward under it */}
        <div data-testid="home-xp" style={{ marginTop: 8, color: "#fff", fontVariantNumeric: "tabular-nums" }}>
          <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.2 }}>{Number(left ? xpToNext : xp).toLocaleString()} XP</div>
          {left && (
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, color: "rgba(255,255,255,0.88)" }}>
              {L(`${nextRankName} хүртэл`, `${nextRankName}까지`, `to ${nextRankName}`)}
            </div>
          )}
        </div>
      </div>

      <ArrowPill testId="home-start" onClick={onStart} style={{ position: "relative", marginTop: 18 }}>{L("Раунд эхлэх", "라운드 시작", "Start a round")}</ArrowPill>
    </section>
  );
}

/**
 * This week + the scores. One tile for the week (dots), one tile for average and best (the same
 * dial for both, with its scale, and the recent change when it is known). With no scored round
 * yet there is nothing to measure, so the score tile is not drawn at all.
 */
export function HomeStats({ locale = "en", week = null, weekLabels = [], rounds = 0, avg = null, best = null, trend = null, onOpen }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const cap = { fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.78)" };
  const days = week?.days || [];
  const trained = week?.trainedCount || 0;
  const up = Number.isFinite(trend) && trend > 0, down = Number.isFinite(trend) && trend < 0;
  return (
    <section data-testid="home-stats" style={{ display: "grid", gap: 12 }}>
      <div style={{ ...glass, padding: "14px 14px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span style={cap}>{L("Энэ 7 хоног", "이번 주", "This week")}</span>
          {trained > 0 && (
            <span data-testid="home-week-count" style={{ ...cap, color: "#fff" }}>
              <span style={{ fontFamily: DISP, fontSize: 22, lineHeight: 1 }}>{trained}</span> {L("өдөр", "일", trained === 1 ? "day" : "days")}
            </span>
          )}
        </div>
        <WeekDots days={days} labels={weekLabels} color={BRAND.red} />
      </div>

      {rounds > 0 && (
        <button type="button" data-testid="home-scores" onClick={onOpen} aria-label={L("Ахиц дэлгэрэнгүй", "성장 자세히", "Progress details")}
          style={{ ...glass, padding: "16px 12px 14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, color: "#fff", fontFamily: "inherit", cursor: "pointer", textAlign: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 0 }}>
            <ScoreDial value={avg} color="#fff" label={L("Дундаж оноо", "평균 점수", "Average score")} />
            <span style={cap}>
              {L("Дундаж", "평균", "Average")}
              {(up || down) && (
                <span data-testid="home-trend" style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 999, fontSize: 13, fontWeight: 800, color: up ? "#052e1b" : "#fff", background: up ? "#34D399" : "rgba(255,255,255,0.16)" }}>
                  {up ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}
                </span>
              )}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 0 }}>
            <ScoreDial value={best} color={BRAND.gold} label={L("Шилдэг оноо", "최고 점수", "Best score")} />
            <span style={cap}>{L("Шилдэг", "최고", "Best")}</span>
          </div>
        </button>
      )}
    </section>
  );
}
