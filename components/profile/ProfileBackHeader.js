"use client";

import styles from "@/components/profile/profilePageStyles";

/**
 * @param {{ onBack: () => void }} props
 */
export default function ProfileBackHeader({ onBack }) {
  return (
    <header style={styles.backHeader}>
      <button
        type="button"
        style={styles.backBtnProfile}
        onClick={onBack}
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </header>
  );
}
