"use client";

import Image from "next/image";
import EmptyState from "@/components/EmptyState";
import styles from "@/components/gyms/gymsDashboardStyles";

export default function GymJoinRequests({ joinRequests, requesterUsers, updatingId, handleJoinAction, t }) {
  if (joinRequests.length === 0) {
    return <EmptyState emoji="👥" title={t("gymNoJoinRequests")} />;
  }

  return (
    <div style={styles.cardList}>
      {joinRequests.map((req) => {
        const ru = requesterUsers[req.userId] || {};
        const name = ru.displayName || ru.username || ru.name || "Fighter";
        const photo = ru.photoURL || ru.profileImageUrl || "";
        return (
          <div key={req.id} style={styles.requestCard}>
            <div style={styles.requestTop}>
              <div style={styles.reqAvatar}>
                {photo
                  ? <Image src={photo} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
                  : <span style={styles.reqAvatarInitial}>{name[0]?.toUpperCase()}</span>
                }
              </div>
              <div style={styles.reqInfo}>
                <p style={styles.reqName}>{name}</p>
                <p style={styles.reqDate}>
                  {req.createdAt?.toDate ? new Date(req.createdAt.toDate()).toLocaleDateString() : ""}
                </p>
              </div>
            </div>
            {req.message && <p style={styles.reqMessage}>&ldquo;{req.message}&rdquo;</p>}
            <div style={styles.reqActions}>
              <button
                type="button"
                style={styles.declineBtn}
                disabled={updatingId === req.id}
                onClick={() => handleJoinAction(req, "declined")}
              >
                {t("gymDecline")}
              </button>
              <button
                type="button"
                style={styles.approveBtn}
                disabled={updatingId === req.id}
                onClick={() => handleJoinAction(req, "approved")}
              >
                {updatingId === req.id ? "…" : t("gymApprove")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
