"use client";

import Image from "next/image";
import EmptyState from "@/components/EmptyState";
import { RED, RED_DARK, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/gyms/gymsStyles";
import { GYM_TYPE_KEYS } from "@/lib/gymConstants";

const GYM_STATUS_CONFIG = {
  pending:  { color: "#F59E0B", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.35)" },
  approved: { color: "#34D399", bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.35)" },
  declined: { color: "#F87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.35)" },
};

function OwnedGymCard({ ownedGym, locale, router, t }) {
  return (
    <div
      style={{ ...styles.card, borderLeft: "2.5px solid #F5C451", borderRadius: "3px 16px 16px 3px", cursor: "pointer" }}
      onClick={() => router.push(`/${locale}/gyms/${ownedGym.id}`)}
    >
      <div style={styles.cardImageWrap}>
        {ownedGym.logo ? (
          <Image src={ownedGym.logo} alt="" width={64} height={64} style={{ objectFit: "cover", borderRadius: 14 }} />
        ) : (
          <div style={styles.cardLogoFallback}><span style={{ fontSize: 28 }}>🥊</span></div>
        )}
        <span style={{ position: "absolute", bottom: 8, right: 10, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 900, background: goldAlpha(0.15), border: `1px solid ${goldAlpha(0.5)}`, color: GOLD }}>
          {t("gymOwnerLabel")}
        </span>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardNameRow}>
          <span style={styles.cardName}>{ownedGym.gymName}</span>
          {ownedGym.verified && <span style={styles.verifiedBadge}>✓</span>}
        </div>
        {(ownedGym.city || ownedGym.country) && (
          <div style={styles.cardLocation}>
            📍 {[ownedGym.city, ownedGym.country].filter(Boolean).join(", ")}
          </div>
        )}
        {ownedGym.gymType && (
          <span style={styles.typeChip}>{t(GYM_TYPE_KEYS[ownedGym.gymType]) || ownedGym.gymType}</span>
        )}
        <button
          type="button"
          style={{ marginTop: 10, padding: "8px 16px", borderRadius: 10, border: `1px solid ${goldAlpha(0.4)}`, background: goldAlpha(0.1), color: GOLD, fontSize: 12, fontWeight: 900, cursor: "pointer" }}
          onClick={(e) => { e.stopPropagation(); router.push(`/${locale}/gyms/dashboard`); }}
        >
          {t("gymManageBtn")}
        </button>
      </div>
    </div>
  );
}

function MembershipCard({ mem, locale, router, t }) {
  const gym = mem.gym;
  const cfg = GYM_STATUS_CONFIG[mem.status] || GYM_STATUS_CONFIG.pending;
  const statusLabel = t(`gymStatus${mem.status.charAt(0).toUpperCase() + mem.status.slice(1)}`);
  if (!gym) return null;
  return (
    <div
      key={mem.id}
      style={{ ...styles.card, borderLeft: `2.5px solid ${cfg.color}`, borderRadius: "3px 16px 16px 3px", cursor: "pointer" }}
      onClick={() => router.push(`/${locale}/gyms/${gym.id}`)}
    >
      <div style={styles.cardImageWrap}>
        {gym.logo ? (
          <Image src={gym.logo} alt="" width={64} height={64} style={{ objectFit: "cover", borderRadius: 14 }} />
        ) : (
          <div style={styles.cardLogoFallback}><span style={{ fontSize: 28 }}>🥊</span></div>
        )}
        <span style={{ position: "absolute", bottom: 8, right: 10, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 900, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
          {statusLabel}
        </span>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardNameRow}>
          <span style={styles.cardName}>{gym.gymName}</span>
          {gym.verified && <span style={styles.verifiedBadge}>✓</span>}
        </div>
        {(gym.city || gym.country) && (
          <div style={styles.cardLocation}>
            📍 {[gym.city, gym.country].filter(Boolean).join(", ")}
          </div>
        )}
        {gym.gymType && (
          <span style={styles.typeChip}>{t(GYM_TYPE_KEYS[gym.gymType]) || gym.gymType}</span>
        )}
      </div>
    </div>
  );
}

export function GymsMyTab({
  user,
  myMemberships,
  myMembershipsLoading,
  ownedGym,
  locale,
  router,
  onSwitchToAll,
  t,
}) {
  return (
    <>
      <div style={{ ...styles.header, paddingTop: 20 }}>
        <p style={styles.kicker}>COMBAT · GYMS</p>
        <h1 style={styles.title}>{t("gymMyTitle")}</h1>
      </div>

      {!user?.uid ? (
        <EmptyState
          emoji="🔒"
          title={t("gymLoginRequired")}
          action={
            <button
              type="button"
              onClick={() => router.push(`/${locale}/login`)}
              style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}
            >
              {t("gymLoginBtn")}
            </button>
          }
        />
      ) : myMembershipsLoading ? (
        <div style={styles.skeletonList}>
          {[0, 1].map((i) => <div key={i} style={styles.skeletonCard} className="sk-pulse" />)}
        </div>
      ) : myMemberships.length === 0 && !ownedGym ? (
        <EmptyState
          emoji="🏋️"
          title={t("gymNotMember")}
          hint={t("gymJoinHint")}
          action={
            <button
              type="button"
              onClick={onSwitchToAll}
              style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", marginTop: 4, boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}
            >
              {t("gymFindBtn")}
            </button>
          }
        />
      ) : (
        <div style={styles.cardList}>
          {ownedGym && (
            <OwnedGymCard ownedGym={ownedGym} locale={locale} router={router} t={t} />
          )}
          {myMemberships.map((mem) => (
            <MembershipCard key={mem.id} mem={mem} locale={locale} router={router} t={t} />
          ))}
        </div>
      )}
    </>
  );
}
