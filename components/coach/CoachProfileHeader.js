"use client";

import Image from "next/image";
import { GOLD } from "@/lib/tokens";
import styles from "@/components/coach/coachIdStyles";
import { SPECIALTY_COLORS, getCoachInsight } from "@/lib/coachConstants";

const STRINGS = {
  mn: {
    back: "Буцах",
    coachProfileTitle: "Дасгалжуулагчийн профайл",
    verifiedCoach: "Баталгаажсан дасгалжуулагч",
    coachRating: "Үнэлгээ",
    coachTotalReviews: "Сэтгэгдэл",
    coachCompletedSessions: "Дууссан хичээл",
    coachExperience: "жил",
    coachPrice: "/ хичээл",
    requestCoach: "Хүсэлт илгээх",
    cancelRequest: "Хүсэлт цуцлах",
    requestPendingLabel: "Хүсэлт хүлээгдэж байна",
    coachDashboard: "Дашбоард",
  },
  en: {
    back: "Back",
    coachProfileTitle: "Coach Profile",
    verifiedCoach: "Verified Coach",
    coachRating: "Rating",
    coachTotalReviews: "Reviews",
    coachCompletedSessions: "Sessions",
    coachExperience: "yrs",
    coachPrice: "/ session",
    requestCoach: "Request Coach",
    cancelRequest: "Cancel Request",
    requestPendingLabel: "Request Pending",
    coachDashboard: "Dashboard",
  },
};

function t(locale, key) {
  return (STRINGS[locale] || STRINGS.en)[key] ?? key;
}

export default function CoachProfileHeader({
  coach,
  locale,
  isOwnProfile,
  pendingRequestId,
  requesting,
  completedSessions,
  avgRating,
  totalReviews,
  onBack,
  onRequest,
  onCancelRequest,
  onDashboard,
}) {
  const displayName = coach.displayName || coach.username || "Coach";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const { bestFor, improves } = getCoachInsight(coach);

  return (
    <>
      {/* Header bar */}
      <div style={styles.headerBar}>
        <button type="button" style={styles.backBtn} onClick={onBack}>
          ← {t(locale, "back")}
        </button>
        <span style={styles.headerTitle}>{t(locale, "coachProfileTitle")}</span>
        <div style={{ width: 60 }} />
      </div>

      <div style={styles.profileSection}>
        {/* Avatar */}
        <div style={styles.avatarWrap}>
          {coach.photoURL || coach.profileImageUrl ? (
            <Image
              src={coach.photoURL || coach.profileImageUrl}
              alt=""
              width={88}
              height={88}
              style={{ borderRadius: 44, objectFit: "cover" }}
            />
          ) : (
            <div style={styles.avatarInitials}>{initials}</div>
          )}
          {coach.coachVerified && (
            <span style={styles.verifiedDot} title={t(locale, "verifiedCoach")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M20 6L9 17l-5-5"
                  stroke="#000"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          )}
        </div>

        {/* Name + inline verified icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <h1 style={{ ...styles.name, margin: 0 }}>{displayName}</h1>
          {coach.coachVerified && (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              title={t(locale, "verifiedCoach")}
              aria-label={t(locale, "verifiedCoach")}
            >
              <circle cx="12" cy="12" r="11" fill={GOLD} />
              <path
                d="M7 12.5l3.5 3.5 6.5-7"
                stroke="#000"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        {/* Verified badge */}
        {coach.coachVerified && (
          <div style={styles.verifiedBadge}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="11" fill={GOLD} />
              <path
                d="M7 12.5l3.5 3.5 6.5-7"
                stroke="#000"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t(locale, "verifiedCoach")}
          </div>
        )}

        {/* Location */}
        {coach.coachLocation && (
          <p style={styles.location}>📍 {coach.coachLocation}</p>
        )}

        {/* Trust stats */}
        <div style={styles.trustRow}>
          {avgRating !== null && (
            <div style={styles.trustStat}>
              <span style={styles.trustNum}>⭐ {avgRating.toFixed(1)}</span>
              <span style={styles.trustLbl}>{t(locale, "coachRating")}</span>
            </div>
          )}
          {totalReviews > 0 && (
            <div style={styles.trustStat}>
              <span style={styles.trustNum}>{totalReviews}</span>
              <span style={styles.trustLbl}>{t(locale, "coachTotalReviews")}</span>
            </div>
          )}
          {completedSessions > 0 && (
            <div style={styles.trustStat}>
              <span style={styles.trustNum}>{completedSessions}</span>
              <span style={styles.trustLbl}>{t(locale, "coachCompletedSessions")}</span>
            </div>
          )}
          {Number.isFinite(coach.coachExperienceYears) && coach.coachExperienceYears > 0 && (
            <div style={styles.trustStat}>
              <span style={styles.trustNum}>{coach.coachExperienceYears}</span>
              <span style={styles.trustLbl}>
                {t(locale, "coachExperience").replace("{n}", "").trim() || "yrs"}
              </span>
            </div>
          )}
        </div>

        {/* Specialties */}
        {coach.coachSpecialties?.length > 0 && (
          <div style={styles.specialtyRow}>
            {coach.coachSpecialties.map((sp) => {
              const spColor = SPECIALTY_COLORS[sp] || null;
              return (
                <span
                  key={sp}
                  style={
                    spColor
                      ? {
                          ...styles.specialtyChip,
                          color: spColor,
                          background: `${spColor}14`,
                          border: `1px solid ${spColor}44`,
                        }
                      : styles.specialtyChip
                  }
                >
                  {sp}
                </span>
              );
            })}
          </div>
        )}

        {/* Vibe tags */}
        {coach.coachVibes?.length > 0 && (
          <div style={styles.specialtyRow}>
            {coach.coachVibes.map((v) => (
              <span key={v} style={styles.vibeChip}>
                {v}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        {(coach.coachBio || coach.bio) && (
          <p style={styles.bio}>{coach.coachBio || coach.bio}</p>
        )}

        {/* Certifications */}
        {coach.coachCertifications && (
          <p style={styles.cert}>🏅 {coach.coachCertifications}</p>
        )}

        {/* Best for + What you'll improve */}
        {(bestFor || improves.length > 0) && (
          <>
            {bestFor && (
              <div style={styles.insightCard}>
                <span style={styles.insightLabel}>{t(locale, "coachBestFor") || "Best for"}</span>
                <span style={styles.insightText}>{bestFor[locale] || bestFor.en}</span>
              </div>
            )}
            {improves.length > 0 && (
              <div style={styles.insightCard}>
                <span style={styles.insightLabel}>
                  {t(locale, "coachWillImprove") || "You'll improve"}
                </span>
                <div style={styles.improveList}>
                  {improves.map((imp) => (
                    <span key={imp} style={styles.improveChip}>
                      ✓ {imp}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Social links */}
        {(coach.coachInstagram || coach.coachYoutube || coach.coachPhone) && (
          <div style={styles.socialRow}>
            {coach.coachInstagram && (
              <a
                href={`https://instagram.com/${coach.coachInstagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.socialLink}
              >
                📸 @{coach.coachInstagram.replace("@", "")}
              </a>
            )}
            {coach.coachYoutube && (
              <a
                href={
                  coach.coachYoutube.startsWith("http")
                    ? coach.coachYoutube
                    : `https://youtube.com/@${coach.coachYoutube.replace("@", "")}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={styles.socialLink}
              >
                ▶ YouTube
              </a>
            )}
            {coach.coachPhone && (
              <a href={`tel:${coach.coachPhone}`} style={styles.socialLink}>
                📞 {coach.coachPhone}
              </a>
            )}
          </div>
        )}

        {/* Price */}
        {Number.isFinite(coach.coachPricePerSession) && (
          <div style={styles.priceRow}>
            <span style={styles.price}>${coach.coachPricePerSession}</span>
            <span style={styles.priceLbl}>{t(locale, "coachPrice")}</span>
          </div>
        )}

        {/* CTA buttons */}
        {!isOwnProfile && (
          <div style={styles.ctaRow}>
            {pendingRequestId ? (
              <div style={styles.pendingRow}>
                <span style={styles.pendingBadge}>
                  ⏳ {t(locale, "requestPendingLabel")}
                </span>
                <button
                  type="button"
                  style={styles.cancelReqBtn}
                  onClick={onCancelRequest}
                >
                  {t(locale, "cancelRequest")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                style={requesting ? styles.requestedBtn : styles.requestBtn}
                onClick={onRequest}
                disabled={requesting}
              >
                {requesting ? "..." : t(locale, "requestCoach")}
              </button>
            )}
          </div>
        )}
        {isOwnProfile && (
          <div style={styles.ctaRow}>
            <button type="button" style={styles.requestBtn} onClick={onDashboard}>
              {t(locale, "coachDashboard")}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
