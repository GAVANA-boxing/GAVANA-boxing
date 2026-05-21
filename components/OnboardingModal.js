"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, RED_DARK, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";

const personaMap = {
  strict: "Drill Sergeant",
  calm: "Zen Master",
  analytical: "Analyst",
};

function getQuestions(t) {
  return [
    {
      key: "goal",
      title: t("onboardingGoalTitle"),
      description: t("onboardingGoalDesc"),
      options: [
        { value: "fitness", label: t("onboardingGoalFitness") },
        { value: "amateur", label: t("onboardingGoalAmateur") },
        { value: "pro", label: t("onboardingGoalPro") },
      ],
    },
    {
      key: "experience",
      title: t("onboardingExpTitle"),
      description: t("onboardingExpDesc"),
      options: [
        { value: "beginner", label: t("onboardingExpBeginner") },
        { value: "intermediate", label: t("onboardingExpIntermediate") },
        { value: "advanced", label: t("onboardingExpAdvanced") },
      ],
    },
    {
      key: "coachStyle",
      title: t("onboardingCoachTitle"),
      description: t("onboardingCoachDesc"),
      options: [
        { value: "strict", label: t("onboardingCoachStrict") },
        { value: "calm", label: t("onboardingCoachCalm") },
        { value: "analytical", label: t("onboardingCoachAnalytical") },
      ],
    },
  ];
}

export default function OnboardingModal() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [goal, setGoal] = useState("");
  const [experience, setExperience] = useState("");
  const [coachStyle, setCoachStyle] = useState("");
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user?.uid) {
      setVisible(false);
      setChecking(false);
      return;
    }

    // Don't show on the onboarding page itself
    if (pathname?.includes("/onboarding")) {
      setVisible(false);
      setChecking(false);
      return;
    }

    let active = true;
    async function checkOnboarding() {
      try {
        const userRef = doc(db, "users", user.uid);
        const snapshot = await getDoc(userRef);
        const data = snapshot.exists() ? snapshot.data() : {};

        // Check both field names (onboardingComplete = new page, onboarding.completed = old modal)
        const isDone = data?.onboardingComplete === true || data?.onboarding?.completed === true;

        if (isDone) {
          setVisible(false);
        } else {
          // Redirect to full onboarding page instead of showing modal questions
          router.replace(`/${locale}/onboarding`);
          setVisible(false);
        }
      } catch (err) {
      } finally {
        if (active) setChecking(false);
      }
    }

    checkOnboarding();
    return () => { active = false; };
  }, [authLoading, user?.uid, pathname, locale, router]);

  const selectedValues = useMemo(
    () => ({ goal, experience, coachStyle }),
    [goal, experience, coachStyle]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(() => getQuestions(t), [locale]); // t omitted — recreated every render, locale covers it
  const currentQuestion = questions[stepIndex];
  const isSummaryStep = stepIndex >= questions.length;
  const recommendedPersona = personaMap[coachStyle] || "Coach";

  const saveOnboarding = async (payload) => {
    if (!user?.uid) return;
    setSaving(true);
    setError("");

    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          onboarding: {
            ...payload,
            coachPersona: payload.coachStyle ? personaMap[payload.coachStyle] : null,
            completed: true,
          },
        },
        { merge: true }
      );
      setVisible(false);
    } catch (err) {
      setError(t("onboardingErrSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (isSummaryStep) {
      saveOnboarding({ ...selectedValues });
      return;
    }

    if (stepIndex === 0 && !goal) {
      setError(t("onboardingErrGoal"));
      return;
    }

    if (stepIndex === 1 && !experience) {
      setError(t("onboardingErrExp"));
      return;
    }

    if (stepIndex === 2 && !coachStyle) {
      setError(t("onboardingErrCoach"));
      return;
    }

    setError("");
    setStepIndex((current) => current + 1);
  };

  const handleSkip = () => {
    saveOnboarding({ skipped: true });
  };

  const renderOptions = () => {
    return currentQuestion.options.map((option) => {
      const selected =
        currentQuestion.key === "goal"
          ? goal === option.value
          : currentQuestion.key === "experience"
          ? experience === option.value
          : coachStyle === option.value;

      return (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            setError("");
            if (currentQuestion.key === "goal") setGoal(option.value);
            if (currentQuestion.key === "experience") setExperience(option.value);
            if (currentQuestion.key === "coachStyle") setCoachStyle(option.value);
          }}
          style={{
            ...styles.optionButton,
            ...(selected ? styles.optionButtonSelected : {}),
          }}
        >
          <span>{option.label}</span>
        </button>
      );
    });
  };

  if (authLoading || checking || !visible) {
    return null;
  }

  const coachRecText = t("onboardingCoachRecText").replace("{persona}", recommendedPersona);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.glow} />
        <div style={styles.brand}>GAVANA BOXING</div>
        <div style={styles.stepMark}>{Math.min(stepIndex + 1, questions.length + 1)}/{questions.length + 1}</div>
        {isSummaryStep ? (
          <>
            <h2 style={styles.title}>{t("onboardingCoachRec")}</h2>
            <p style={styles.text}>{coachRecText}</p>
            <div style={styles.summaryCard}>
              <div style={styles.summaryRow}>
                <span>{t("onboardingGoalLabel")}</span>
                <strong>{goal || t("onboardingNotSelected")}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>{t("onboardingExpLabel")}</span>
                <strong>{experience || t("onboardingNotSelected")}</strong>
              </div>
              <div style={styles.summaryRow}>
                <span>{t("onboardingCoachLabel")}</span>
                <strong>{coachStyle || t("onboardingNotSelected")}</strong>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 style={styles.title}>{currentQuestion.title}</h2>
            <p style={styles.text}>{currentQuestion.description}</p>
            <div style={styles.options}>{renderOptions()}</div>
          </>
        )}

        {error ? <div style={styles.error}>{error}</div> : null}

        <div style={styles.actions}>
          <button type="button" style={styles.secondaryButton} onClick={handleSkip} disabled={saving}>
            {t("onboardingSkip")}
          </button>
          <button type="button" style={styles.primaryButton} onClick={handleNext} disabled={saving}>
            {isSummaryStep ? (saving ? t("onboardingSaving") : t("onboardingFinish")) : t("onboardingNext")}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1900,
    display: "grid",
    placeItems: "center",
    padding: 18,
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },
  modal: {
    position: "relative",
    width: "min(100%, 480px)",
    overflow: "hidden",
    borderRadius: 28,
    padding: "32px 26px",
    background: `linear-gradient(145deg, ${redAlpha(0.16)}, rgba(11,11,11,0.98) 42%, ${goldAlpha(0.08)})`,
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 28px 90px rgba(0,0,0,0.58)",
    color: "#fff",
    textAlign: "center",
  },
  glow: {
    position: "absolute",
    inset: "-40% -20% auto",
    height: 180,
    background: `radial-gradient(circle, ${goldAlpha(0.2)}, transparent 62%)`,
    pointerEvents: "none",
  },
  brand: {
    margin: 0,
    color: GOLD,
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 2,
  },
  stepMark: {
    margin: "18px auto 12px",
    width: 52,
    height: 52,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: `${redAlpha(0.2)}`,
    border: `1px solid ${redAlpha(0.42)}`,
    color: "#fff",
    fontSize: 13,
    fontWeight: 950,
  },
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.05,
    fontWeight: 900,
  },
  text: {
    margin: "12px auto 24px",
    maxWidth: 360,
    color: "#CCCCCC",
    fontSize: 15,
    lineHeight: 1.6,
  },
  options: {
    display: "grid",
    gap: 12,
    marginTop: 18,
  },
  optionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    padding: "0 14px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 160ms ease, background 160ms ease, border-color 160ms ease",
  },
  optionButtonSelected: {
    background: `${redAlpha(0.18)}`,
    borderColor: `${redAlpha(0.5)}`,
    transform: "scale(1.01)",
  },
  summaryCard: {
    margin: "20px auto 0",
    width: "100%",
    maxWidth: 380,
    padding: 20,
    borderRadius: 18,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    textAlign: "left",
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    color: "#DDD",
    fontSize: 15,
  },
  error: {
    marginTop: 16,
    color: "#FF8B8B",
    fontSize: 14,
    minHeight: 22,
  },
  actions: {
    display: "grid",
    gap: 12,
    marginTop: 22,
  },
  primaryButton: {
    minHeight: 52,
    border: "none",
    borderRadius: 16,
    background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: `0 18px 44px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)`,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
};
