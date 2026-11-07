"use client";

import { loc } from "@/lib/loc";
import { RANK_TIERS } from "@/lib/xp";
import { shortDate } from "@/lib/progressStats";
import HowToEarnXP from "@/components/rank/HowToEarnXP";
import ScoreTrendChart from "@/components/progress/ScoreTrendChart";
import { BRAND, btnPrimary, btnSecondary, card, displayTitle, kickerDot, kickerPill, sectionLabel } from "@/components/ui/brand";

const MIX = [
  { key: "jab", label: "Jab", color: "#60A5FA" },
  { key: "cross", label: "Cross", color: BRAND.red },
  { key: "hook", label: "Hook", color: BRAND.gold },
];

/**
 * The Progress page's content — presentational only (data comes from
 * app/[locale]/progress/page.js), so it can be previewed and tested with any data.
 */
export default function ProgressView({ locale, t, loading, currentXP, rank, nextRank, rankPct, stats, dna, sessions, go }) {
  const L = (mn, ko, en) => loc(locale, mn, ko, en);
  const date = (s) => shortDate(s.createdAt, locale);
  const mixTotal = stats.mix.jab + stats.mix.cross + stats.mix.hook;

  return (
    <div style={wrap}>
        <header style={{ marginBottom: 18 }}>
          <p style={kickerPill}><span style={kickerDot} />{L("Дэвшил", "성장", "Progress")}</p>
          <h1 style={{ ...displayTitle, fontSize: 40, marginTop: 14, color: rank?.color || BRAND.text }}>
            {loading ? "…" : t(rank.key)}
          </h1>
        </header>

        {/* Rank: one XP number, one ladder */}
        <section style={{ ...card, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
            <span style={{ ...displayTitle, fontSize: 28 }}>{currentXP.toLocaleString()} <span style={{ fontSize: 14, color: BRAND.faint }}>XP</span></span>
            {nextRank && <span style={{ fontSize: 13, color: BRAND.muted, textAlign: "right" }}>{L("Дараагийн цол", "다음 등급", "Next")}: <b style={{ color: BRAND.text, fontWeight: 600 }}>{t(nextRank.key)}</b></span>}
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginTop: 12 }}>
            <div style={{ height: "100%", width: `${Math.round(rankPct)}%`, borderRadius: 4, background: `linear-gradient(90deg, ${BRAND.red}, ${BRAND.gold})`, transition: "width 0.6s ease" }} />
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: BRAND.faint }}>
            {nextRank
              ? L(`${(nextRank.minXP - currentXP).toLocaleString()} XP үлдлээ`, `${(nextRank.minXP - currentXP).toLocaleString()} XP 남음`, `${(nextRank.minXP - currentXP).toLocaleString()} XP to go`)
              : L("Хамгийн дээд цол", "최고 등급", "Top rank")}
          </div>
          <details style={{ marginTop: 14 }}>
            <summary style={summary}>{L("Цолны шат", "등급 단계", "All ranks")}</summary>
            <ol style={{ listStyle: "none", margin: "10px 0 0", padding: 0, display: "grid", gap: 4 }}>
              {RANK_TIERS.map((r) => {
                const here = r.key === rank.key, done = currentXP >= r.minXP;
                return (
                  <li key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 10, background: here ? "rgba(255,255,255,0.06)" : "transparent" }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: done ? r.color : "rgba(255,255,255,0.12)" }} />
                    <span style={{ flex: 1, fontSize: 14, color: here ? BRAND.text : done ? BRAND.muted : BRAND.faint, fontWeight: here ? 700 : 500 }}>{t(r.key)}</span>
                    <span style={{ fontSize: 12, color: BRAND.faint }}>{r.minXP.toLocaleString()}</span>
                  </li>
                );
              })}
            </ol>
          </details>
        </section>

        {/* Key numbers */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          {[
            { label: L("Бэлтгэл", "세션", "Sessions"), value: stats.count, sub: stats.thisWeek ? L(`${stats.thisWeek} энэ долоо хоногт`, `이번 주 ${stats.thisWeek}`, `${stats.thisWeek} this week`) : null },
            { label: L("Дундаж оноо", "평균 점수", "Average"), value: stats.avg ?? "—", sub: stats.trend == null ? null : `${stats.trend > 0 ? "▲" : stats.trend < 0 ? "▼" : "•"} ${Math.abs(stats.trend).toFixed(1)}`, subColor: stats.trend > 0 ? BRAND.green : stats.trend < 0 ? "#F87171" : BRAND.faint },
            { label: L("Шилдэг оноо", "최고 점수", "Best"), value: stats.best ?? "—" },
            { label: L("Цохилт", "펀치", "Punches"), value: stats.punches.toLocaleString() },
          ].map((s) => (
            <div key={s.label} style={{ ...card, padding: "14px 16px" }}>
              <div style={{ fontSize: 12, color: BRAND.faint }}>{s.label}</div>
              <div style={{ ...displayTitle, fontSize: 30, marginTop: 6 }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 12, marginTop: 4, color: s.subColor || BRAND.muted }}>{s.sub}</div>}
            </div>
          ))}
        </section>

        {/* Score trend */}
        <section style={{ ...card, padding: 18, marginTop: 12 }}>
          <p style={sectionLabel}>{L("Онооны явц", "점수 추이", "Score trend")}</p>
          {stats.series.length >= 2 ? (
            <div style={{ marginTop: 14 }}>
              <ScoreTrendChart scores={stats.series} label={L("Онооны график", "점수 그래프", "Score chart")} avgLabel={L("дундаж", "평균", "avg")} />
            </div>
          ) : (
            <Empty L={L} onTrain={() => go("/train")} />
          )}
        </section>

        {/* Punch mix */}
        {mixTotal > 0 && (
          <section style={{ ...card, padding: 18, marginTop: 12 }}>
            <p style={sectionLabel}>{L("Цохилтын харьцаа", "펀치 비율", "Punch mix")}</p>
            <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden", gap: 2, marginTop: 14 }} aria-hidden="true">
              {MIX.filter((m) => stats.mix[m.key]).map((m) => <div key={m.key} style={{ flex: stats.mix[m.key], background: m.color }} />)}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
              {MIX.map((m) => (
                <span key={m.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: BRAND.muted }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
                  {m.label} {Math.round((100 * stats.mix[m.key]) / mixTotal)}%
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Fighter DNA */}
        <button type="button" onClick={() => go("/fighter-profile")} style={{ ...card, ...rowBtn, marginTop: 12 }}>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ ...sectionLabel, display: "block" }}>Fighter DNA</span>
            <span style={{ display: "block", marginTop: 6, fontSize: 17, fontWeight: 700, color: BRAND.text }}>
              {dna.building
                ? L(`${3 - (dna.sessionsNeeded ?? 3)}/3 бэлтгэл — DNA нээгдэнэ`, `${3 - (dna.sessionsNeeded ?? 3)}/3 세션 — DNA 공개`, `${3 - (dna.sessionsNeeded ?? 3)}/3 sessions to unlock`)
                : dna.archetype}
            </span>
          </span>
          <span aria-hidden="true" style={{ color: BRAND.faint, fontSize: 18 }}>→</span>
        </button>

        {/* World Tour — the rank ladder as a journey of cities */}
        <button type="button" data-testid="open-tour" onClick={() => go("/tour")} style={{ ...card, ...rowBtn, marginTop: 12 }}>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ ...sectionLabel, display: "block" }}>World Tour</span>
            <span style={{ display: "block", marginTop: 6, fontSize: 17, fontWeight: 700, color: BRAND.text }}>
              {L("Улаанбаатараас Вегас хүртэл — 3D хотууд", "울란바토르에서 베가스까지 — 3D 도시", "Ulaanbaatar to Vegas — cities in 3D")}
            </span>
          </span>
          <span aria-hidden="true" style={{ color: BRAND.faint, fontSize: 18 }}>→</span>
        </button>

        {/* Latest sessions */}
        {stats.count > 0 && (
          <section style={{ ...card, padding: "16px 18px", marginTop: 12 }}>
            <p style={sectionLabel}>{L("Сүүлийн бэлтгэлүүд", "최근 세션", "Latest sessions")}</p>
            <ul style={{ listStyle: "none", margin: "10px 0 0", padding: 0 }}>
              {sessions.slice(0, 5).map((s) => (
                <li key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${BRAND.line}` }}>
                  <span style={{ ...displayTitle, fontSize: 22, width: 44 }}>{Number(s.score).toFixed(1)}</span>
                  <span style={{ flex: 1, fontSize: 14, color: BRAND.muted }}>
                    {date(s)}{s.poseMetrics?.punchCount ? ` · ${s.poseMetrics.punchCount} ${L("цохилт", "펀치", "punches")}` : ""}
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => go("/history")} style={{ ...btnSecondary, marginTop: 8 }}>
              {L("Бүх бэлтгэл", "모든 세션", "All sessions")} →
            </button>
          </section>
        )}

        {/* How XP works */}
        <details style={{ ...card, padding: "14px 18px", marginTop: 12 }}>
          <summary style={summary}>{L("XP хэрхэн авах вэ", "XP 얻는 방법", "How to earn XP")}</summary>
          <div style={{ marginTop: 10 }}><HowToEarnXP locale={locale} t={t} /></div>
        </details>
    </div>
  );
}

function Empty({ L, onTrain }) {
  return (
    <div style={{ marginTop: 12 }}>
      <p style={{ margin: "0 0 14px", fontSize: 15, color: BRAND.muted, lineHeight: 1.5 }}>
        {L("2 бэлтгэлийн дараа онооны график энд гарна.", "2번 훈련하면 점수 그래프가 표시돼요.", "Your score chart appears after 2 sessions.")}
      </p>
      <button type="button" onClick={onTrain} style={btnPrimary}>{L("Раунд эхлүүлэх", "라운드 시작", "Start a round")}</button>
    </div>
  );
}

const wrap = {
  maxWidth: 540,
  margin: "0 auto",
  padding: "calc(24px + env(safe-area-inset-top)) 16px calc(110px + env(safe-area-inset-bottom))",
};
const summary = { cursor: "pointer", fontSize: 14, fontWeight: 600, color: BRAND.muted, listStyle: "revert", padding: "10px 0" }; // ≥ 40 px tap target
const rowBtn = {
  display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
  padding: "16px 18px", cursor: "pointer", color: BRAND.text, font: "inherit",
};
