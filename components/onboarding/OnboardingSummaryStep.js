"use client";

/**
 * Props:
 *   coachRecText  — string, already interpolated (persona substituted)
 *   goal          — string
 *   experience    — string
 *   coachStyle    — string
 *   labels        — { coachRec, goalLabel, expLabel, coachLabel, notSelected }
 *                   all pre-translated strings
 */
export default function OnboardingSummaryStep({ coachRecText, goal, experience, coachStyle, labels }) {
  return (
    <>
      <h2 style={styles.title}>{labels.coachRec}</h2>
      <p style={styles.text}>{coachRecText}</p>
      <div style={styles.summaryCard}>
        <div style={styles.summaryRow}>
          <span>{labels.goalLabel}</span>
          <strong>{goal || labels.notSelected}</strong>
        </div>
        <div style={styles.summaryRow}>
          <span>{labels.expLabel}</span>
          <strong>{experience || labels.notSelected}</strong>
        </div>
        <div style={styles.summaryRow}>
          <span>{labels.coachLabel}</span>
          <strong>{coachStyle || labels.notSelected}</strong>
        </div>
      </div>
    </>
  );
}

const styles = {
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
};
