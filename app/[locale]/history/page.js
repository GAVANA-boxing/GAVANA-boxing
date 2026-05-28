"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname } from "@/lib/i18n";
import { RED, GOLD, goldAlpha, redAlpha, RADIUS } from "@/lib/tokens";
import BottomNav from "@/components/BottomNav";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function formatDate(ts, locale) {
  const d = new Date(getTs(ts));
  if (!d.getTime()) return "—";
  return d.toLocaleDateString(locale === "mn" ? "mn-MN" : locale === "ko" ? "ko-KR" : "en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

const TAG_COLORS = {
  Bag: RED, Shadow: "#60A5FA", Mitts: GOLD,
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

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const mn = locale === "mn";

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState(null);
  const [scoreFilter, setScoreFilter] = useState(SCORE_RANGES[0]);
  const [sortDir, setSortDir] = useState("desc");

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { router.replace(`/${locale}/login`); return; }
    let active = true;
    getDocs(query(collection(db, "training_sessions"), where("userId", "==", user.uid)))
      .then((snap) => {
        if (!active) return;
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.type === "training" && s.score != null)
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setSessions(list);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.uid, authLoading]);

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

  if (loading || authLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0B0B0C" }}>
        <div style={{ width: 28, height: 28, border: "2px solid #FF3B30", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ background: "#0B0B0C", minHeight: "100dvh", color: "#fff" }}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "calc(20px + env(safe-area-inset-top)) 16px calc(96px + env(safe-area-inset-bottom))" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button type="button" onClick={() => router.back()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", padding: "4px 6px 4px 0" }}>←</button>
          <div>
            <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color: RED, letterSpacing: 3, textTransform: "uppercase" }}>COMBAT · OS</p>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>
              {mn ? "Дасгалын түүх" : "Session History"}
            </h1>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {[
            { label: mn ? "Нийт" : "Total", value: sessions.length, unit: mn ? "дасгал" : "sessions", col: GOLD },
            { label: mn ? "Цохилт" : "Punches", value: totalPunches || "—", unit: "", col: "#F87171" },
            { label: mn ? "Дундаж" : "Avg Score", value: avgScore?.toFixed(1) ?? "—", unit: "/10", col: "#34D399" },
          ].map(({ label, value, unit, col }) => (
            <div key={label} style={{ flex: 1, padding: "9px 10px", borderRadius: 12, background: `${col}09`, border: `1px solid ${col}20` }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: col, lineHeight: 1 }}>
                {value}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginLeft: 2 }}>{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Score filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 4 }}>
          {SCORE_RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setScoreFilter(r)}
              style={{
                flexShrink: 0, padding: "5px 12px", borderRadius: RADIUS.full, fontSize: 11, fontWeight: 800, cursor: "pointer",
                background: scoreFilter.label === r.label ? goldAlpha(0.18) : "rgba(255,255,255,0.05)",
                border: `1px solid ${scoreFilter.label === r.label ? goldAlpha(0.45) : "rgba(255,255,255,0.1)"}`,
                color: scoreFilter.label === r.label ? GOLD : "rgba(255,255,255,0.4)",
              }}
            >{mn ? r.mn : r.label}</button>
          ))}
          <button
            type="button"
            onClick={() => setSortDir((d) => d === "desc" ? "asc" : "desc")}
            style={{
              flexShrink: 0, marginLeft: "auto", padding: "5px 12px", borderRadius: RADIUS.full, fontSize: 11, fontWeight: 800, cursor: "pointer",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)",
            }}
          >{sortDir === "desc" ? "↓ New" : "↑ Old"}</button>
        </div>

        {/* Tag filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto", paddingBottom: 4 }}>
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: RADIUS.full, fontSize: 11, fontWeight: 800, cursor: "pointer",
              background: !tagFilter ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${!tagFilter ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"}`,
              color: !tagFilter ? "#fff" : "rgba(255,255,255,0.35)",
            }}
          >{mn ? "Бүгд" : "All"}</button>
          {TAGS.map((tag) => {
            const col = TAG_COLORS[tag] || GOLD;
            const active = tagFilter === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setTagFilter(active ? null : tag)}
                style={{
                  flexShrink: 0, padding: "5px 12px", borderRadius: RADIUS.full, fontSize: 11, fontWeight: 800, cursor: "pointer",
                  background: active ? `${col}18` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? col + "45" : "rgba(255,255,255,0.08)"}`,
                  color: active ? col : "rgba(255,255,255,0.35)",
                }}
              >{tag}</button>
            );
          })}
        </div>

        {/* Session list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.25)", fontSize: 14, fontWeight: 700 }}>
            {mn ? "Тохирох дасгал олдсонгүй" : "No sessions match your filters"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((s) => {
              const score  = Number(s.score);
              const col    = score >= 8 ? "#34D399" : score >= 6 ? GOLD : "#F87171";
              const tagCol = TAG_COLORS[s.sessionTag] || null;
              const xp     = Number(s.xpGained) || 0;

              const pm       = s.poseMetrics;
              const bi       = pm?.boxingIntelligence;
              const pc       = pm?.punchCount || 0;
              const pb       = pm?.punchBreakdown || {};
              const jabC     = pb.jab?.count   || 0;
              const crossC   = pb.cross?.count  || 0;
              const hookC    = pb.hook?.count   || 0;
              const conf     = pm?.avgConfidencePct ?? pm?.debugStats?.avgConfidencePct;
              const styleKey = bi?.style;
              const styleCol = STYLE_COLOR[styleKey];
              const showStyle = bi?.styleLabel && (bi.styleConfidence ?? 0) >= 0.3;
              const identity = s.sessionIdentity;
              // Saved weaknesses (new sessions) or derived from breakdown (old sessions)
              const weakness = (() => {
                if (pm?.weaknesses?.length) return pm.weaknesses[0];
                const bd = s.breakdown;
                if (!bd) return null;
                const entries = Object.entries(bd).filter(([, v]) => typeof v === "number");
                if (!entries.length) return null;
                const [key, val] = entries.reduce((a, b) => b[1] < a[1] ? b : a);
                if (val >= 6.5) return null;
                const labels = { accuracy: mn ? "Нарийвчлал" : "Accuracy", speed: mn ? "Хурд" : "Speed", power: mn ? "Хүч" : "Power", consistency: mn ? "Тогтвортой байдал" : "Consistency" };
                return labels[key] ? `${mn ? "Сайжруулах:" : "Improve:"} ${labels[key]} (${val.toFixed(1)}/10)` : null;
              })();

              return (
                <div key={s.id} style={{
                  padding: "11px 13px", borderRadius: 14,
                  background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {/* Score circle */}
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                      background: `${col}14`, border: `2px solid ${col}35`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 900, color: col,
                    }}>
                      {score.toFixed(1)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Date + tags */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>
                          {formatDate(s.createdAt, locale)}
                        </span>
                        {s.sessionTag && tagCol && (
                          <span style={{ fontSize: 8, fontWeight: 900, color: tagCol, background: `${tagCol}18`, border: `1px solid ${tagCol}30`, borderRadius: RADIUS.full, padding: "1px 6px" }}>
                            {s.sessionTag}
                          </span>
                        )}
                        {showStyle && (
                          <span style={{ fontSize: 8, fontWeight: 900, color: styleCol, background: `${styleCol}14`, border: `1px solid ${styleCol}30`, borderRadius: RADIUS.full, padding: "1px 6px", letterSpacing: 0.8 }}>
                            {bi.styleLabel}
                          </span>
                        )}
                        {identity && !showStyle && (
                          <span style={{ fontSize: 8, fontWeight: 900, color: "rgba(168,85,247,0.9)", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: RADIUS.full, padding: "1px 6px", letterSpacing: 0.5 }}>
                            {identity}
                          </span>
                        )}
                      </div>
                      {/* Score bar */}
                      <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden", marginBottom: pc > 0 ? 5 : 0 }}>
                        <div style={{ height: "100%", width: `${(score / 10) * 100}%`, borderRadius: 2, background: col }} />
                      </div>
                      {/* Punch stats */}
                      {pc > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
                            {pc} {mn ? "цохилт" : "punches"}
                          </span>
                          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>
                            {jabC > 0 ? `${jabC}J` : ""}{crossC > 0 ? ` ${crossC}C` : ""}{hookC > 0 ? ` ${hookC}H` : ""}
                          </span>
                          {conf != null && (
                            <span style={{
                              fontSize: 9, fontWeight: 800,
                              color: conf >= 70 ? "#34D399" : conf >= 45 ? GOLD : "#F87171",
                            }}>
                              {conf}%
                            </span>
                          )}
                        </div>
                      )}
                      {/* Weakness */}
                      {weakness && (
                        <div style={{ marginTop: 3, fontSize: 9, fontWeight: 700, color: "rgba(248,113,113,0.7)", lineHeight: 1.3 }}>
                          ↳ {weakness}
                        </div>
                      )}
                    </div>

                    {/* XP */}
                    {xp > 0 && (
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: GOLD }}>+{xp}</div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.25)" }}>XP</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="" />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
