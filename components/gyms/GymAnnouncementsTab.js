"use client";

import styles from "@/components/gyms/gymsDashboardStyles";

export default function GymAnnouncementsTab({
  annTitle, setAnnTitle,
  annBody, setAnnBody,
  annPosting,
  annSuccess,
  annError,
  handlePostAnnouncement,
  announcements,
  t,
}) {
  return (
    <div>
      <div style={styles.annForm}>
        <input
          type="text"
          value={annTitle}
          onChange={(e) => setAnnTitle(e.target.value)}
          placeholder={t("gymAnnouncementTitle")}
          style={styles.input}
        />
        <textarea
          value={annBody}
          onChange={(e) => setAnnBody(e.target.value)}
          placeholder={t("gymAnnouncementBody")}
          style={styles.textarea}
          rows={4}
        />
        {annError && <p style={styles.errorText}>{annError}</p>}
        {annSuccess && <p style={styles.successText}>{t("gymAnnouncementSuccess")}</p>}
        <button
          type="button"
          style={annPosting ? styles.submitBtnDisabled : styles.submitBtn}
          onClick={handlePostAnnouncement}
          disabled={annPosting}
        >
          {annPosting ? t("gymAnnouncementPosting") : t("gymAnnouncementSubmit")}
        </button>
      </div>

      {announcements.length > 0 && (
        <div style={styles.annList}>
          <p style={styles.sectionLabel}>{t("gymDashPostedAnnouncements")}</p>
          {announcements.map((ann) => (
            <div key={ann.id} style={styles.annCard}>
              <p style={styles.annTitle}>{ann.title}</p>
              <p style={styles.annBody}>{ann.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
