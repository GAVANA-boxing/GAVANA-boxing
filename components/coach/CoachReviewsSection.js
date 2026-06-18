"use client";

import styles from "@/components/coach/coachIdStyles";
import EmptyState from "@/components/EmptyState";
import { ReviewCard } from "@/components/shared/ReviewCard";

const STRINGS = {
  mn: {
    coachReviews: "Сэтгэгдлүүд",
    coachReviewsEmpty: "Сэтгэгдэл байхгүй байна",
    coachIdReviewsEmpty: "Эхний сэтгэгдэлийг үлдээгээрэй!",
  },
  en: {
    coachReviews: "Reviews",
    coachReviewsEmpty: "No reviews yet",
    coachIdReviewsEmpty: "Be the first to leave a review!",
  },
};

function t(locale, key) {
  return (STRINGS[locale] || STRINGS.en)[key] ?? key;
}

export default function CoachReviewsSection({ locale, reviews }) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>{t(locale, "coachReviews")}</h2>
      {reviews.length === 0 ? (
        <div
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.1)",
          }}
        >
          <EmptyState
            emoji="⭐"
            title={t(locale, "coachReviewsEmpty")}
            hint={t(locale, "coachIdReviewsEmpty")}
            padding="28px 16px"
          />
        </div>
      ) : (
        reviews.map((r) => <ReviewCard key={r.id} review={r} styles={styles} />)
      )}
    </div>
  );
}
