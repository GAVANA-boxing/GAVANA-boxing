"use client";

import styles from "@/components/coach/coachIdStyles";
import { StarRating } from "@/components/shared/ReviewCard";

const STRINGS = {
  mn: {
    leaveReview: "Сэтгэгдэл үлдээх",
    coachReviewRating: "Үнэлгээ",
    coachReviewPlaceholder: "Сэтгэгдэлээ бичнэ үү...",
    cancel: "Цуцлах",
    coachReviewSubmitting: "Илгээж байна...",
    coachReviewSubmit: "Илгээх",
  },
  en: {
    leaveReview: "Leave a Review",
    coachReviewRating: "Rating",
    coachReviewPlaceholder: "Write your review...",
    cancel: "Cancel",
    coachReviewSubmitting: "Submitting...",
    coachReviewSubmit: "Submit",
  },
};

function t(locale, key) {
  return (STRINGS[locale] || STRINGS.en)[key] ?? key;
}

export default function CoachReviewForm({
  locale,
  reviewRating,
  reviewText,
  reviewError,
  reviewSubmitting,
  onRatingChange,
  onTextChange,
  onCancel,
  onSubmit,
}) {
  return (
    <div style={styles.reviewFormCard}>
      <h3 style={styles.reviewFormTitle}>{t(locale, "leaveReview")}</h3>
      <div style={styles.ratingRow}>
        <span style={styles.fieldLabel}>{t(locale, "coachReviewRating")}</span>
        <StarRating value={reviewRating} onChange={onRatingChange} />
      </div>
      <textarea
        value={reviewText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={t(locale, "coachReviewPlaceholder")}
        style={styles.reviewTextarea}
        rows={3}
      />
      {reviewError && <p style={styles.reviewErr}>{reviewError}</p>}
      <div style={styles.reviewFormActions}>
        <button type="button" style={styles.cancelBtn} onClick={onCancel}>
          {t(locale, "cancel")}
        </button>
        <button
          type="button"
          style={reviewSubmitting ? styles.submitBtnDisabled : styles.submitBtn}
          onClick={onSubmit}
          disabled={reviewSubmitting}
        >
          {reviewSubmitting
            ? t(locale, "coachReviewSubmitting")
            : t(locale, "coachReviewSubmit")}
        </button>
      </div>
    </div>
  );
}
