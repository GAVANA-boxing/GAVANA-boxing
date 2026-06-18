"use client";

import styles from "@/components/coach/coachIdStyles";

const STRINGS = {
  mn: {
    coachReviewSessionCompleted: "Хичээл амжилттай дууслаа! Сэтгэгдэл үлдээнэ үү.",
    leaveReview: "Сэтгэгдэл үлдээх",
    coachReviewSuccess: "Сэтгэгдэл амжилттай илгээгдлээ",
  },
  en: {
    coachReviewSessionCompleted: "Session completed! Leave a review.",
    leaveReview: "Leave a Review",
    coachReviewSuccess: "Review submitted successfully",
  },
};

function t(locale, key) {
  return (STRINGS[locale] || STRINGS.en)[key] ?? key;
}

export default function CoachReviewPrompt({
  locale,
  eligibleBooking,
  reviewSuccess,
  onLeaveReview,
}) {
  if (reviewSuccess) {
    return (
      <div
        style={{
          ...styles.reviewPrompt,
          borderColor: "rgba(52,211,153,0.4)",
          background: "rgba(52,211,153,0.08)",
        }}
      >
        <p style={{ ...styles.reviewPromptText, color: "#34D399" }}>
          ✓ {t(locale, "coachReviewSuccess")}
        </p>
      </div>
    );
  }

  if (!eligibleBooking) return null;

  return (
    <div style={styles.reviewPrompt}>
      <p style={styles.reviewPromptText}>
        {t(locale, "coachReviewSessionCompleted")}
      </p>
      <button type="button" style={styles.leaveReviewBtn} onClick={onLeaveReview}>
        {t(locale, "leaveReview")}
      </button>
    </div>
  );
}
