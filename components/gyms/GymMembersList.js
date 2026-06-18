"use client";

import Image from "next/image";
import EmptyState from "@/components/EmptyState";
import styles from "@/components/gyms/gymsDashboardStyles";

export default function GymMembersList({ members, requesterUsers, locale, router, t }) {
  if (members.length === 0) {
    return <EmptyState emoji="👥" title={t("gymDashNoMembers")} />;
  }

  return (
    <div style={styles.cardList}>
      {members.map((mem) => {
        const mu = requesterUsers[mem.userId] || {};
        const name = mu.displayName || mu.username || mu.name || "Fighter";
        const photo = mu.photoURL || mu.profileImageUrl || "";
        const archetype = mu.archetype || "";
        const weightClass = mu.weightClass || "";
        const joinedAt = mem.reviewedAt?.toDate
          ? mem.reviewedAt.toDate().toLocaleDateString()
          : mem.createdAt?.toDate
          ? mem.createdAt.toDate().toLocaleDateString()
          : "";
        return (
          <button key={mem.id} type="button" style={{ ...styles.memberCard, width: "100%", textAlign: "left", cursor: "pointer" }} onClick={() => mem.userId && router.push(`/${locale}/profile/${mem.userId}`)}>
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
                  {archetype && weightClass ? `${archetype} · ${weightClass}` : archetype || weightClass || "Fighter"}
                </p>
              </div>
              <div style={styles.memberJoinedChip}>
                <span style={styles.memberJoinedLabel}>
                  {t("gymDashJoined")}
                </span>
                <span style={styles.memberJoinedDate}>{joinedAt}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
