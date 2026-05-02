"use client";

import { useEffect, useState } from "react";

const steps = [
  {
    title: "Upload your training",
    text: "Post bag work, sparring clips, and drills in seconds.",
  },
  {
    title: "Get AI feedback",
    text: "Use your caption and stats to get simple coaching advice.",
  },
  {
    title: "Follow fighters and improve",
    text: "Build your feed around athletes who push your level.",
  },
];

export default function OnboardingModal() {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const done = window.localStorage.getItem("gavana_onboarding_complete");
    if (!done) {
      setVisible(true);
    }
  }, []);

  const finish = () => {
    window.localStorage.setItem("gavana_onboarding_complete", "1");
    setVisible(false);
  };

  const next = () => {
    if (stepIndex >= steps.length - 1) {
      finish();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  if (!visible) return null;

  const step = steps[stepIndex];

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.glow} />
        <p style={styles.kicker}>GAVANA BOXING</p>
        <div style={styles.stepMark}>{stepIndex + 1}/3</div>
        <h2 style={styles.title}>{step.title}</h2>
        <p style={styles.text}>{step.text}</p>
        <div style={styles.dots}>
          {steps.map((item, index) => (
            <span
              key={item.title}
              style={{
                ...styles.dot,
                ...(index === stepIndex ? styles.dotActive : {}),
              }}
            />
          ))}
        </div>
        <button type="button" style={styles.button} onClick={next}>
          {stepIndex === steps.length - 1 ? "Get started" : "Next"}
        </button>
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
    width: "min(100%, 420px)",
    overflow: "hidden",
    borderRadius: 24,
    padding: "28px 22px 22px",
    background: "linear-gradient(145deg, rgba(193,18,31,0.16), rgba(11,11,11,0.98) 42%, rgba(212,175,55,0.08))",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 28px 90px rgba(0,0,0,0.58)",
    color: "#fff",
    textAlign: "center",
  },
  glow: {
    position: "absolute",
    inset: "-40% -20% auto",
    height: 180,
    background: "radial-gradient(circle, rgba(212,175,55,0.2), transparent 62%)",
    pointerEvents: "none",
  },
  kicker: {
    position: "relative",
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 2,
  },
  stepMark: {
    position: "relative",
    margin: "18px auto 14px",
    width: 52,
    height: 52,
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    background: "rgba(193,18,31,0.2)",
    border: "1px solid rgba(193,18,31,0.42)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 950,
  },
  title: {
    position: "relative",
    margin: 0,
    fontSize: 30,
    lineHeight: 1,
    fontWeight: 1000,
    letterSpacing: 0,
  },
  text: {
    position: "relative",
    margin: "12px auto 0",
    maxWidth: 300,
    color: "#AAAAAA",
    fontSize: 15,
    lineHeight: 1.45,
  },
  dots: {
    display: "flex",
    justifyContent: "center",
    gap: 7,
    margin: "24px 0 18px",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    background: "rgba(255,255,255,0.22)",
  },
  dotActive: {
    width: 22,
    background: "#C1121F",
    boxShadow: "0 0 16px rgba(193,18,31,0.55)",
  },
  button: {
    width: "100%",
    minHeight: 50,
    border: "none",
    borderRadius: 16,
    background: "#C1121F",
    color: "#fff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 18px 44px rgba(193,18,31,0.28)",
  },
};
