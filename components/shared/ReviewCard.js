"use client";

import { GOLD } from "@/lib/tokens";

export function StarRating({ value, onChange, readonly = false }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange?.(n)}
          style={{
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: readonly ? "default" : "pointer",
            color: n <= value ? GOLD : "rgba(255,255,255,0.2)",
            padding: "2px 1px",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function ReviewCard({ review, styles }) {
  return (
    <div style={styles.reviewCard}>
      <div style={styles.reviewTop}>
        <StarRating value={review.rating} readonly />
        <span style={styles.reviewDate}>
          {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString() : ""}
        </span>
      </div>
      {review.review && <p style={styles.reviewText}>{review.review}</p>}
    </div>
  );
}
