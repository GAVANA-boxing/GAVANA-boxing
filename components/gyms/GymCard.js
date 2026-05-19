"use client";

import { GOLD, redAlpha } from "@/lib/tokens";
import styles from "@/components/gyms/gymsStyles";
import { GYM_TYPE_KEYS, getDefaultVibes } from "@/lib/gymConstants";
import Image from "next/image";

function StarDisplay({ rating }) {
  const r = Number(rating) || 0;
  return (
    <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>
      {"★".repeat(Math.round(r))}{"☆".repeat(5 - Math.round(r))} {r > 0 ? r.toFixed(1) : ""}
    </span>
  );
}

export function GymCard({ gym, t, router, locale }) {
  const vibes = gym.vibes || getDefaultVibes(gym.gymType);
  return (
    <div style={styles.card}>
      <div style={styles.cardImageWrap} onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}>
        {gym.logo ? (
          <Image src={gym.logo} alt={gym.gymName || "Gym"} width={64} height={64} style={{ objectFit: "cover", borderRadius: 14 }} />
        ) : (
          <div style={styles.cardLogoFallback}>
            <span style={{ fontSize: 32, filter: `drop-shadow(0 2px 12px ${redAlpha(0.6)})` }}>🥊</span>
          </div>
        )}
        {gym.verified && (
          <span style={styles.verifiedBadge}>✓ {t("gymVerified")}</span>
        )}
        {gym.memberCount > 0 && (
          <span style={styles.memberCountBadge}>👥 {gym.memberCount}</span>
        )}
      </div>

      <div style={styles.cardBody}>
        <div style={styles.cardNameRow}>
          <span style={styles.cardName}>{gym.gymName}</span>
          {gym.gymType && (
            <span style={styles.typeChip}>{t(GYM_TYPE_KEYS[gym.gymType]) || gym.gymType}</span>
          )}
        </div>

        {(gym.city || gym.country) && (
          <div style={styles.cardLocation}>
            📍 {[gym.city, gym.country].filter(Boolean).join(", ")}
          </div>
        )}

        {gym.rating > 0 && (
          <div style={styles.cardRating}>
            <StarDisplay rating={gym.rating} />
            {gym.totalReviews > 0 && (
              <span style={styles.reviewCount}>({gym.totalReviews})</span>
            )}
          </div>
        )}

        {gym.specialties?.length > 0 && (
          <div style={styles.cardStats}>
            {gym.specialties.slice(0, 3).map((sp) => (
              <span key={sp} style={styles.statChip}>{sp}</span>
            ))}
          </div>
        )}

        {vibes.length > 0 && (
          <div style={styles.cardVibeRow}>
            {vibes.slice(0, 3).map((v) => (
              <span key={v} style={styles.cardVibeBadge}>{v}</span>
            ))}
          </div>
        )}

        {gym.description && (
          <p style={styles.cardDesc}>
            {gym.description.length > 90 ? gym.description.slice(0, 90) + "…" : gym.description}
          </p>
        )}

        <button
          type="button"
          style={styles.joinBtn}
          onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}
        >
          {t("gymViewJoin")}
        </button>
      </div>
    </div>
  );
}
