"use client";

import styles from "@/components/leaderboard/leaderboardStyles";

export default function LeaderboardHeader({ onBack, title }) {
  return (
    <header style={styles.header}>
      <button
        type="button"
        style={styles.backBtn}
        onClick={onBack}
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={styles.headerCenter}>
        <p style={styles.eyebrow}>COMBAT · BOARD</p>
        <h1 style={styles.title}>{title}</h1>
      </div>
      <div style={styles.trophyBadge} aria-hidden="true">🏆</div>
    </header>
  );
}
