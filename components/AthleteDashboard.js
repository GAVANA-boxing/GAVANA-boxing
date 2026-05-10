"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { translate } from "@/lib/i18n";
import {
  RANK_TIERS, calculateUserXP, getFighterRank,
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

// ─── Score SVG Chart ──────────────────────────────────────────────────────────

function ScoreChart({ scores, t }) {
  if (!scores || scores.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "24px 0", color: "#444", fontSize: 12 }}>
        {scores?.length === 1 ? "1 session recorded — need 2+ to show chart" : "No score data yet"}
      </div>
    );
  }

  const W = 300, H = 90;
  const PAD = { top: 14, bottom: 22, left: 26, right: 30 };
  const pw = W - PAD.left - PAD.right;
  const ph = H - PAD.top - PAD.bottom;

  const toX = (i) => PAD.left + (i / (scores.length - 1)) * pw;
  const toY = (v) => PAD.top + ph - (Math.max(0, Math.min(10, v)) / 10) * ph;

  const pts = scores.map((s, i) => `${toX(i).toFixed(1)},${toY(s).toFixed(1)}`).join(" ");
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const best = Math.max(...scores);
  const avgY = toY(avg).toFixed(1);
  const bestY = toY(best).toFixed(1);

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
        {/* Grid */}
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={toY(v)} x2={W - PAD.right} y2={toY(v)}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={PAD.left - 4} y={toY(v) + 3.5} textAnchor="end"
              fontSize="7" fill="rgba(255,255,255,0.28)">{v}</text>
          </g>
        ))}

        {/* Best score dashed gold line */}
        <line x1={PAD.left} y1={bestY} x2={W - PAD.right} y2={bestY}
          stroke="#D4AF37" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.75" />
        <text x={W - PAD.right + 3} y={Number(bestY) + 3.5} fontSize="7" fill="#D4AF37" opacity="0.9">
          {t("dashboardBest")}
        </text>

        {/* Avg dashed white line */}
        <line x1={PAD.left} y1={avgY} x2={W - PAD.right} y2={avgY}
          stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" strokeDasharray="2,3" />

        {/* Area fill */}
        <polygon
          points={`${pts} ${toX(scores.length - 1).toFixed(1)},${PAD.top + ph} ${PAD.left},${PAD.top + ph}`}
          fill="rgba(193,18,31,0.08)"
        />

        {/* Score line */}
        <polyline points={pts} fill="none" stroke="#C1121F" strokeWidth="1.6"
          strokeLinejoin="round" strokeLinecap="round" />

        {/* Dots */}
        {scores.map((s, i) => (
          <circle key={i} cx={toX(i).toFixed(1)} cy={toY(s).toFixed(1)} r="2.5"
            fill={s === best ? "#D4AF37" : "#C1121F"}
            stroke="rgba(0,0,0,0.6)" strokeWidth="0.5" />
        ))}

        {/* X labels */}
        {[0, scores.length - 1].map((idx) => (
          <text key={idx} x={toX(idx).toFixed(1)} y={H - 4} textAnchor="middle"
            fontSize="7" fill="rgba(255,255,255,0.28)">
            {idx === 0 ? "older" : "recent"}
          </text>
        ))}
      </svg>

      <div style={{ display: "flex", gap: 14, marginTop: 6, paddingLeft: 26 }}>
        <ChartLegendItem color="#C1121F" solid label="Score" />
        <ChartLegendItem color="#D4AF37" dashed label={`${t("dashboardBest")} ${formatScore(best)}`} />
        <ChartLegendItem color="rgba(255,255,255,0.3)" dashed label={`${t("dashboardAvgScore")} ${formatScore(avg)}`} />
      </div>
    </div>
  );
}

function ChartLegendItem({ color, solid, dashed, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{
        width: 16, height: 2,
        background: solid ? color : "transparent",
        borderTop: dashed ? `1.5px dashed ${color}` : "none",
      }} />
      <span style={{ fontSize: 9, color: "#666" }}>{label}</span>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, valueColor, accent }) {
  return (
    <div style={{
      background: accent ? "rgba(193,18,31,0.07)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${accent ? "rgba(193,18,31,0.22)" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 12,
      padding: "11px 13px 10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 800, color: "#4a4a4a", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, color: valueColor || "#fff", lineHeight: 1, marginBottom: sub ? 3 : 0 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Rank Progress Bar ────────────────────────────────────────────────────────

function RankBar({ xp, t }) {
  const rank = getFighterRank(xp);
  const next = getNextRank(xp);
  const progress = getRankProgress(xp);

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 14,
      padding: "14px 16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
            {t("dashboardCurrentRank")}
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: rank.color }}>{t(rank.key)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
            {t("dashboardXP")}
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#D4AF37" }}>{xp.toLocaleString()}</div>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 999, height: 5, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 999,
          background: rank.gradient || rank.color,
          width: `${progress}%`,
          transition: "width 600ms ease",
        }} />
      </div>
      {next && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
          <span style={{ fontSize: 9, color: "#444" }}>{t(rank.key)}</span>
          <span style={{ fontSize: 9, color: "#555" }}>
            {(next.minXP - xp).toLocaleString()} {t("dashboardToGo")} → {t(next.key)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Insight Card ─────────────────────────────────────────────────────────────

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
    return { text: "Your score is trending up 🔥 Keep the momentum going.", type: "positive" };
  }
  if (delta <= -0.4) {
    if (locale === "mn") return { text: "Recovery/guard дээр анхаар ⚠️ Техникийг шалга.", type: "warning" };
    if (locale === "ko") return { text: "회복/가드에 집중하세요 ⚠️ 기술을 재점검해요.", type: "warning" };
    return { text: "Focus on guard and recovery ⚠️ Review your technique.", type: "warning" };
  }
  if (dailyStreak >= 3) {
    if (locale === "mn") return { text: "Consistency сайн байна 💪 Тасралтгүй дасгал хий.", type: "positive" };
    if (locale === "ko") return { text: "꾸준함이 좋아요 💪 훈련을 이어가세요.", type: "positive" };
    return { text: "Great consistency 💪 Your daily streak is paying off.", type: "positive" };
  }
  if (locale === "mn") return { text: "Жигд байна. Intensity нэмж score өсгө.", type: "neutral" };
  if (locale === "ko") return { text: "꾸준하네요. 강도를 높여 점수를 올려보세요.", type: "neutral" };
  return { text: "Steady progress. Increase intensity to push higher.", type: "neutral" };
}

const INSIGHT_COLORS = {
  positive: { bg: "rgba(74,222,128,0.06)", border: "rgba(74,222,128,0.2)", text: "#4ade80" },
  warning:  { bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.2)", text: "#fb923c" },
  neutral:  { bg: "rgba(212,175,55,0.06)", border: "rgba(212,175,55,0.15)", text: "#D4AF37" },
};

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
      padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${scoreColor}14`, border: `1px solid ${scoreColor}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: scoreColor }}>
          {Number.isFinite(score) ? formatScore(score) : "—"}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#ddd", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "#555" }}>{formatDate(session.createdAt)}</span>
          {session.accuracy != null && (
            <span style={{ fontSize: 10, color: "#666" }}>Acc: {Number(session.accuracy).toFixed(0)}%</span>
          )}
          {session.hits != null && (
            <span style={{ fontSize: 10, color: "#666" }}>Hits: {session.hits}</span>
          )}
        </div>
      </div>
      {session.xpGained != null && (
        <div style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", flexShrink: 0 }}>
          +{session.xpGained} XP
        </div>
      )}
    </div>
  );
}

// ─── Body Progress ────────────────────────────────────────────────────────────

function BodyProgressSection({ userId, t }) {
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ weight: "", height: "", reach: "", weightClass: "", notes: "" });

  useEffect(() => {
    if (!userId) return;
    let active = true;
    async function load() {
      try {
        const q = query(
          collection(db, "body_progress"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(8)
        );
        const snap = await getDocs(q);
        if (active) setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { /* empty */ }
    }
    load();
    return () => { active = false; };
  }, [userId]);

  async function handleSave() {
    if (!form.weight || isNaN(Number(form.weight))) return;
    setSaving(true);
    try {
      const payload = {
        userId,
        weight: Number(form.weight),
        createdAt: serverTimestamp(),
      };
      if (form.height) payload.height = Number(form.height);
      if (form.reach) payload.reach = Number(form.reach);
      if (form.weightClass) payload.weightClass = form.weightClass;
      if (form.notes.trim()) payload.notes = form.notes.trim();

      const ref = await addDoc(collection(db, "body_progress"), payload);
      setHistory((prev) => [{ id: ref.id, ...payload, createdAt: new Date() }, ...prev].slice(0, 8));
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
      {/* Latest stats */}
      {latest && (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12,
          padding: "12px 14px",
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#555", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            {t("dashboardBodyLatest")} · {formatDate(latest.createdAt)}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {latest.weight && <BodyStat label={t("dashboardWeight")} value={`${latest.weight} kg`} />}
            {latest.height && <BodyStat label={t("dashboardHeight")} value={`${latest.height} cm`} />}
            {latest.reach && <BodyStat label={t("dashboardReach")} value={`${latest.reach} cm`} />}
            {latest.weightClass && <BodyStat label={t("dashboardWeightClass")} value={latest.weightClass} />}
          </div>
          {latest.notes && (
            <p style={{ margin: "8px 0 0", fontSize: 11, color: "#666", fontStyle: "italic" }}>{latest.notes}</p>
          )}
        </div>
      )}

      {!latest && !showForm && (
        <p style={{ fontSize: 12, color: "#444", margin: "0 0 10px" }}>{t("dashboardNoBodyData")}</p>
      )}

      {/* Add form */}
      {showForm ? (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
          padding: "14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
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
              <label style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
                {t("dashboardWeightClass")}
              </label>
              <select
                value={form.weightClass}
                onChange={(e) => setForm((f) => ({ ...f, weightClass: e.target.value }))}
                style={inputStyle}
              >
                <option value="">—</option>
                {WEIGHT_CLASSES.map((wc) => <option key={wc} value={wc}>{wc}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
              {t("dashboardNotes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              style={{ ...inputStyle, resize: "none", height: "auto" }}
              placeholder="Optional notes..."
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
              {saving ? t("dashboardSaving") : t("dashboardSave")}
            </button>
            <button onClick={() => setShowForm(false)} style={ghostBtnStyle}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} style={ghostBtnStyle}>
          + {t("dashboardAddBodyStats")}
        </button>
      )}

      {/* History */}
      {history.length > 1 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#444", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
            {t("dashboardBodyHistory")}
          </div>
          {history.slice(1).map((entry) => (
            <div key={entry.id} style={{
              display: "flex", gap: 10, padding: "7px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              fontSize: 11, color: "#666",
            }}>
              <span style={{ flexShrink: 0, color: "#555" }}>{formatDate(entry.createdAt)}</span>
              <span>{entry.weight} kg</span>
              {entry.height && <span>{entry.height} cm</span>}
              {entry.reach && <span>reach {entry.reach}</span>}
              {entry.weightClass && <span style={{ color: "#555" }}>{entry.weightClass.split(" ")[0]}</span>}
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
      <div style={{ fontSize: 9, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#ddd" }}>{value}</div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label style={{ fontSize: 10, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>
        {label}{required && " *"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        inputMode={type === "number" ? "decimal" : "text"}
      />
    </div>
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#fff",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtnStyle = {
  flex: 1, padding: "10px 0", borderRadius: 9,
  background: "#C1121F", border: "none",
  color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
};

const ghostBtnStyle = {
  flex: 1, padding: "10px 0", borderRadius: 9,
  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#888", fontSize: 12, fontWeight: 700, cursor: "pointer",
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <section>
      <h2 style={{
        margin: "0 0 12px",
        fontSize: 10, fontWeight: 900,
        color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.1em",
        paddingBottom: 10, borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AthleteDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [xp, setXp] = useState(0);
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [challengeCount, setChallengeCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) {
      router.replace(`/${locale}/login`);
      return;
    }

    let active = true;
    async function load() {
      try {
        const { getDoc, doc } = await import("firebase/firestore");

        // 1. User doc
        const userSnap = await getDoc(doc(db, "users", user.uid));
        const uData = userSnap.exists() ? userSnap.data() : {};

        // 2. AI feedback → XP
        const feedbackSnap = await getDocs(
          query(collection(db, "ai_feedback"), where("userId", "==", user.uid))
        );
        const feedbackDocs = feedbackSnap.docs.map((d) => d.data());
        const computedXP = calculateUserXP({
          aiFeedbackDocs: feedbackDocs,
          streakDays: Number(uData.dailyStreak) || 0,
        });

        // 3. Training sessions (last 25)
        const sessionsSnap = await getDocs(
          query(
            collection(db, "training_sessions"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(25)
          )
        );
        const sessions = sessionsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.type === "training");

        // 4. Challenge results count
        const challengeSnap = await getDocs(
          query(collection(db, "challenge_results"), where("userId", "==", user.uid))
        );

        if (!active) return;
        setUserData(uData);
        setXp(computedXP);
        setTrainingSessions(sessions);
        setChallengeCount(challengeSnap.size);
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        if (active) setLoading(false);
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
    const chronoScores = [...scores].reverse(); // oldest → newest for chart
    return { scores, bestScore, chronoScores };
  }, [trainingSessions]);

  const insight = useMemo(() =>
    getInsight(locale, stats.scores, Number(userData?.dailyStreak) || 0),
    [locale, stats.scores, userData]
  );

  const rank = getFighterRank(xp);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#070707" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, border: "2px solid #C1121F", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 12, color: "#555" }}>Loading...</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#070707", minHeight: "100dvh", color: "#fff" }}>
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "calc(16px + env(safe-area-inset-top)) 16px calc(96px + env(safe-area-inset-bottom))" }}>

        {/* Page header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            margin: "0 0 2px", fontSize: 22, fontWeight: 900,
            color: "#fff", letterSpacing: "-0.02em", lineHeight: 1,
          }}>
            {userData?.username || user?.displayName || "Athlete"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: rank.color, fontWeight: 800 }}>
              {t(rank.key)}
            </span>
            <span style={{ fontSize: 10, color: "#333" }}>·</span>
            <span style={{ fontSize: 11, color: "#555" }}>{t("dashboardProgressOverview")}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* ── A. Progress Overview ── */}
          <Section title={t("dashboardProgressOverview")}>
            {/* Rank + XP bar */}
            <div style={{ marginBottom: 12 }}>
              <RankBar xp={xp} t={t} />
            </div>

            {/* Stat cards grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <StatCard icon="🔥" label={t("dashboardTrainingStreak")}
                value={`${Number(userData?.dailyStreak) || 0}d`}
                sub={`best ${Number(userData?.bestDailyStreak) || 0}d`}
                valueColor="#FB923C" />
              <StatCard icon="⭐" label={t("dashboardBestScore")}
                value={stats.bestScore != null ? formatScore(stats.bestScore) : "—"}
                sub="/10" valueColor="#D4AF37" />
              <StatCard icon="🏋️" label={t("dashboardTotalSessions")}
                value={trainingSessions.length}
                valueColor="#fff" />
              <StatCard icon="🎯" label={t("dashboardChallengeAttempts")}
                value={challengeCount}
                valueColor="#60a5fa" />
              <StatCard icon="📈" label="Avg Score"
                value={stats.scores.length ? formatScore(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length) : "—"}
                sub="/10" valueColor="#a78bfa" />
              <StatCard icon="✨" label={t("dashboardXP")}
                value={xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : xp}
                valueColor="#D4AF37" accent />
            </div>
          </Section>

          {/* ── E. AI Progress Insight ── */}
          <Section title={t("dashboardAIInsight")}>
            <div style={{
              background: INSIGHT_COLORS[insight.type].bg,
              border: `1px solid ${INSIGHT_COLORS[insight.type].border}`,
              borderLeft: `3px solid ${INSIGHT_COLORS[insight.type].text}`,
              borderRadius: 12,
              padding: "14px 16px",
            }}>
              <p style={{ margin: 0, fontSize: 13, color: "#ddd", lineHeight: 1.6, fontWeight: 600 }}>
                {insight.text}
              </p>
            </div>
          </Section>

          {/* ── B. Score History Chart ── */}
          <Section title={t("dashboardScoreHistory")}>
            {stats.chronoScores.length === 0 ? (
              <p style={{ fontSize: 12, color: "#444", margin: 0 }}>{t("dashboardNoSessions")}</p>
            ) : (
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: "14px",
              }}>
                <ScoreChart scores={stats.chronoScores} t={t} />
              </div>
            )}
          </Section>

          {/* ── C. Training History ── */}
          <Section title={t("dashboardTrainingHistory")}>
            {trainingSessions.length === 0 ? (
              <p style={{ fontSize: 12, color: "#444", margin: 0 }}>{t("dashboardNoSessions")}</p>
            ) : (
              <div>
                {trainingSessions.slice(0, 12).map((s) => (
                  <SessionRow key={s.id} session={s} t={t} />
                ))}
              </div>
            )}
          </Section>

          {/* ── D. Body Progress ── */}
          <Section title={t("dashboardBodyProgress")}>
            <BodyProgressSection userId={user?.uid} t={t} />
          </Section>

        </div>
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}
