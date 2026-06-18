"use client";

import styles from "@/components/gyms/gymIdStyles";
import { StarRating, ReviewCard } from "@/components/shared/ReviewCard";

export default function GymReviewsSection({
  reviews,
  user,
  alreadyReviewed,
  showReviewForm,
  reviewRating,
  reviewText,
  reviewSubmitting,
  reviewSuccess,
  reviewError,
  onShowForm,
  onHideForm,
  onRatingChange,
  onTextChange,
  onSubmit,
  t,
}) {
  return (
    <section style={styles.section}>
      <div style={styles.reviewsHeader}>
        <p style={styles.sectionTitle}>{t("gymReviewsSection")}</p>
        {!alreadyReviewed && !showReviewForm && user && (
          <button type="button" style={styles.leaveReviewBtn} onClick={onShowForm}>
            + {t("gymLeaveReview")}
          </button>
        )}
      </div>

      {reviewSuccess && (
        <p style={styles.successText}>{t("gymReviewSuccess")}</p>
      )}

      {showReviewForm && (
        <div style={styles.reviewForm}>
          <StarRating value={reviewRating} onChange={onRatingChange} />
          <textarea
            value={reviewText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={t("gymReviewPlaceholder")}
            style={styles.textarea}
            rows={3}
          />
          {reviewError && <p style={styles.errorText}>{reviewError}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" style={styles.cancelBtn} onClick={onHideForm}>{t("cancel")}</button>
            <button type="button" style={styles.submitBtn} onClick={onSubmit} disabled={reviewSubmitting}>
              {reviewSubmitting ? t("gymReviewSubmitting") : t("gymReviewSubmit")}
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <p style={styles.emptyText}>{t("gymReviewEmpty")}</p>
      ) : (
        <div style={styles.reviewList}>
          {reviews.map((r) => <ReviewCard key={r.id} review={r} styles={styles} />)}
        </div>
      )}
    </section>
  );
}
