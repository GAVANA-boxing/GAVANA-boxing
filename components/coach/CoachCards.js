"use client";

import { GOLD, PURPLE, goldAlpha } from "@/lib/tokens";
import styles from "@/components/coach/coachStyles";
import Image from "next/image";

function formatTimeAgo(date, locale) {
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (locale === "ko") {
    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    return date.toLocaleDateString();
  }
  if (locale !== "mn") {
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
  if (days === 0) return "Өнөөдөр";
  if (days === 1) return "Өчигдөр";
  if (days < 7) return `${days} өдрийн өмнө`;
  return date.toLocaleDateString();
}

const REQ_STATUS = {
  pending:   { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.35)",  color: "#F59E0B" },
  accepted:  { bg: "rgba(52,211,153,0.1)",  border: "rgba(52,211,153,0.35)",  color: "#34D399" },
  declined:  { bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.35)", color: "#F87171" },
  scheduled: { bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.35)", color: PURPLE },
  completed: { bg: "rgba(96,165,250,0.1)",  border: "rgba(96,165,250,0.35)",  color: "#60A5FA" },
};

function getReqStatusLabel(status, locale) {
  const labels = {
    pending:   { mn: "⏳ Хүлээгдэж байна", ko: "⏳ 대기 중",      en: "⏳ Pending" },
    accepted:  { mn: "✓ Зөвшөөрөгдсөн",   ko: "✓ 수락됨",        en: "✓ Accepted" },
    declined:  { mn: "✕ Татгалзсан",       ko: "✕ 거절됨",        en: "✕ Declined" },
    scheduled: { mn: "📅 Товлогдсон",      ko: "📅 예약됨",       en: "📅 Scheduled" },
    completed: { mn: "✓ Дууссан",          ko: "✓ 완료됨",        en: "✓ Completed" },
  };
  return (labels[status] || labels.pending)[locale] || (labels[status] || labels.pending).en;
}

export function CoachCard({ coach, t, locale, onRequest, requested, router }) {
  const initials = (coach.displayName || coach.username || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div style={styles.avatarWrap}>
          {coach.photoURL ? (
            <Image src={coach.photoURL} alt={coach.displayName || coach.username || "Coach"} width={52} height={52} style={{ borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={styles.avatarInitials}>{initials}</div>
          )}
          {coach.coachVerified && (
            <span style={styles.verifiedDot} title={t("verifiedCoach")}>✓</span>
          )}
        </div>

        <div style={styles.cardInfo}>
          <div style={styles.cardNameRow}>
            <span style={styles.cardName}>
              {coach.displayName || coach.username || "Coach"}
            </span>
            {coach.coachVerified && (
              <span style={styles.verifiedBadge}>{t("verifiedCoach")}</span>
            )}
          </div>
          {coach.coachLocation && (
            <div style={styles.cardLocation}>📍 {coach.coachLocation}</div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            {Number.isFinite(coach.coachRating) && coach.coachRating > 0 && (
              <span style={styles.cardRatingInline}>⭐ {coach.coachRating.toFixed(1)}</span>
            )}
            {Number.isFinite(coach.coachPricePerSession) && coach.coachPricePerSession > 0 && (
              <span style={{ fontSize: 13, fontWeight: 900, color: GOLD }}>
                ${coach.coachPricePerSession}<span style={{ fontSize: 10, color: "#888", fontWeight: 600 }}>/sess</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {coach.coachSpecialties?.length > 0 && (
        <div style={styles.specialtyRow}>
          {coach.coachSpecialties.slice(0, 4).map((sp) => (
            <span key={sp} style={styles.specialtyChip}>{sp}</span>
          ))}
        </div>
      )}

      {coach.coachBio && (
        <p style={styles.cardBio}>
          {coach.coachBio.length > 90 ? coach.coachBio.slice(0, 90) + "…" : coach.coachBio}
        </p>
      )}

      <div style={styles.cardActions}>
        <button
          type="button"
          style={styles.viewProfileBtn}
          onClick={() => router.push(`/${locale}/coach/${coach.id}`)}
        >
          {t("coachProfileBtn")}
        </button>
        <button
          type="button"
          style={requested ? styles.requestedBtn : styles.requestBtn}
          disabled={requested}
          onClick={() => onRequest(coach.id)}
        >
          {requested ? t("requestSent") : t("coachBookSession")}
        </button>
      </div>
    </div>
  );
}

export function MyRequestCard({ req, coachProfile, t, locale, router }) {
  const name = coachProfile?.displayName || coachProfile?.username || "Coach";
  const photo = coachProfile?.photoURL || coachProfile?.profileImageUrl || "";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const st = REQ_STATUS[req.status] || REQ_STATUS.pending;
  const statusLabel = getReqStatusLabel(req.status, locale);
  const timeAgo = req.createdAt?.toDate ? formatTimeAgo(req.createdAt.toDate(), locale) : "";

  return (
    <div style={{ ...styles.card, borderLeft: `2.5px solid ${st.color}`, borderRadius: "3px 18px 18px 3px" }}>
      <div style={styles.cardTop}>
        <div style={styles.avatarWrap}>
          {photo
            ? <Image src={photo} alt={name} width={52} height={52} style={{ borderRadius: "50%", objectFit: "cover" }} />
            : <div style={styles.avatarInitials}>{initials}</div>
          }
        </div>
        <div style={styles.cardInfo}>
          <div style={styles.cardNameRow}>
            <span style={styles.cardName}>{name}</span>
            {req.type === "sparring" && (
              <span style={{ fontSize: 10, fontWeight: 900, color: GOLD, background: `${goldAlpha(0.12)}`, border: `1px solid ${goldAlpha(0.28)}`, borderRadius: 999, padding: "1px 7px" }}>🥊 Sparring</span>
            )}
          </div>
          <span style={{ display: "inline-flex", marginTop: 4, padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 900, background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
            {statusLabel}
          </span>
          {timeAgo && <div style={{ ...styles.cardLocation, marginTop: 4 }}>{timeAgo}</div>}
        </div>
      </div>
      {req.coachId && (
        <button
          type="button"
          style={styles.viewProfileBtn}
          onClick={() => router.push(`/${locale}/coach/${req.coachId}`)}
        >
          {t("coachViewProfile")}
        </button>
      )}
    </div>
  );
}

export function SparringPostCard({ post, t, onRequest, requested, user, router, locale }) {
  return (
    <div style={styles.card}>
      <div style={styles.sparringCardHead}>
        <span style={styles.sparringLevel}>{post.level || "—"}</span>
        {post.weight && <span style={styles.sparringWeight}>{post.weight}</span>}
        {post.location && <span style={styles.sparringLocation}>📍 {post.location}</span>}
      </div>
      {post.availableTime && (
        <div style={styles.sparringTime}>🕐 {post.availableTime}</div>
      )}
      {post.note && <p style={styles.cardBio}>{post.note}</p>}
      <button
        type="button"
        style={requested ? styles.requestedBtn : styles.requestBtn}
        disabled={requested || post.userId === user?.uid}
        onClick={() => {
          if (!user?.uid) { router.push(`/${locale}/login`); return; }
          onRequest(post.id);
        }}
      >
        {post.userId === user?.uid
          ? t("coachYourPost")
          : requested
            ? t("requestSent")
            : t("sendRequest")}
      </button>
    </div>
  );
}
