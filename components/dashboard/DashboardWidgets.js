"use client";

import { useState, useEffect } from "react";
import { collection, query, where, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RED, GOLD, PURPLE, redAlpha, goldAlpha } from "@/lib/tokens";
import {
  WEIGHT_CLASSES, RADAR_KEYS, RADAR_ANGLES, INSIGHT_COLOR, DNA_ATTRS, radPolar,
} from "@/lib/dashboardHelpers";

function getTs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  return Number(ts) || 0;
}

function formatDate(ts) {
  const ms = getTs(ts);
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatScore(s) {
  const n = Number(s);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

export const labelStyle = {
  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: 4,
};

export const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

export const primaryBtnStyle = {
  flex: 1, padding: "10px 0", borderRadius: 9,
  background: "linear-gradient(135deg, #C1121F, #7d0812)",
  border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
};

export const ghostBtnStyle = {
  flex: 1, padding: "10px 0", borderRadius: 9,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700, cursor: "pointer",
};

// ─── Radar Chart ──────────────────────────────────────────────────────────────

export function RadarChart({ stats }) {
  const SIZE = 230;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const maxR = 76;

  const gridPoly = (scale) =>
    RADAR_ANGLES.map((a) => {
      const p = radPolar(a, maxR * scale, cx, cy);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");

  const dataPoints = RADAR_KEYS.map((key, i) => {
    const val = Math.max(0, Math.min(10, stats[key] || 0));
    return radPolar(RADAR_ANGLES[i], (val / 10) * maxR, cx, cy);
  });
  const dataPoly = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <radialGradient id="rdg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={redAlpha(0.52)} />
          <stop offset="100%" stopColor={redAlpha(0.05)} />
        </radialGradient>
        <filter id="rdGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {[0.25, 0.5, 0.75, 1.0].map((scale) => (
        <polygon key={scale} points={gridPoly(scale)}
          fill="none"
          stroke={scale === 1.0 ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.05)"}
          strokeWidth={scale === 1.0 ? 1 : 0.7}
        />
      ))}

      {RADAR_ANGLES.map((a, i) => {
        const outer = radPolar(a, maxR, cx, cy);
        return (
          <line key={i}
            x1={cx.toFixed(1)} y1={cy.toFixed(1)}
            x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
            stroke="rgba(255,255,255,0.055)" strokeWidth="1" />
        );
      })}

      <polygon points={dataPoly}
        fill="url(#rdg)"
        stroke={GOLD}
        strokeWidth="1.8"
        strokeLinejoin="round"
        filter="url(#rdGlow)"
        className="radar-polygon"
      />

      {dataPoints.map((p, i) => (
        <circle key={i}
          cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
          r="3" fill={GOLD} stroke="rgba(0,0,0,0.55)" strokeWidth="0.5" opacity="0.92"
        />
      ))}

      {RADAR_KEYS.map((key, i) => {
        const p = radPolar(RADAR_ANGLES[i], maxR + 17, cx, cy);
        const ta = p.x < cx - 8 ? "end" : p.x > cx + 8 ? "start" : "middle";
        const val = Math.max(0, Math.min(10, stats[key] || 0));
        const valColor = val >= 7 ? GOLD : val >= 5 ? "rgba(255,255,255,0.45)" : RED;
        return (
          <g key={key}>
            <text x={p.x.toFixed(1)} y={(p.y - 4).toFixed(1)}
              textAnchor={ta} dominantBaseline="auto"
              fontSize="8" fontWeight="900" fill="rgba(255,255,255,0.6)" letterSpacing="0.7">
              {key.toUpperCase()}
            </text>
            <text x={p.x.toFixed(1)} y={(p.y + 7).toFixed(1)}
              textAnchor={ta} dominantBaseline="auto"
              fontSize="7" fontWeight="700" fill={valColor}>
              {val.toFixed(1)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Style DNA ────────────────────────────────────────────────────────────────

export function StyleDNA({ radarStats }) {
  const items = DNA_ATTRS.map((a) => ({
    key: a.key,
    color: a.color,
    pct: Math.round(Math.max(1, Math.min(10, a.fn(radarStats))) * 10),
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {items.map((item) => (
        <div key={item.key}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.42)", letterSpacing: 0.9 }}>
              {item.key.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, fontWeight: 900, color: item.color }}>{item.pct}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: "rgba(255,255,255,0.055)", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 999,
              width: `${item.pct}%`,
              background: `linear-gradient(90deg, ${item.color}88, ${item.color})`,
              boxShadow: `0 0 8px ${item.color}44`,
              animation: "rankFill 850ms cubic-bezier(0.16,1,0.3,1) both",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Fighter Score Hero ───────────────────────────────────────────────────────

export function FighterHero({ displayScore, xp, rank, nextRank, xpProgress, insight, t }) {
  const ic = INSIGHT_COLOR[insight.type];
  const rankIcon = rank.icon === "crown" ? "👑" : rank.icon === "diamond" ? "💎" : rank.icon === "star5" ? "⭐" : "🥊";

  return (
    <div style={{
      position: "relative",
      borderRadius: 22,
      overflow: "hidden",
      background: "linear-gradient(160deg, #1c0202 0%, #0e0000 45%, #080808 100%)",
      border: `1px solid ${redAlpha(0.18)}`,
      boxShadow: `0 0 0 1px ${redAlpha(0.07)}, 0 28px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.035)`,
      marginBottom: 20,
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse at 18% 25%, ${redAlpha(0.24)} 0%, transparent 58%)`,
      }} />
      <div style={{ position: "relative", padding: "22px 22px 20px" }}>
        <p style={{ margin: "0 0 18px", fontSize: 9, fontWeight: 900, color: `${redAlpha(0.75)}`, letterSpacing: 3.5, textTransform: "uppercase" }}>
          GAVANA · FIGHTER SCORE
        </p>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, lineHeight: 1 }}>
              <span style={{
                fontSize: 72, fontWeight: 900, color: "#fff",
                letterSpacing: "-0.045em", lineHeight: 0.92,
                fontFamily: "var(--font-display, 'Anton', sans-serif)",
                textShadow: `0 0 60px ${redAlpha(0.35)}, 0 4px 24px rgba(0,0,0,0.8)`,
              }}>
                {displayScore}
              </span>
              <span style={{ fontSize: 19, color: "rgba(255,255,255,0.22)", fontWeight: 700, paddingBottom: 8 }}>/100</span>
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: rank.color, letterSpacing: 0.2 }}>{t(rank.key)}</span>
              <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 12 }}>·</span>
              <span style={{ fontSize: 12, color: GOLD, fontWeight: 800 }}>{xp.toLocaleString()} XP</span>
            </div>
          </div>

          <div style={{
            width: 62, height: 62, borderRadius: "50%", flexShrink: 0,
            background: `radial-gradient(ellipse at 40% 30%, ${rank.color}1e, rgba(0,0,0,0.55))`,
            border: `1.5px solid ${rank.color}3a`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 0 28px ${rank.color}28`,
          }}>
            <span style={{ fontSize: 28 }}>{rankIcon}</span>
          </div>
        </div>

        {nextRank && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.22)", letterSpacing: 0.5 }}>
                {t(rank.key).toUpperCase()}
              </span>
              <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)" }}>
                {(nextRank.minXP - xp).toLocaleString()} {t("dashboardToGo")} → {t(nextRank.key)}
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 999,
                background: rank.gradient || rank.color,
                width: `${xpProgress}%`,
                boxShadow: `0 0 14px ${rank.color}55`,
                animation: "rankFill 1100ms cubic-bezier(0.16,1,0.3,1) both",
              }} />
            </div>
          </div>
        )}

        <p style={{
          margin: 0, fontSize: 12, color: ic,
          fontStyle: "italic", lineHeight: 1.55, opacity: 0.88,
          borderLeft: `2px solid ${ic}55`, paddingLeft: 10,
        }}>
          {insight.text}
        </p>
      </div>
    </div>
  );
}

// ─── Stat Pill ────────────────────────────────────────────────────────────────

export function StatPill({ label, value, sub, color }) {
  return (
    <div style={{
      background: "linear-gradient(160deg, #111012 0%, #0a0a0a 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderTop: `2px solid ${color || "rgba(255,255,255,0.18)"}`,
      borderRadius: 13,
      padding: "12px 11px 10px",
      boxShadow: `0 0 14px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.025)`,
    }}>
      <div style={{
        fontSize: 20, fontWeight: 900, color: color || "#fff",
        letterSpacing: "-0.025em", lineHeight: 1,
        fontFamily: "var(--font-display,'Anton',sans-serif)",
        textShadow: `0 0 18px ${color || "rgba(255,255,255,0.2)"}44`,
      }}>
        {value}
      </div>
      <div style={{ fontSize: 8, fontWeight: 800, color: "rgba(255,255,255,0.32)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 5 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Score Chart ──────────────────────────────────────────────────────────────

export function ScoreChart({ scores, t }) {
  if (!scores || scores.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "28px 0", color: "#333", fontSize: 12 }}>
        {scores?.length === 1 ? "1 session — need 2+ to show trend" : t("dashboardNoSessions")}
      </div>
    );
  }

  const W = 320, H = 100;
  const PAD = { top: 16, bottom: 24, left: 26, right: 36 };
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;
  const toX = (i) => PAD.left + (i / (scores.length - 1)) * pw;
  const toY = (v) => PAD.top + ph - (Math.max(0, Math.min(10, v)) / 10) * ph;
  const pts = scores.map((s, i) => `${toX(i).toFixed(1)},${toY(s).toFixed(1)}`).join(" ");
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const best = Math.max(...scores);
  const avgY = toY(avg).toFixed(1);
  const bestY = toY(best).toFixed(1);
  const bestIdx = scores.indexOf(best);

  const recent3 = scores.slice(-3);
  const older3 = scores.slice(0, 3);
  const recentAvg = recent3.reduce((a, b) => a + b, 0) / recent3.length;
  const olderAvg = older3.reduce((a, b) => a + b, 0) / older3.length;
  const improvement = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg * 100) : 0;

  return (
    <div style={{ width: "100%" }}>
      {Math.abs(improvement) > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: improvement > 0 ? "#4ade80" : "#f87171" }}>
            {improvement > 0 ? "↑" : "↓"} {Math.abs(improvement).toFixed(0)}%
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>{t("dashboardVsEarlier")}</span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x={PAD.left - 4} y={toY(v) + 3.5} textAnchor="end"
              fontSize="7" fill="rgba(255,255,255,0.18)">{v}</text>
          </g>
        ))}
        <line x1={PAD.left} y1={bestY} x2={W - PAD.right} y2={bestY}
          stroke={GOLD} strokeWidth="0.8" strokeDasharray="4,3" opacity="0.5" />
        <text x={W - PAD.right + 3} y={Number(bestY) + 3.5} fontSize="7" fill={GOLD} opacity="0.65">
          {t("dashboardBest")}
        </text>
        <line x1={PAD.left} y1={avgY} x2={W - PAD.right} y2={avgY}
          stroke="rgba(255,255,255,0.13)" strokeWidth="0.6" strokeDasharray="2,3" />
        <polygon
          points={`${pts} ${toX(scores.length - 1).toFixed(1)},${PAD.top + ph} ${PAD.left},${PAD.top + ph}`}
          fill={redAlpha(0.07)}
        />
        <polyline points={pts} fill="none" stroke={RED} strokeWidth="1.8"
          strokeLinejoin="round" strokeLinecap="round" className="graph-line" />
        {scores.map((s, i) => (
          <circle key={i} cx={toX(i).toFixed(1)} cy={toY(s).toFixed(1)}
            r={i === bestIdx ? 3.5 : 2.5}
            fill={i === bestIdx ? GOLD : RED}
            stroke="rgba(0,0,0,0.6)" strokeWidth="0.5"
          />
        ))}
        <text x={toX(0).toFixed(1)} y={H - 4} textAnchor="middle"
          fontSize="7" fill="rgba(255,255,255,0.18)">{t("dashboardOlderSess")}</text>
        <text x={toX(scores.length - 1).toFixed(1)} y={H - 4} textAnchor="middle"
          fontSize="7" fill="rgba(255,255,255,0.18)">{t("dashboardRecentSess")}</text>
      </svg>
      <div style={{ display: "flex", gap: 14, marginTop: 7, paddingLeft: 26 }}>
        {[
          { color: RED, solid: true, label: t("dashboardScore") },
          { color: GOLD, dashed: true, label: `${t("dashboardBest")} ${formatScore(best)}` },
          { color: "rgba(255,255,255,0.22)", dashed: true, label: `${t("dashboardAvg")} ${formatScore(avg)}` },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 16, height: 2,
              background: item.solid ? item.color : "transparent",
              borderTop: item.dashed ? `1.5px dashed ${item.color}` : "none",
            }} />
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

export function SessionRow({ session, t }) {
  const score = Number(session.score);
  const scoreColor = score >= 7 ? "#4ade80" : score >= 5 ? GOLD : score >= 3 ? "#fb923c" : "#f87171";
  const label = session.reelId
    ? `Reel ${String(session.reelId).slice(0, 6)}…`
    : t("dashboardFreeTraining");

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.035)",
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
        background: `${scoreColor}0e`,
        border: `1px solid ${scoreColor}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: scoreColor }}>
          {Number.isFinite(score) ? formatScore(score) : "—"}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#ccc", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </div>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>{formatDate(session.createdAt)}</span>
      </div>
      {session.xpGained != null && (
        <div style={{ fontSize: 10, fontWeight: 800, color: "#D4AF3788", flexShrink: 0 }}>
          +{session.xpGained}
        </div>
      )}
    </div>
  );
}

// ─── Body Stats ───────────────────────────────────────────────────────────────

export function BodyStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#ddd" }}>{value}</div>
    </div>
  );
}

export function InputField({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && " *"}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={inputStyle} inputMode={type === "number" ? "decimal" : "text"} />
    </div>
  );
}

// ─── Body Progress Section ────────────────────────────────────────────────────

export function BodyProgressSection({ userId, t }) {
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ weight: "", height: "", reach: "", weightClass: "", notes: "" });

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function load() {
      try {
        const q = query(collection(db, "body_progress"), where("userId", "==", userId), limit(10));
        const snap = await getDocs(q);
        if (!active) return;
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));
        setHistory(docs);
      } catch (e) {
        console.error("Body progress load error:", e);
      }
    }
    load();
    return () => { active = false; };
  }, [userId]);

  async function handleSave() {
    if (!form.weight || isNaN(Number(form.weight))) return;
    setSaving(true);
    try {
      const payload = { userId, weight: Number(form.weight), createdAt: serverTimestamp() };
      if (form.height) payload.height = Number(form.height);
      if (form.reach) payload.reach = Number(form.reach);
      if (form.weightClass) payload.weightClass = form.weightClass;
      if (form.notes.trim()) payload.notes = form.notes.trim();
      const ref = await addDoc(collection(db, "body_progress"), payload);
      const newEntry = { id: ref.id, ...payload, createdAt: { toMillis: () => Date.now() } };
      setHistory((prev) => [newEntry, ...prev].slice(0, 10));
      setForm({ weight: "", height: "", reach: "", weightClass: "", notes: "" });
      setShowForm(false);
    } catch (e) {
      console.error("Body progress save error:", e);
    } finally {
      setSaving(false);
    }
  }

  const latest = history[0];

  return (
    <div>
      {latest ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.055)",
          borderRadius: 12,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 0.7, flexShrink: 0 }}>
            {formatDate(latest.createdAt)}
          </span>
          {latest.weight && <span style={{ fontSize: 13, fontWeight: 800, color: "#ccc" }}>{latest.weight} kg</span>}
          {latest.height && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{latest.height} cm</span>}
          {latest.reach && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>reach {latest.reach}</span>}
          {latest.weightClass && (
            <span style={{ fontSize: 11, color: GOLD, fontWeight: 700 }}>
              {latest.weightClass.split(" ")[0]}
            </span>
          )}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: "#333", margin: "0 0 10px" }}>{t("dashboardNoBodyData")}</p>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: showForm || showHistory ? 12 : 0 }}>
        <button onClick={() => { setShowForm(!showForm); setShowHistory(false); }} style={ghostBtnStyle}>
          {showForm ? t("dashboardCancel") : `+ ${t("dashboardAddBodyStats")}`}
        </button>
        {history.length > 1 && (
          <button onClick={() => { setShowHistory(!showHistory); setShowForm(false); }} style={{ ...ghostBtnStyle, fontSize: 11, color: "#555" }}>
            {showHistory ? "Hide" : `${t("dashboardBodyHistory")} ›`}
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <InputField label={t("dashboardWeight")} value={form.weight}
              onChange={(v) => setForm((f) => ({ ...f, weight: v }))} type="number" required />
            <InputField label={t("dashboardHeight")} value={form.height}
              onChange={(v) => setForm((f) => ({ ...f, height: v }))} type="number" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <InputField label={t("dashboardReach")} value={form.reach}
              onChange={(v) => setForm((f) => ({ ...f, reach: v }))} type="number" />
            <div>
              <label style={labelStyle}>{t("dashboardWeightClass")}</label>
              <select value={form.weightClass}
                onChange={(e) => setForm((f) => ({ ...f, weightClass: e.target.value }))}
                style={inputStyle}>
                <option value="">—</option>
                {WEIGHT_CLASSES.map((wc) => <option key={wc} value={wc}>{wc}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t("dashboardNotes")}</label>
            <textarea value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2} style={{ ...inputStyle, resize: "none", height: "auto" }}
              placeholder={t("dashboardNotesPlaceholder")} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
              {saving ? t("dashboardSaving") : t("dashboardSave")}
            </button>
            <button onClick={() => setShowForm(false)} style={ghostBtnStyle}>
              {t("dashboardCancel")}
            </button>
          </div>
        </div>
      )}

      {showHistory && history.length > 1 && (
        <div>
          {history.slice(1).map((entry) => (
            <div key={entry.id} style={{
              display: "flex", gap: 10, padding: "6px 0",
              borderBottom: "1px solid rgba(255,255,255,0.035)",
              fontSize: 11, color: "rgba(255,255,255,0.3)",
            }}>
              <span style={{ flexShrink: 0 }}>{formatDate(entry.createdAt)}</span>
              <span>{entry.weight} kg</span>
              {entry.height && <span>{entry.height} cm</span>}
              {entry.reach && <span>reach {entry.reach}</span>}
              {entry.weightClass && <span style={{ color: "rgba(255,255,255,0.22)" }}>{entry.weightClass.split(" ")[0]}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panel Card ───────────────────────────────────────────────────────────────

export function PanelCard({ label, accent = RED, tag, children, style: styleProp = {} }) {
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(145deg, #111012 0%, #0a0a0a 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderLeft: `2.5px solid ${accent}`,
      borderRadius: "3px 16px 16px 3px",
      boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 12px 40px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.025)`,
      overflow: "hidden",
      marginBottom: 28,
      ...styleProp,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "9px 14px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.045)",
        background: "rgba(0,0,0,0.18)",
      }}>
        <div style={{
          width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
          background: accent,
          boxShadow: `0 0 7px ${accent}, 0 0 14px ${accent}55`,
        }} />
        <span style={{
          fontSize: 9, fontWeight: 900, flex: 1,
          color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.2em", textTransform: "uppercase",
        }}>
          {label}
        </span>
        {tag && (
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", fontWeight: 700, letterSpacing: "0.08em" }}>
            {tag}
          </span>
        )}
      </div>
      <div style={{ padding: "14px 14px 16px" }}>
        {children}
      </div>
    </div>
  );
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────

export function Section({ title, accent, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      {title && (
        <h2 style={{
          margin: "0 0 14px",
          fontSize: 9, fontWeight: 900,
          color: accent || `${goldAlpha(0.38)}`,
          textTransform: "uppercase", letterSpacing: "0.15em",
        }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
