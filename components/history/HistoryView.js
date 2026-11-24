"use client";

import { useState, useMemo } from "react";
import { RED, GOLD } from "@/lib/tokens";
import { shortDate } from "@/lib/progressStats";
import BrandHeader from "@/components/ui/BrandHeader";
import { BRAND, btnPrimary, card, displayTitle, glass, pageBackground } from "@/components/ui/brand";
import BottomNav from "@/components/BottomNav";
import { ScoreDial } from "@/components/ui/gauges";

const TAG_COLORS = {
  Bag: RED, Shadow: "#3B82F6", Mitts: GOLD,
  Sparring: "#A78BFA", Conditioning: "#34D399",
};

const STYLE_COLOR = {
  pressure:  "#F87171",
  outboxer:  "#34D399",
  explosive: "#F59E0B",
  counter:   "#94A3B8",
};

const SCORE_RANGES = [
  { label: "All", mn: "Бүгд", min: 0, max: 10 },
  { label: "8–10", mn: "8–10", min: 8, max: 10 },
  { label: "6–8",  mn: "6–8",  min: 6, max: 8 },
  { label: "<6",   mn: "<6",   min: 0, max: 6 },
];

const TAGS = ["Bag", "Shadow", "Mitts", "Sparring", "Conditioning"];


/** The history screen: summary dial, filters, one row per round. Presentational (the page loads the sessions). */
export default function HistoryView({ sessions, locale, router, user, onBack }) {
  const [tagFilter, setTagFilter] = useState(null);
  const [scoreFilter, setScoreFilter] = useState(SCORE_RANGES[0]);
  const [sortDir, setSortDir] = useState("desc");
  const filtered = useMemo(() => {
    let list = sessions.filter((s) => {
      const score = Number(s.score);
      if (score < scoreFilter.min || score > scoreFilter.max) return false;
      if (tagFilter && s.sessionTag !== tagFilter) return false;
      return true;
    });
    if (sortDir === "asc") list = [...list].reverse();
    return list;
  }, [sessions, tagFilter, scoreFilter, sortDir]);

  const avgScore = useMemo(() => {
    const scores = filtered.map((s) => Number(s.score)).filter(Number.isFinite);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  }, [filtered]);

  const totalPunches = useMemo(() => {
    return filtered.reduce((sum, s) => sum + (s.poseMetrics?.punchCount || 0), 0);
  }, [filtered]);

  const L = (m, k, e) => (locale === "mn" ? m : locale === "ko" ? k : e);
  const back = onBack;

  const chip = (active, col = "#fff") => ({
    ...glass,
    flexShrink: 0, padding: "8px 14px", borderRadius: 999, fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
    ...(active ? { background: col === "#fff" ? "#fff" : `${col}26`, borderColor: col === "#fff" ? "#fff" : `${col}66`, color: col === "#fff" ? "#0b0b0d" : col } : { color: BRAND.muted }),
  });
  const chipRow = { display: "flex", gap: 8, overflowX: "auto", margin: "0 -16px", padding: "0 16px 4px", scrollbarWidth: "none" };

  return (
    <div style={{ background: pageBackground, minHeight: "100dvh", color: "#fff" }}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 16px calc(110px + env(safe-area-inset-bottom))" }}>
        <BrandHeader
          kicker={L("Дэвшил", "성장", "Progress")}
          title={L("Бэлтгэлийн түүх", "훈련 기록", "Session history")}
          onBack={back}
          backLabel={L("Буцах", "뒤로", "Back")}
        />

        {/* Key numbers: the average as one dial, the counts beside it */}
        <section data-testid="history-summary" style={{ ...glass, borderRadius: 24, padding: "16px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ flexShrink: 0, textAlign: "center" }}>
            <ScoreDial value={avgScore ?? NaN} width={124} stroke={11} label={L("Дундаж", "평균", "Average")} />
            <div style={{ marginTop: 4, fontSize: 12, color: BRAND.faint }}>{L("Дундаж", "평균", "Average")}</div>
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 12 }}>
            <div>
              <div style={{ ...displayTitle, fontSize: 30 }}>{filtered.length}</div>
              <div style={{ fontSize: 12, color: BRAND.faint }}>{L("Бэлтгэл", "세션", "Sessions")}</div>
            </div>
            <div>
              <div style={{ ...displayTitle, fontSize: 30 }}>{totalPunches ? totalPunches.toLocaleString() : "—"}</div>
              <div style={{ fontSize: 12, color: BRAND.faint }}>{L("Цохилт", "펀치", "Punches")}</div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div style={{ ...chipRow, marginBottom: 8 }}>
          {SCORE_RANGES.map((r) => (
            <button key={r.label} type="button" onClick={() => setScoreFilter(r)} style={chip(scoreFilter.label === r.label)}>
              {r.label === "All" ? L("Бүх оноо", "전체 점수", "All scores") : r.label}
            </button>
          ))}
          <button type="button" onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))} style={{ ...chip(false), marginLeft: "auto" }}>
            {sortDir === "desc" ? L("↓ Шинэ", "↓ 최신", "↓ Newest") : L("↑ Хуучин", "↑ 오래된", "↑ Oldest")}
          </button>
        </div>
        {sessions.some((x) => x.sessionTag) && <div style={{ ...chipRow, marginBottom: 18 }}>
          <button type="button" onClick={() => setTagFilter(null)} style={chip(!tagFilter)}>{L("Бүгд", "전체", "All")}</button>
          {TAGS.map((tag) => {
            const active = tagFilter === tag;
            return (
              <button key={tag} type="button" onClick={() => setTagFilter(active ? null : tag)} style={chip(active, TAG_COLORS[tag] || BRAND.gold)}>{tag}</button>
            );
          })}
        </div>}

        {/* Sessions */}
        {filtered.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: "36px 20px" }}>
            <div style={{ fontSize: 30 }} aria-hidden="true">🥊</div>
            <p style={{ margin: "10px 0 16px", fontSize: 15, color: BRAND.muted }}>
              {sessions.length ? L("Шүүлтүүрт тохирох бэлтгэл алга", "필터에 맞는 세션이 없어요", "No sessions match your filters") : L("Анхны раундаа хийгээд энд түүхээ хар.", "첫 라운드를 하면 기록이 쌓여요.", "Do your first round to start your history.")}
            </p>
            {!sessions.length && <button type="button" onClick={() => router.push(`/${locale}/train`)} style={btnPrimary}>{L("Раунд эхлүүлэх", "라운드 시작", "Start a round")}</button>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((s) => {
              const score  = Number(s.score);
              const col    = score >= 8 ? BRAND.green : score >= 6.5 ? BRAND.gold : BRAND.red;
              const tagCol = TAG_COLORS[s.sessionTag] || null;
              const xp     = Number(s.xpGained) || 0;
              const pm     = s.poseMetrics;
              const bi     = pm?.boxingIntelligence;
              const pc     = pm?.punchCount || 0;
              const pb     = pm?.punchBreakdown || {};
              const mix    = [["Jab", pb.jab?.count, "#60A5FA"], ["Cross", pb.cross?.count, BRAND.red], ["Hook", pb.hook?.count, BRAND.gold]].filter(([, n]) => n > 0);
              const styleCol = STYLE_COLOR[bi?.style];
              const showStyle = bi?.styleLabel && (bi.styleConfidence ?? 0) >= 0.3;
              // The one thing to fix, as measured by the camera for that round (saved, localized, by
              // lib/trainingSessionDoc). No fallback: the old one printed a "skill score" that was
              // arithmetic on the round score, not a measurement.
              const pw = s.techniqueReview?.priorityWeakness;
              const weakness = typeof pw === "string" && pw.trim() && (!s.locale || s.locale === locale) ? pw.trim() : null;

              return (
                <div key={s.id} style={{ ...card, display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: `radial-gradient(90% 120% at 0% 50%, ${col}14, transparent 55%), ${BRAND.card}` }}>
                  <div style={{ ...displayTitle, fontSize: 34, width: 58, flexShrink: 0, color: col }}>{Number.isFinite(score) ? score.toFixed(1) : "—"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{shortDate(s.createdAt, locale)}</span>
                      {s.sessionTag && tagCol && <span style={{ fontSize: 11, fontWeight: 600, color: tagCol, background: `${tagCol}1f`, borderRadius: 999, padding: "2px 8px" }}>{s.sessionTag}</span>}
                      {showStyle && <span style={{ fontSize: 11, fontWeight: 600, color: styleCol, background: `${styleCol}1f`, borderRadius: 999, padding: "2px 8px" }}>{bi.styleLabel}</span>}
                      {s.sessionIdentity && !showStyle && <span style={{ fontSize: 11, fontWeight: 600, color: "#C4B5FD", background: "rgba(168,85,247,0.14)", borderRadius: 999, padding: "2px 8px" }}>{s.sessionIdentity}</span>}
                    </div>
                    {pc > 0 && (
                      <div style={{ marginTop: 5, fontSize: 13, color: BRAND.muted, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span>{pc} {L("цохилт", "펀치", "punches")}</span>
                        {mix.map(([name, n, c]) => <span key={name} style={{ color: c }}>{name} {n}</span>)}
                      </div>
                    )}
                    {weakness && <div style={{ marginTop: 4, fontSize: 12.5, color: "rgba(248,113,113,0.85)", lineHeight: 1.35 }}>↳ {weakness}</div>}
                  </div>
                  {xp > 0 && <div style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: BRAND.gold }}>+{xp} XP</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="progress" />
    </div>
  );
}
