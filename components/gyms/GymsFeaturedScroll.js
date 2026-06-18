"use client";

import Image from "next/image";
import styles from "@/components/gyms/gymsStyles";

export function GymsFeaturedScroll({ featuredGyms, locale, router, t }) {
  if (!featuredGyms.length) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={styles.sectionLabel}>{t("gymFeatured")}</p>
      <div style={styles.featuredScroll}>
        {featuredGyms.map((gym) => (
          <button
            key={gym.id}
            type="button"
            style={styles.featuredCard}
            onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}
          >
            {gym.logo ? (
              <Image
                src={gym.logo}
                alt=""
                width={48}
                height={48}
                style={{ objectFit: "cover", borderRadius: 12, marginBottom: 2 }}
              />
            ) : (
              <div style={styles.featuredLogoFallback}>🥊</div>
            )}
            <p style={styles.featuredName}>{gym.gymName}</p>
            <p style={styles.featuredCity}>{gym.city || ""}</p>
            {gym.rating > 0 && (
              <span style={styles.featuredRating}>⭐ {Number(gym.rating).toFixed(1)}</span>
            )}
            {gym.memberCount > 0 && (
              <span style={styles.featuredMembers}>👥 {gym.memberCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
