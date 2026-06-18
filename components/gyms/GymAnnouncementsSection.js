"use client";

import styles from "@/components/gyms/gymIdStyles";

export default function GymAnnouncementsSection({ announcements, t }) {
  if (!announcements.length) return null;

  return (
    <section style={styles.section}>
      <p style={styles.sectionTitle}>{t("gymAnnouncements")}</p>
      <div style={styles.announcementList}>
        {announcements.map((ann) => (
          <div key={ann.id} style={styles.announcementCard}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📌</span>
              <p style={{ ...styles.annTitle, margin: 0 }}>{ann.title}</p>
            </div>
            <p style={styles.annBody}>{ann.body}</p>
            <span style={styles.annDate}>
              {ann.createdAt?.toDate ? new Date(ann.createdAt.toDate()).toLocaleDateString() : ""}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
