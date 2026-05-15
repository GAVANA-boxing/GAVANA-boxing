"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  collection, doc, query, where, limit,
  getDocs, getDoc, addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { translate } from "@/lib/i18n";
import {
  calculateUserXP, getFighterRank,
  getNextRank, getRankProgress,
} from "@/lib/xp";
import BottomNav from "@/components/BottomNav";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function getLocaleFromPathname(p = "") {
  const seg = p.split("/")[1];
  return ["en", "mn", "ko"].includes(seg) ? seg : "en";
}

const WEIGHT_CLASSES = [
  "Mini Flyweight (49kg)", "Light Flyweight (49kg)", "Flyweight (52kg)",
  "Super Flyweight (55kg)", "Bantamweight (56kg)", "Super Bantamweight (59kg)",
  "Featherweight (59kg)", "Super Featherweight (63kg)", "Lightweight (61kg)",
  "Super Lightweight (64kg)", "Welterweight (67kg)", "Super Welterweight (70kg)",
  "Middleweight (75kg)", "Super Middleweight (79kg)", "Light Heavyweight (81kg)",
  "Cruiserweight (91kg)", "Heavyweight (91+kg)",
];

// ─── Count-up animation hook ──────────────────────────────────────────────────

function useCountUp(target, ready, duration = 1100) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!ready) return;
    if (target === 0) { setVal(0); return; }
    let startTime = null;
    function step(ts) {
      if (!startTime) startTime = ts;
      const progress = Math.min(1, (ts - startTime) / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(ease * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, ready, duration]);
  return val;
}

// ─── Combat stat derivation ───────────────────────────────────────────────────

function deriveRadarStats(scores, sessions, streakDays) {
  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  if (!scores.length) {
    return { Speed: 4.5, Timing: 4.5, Guard: 4.5, Footwork: 4.5, Power: 4.5, Accuracy: 4.5 };
  }
  const avgScore = avg(scores);
  const maxScore = Math.max(...scores);
  const hitSessions = sessions.filter((s) => s.hits != null && Number(s.hits) > 0);
  const accSessions = sessions.filter((s) => s.accuracy != null);
  const avgHits = avg(hitSessions.map((s) => Number(s.hits)));
  const avgAcc = avg(accSessions.map((s) => Number(s.accuracy)));
  const recentAvg = avg(scores.slice(0, Math.min(3, scores.length)));
  const olderAvg = avg(scores.slice(-Math.min(3, scores.length)));
  const trend = Math.max(-2, Math.min(2, recentAvg - olderAvg));

  const speed = hitSessions.length >= 2
    ? Math.min(10, avgHits / 2)
    : Math.max(1, Math.min(10, avgScore * 0.95 + 0.3));
  const timing = Math.max(1, Math.min(10, avgScore + trend));
  const guard = accSessions.length >= 2
    ? Math.max(1, Math.min(10, avgAcc / 10))
    : Math.max(1, Math.min(10, avgScore * 0.82));
  const footwork = Math.max(1, Math.min(10, 2 + Math.min(streakDays, 10) * 0.5 + avgScore * 0.3));
  const power = hitSessions.length >= 2
    ? Math.min(10, avgHits / 1.8)
    : Math.max(1, Math.min(10, maxScore * 0.92 + 0.4));
  const accuracy = accSessions.length >= 2
    ? Math.max(1, Math.min(10, avgAcc / 10))
    : Math.max(1, Math.min(10, avgScore * 0.88));

  return { Speed: speed, Timing: timing, Guard: guard, Footwork: footwork, Power: power, Accuracy: accuracy };
}

function computeFighterScore(scores, xp, streakDays) {
  if (!scores.length) return 0;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const best = Math.max(...scores);
  const base = best * 6 + avg * 4;
  const streakBonus = Math.min(5, streakDays * 0.3);
  const xpBonus = Math.min(5, Math.sqrt(xp / 1000));
  return Math.min(100, Math.round(base + streakBonus + xpBonus));
}

// ─── Insight ──────────────────────────────────────────────────────────────────

function getInsight(locale, recentScores, dailyStreak) {
  if (!recentScores || recentScores.length < 3) {
    if (locale === "mn") return { text: "Эхний 3 session-ээ бүртгээд trend харна 🎯", type: "neutral" };
    if (locale === "ko") return { text: "첫 3세션을 기록하면 추세를 확인할 수 있어요 🎯", type: "neutral" };
    return { text: "Complete 3 sessions to see your progress trend 🎯", type: "neutral" };
  }
  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const last3 = recentScores.slice(0, 3);
  const prev3 = recentScores.slice(3, 6);
  const delta = prev3.length ? avg(last3) - avg(prev3) : 0;

  if (delta >= 0.4) {
    if (locale === "mn") return { text: "Tempo өсөж байна 🔥 Хурдаа хэвээр хадгал.", type: "positive" };
    if (locale === "ko") return { text: "템포가 오르고 있어요 🔥 이 흐름을 유지하세요.", type: "positive" };
    return { text: "Score is climbing 🔥 Keep the pressure on.", type: "positive" };
  }
  if (delta <= -0.4) {
    if (locale === "mn") return { text: "Guard болон техникд анхаар ⚠️ Хурдаа нэмэх шаардлагагүй — нарийвчлал чухал.", type: "warning" };
    if (locale === "ko") return { text: "가드와 기술에 집중하세요 ⚠️ 정확도가 핵심입니다.", type: "warning" };
    return { text: "Guard needs attention ⚠️ Focus on accuracy over speed.", type: "warning" };
  }
  if (dailyStreak >= 3) {
    if (locale === "mn") return { text: "Consistency бол чамайг хаана хүргэж байгааг мэдэхгүй 💪 Тасалтгүй дасгал хий.", type: "positive" };
    if (locale === "ko") return { text: "꾸준함이 무기예요 💪 훈련을 이어가세요.", type: "positive" };
    return { text: "Consistency is your weapon 💪 Keep the streak alive.", type: "positive" };
  }
  if (locale === "mn") return { text: "Жигд явж байна. Intensity нэмж score ахиулаарай.", type: "neutral" };
  if (locale === "ko") return { text: "꾸준하네요. 강도를 높여 점수를 올려보세요.", type: "neutral" };
  return { text: "Steady rhythm. Push intensity to break through.", type: "neutral" };
}

const INSIGHT_COLOR = {
  positive: "#4ade80",
  warning:  "#FB923C",
  neutral:  "#D4AF37",
};

// ─── Radar Chart ──────────────────────────────────────────────────────────────

const RADAR_KEYS = ["Speed", "Timing", "Guard", "Footwork", "Power", "Accuracy"];
const RADAR_ANGLES = [270, 330, 30, 90, 150, 210];

function radPolar(deg, r, cx, cy) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function RadarChart({ stats }) {
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
          <stop offset="0%" stopColor="rgba(193,18,31,0.52)" />
          <stop offset="100%" stopColor="rgba(193,18,31,0.05)" />
        </radialGradient>
        <filter id="rdGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1.0].map((scale) => (
        <polygon key={scale} points={gridPoly(scale)}
          fill="none"
          stroke={scale === 1.0 ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.05)"}
          strokeWidth={scale === 1.0 ? 1 : 0.7}
        />
      ))}

      {/* Axis lines */}
      {RADAR_ANGLES.map((a, i) => {
        const outer = radPolar(a, maxR, cx, cy);
        return (
          <line key={i}
            x1={cx.toFixed(1)} y1={cy.toFixed(1)}
            x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
            stroke="rgba(255,255,255,0.055)" strokeWidth="1" />
        );
      })}

      {/* Data polygon */}
      <polygon points={dataPoly}
        fill="url(#rdg)"
        stroke="#D4AF37"
        strokeWidth="1.8"
        strokeLinejoin="round"
        filter="url(#rdGlow)"
        className="radar-polygon"
      />

      {/* Axis dots */}
      {dataPoints.map((p, i) => (
        <circle key={i}
          cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
          r="3" fill="#D4AF37" stroke="rgba(0,0,0,0.55)" strokeWidth="0.5" opacity="0.92"
        />
      ))}

      {/* Labels + values */}
      {RADAR_KEYS.map((key, i) => {
        const p = radPolar(RADAR_ANGLES[i], maxR + 17, cx, cy);
        const ta = p.x < cx - 8 ? "end" : p.x > cx + 8 ? "start" : "middle";
        const val = Math.max(0, Math.min(10, stats[key] || 0));
        const valColor = val >= 7 ? "#D4AF37" : val >= 5 ? "rgba(255,255,255,0.45)" : "#C1121F";
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

const DNA_ATTRS = [
  { key: "Pressure",  color: "#C1121F", fn: (s) => (s.Speed + s.Power) / 2 },
  { key: "Technical", color: "#D4AF37", fn: (s) => (s.Timing + s.Accuracy) / 2 },
  { key: "Counter",   color: "#60A5FA", fn: (s) => (s.Timing + s.Guard) / 2 },
  { key: "Footwork",  color: "#34D399", fn: (s) => s.Footwork },
  { key: "Defense",   color: "#A78BFA", fn: (s) => s.Guard },
];

function StyleDNA({ radarStats }) {
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

function FighterHero({ displayScore, fighterScore, xp, rank, nextRank, xpProgress, insight, t }) {
  const ic = INSIGHT_COLOR[insight.type];
  const rankIcon = rank.icon === "crown" ? "👑" : rank.icon === "diamond" ? "💎" : rank.icon === "star5" ? "⭐" : "🥊";

  return (
    <div style={{
      position: "relative",
      borderRadius: 22,
      overflow: "hidden",
      background: "linear-gradient(160deg, #1c0202 0%, #0e0000 45%, #080808 100%)",
      border: "1px solid rgba(193,18,31,0.18)",
      boxShadow: "0 0 0 1px rgba(193,18,31,0.07), 0 28px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.035)",
      marginBottom: 20,
    }}>
      {/* Atmosphere */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 18% 25%, rgba(193,18,31,0.24) 0%, transparent 58%)",
      }} />
      <div style={{ position: "relative", padding: "22px 22px 20px" }}>
        {/* Kicker */}
        <p style={{ margin: "0 0 18px", fontSize: 9, fontWeight: 900, color: "rgba(193,18,31,0.75)", letterSpacing: 3.5, textTransform: "uppercase" }}>
          GAVANA · FIGHTER SCORE
        </p>

        {/* Score + rank icon */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, lineHeight: 1 }}>
              <span style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: "-0.045em",
                lineHeight: 0.92,
                fontFamily: "var(--font-display, 'Anton', sans-serif)",
                textShadow: "0 0 60px rgba(193,18,31,0.35), 0 4px 24px rgba(0,0,0,0.8)",
              }}>
                {displayScore}
              </span>
              <span style={{ fontSize: 19, color: "rgba(255,255,255,0.22)", fontWeight: 700, paddingBottom: 8 }}>/100</span>
            </div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: rank.color, letterSpacing: 0.2 }}>{t(rank.key)}</span>
              <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 12 }}>·</span>
              <span style={{ fontSize: 12, color: "#D4AF37", fontWeight: 800 }}>{xp.toLocaleString()} XP</span>
            </div>
          </div>

          {/* Belt icon */}
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

        {/* XP progress bar */}
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

        {/* Coaching line */}
        <p style={{
          margin: 0,
          fontSize: 12,
          color: ic,
          fontStyle: "italic",
          lineHeight: 1.55,
          opacity: 0.88,
          borderLeft: `2px solid ${ic}55`,
          paddingLeft: 10,
        }}>
          {insight.text}
        </p>
      </div>
    </div>
  );
}

// ─── Stat Pills ───────────────────────────────────────────────────────────────

function StatPill({ label, value, sub, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14,
      padding: "14px 14px 11px",
    }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: color || "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 9, fontWeight: 800, color: "#383838", textTransform: "uppercase", letterSpacing: 0.9, marginTop: 5 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 9, color: "#2d2d2d", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Score Chart ──────────────────────────────────────────────────────────────

function ScoreChart({ scores, t }) {
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
          <span style={{ fontSize: 10, color: "#3a3a3a", fontWeight: 700 }}>vs earlier</span>
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
          stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.5" />
        <text x={W - PAD.right + 3} y={Number(bestY) + 3.5} fontSize="7" fill="#D4AF37" opacity="0.65">
          {t("dashboardBest")}
        </text>
        <line x1={PAD.left} y1={avgY} x2={W - PAD.right} y2={avgY}
          stroke="rgba(255,255,255,0.13)" strokeWidth="0.6" strokeDasharray="2,3" />
        <polygon
          points={`${pts} ${toX(scores.length - 1).toFixed(1)},${PAD.top + ph} ${PAD.left},${PAD.top + ph}`}
          fill="rgba(193,18,31,0.07)"
        />
        <polyline points={pts} fill="none" stroke="#C1121F" strokeWidth="1.8"
          strokeLinejoin="round" strokeLinecap="round" className="graph-line" />
        {scores.map((s, i) => (
          <circle key={i} cx={toX(i).toFixed(1)} cy={toY(s).toFixed(1)}
            r={i === bestIdx ? 3.5 : 2.5}
            fill={i === bestIdx ? "#D4AF37" : "#C1121F"}
            stroke="rgba(0,0,0,0.6)" strokeWidth="0.5"
          />
        ))}
        <text x={toX(0).toFixed(1)} y={H - 4} textAnchor="middle"
          fontSize="7" fill="rgba(255,255,255,0.18)">older</text>
        <text x={toX(scores.length - 1).toFixed(1)} y={H - 4} textAnchor="middle"
          fontSize="7" fill="rgba(255,255,255,0.18)">recent</text>
      </svg>
      <div style={{ display: "flex", gap: 14, marginTop: 7, paddingLeft: 26 }}>
        {[
          { color: "#C1121F", solid: true, label: "Score" },
          { color: "#D4AF37", dashed: true, label: `${t("dashboardBest")} ${formatScore(best)}` },
          { color: "rgba(255,255,255,0.22)", dashed: true, label: `Avg ${formatScore(avg)}` },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{
              width: 16, height: 2,
              background: item.solid ? item.color : "transparent",
              borderTop: item.dashed ? `1.5px dashed ${item.color}` : "none",
            }} />
            <span style={{ fontSize: 9, color: "#444" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Session Row ──────────────────────────────────────────────────────────────

function SessionRow({ session, t }) {
  const score = Number(session.score);
  const scoreColor = score >= 7 ? "#4ade80" : score >= 5 ? "#D4AF37" : score >= 3 ? "#fb923c" : "#f87171";
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
        <span style={{ fontSize: 10, color: "#3a3a3a" }}>{formatDate(session.createdAt)}</span>
      </div>
      {session.xpGained != null && (
        <div style={{ fontSize: 10, fontWeight: 800, color: "#D4AF3788", flexShrink: 0 }}>
          +{session.xpGained}
        </div>
      )}
    </div>
  );
}

// ─── Body Progress ────────────────────────────────────────────────────────────

function BodyProgressSection({ userId, t }) {
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
      {/* Compact latest line */}
      {latest ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          padding: "10px 14px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.055)",
          borderRadius: 12,
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "#333", textTransform: "uppercase", letterSpacing: 0.7, flexShrink: 0 }}>
            {formatDate(latest.createdAt)}
          </span>
          {latest.weight && <span style={{ fontSize: 13, fontWeight: 800, color: "#ccc" }}>{latest.weight} kg</span>}
          {latest.height && <span style={{ fontSize: 12, color: "#555" }}>{latest.height} cm</span>}
          {latest.reach && <span style={{ fontSize: 12, color: "#555" }}>reach {latest.reach}</span>}
          {latest.weightClass && (
            <span style={{ fontSize: 11, color: "#D4AF37", fontWeight: 700 }}>
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
              fontSize: 11, color: "#555",
            }}>
              <span style={{ flexShrink: 0 }}>{formatDate(entry.createdAt)}</span>
              <span>{entry.weight} kg</span>
              {entry.height && <span>{entry.height} cm</span>}
              {entry.reach && <span>reach {entry.reach}</span>}
              {entry.weightClass && <span style={{ color: "#444" }}>{entry.weightClass.split(" ")[0]}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BodyStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#ddd" }}>{value}</div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && " *"}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        style={inputStyle} inputMode={type === "number" ? "decimal" : "text"} />
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, accent, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      {title && (
        <h2 style={{
          margin: "0 0 14px",
          fontSize: 9, fontWeight: 900,
          color: accent || "rgba(212,175,55,0.38)",
          textTransform: "uppercase", letterSpacing: "0.15em",
        }}>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const labelStyle = {
  fontSize: 10, fontWeight: 700, color: "#555",
  textTransform: "uppercase", letterSpacing: "0.06em",
  display: "block", marginBottom: 4,
};

const inputStyle = {
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

const primaryBtnStyle = {
  flex: 1, padding: "10px 0", borderRadius: 9,
  background: "linear-gradient(135deg, #C1121F, #7d0812)",
  border: "none", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
};

const ghostBtnStyle = {
  flex: 1, padding: "10px 0", borderRadius: 9,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
  color: "#666", fontSize: 12, fontWeight: 700, cursor: "pointer",
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AthleteDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);

  const [userData, setUserData] = useState(null);
  const [xp, setXp] = useState(0);
  const [rankReady, setRankReady] = useState(false);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [challengeCount, setChallengeCount] = useState(0);
  const [sessionsReady, setSessionsReady] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) { router.replace(`/${locale}/login`); return; }

    let active = true;
    async function load() {
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const uData = userSnap.exists() ? userSnap.data() : {};

        const feedbackSnap = await getDocs(
          query(collection(db, "ai_feedback"), where("userId", "==", user.uid))
        );
        const feedbackDocs = feedbackSnap.docs.map((d) => d.data());

        const sessSnap = await getDocs(
          query(collection(db, "training_sessions"), where("userId", "==", user.uid))
        );
        const allSessions = sessSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.type === "training")
          .sort((a, b) => getTs(b.createdAt) - getTs(a.createdAt));

        const trainingSessionXP = allSessions.reduce((sum, s) => sum + (Number(s.xpGained) || 0), 0);
        const storedChallengeXP = Number(uData.xp) || 0;
        const streakDays = Number(uData.streakCount) || Number(uData.dailyStreak) || 0;
        const totalXP = storedChallengeXP + trainingSessionXP + calculateUserXP({
          aiFeedbackDocs: feedbackDocs,
          streakDays,
        });

        if (!active) return;
        setUserData(uData);
        setXp(totalXP);
        setTrainingSessions(allSessions.slice(0, 25));
        setRankReady(true);

        getDocs(query(collection(db, "challenge_results"), where("userId", "==", user.uid)))
          .then((snap) => { if (active) setChallengeCount(snap.size); })
          .catch(() => {});
        setSessionsReady(true);
      } catch (e) {
        console.error("Dashboard load error:", e);
        if (active) setRankReady(true);
      }
    }
    load();
    return () => { active = false; };
  }, [authLoading, user?.uid, locale, router]);

  const stats = useMemo(() => {
    const scores = trainingSessions
      .map((s) => Number(s.score))
      .filter(Number.isFinite);
    const bestScore = scores.length ? Math.max(...scores) : null;
    const chronoScores = [...scores].reverse();
    return { scores, bestScore, chronoScores };
  }, [trainingSessions]);

  const dailyStreak = Number(userData?.dailyStreak || userData?.streakCount) || 0;
  const bestStreak = Number(userData?.bestDailyStreak) || 0;
  const rank = getFighterRank(xp);
  const nextRank = getNextRank(xp);
  const xpProgress = getRankProgress(xp);

  const insight = useMemo(() =>
    getInsight(locale, stats.scores, dailyStreak),
    [locale, stats.scores, dailyStreak]
  );

  const radarStats = useMemo(() =>
    deriveRadarStats(stats.scores, trainingSessions, dailyStreak),
    [stats.scores, trainingSessions, dailyStreak]
  );

  const fighterScore = useMemo(() =>
    computeFighterScore(stats.scores, xp, dailyStreak),
    [stats.scores, xp, dailyStreak]
  );

  const displayScore = useCountUp(fighterScore, rankReady);

  const visibleSessions = showAllSessions ? trainingSessions : trainingSessions.slice(0, 5);

  if (authLoading || !rankReady) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070707" }}>
        <div style={{ width: 28, height: 28, border: "2px solid #C1121F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      className="page-enter"
      style={{ background: "radial-gradient(ellipse at top center, rgba(193,18,31,0.07) 0%, transparent 48%), #070707", minHeight: "100dvh", color: "#fff" }}
    >
      <style>{`
        @keyframes rankFill { from { width: 0 !important; } }
        @keyframes radarFade { from { opacity: 0; transform-origin: center; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
        .radar-polygon { animation: radarFade 750ms cubic-bezier(0.16,1,0.3,1) both; }
        .graph-line { animation: radarFade 600ms cubic-bezier(0.16,1,0.3,1) both; }
      `}</style>

      <div style={{ maxWidth: 540, margin: "0 auto", padding: "calc(20px + env(safe-area-inset-top)) 16px calc(96px + env(safe-area-inset-bottom))" }}>

        {/* Page kicker + name */}
        <div style={{ marginBottom: 22 }}>
          <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 900, color: "rgba(193,18,31,0.7)", letterSpacing: 3, textTransform: "uppercase" }}>
            GAVANA
          </p>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1, fontFamily: "var(--font-display, 'Anton', sans-serif)" }}>
            {userData?.username || user?.displayName || (locale === "mn" ? "Тамирчны ахиц" : locale === "ko" ? "선수 현황" : "My Progress")}
          </h1>
        </div>

        {/* ── Fighter Score Hero ── */}
        <FighterHero
          displayScore={displayScore}
          fighterScore={fighterScore}
          xp={xp}
          rank={rank}
          nextRank={nextRank}
          xpProgress={xpProgress}
          insight={insight}
          t={t}
        />

        {/* ── 4 Stat Pills ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 32 }}>
          <StatPill
            label={t("dashboardTrainingStreak")}
            value={`${dailyStreak}d`}
            sub={bestStreak > 0 ? `best ${bestStreak}d` : undefined}
            color="#FB923C"
          />
          <StatPill
            label={t("dashboardBestScore")}
            value={stats.bestScore != null ? formatScore(stats.bestScore) : "—"}
            sub="/10"
            color="#D4AF37"
          />
          <StatPill
            label={t("dashboardTotalSessions")}
            value={trainingSessions.length}
            color="#fff"
          />
          <StatPill
            label={t("dashboardXP")}
            value={xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : xp}
            color="#D4AF37"
          />
        </div>

        {/* ── Combat Profile (Radar) ── */}
        <Section title={locale === "mn" ? "Дайны профайл" : locale === "ko" ? "전투 프로필" : "Combat Profile"}>
          <div style={{
            background: "radial-gradient(ellipse at center, rgba(193,18,31,0.06) 0%, transparent 70%)",
            borderRadius: 18,
            padding: "16px 8px 8px",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <RadarChart stats={radarStats} />
          </div>
        </Section>

        {/* ── Style DNA ── */}
        <Section title={locale === "mn" ? "Тоглолтын хэв маяг" : locale === "ko" ? "스타일 DNA" : "Style DNA"}>
          <div style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.055)",
            borderRadius: 16,
            padding: "16px 18px",
          }}>
            <StyleDNA radarStats={radarStats} />
          </div>
        </Section>

        {/* ── Score Trend ── */}
        <Section title={locale === "mn" ? "Оноогийн чиглэл" : locale === "ko" ? "점수 추세" : "Score Trend"}>
          <div style={{
            background: "radial-gradient(ellipse at center bottom, rgba(193,18,31,0.04), transparent 70%)",
            borderRadius: 16,
            padding: "12px 6px 8px",
            border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <ScoreChart scores={stats.chronoScores} t={t} />
          </div>
        </Section>

        {/* ── Session History ── */}
        <Section title={t("dashboardTrainingHistory")}>
          {trainingSessions.length === 0 ? (
            <p style={{ fontSize: 12, color: "#333", margin: 0 }}>{t("dashboardNoSessions")}</p>
          ) : (
            <>
              {visibleSessions.map((s) => (
                <SessionRow key={s.id} session={s} t={t} />
              ))}
              {trainingSessions.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllSessions(!showAllSessions)}
                  style={{ ...ghostBtnStyle, marginTop: 10, width: "100%", flex: "unset" }}
                >
                  {showAllSessions
                    ? "Show less"
                    : `Show all ${trainingSessions.length} sessions`}
                </button>
              )}
            </>
          )}
        </Section>

        {/* ── Body Stats ── */}
        <Section title={t("dashboardBodyProgress")}>
          <BodyProgressSection userId={user?.uid} t={t} />
        </Section>

      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}
