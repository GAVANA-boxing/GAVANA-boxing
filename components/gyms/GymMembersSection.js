"use client";

import Image from "next/image";
import styles from "@/components/gyms/gymIdStyles";

export default function GymMembersSection({ members, t }) {
  if (!members.length) return null;

  return (
    <section style={styles.section}>
      <p style={styles.sectionTitle}>{t("gymMembersSection")} ({members.length})</p>
      <div style={styles.membersRow}>
        {members.slice(0, 12).map((m) => {
          const name = m.user?.displayName || m.user?.username || "Member";
          const photo = m.user?.photoURL || m.user?.profileImageUrl || "";
          return (
            <div key={m.id} style={styles.memberSlot}>
              <div style={styles.memberAvatar}>
                {photo
                  ? <Image src={photo} alt="" width={44} height={44} style={{ objectFit: "cover" }} />
                  : <span style={styles.memberAvatarInitial}>{name[0]?.toUpperCase()}</span>
                }
              </div>
              <span style={styles.memberName}>{name.split(" ")[0]}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
