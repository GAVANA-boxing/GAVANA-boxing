"use client";

import styles from "@/components/gyms/gymIdStyles";

export default function GymCtaRow({
  gym,
  isOwner,
  pendingJoinRequestId,
  joinRequested,
  mapsUrl,
  locale,
  router,
  t,
  onJoinClick,
  onCancelJoin,
  onShare,
}) {
  return (
    <div style={styles.ctaRow}>
      {isOwner ? (
        <button type="button" style={styles.manageBtn} onClick={() => router.push(`/${locale}/gyms/dashboard`)}>
          {t("gymManage")}
        </button>
      ) : pendingJoinRequestId ? (
        <div style={styles.pendingJoinCol}>
          <span style={styles.pendingJoinBadge}>⏳ {t("requestPendingLabel")}</span>
          <button type="button" style={styles.cancelJoinBtn} onClick={onCancelJoin}>
            {t("cancelRequest")}
          </button>
        </div>
      ) : joinRequested ? (
        <span style={styles.approvedBadge}>✓ {t("gymMembers")}</span>
      ) : (
        <button type="button" style={styles.joinBtn} onClick={onJoinClick}>{t("gymJoin")}</button>
      )}

      {gym.phone && (
        <a href={`tel:${gym.phone}`} style={styles.contactBtn}>📞</a>
      )}
      {gym.instagram && (
        <a
          href={`https://instagram.com/${gym.instagram.replace("@", "")}`}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.contactBtn}
        >
          IG
        </a>
      )}
      {gym.website && (
        <a href={gym.website} target="_blank" rel="noopener noreferrer" style={styles.contactBtn}>🌐</a>
      )}
      {(gym.city || gym.address) && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={styles.contactBtn} title={t("gymIdMapTitle")}>📍</a>
      )}
      <button type="button" style={styles.contactBtn} onClick={onShare} title={t("share")}>
        ↗
      </button>
    </div>
  );
}
