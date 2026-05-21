"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";
import { RED, GOLD , redAlpha, goldAlpha} from "@/lib/tokens";
import { CombatCard, GlassCard } from "@/components/ui";

const GOALS = [
  { key: "conditioning",   emoji: "🏋️", mn: "Нийт бэлтгэл",  ko: "체력 훈련",    en: "Conditioning" },
  { key: "technique",      emoji: "🥊", mn: "Техник",         ko: "기술 향상",    en: "Technique" },
  { key: "sparring_prep",  emoji: "⚔️", mn: "Спарринг бэлтгэл", ko: "스파링 준비", en: "Sparring Prep" },
  { key: "competition",    emoji: "🏆", mn: "Тэмцээн",        ko: "대회 준비",    en: "Competition" },
];

const LEVELS = [
  { key: "beginner",     mn: "Анхан",    ko: "초급",   en: "Beginner" },
  { key: "intermediate", mn: "Дундаж",   ko: "중급",   en: "Intermediate" },
  { key: "advanced",     mn: "Дэвшилтэт", ko: "고급",  en: "Advanced" },
];

const DAYS_OPTIONS = [2, 3, 4, 5];
const DURATION_OPTIONS = [
  { value: 30,  mn: "30 мин",  ko: "30분",  en: "30 min" },
  { value: 45,  mn: "45 мин",  ko: "45분",  en: "45 min" },
  { value: 60,  mn: "60 мин",  ko: "60분",  en: "60 min" },
  { value: 90,  mn: "90 мин",  ko: "90분",  en: "90 min" },
];

function label(obj, locale) {
  return obj[locale] || obj.en;
}

function buildPrompt(goal, level, days, duration, locale) {
  const goalLabel = GOALS.find((g) => g.key === goal)?.en || goal;
  const levelLabel = LEVELS.find((l) => l.key === level)?.en || level;

  const langNote = locale === "mn"
    ? "Reply in Mongolian. Use English for boxing terms (jab, cross, hook, uppercut, combo, footwork, guard, shadow boxing, pad work, bag work, sparring, conditioning)."
    : locale === "ko"
    ? "Reply in Korean. Use English for boxing terms (jab, cross, hook, uppercut, combo, footwork, guard)."
    : "Reply in English.";

  return `${langNote}

Create a practical weekly boxing training program:
- Athlete level: ${levelLabel}
- Goal: ${goalLabel}
- Training days: ${days} days per week (include rest days)
- Session duration: ${duration} minutes

Format exactly like this (do NOT use markdown headers or asterisks):

WEEKLY PLAN

Day 1 - [Day name]:
• Exercise: X min
• Exercise: X min
...

Day 2 - REST

Day 3 - [Day name]:
...

TIPS:
• Tip 1
• Tip 2
• Tip 3

Keep it practical, boxing-specific, and achievable. Each session must fit within ${duration} minutes.`;
}

function parsePlan(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const days = [];
  const tips = [];
  let currentDay = null;
  let inTips = false;

  for (const line of lines) {
    if (/^WEEKLY PLAN/i.test(line) || /^7 ХОНОГИЙН ПЛАН/i.test(line) || /^주간 플랜/i.test(line)) continue;

    if (/^TIPS?:/i.test(line) || /^ЗӨВЛӨМЖ/i.test(line) || /^팁:/i.test(line)) {
      inTips = true;
      currentDay = null;
      continue;
    }

    if (inTips) {
      const tip = line.replace(/^[•\-*]\s*/, "");
      if (tip) tips.push(tip);
      continue;
    }

    if (/^Day\s+\d+/i.test(line) || /^өдөр\s+\d+/i.test(line) || /^\d+[-\s]?(дэх|р|дугаар)?\s*өдөр/i.test(line)) {
      currentDay = { title: line, items: [], isRest: /rest|амар/i.test(line) };
      days.push(currentDay);
      continue;
    }

    if (currentDay && !currentDay.isRest) {
      const item = line.replace(/^[•\-*]\s*/, "");
      if (item) currentDay.items.push(item);
    }
  }

  return { days, tips, raw: text };
}

export default function WorkoutBuilderPage() {
  const params = useParams();
  const locale = getLocale(params?.locale);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0); // 0=goal 1=level+days 2=duration 3=result
  const [goal, setGoal] = useState(null);
  const [level, setLevel] = useState(null);
  const [days, setDays] = useState(3);
  const [duration, setDuration] = useState(45);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null); // { days, tips, raw }
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);


  const handleGenerate = async () => {
    if (!goal || !level) return;
    setGenerating(true);
    setError("");
    setPlan(null);

    const prompt = buildPrompt(goal, level, days, duration, locale);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          persona: "analyst",
          locale,
        }),
      });
      const data = await res.json();
      const text = data.message || (data.content?.[0]?.text) || "";
      if (!text) throw new Error("empty");
      setPlan(parsePlan(text));
      setStep(3);
    } catch {
      setError(t("wbErrApi"));
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid || !plan || saving || saved) return;
    if (!user) { setError(t("wbErrAuth")); return; }
    setSaving(true);
    try {
      const goalMeta = GOALS.find((g) => g.key === goal);
      const levelMeta = LEVELS.find((l) => l.key === level);
      await addDoc(collection(db, "training_programs"), {
        userId: user.uid,
        title: `${goalMeta?.emoji || "🥊"} ${label(goalMeta || { en: goal }, locale)} — ${label(levelMeta || { en: level }, locale)}`,
        description: t("wbSubtitle"),
        level,
        category: "AI Generated",
        emoji: goalMeta?.emoji || "🤖",
        color: RED,
        duration: days * 7,
        daysPerWeek: days,
        sessionMinutes: duration,
        planRaw: plan.raw,
        createdAt: serverTimestamp(),
        source: "ai_builder",
      });
      setSaved(true);
    } catch {
      setError(t("wbErrApi"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.inner}>
        {/* Header */}
        <div style={s.header}>
          <button type="button" style={s.backBtn} onClick={() => step > 0 && step < 3 ? setStep(step - 1) : router.push(`/${locale}/programs`)} aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div style={s.kicker}>GAVANA AI</div>
        </div>

        <div style={s.heroSection}>
          <div style={s.heroEmoji}>🤖</div>
          <h1 style={s.title}>{t("wbTitle")}</h1>
          <p style={s.subtitle}>{t("wbSubtitle")}</p>
        </div>

        {/* Step indicator */}
        {step < 3 && (
          <div style={s.stepDots}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ ...s.dot, background: i <= step ? RED : "rgba(255,255,255,0.12)" }} />
            ))}
          </div>
        )}

        {/* STEP 0 — Goal */}
        {step === 0 && (
          <div style={s.stepWrap}>
            <p style={s.stepLabel}>{t("wbGoalStep")}</p>
            <div style={s.goalGrid}>
              {GOALS.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGoal(g.key)}
                  style={{ ...s.goalCard, ...(goal === g.key ? s.goalCardActive : {}) }}
                >
                  <span style={s.goalEmoji}>{g.emoji}</span>
                  <span style={s.goalLabel}>{label(g, locale)}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              style={goal ? s.nextBtn : s.nextBtnDisabled}
              disabled={!goal}
              onClick={() => setStep(1)}
            >
              {t("wbNext")}
            </button>
          </div>
        )}

        {/* STEP 1 — Level + Days */}
        {step === 1 && (
          <div style={s.stepWrap}>
            <p style={s.stepLabel}>{t("wbLevelStep")}</p>

            <p style={s.fieldLabel}>{t("wbLevel")}</p>
            <div style={s.chipRow}>
              {LEVELS.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLevel(l.key)}
                  style={{ ...s.chip, ...(level === l.key ? s.chipActive : {}) }}
                >
                  {label(l, locale)}
                </button>
              ))}
            </div>

            <p style={{ ...s.fieldLabel, marginTop: 20 }}>{t("wbDaysWeek")}</p>
            <div style={s.chipRow}>
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  style={{ ...s.chip, ...(days === d ? s.chipActive : {}) }}
                >
                  {d}x
                </button>
              ))}
            </div>

            <button
              type="button"
              style={level ? s.nextBtn : s.nextBtnDisabled}
              disabled={!level}
              onClick={() => setStep(2)}
            >
              {t("wbNext")}
            </button>
          </div>
        )}

        {/* STEP 2 — Duration */}
        {step === 2 && (
          <div style={s.stepWrap}>
            <p style={s.stepLabel}>{t("wbDurationStep")}</p>
            <div style={s.durationGrid}>
              {DURATION_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDuration(d.value)}
                  style={{ ...s.durationCard, ...(duration === d.value ? s.durationCardActive : {}) }}
                >
                  <span style={s.durationValue}>{d.value}</span>
                  <span style={s.durationUnit}>{t("wbMinUnit")}</span>
                </button>
              ))}
            </div>

            {error && <p style={s.errorText}>{error}</p>}

            <button
              type="button"
              style={generating ? s.nextBtnDisabled : s.generateBtn}
              disabled={generating}
              onClick={handleGenerate}
            >
              {generating ? t("wbGenerating") : t("wbGenerate")}
            </button>
          </div>
        )}

        {/* STEP 3 — Result */}
        {step === 3 && plan && (
          <div style={s.resultWrap}>
            {/* Summary strip */}
            <div style={s.summaryStrip}>
              {[
                { icon: GOALS.find((g) => g.key === goal)?.emoji || "🥊", text: label(GOALS.find((g) => g.key === goal) || { en: goal }, locale) },
                { icon: "📊", text: label(LEVELS.find((l) => l.key === level) || { en: level }, locale) },
                { icon: "📅", text: `${days}x ${t("wbPerWeek")}` },
                { icon: "⏱", text: `${duration} ${t("wbMinUnit")}` },
              ].map(({ icon, text }) => (
                <div key={text} style={s.summaryChip}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={s.summaryText}>{text}</span>
                </div>
              ))}
            </div>

            {/* Day cards */}
            {plan.days.map((day, i) => (
              <CombatCard
                key={i}
                accent={!day.isRest}
                style={{ marginBottom: 8, padding: "14px 16px", ...(day.isRest ? { borderColor: "rgba(255,255,255,0.08)" } : {}) }}
              >
                <div style={s.dayTitle}>{day.title}</div>
                {day.isRest ? (
                  <p style={s.restText}>{t("wbRest")} 💤</p>
                ) : (
                  <ul style={s.itemList}>
                    {day.items.map((item, j) => (
                      <li key={j} style={s.itemRow}>
                        <span style={s.itemBullet}>▸</span>
                        <span style={s.itemText}>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CombatCard>
            ))}

            {/* Tips */}
            {plan.tips.length > 0 && (
              <GlassCard style={{ padding: "14px 16px", marginBottom: 8, border: `1px solid ${goldAlpha(0.18)}`, background: goldAlpha(0.06) }}>
                <p style={s.tipsTitle}>💡 {t("wbTips")}</p>
                {plan.tips.map((tip, i) => (
                  <p key={i} style={s.tipRow}>• {tip}</p>
                ))}
              </GlassCard>
            )}

            {error && <p style={s.errorText}>{error}</p>}

            {/* Action buttons */}
            <div style={s.actionRow}>
              <button
                type="button"
                style={saved ? s.savedBtn : saving ? s.nextBtnDisabled : s.saveBtn}
                disabled={saving || saved}
                onClick={handleSave}
              >
                {saved ? t("wbSaved") : saving ? "…" : t("wbSave")}
              </button>
              <button
                type="button"
                style={s.rebuildBtn}
                onClick={() => { setPlan(null); setSaved(false); setError(""); setStep(2); }}
              >
                {t("wbRebuild")}
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}

const s = {
  page: { minHeight: "100dvh", background: "#0B0B0C", color: "#fff" },
  inner: { maxWidth: 520, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "calc(16px + env(safe-area-inset-top))", paddingBottom: 8 },
  backBtn: { width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.055)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", borderRadius: 10, cursor: "pointer", padding: 0 },
  kicker: { fontSize: 10, letterSpacing: 2.5, color: GOLD, textTransform: "uppercase", fontWeight: 900 },
  heroSection: { textAlign: "center", padding: "20px 0 24px" },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  title: { margin: "0 0 8px", fontSize: 24, fontWeight: 1000, lineHeight: 1.1 },
  subtitle: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 },
  stepDots: { display: "flex", gap: 8, justifyContent: "center", marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: "50%", transition: "background 0.3s" },
  stepWrap: { display: "flex", flexDirection: "column", gap: 0 },
  stepLabel: { margin: "0 0 18px", fontSize: 17, fontWeight: 900, color: "#fff" },
  fieldLabel: { margin: "0 0 10px", fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  goalGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 },
  goalCard: { padding: "20px 12px", borderRadius: 16, border: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "border-color 0.2s" },
  goalCardActive: { border: `1.5px solid ${redAlpha(0.7)}`, background: `${redAlpha(0.1)}`, boxShadow: `0 0 0 1px ${redAlpha(0.2)}` },
  goalEmoji: { fontSize: 32 },
  goalLabel: { fontSize: 13, fontWeight: 800, color: "#fff", textAlign: "center" },
  chipRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 },
  chip: { padding: "9px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  chipActive: { border: `1px solid ${redAlpha(0.6)}`, background: `${redAlpha(0.14)}`, color: "#fff", fontWeight: 900 },
  durationGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 },
  durationCard: { padding: "18px 12px", borderRadius: 14, border: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  durationCardActive: { border: `1.5px solid ${redAlpha(0.7)}`, background: `${redAlpha(0.1)}`, boxShadow: `0 0 0 1px ${redAlpha(0.2)}` },
  durationValue: { fontSize: 28, fontWeight: 1000, color: "#fff" },
  durationUnit: { fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 700 },
  nextBtn: { marginTop: 8, width: "100%", padding: 15, borderRadius: 14, border: "none", background: "#FF3B30", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}` },
  nextBtnDisabled: { marginTop: 8, width: "100%", padding: 15, borderRadius: 14, border: "none", background: `${redAlpha(0.25)}`, color: "rgba(255,255,255,0.4)", fontSize: 15, fontWeight: 900, cursor: "not-allowed" },
  generateBtn: { marginTop: 8, width: "100%", padding: 15, borderRadius: 14, border: "none", background: "#FF3B30", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}` },
  errorText: { margin: "10px 0 0", fontSize: 12, color: "#F87171", textAlign: "center" },
  resultWrap: { display: "flex", flexDirection: "column", gap: 12 },
  summaryStrip: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 },
  summaryChip: { display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" },
  summaryText: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" },
  dayCard: { background: "#141416", border: "1px solid rgba(255,255,255,0.06)", borderLeft: "2.5px solid #FF3B30", borderRadius: "3px 14px 14px 3px", padding: "14px 16px" },
  dayCardRest: { borderLeftColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.02)" },
  dayTitle: { fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 10, letterSpacing: 0.2 },
  restText: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic" },
  itemList: { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 },
  itemRow: { display: "flex", alignItems: "flex-start", gap: 8 },
  itemBullet: { color: RED, fontSize: 10, marginTop: 3, flexShrink: 0 },
  itemText: { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.45 },
  tipsCard: { background: `${goldAlpha(0.06)}`, border: `1px solid ${goldAlpha(0.18)}`, borderRadius: 14, padding: "14px 16px" },
  tipsTitle: { margin: "0 0 10px", fontSize: 12, fontWeight: 900, color: GOLD, textTransform: "uppercase", letterSpacing: 0.5 },
  tipRow: { margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 },
  actionRow: { display: "flex", gap: 8, marginTop: 4 },
  saveBtn: { flex: 2, padding: 14, borderRadius: 14, border: "none", background: "#FF3B30", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" },
  savedBtn: { flex: 2, padding: 14, borderRadius: 14, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.08)", color: "#34D399", fontSize: 14, fontWeight: 900, cursor: "not-allowed" },
  rebuildBtn: { flex: 1, padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: 700, cursor: "pointer" },
};
