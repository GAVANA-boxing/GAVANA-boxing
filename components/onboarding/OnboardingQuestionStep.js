"use client";

const optionButtonBase = {
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
};

const optionButtonSelected = {
  background: "rgba(239,68,68,0.18)",
  borderColor: "rgba(239,68,68,0.5)",
  transform: "scale(1.01)",
};

/**
 * Props:
 *   question   — { key, title, description, options: [{ value, label }] }
 *   selected   — currently selected value string
 *   onSelect   — (value: string) => void
 */
export default function OnboardingQuestionStep({ question, selected, onSelect }) {
  return (
    <>
      <h2 style={styles.title}>{question.title}</h2>
      <p style={styles.text}>{question.description}</p>
      <div style={styles.options}>
        {question.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            style={{
              ...optionButtonBase,
              ...(selected === option.value ? optionButtonSelected : {}),
            }}
          >
            <span>{option.label}</span>
          </button>
        ))}
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
  options: {
    display: "grid",
    gap: 12,
    marginTop: 18,
  },
};
