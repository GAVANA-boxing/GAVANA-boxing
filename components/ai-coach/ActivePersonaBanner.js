"use client";

import styles from "@/components/aiCoachStyles";

export default function ActivePersonaBanner({ activePersona, locale }) {
  return (
    <div style={{ ...styles.personaBanner, borderColor: `${activePersona.color}30`, background: `${activePersona.color}08` }}>
      <span style={{ ...styles.personaBannerEmoji, background: `${activePersona.color}1A` }}>
        {activePersona.emoji}
      </span>
      <div style={styles.personaBannerInfo}>
        <p style={{ ...styles.personaBannerName, color: activePersona.color }}>{activePersona.name}</p>
        <p style={styles.personaBannerSub}>
          {locale === "mn" ? "Одоо дасгалжуулж байна" : locale === "ko" ? "지금 코칭 중" : "Coaching you now"}
        </p>
      </div>
      <span style={styles.personaBannerDot} />
    </div>
  );
}
