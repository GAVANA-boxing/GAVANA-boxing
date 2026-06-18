"use client";

import styles from "@/components/creator/creatorDashboardStyles";
import SubscriptionTiers from "@/components/creator/SubscriptionTiers";

const COMING_SOON_STYLE = {
  padding: "6px 12px",
  borderRadius: 10,
  border: "1px solid rgba(245,196,81,0.2)",
  color: "rgba(245,196,81,0.5)",
  fontSize: 10,
  fontWeight: 900,
  letterSpacing: 1.5,
  fontFamily: "var(--font-condensed)",
};

/**
 * @param {{
 *   t: (key: string) => string,
 *   locale: string,
 * }} props
 */
export default function CreatorMonetizeTab({ t, locale }) {
  return (
    <>
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>💰 {t("creatorMonetizeTitle")}</h2>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
          {t("creatorMonetizeSub")}
        </p>
        <SubscriptionTiers t={t} locale={locale} />
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🎁 {t("creatorTipsTitle")}</h2>
        <div style={{ padding: "14px 16px", borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{t("creatorTipsEnable")}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{t("creatorTipsSub")}</div>
          </div>
          <span style={COMING_SOON_STYLE}>COMING SOON</span>
        </div>
      </section>
    </>
  );
}
