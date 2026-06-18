"use client";

import styles from "@/components/gyms/gymIdStyles";

export default function GymJoinForm({
  joinMessage,
  onMessageChange,
  joinError,
  joinSubmitting,
  onCancel,
  onSubmit,
  t,
}) {
  return (
    <div style={styles.joinForm}>
      <p style={styles.sectionTitle}>{t("gymJoin")}</p>
      <textarea
        value={joinMessage}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder={t("gymJoinMessagePlaceholder")}
        style={styles.textarea}
        rows={3}
      />
      {joinError && <p style={styles.errorText}>{joinError}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" style={styles.cancelBtn} onClick={onCancel}>{t("cancel")}</button>
        <button type="button" style={styles.submitBtn} onClick={onSubmit} disabled={joinSubmitting}>
          {joinSubmitting ? t("gymJoinSubmitting") : t("gymJoinSubmit")}
        </button>
      </div>
    </div>
  );
}
