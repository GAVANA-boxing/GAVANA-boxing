"use client";

import BottomNav from "@/components/BottomNav";
import styles from "@/components/gyms/gymsDashboardStyles";

export default function GymRegisterSuccess({ router, user, locale, t, gym }) {
  return (
    <div style={styles.page}>
      <div style={styles.inner}>
        <div style={styles.successCard}>
          <div style={{ fontSize: 52 }}>🏋️</div>
          <h2 style={styles.successTitle}>{t("gymRegisterSuccess")}</h2>
          <button type="button" style={styles.submitBtn} onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}>
            {t("gymDashViewGym")}
          </button>
        </div>
      </div>
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}
