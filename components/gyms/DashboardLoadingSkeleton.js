"use client";

import BottomNav from "@/components/BottomNav";
import styles from "@/components/gyms/gymsDashboardStyles";

export default function DashboardLoadingSkeleton({ router, user, locale }) {
  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <div style={{ height: 20, width: 80, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 8 }} className="shimmer" />
        <div style={{ height: 28, width: "60%", borderRadius: 8, background: "rgba(255,255,255,0.08)", marginBottom: 20 }} className="shimmer" />
        <div style={{ display: "flex", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
          {[1,2,3,4].map((i) => (
            <div key={i} style={{ flex: 1, padding: "14px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ height: 20, width: 32, borderRadius: 4, background: "rgba(255,255,255,0.08)" }} className="shimmer" />
              <div style={{ height: 10, width: 44, borderRadius: 4, background: "rgba(255,255,255,0.05)" }} className="shimmer" />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[1,2,3,4].map((i) => <div key={i} style={{ flex: 1, height: 38, borderRadius: 10, background: "rgba(255,255,255,0.06)" }} className="shimmer" />)}
        </div>
        {[1,2,3].map((i) => (
          <div key={i} style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", padding: 14, marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} className="shimmer" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ height: 13, width: "50%", borderRadius: 6, background: "rgba(255,255,255,0.08)" }} className="shimmer" />
                <div style={{ height: 11, width: "30%", borderRadius: 6, background: "rgba(255,255,255,0.05)" }} className="shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}
