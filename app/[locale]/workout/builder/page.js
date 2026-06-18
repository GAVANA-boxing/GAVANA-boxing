"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { getLocale, translate } from "@/lib/i18n";
import BottomNav from "@/components/BottomNav";
import { RED, pageBg } from "@/lib/tokens";
import { GOALS, LEVELS, label, buildPrompt, parsePlan } from "@/components/workout/builderConstants";
import BuilderHeader from "@/components/workout/BuilderHeader";
import BuilderStepDots from "@/components/workout/BuilderStepDots";
import BuilderStepGoal from "@/components/workout/BuilderStepGoal";
import BuilderStepLevel from "@/components/workout/BuilderStepLevel";
import BuilderStepDuration from "@/components/workout/BuilderStepDuration";
import BuilderPlanResult from "@/components/workout/BuilderPlanResult";

const s = {
  page: { minHeight: "100dvh", background: pageBg(), color: "#fff" },
  inner: { maxWidth: 520, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
};

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

  const handleBack = () => {
    if (step > 0 && step < 3) {
      setStep(step - 1);
    } else {
      router.push(`/${locale}/programs`);
    }
  };

  return (
    <div style={s.page} className="page-enter">
      <div style={s.inner}>
        <BuilderHeader
          onBack={handleBack}
          title={t("wbTitle")}
          subtitle={t("wbSubtitle")}
        />

        {step < 3 && <BuilderStepDots step={step} total={3} />}

        {step === 0 && (
          <BuilderStepGoal
            locale={locale}
            goal={goal}
            onGoalChange={setGoal}
            onNext={() => setStep(1)}
            stepLabel={t("wbGoalStep")}
            nextLabel={t("wbNext")}
          />
        )}

        {step === 1 && (
          <BuilderStepLevel
            locale={locale}
            level={level}
            onLevelChange={setLevel}
            days={days}
            onDaysChange={setDays}
            onNext={() => setStep(2)}
            stepLabel={t("wbLevelStep")}
            levelLabel={t("wbLevel")}
            daysLabel={t("wbDaysWeek")}
            nextLabel={t("wbNext")}
          />
        )}

        {step === 2 && (
          <BuilderStepDuration
            duration={duration}
            onDurationChange={setDuration}
            generating={generating}
            error={error}
            onGenerate={handleGenerate}
            stepLabel={t("wbDurationStep")}
            minUnit={t("wbMinUnit")}
            generateLabel={t("wbGenerate")}
            generatingLabel={t("wbGenerating")}
          />
        )}

        {step === 3 && plan && (
          <BuilderPlanResult
            plan={plan}
            goal={goal}
            level={level}
            days={days}
            duration={duration}
            locale={locale}
            saving={saving}
            saved={saved}
            error={error}
            onSave={handleSave}
            onRebuild={() => { setPlan(null); setSaved(false); setError(""); setStep(2); }}
            perWeekLabel={t("wbPerWeek")}
            minUnit={t("wbMinUnit")}
            restLabel={t("wbRest")}
            tipsLabel={t("wbTips")}
            saveLabel={t("wbSave")}
            savedLabel={t("wbSaved")}
            rebuildLabel={t("wbRebuild")}
          />
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}
