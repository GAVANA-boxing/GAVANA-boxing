"use client";

// "Am I getting better?" — one card, almost no text: first rounds → latest rounds (big numbers +
// arrow), the score line, and three icon tiles. Used on Home, Progress and the DNA page.
// Data: lib/progressStats progressGlance (needs ≥ 4 rounds; compares windows that never overlap).
import { loc } from "@/lib/loc";
import { progressGlance } from "@/lib/progressStats";
import ScoreTrendChart from "@/components/progress/ScoreTrendChart";
import { BRAND, card, displayTitle } from "@/components/ui/brand";

const UP = "#34D399";
const DOWN = "#F87171";

export default function ProgressGlance({ locale, sessions, streak = 0, onOpen, style }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const g = progressGlance(sessions);
  const tiles = [
    { icon: "🥊", value: g.count, label: L("раунд", "라운드", "rounds") },
    { icon: "🏆", value: g.best ?? "—", label: L("шилдэг", "최고", "best") },
    { icon: "🔥", value: streak, label: L("өдөр", "일", "days") },
  ];
  const tone = !g.ready ? BRAND.muted : g.delta > 0 ? UP : g.delta < 0 ? DOWN : BRAND.muted;
  const Wrapper = onOpen ? "button" : "section";

  return (
    <Wrapper
      type={onOpen ? "button" : undefined}
      onClick={onOpen}
      data-testid="progress-glance"
      aria-label={onOpen ? L("Ахиц дэлгэрэнгүй", "성장 자세히", "Progress details") : undefined}
      style={{ ...card, padding: 18, width: "100%", textAlign: "left", color: BRAND.text, font: "inherit", cursor: onOpen ? "pointer" : "default", display: "block", ...style }}
    >
      {g.ready ? (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <Num value={g.start.toFixed(1)} label={L(`Эхний ${g.k}`, `처음 ${g.k}회`, `First ${g.k}`)} dim />
          <span aria-hidden="true" style={{ fontSize: 24, color: tone, paddingBottom: 22 }}>→</span>
          <Num value={g.now.toFixed(1)} label={L(`Сүүлийн ${g.k}`, `최근 ${g.k}회`, `Last ${g.k}`)} />
          <span
            style={{
              marginLeft: "auto", alignSelf: "center", padding: "6px 12px", borderRadius: 999,
              background: `${tone}1f`, border: `1px solid ${tone}55`, color: tone,
              fontSize: 18, fontWeight: 800, whiteSpace: "nowrap",
            }}
          >
            {g.delta > 0 ? "▲" : g.delta < 0 ? "▼" : "="} {g.delta > 0 ? "+" : ""}{g.delta.toFixed(1)}
          </span>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", gap: 8 }} aria-hidden="true">
            {Array.from({ length: g.need }, (_, i) => (
              <span key={i} style={{ flex: 1, height: 8, borderRadius: 4, background: i < g.count ? BRAND.red : "rgba(255,255,255,0.08)" }} />
            ))}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: BRAND.muted }}>
            {L(`${g.count}/${g.need} раунд — дараа нь ахиц харагдана`, `${g.count}/${g.need} 라운드 — 그 후 성장이 보여요`, `${g.count}/${g.need} rounds — then your progress shows`)}
          </p>
        </div>
      )}

      {g.series.length >= 2 && (
        <div style={{ marginTop: 14 }}>
          <ScoreTrendChart scores={g.series} label={L("Онооны график", "점수 그래프", "Score chart")} avgLabel={L("дундаж", "평균", "avg")} />
        </div>
      )}

      {g.ready && g.punchesStart != null && g.punchesNow != null && (
        <p style={{ margin: "10px 0 0", fontSize: 13, color: BRAND.muted }}>
          🥊 {L("Раунд бүрт", "라운드당", "Per round")} {g.punchesStart} → <b style={{ color: BRAND.text }}>{g.punchesNow}</b>
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 14 }}>
        {tiles.map((t) => (
          <div key={t.label} style={{ borderRadius: 12, background: "rgba(255,255,255,0.04)", padding: "10px 8px", textAlign: "center" }}>
            <div aria-hidden="true" style={{ fontSize: 16 }}>{t.icon}</div>
            <div style={{ ...displayTitle, fontSize: 22, marginTop: 2 }}>{t.value}</div>
            <div style={{ fontSize: 12, color: BRAND.faint }}>{t.label}</div>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}

function Num({ value, label, dim }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ ...displayTitle, fontSize: dim ? 30 : 44, lineHeight: 1, color: dim ? BRAND.muted : BRAND.text }}>{value}</div>
      <div style={{ fontSize: 12, color: BRAND.faint, marginTop: 6, whiteSpace: "nowrap" }}>{label}</div>
    </div>
  );
}
