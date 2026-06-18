"use client";

import styles from "@/components/challenges/challengesStyles";

/**
 * Props:
 *   labels  — { kicker, title, subtitle, streakText }
 *             all pre-translated; streakText already has {n} substituted
 */
export default function ChallengesHeader({ labels }) {
  return (
    <header style={styles.header}>
      <p style={styles.kicker}>{labels.kicker}</p>
      <h1 style={styles.title}>{labels.title}</h1>
      <p style={styles.subtitle}>{labels.subtitle}</p>
      <div style={styles.streakPill}>
        <span style={styles.streakFlame}>🔥</span>
        {labels.streakText}
      </div>
    </header>
  );
}
