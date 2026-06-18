"use client";

import styles from "@/components/gyms/gymsStyles";

export function GymsAllTabHeader({ locale, router, t }) {
  return (
    <div style={styles.header}>
      <p style={styles.kicker}>GAVANA</p>
      <h1 style={styles.title}>{t("gymsTitle")}</h1>
      <p style={styles.subtitle}>{t("gymsSubtitle")}</p>
      <button
        type="button"
        style={styles.registerBtn}
        onClick={() => router.push(`/${locale}/gyms/dashboard`)}
      >
        + {t("gymsRegister")}
      </button>
    </div>
  );
}
