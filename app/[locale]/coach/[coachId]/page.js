"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/coach/coachIdStyles";
import { StarRating, ReviewCard } from "@/components/shared/ReviewCard";
import { SPECIALTY_COLORS, getCoachInsight } from "@/lib/coachConstants";
import { useCoachProfileData } from "@/hooks/useCoachProfileData";
import { useCoachProfileActions } from "@/hooks/useCoachProfileActions";
import Image from "next/image";



export default function CoachProfilePage() {
  const params = useParams();
  const coachId = params?.coachId;
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const {
    coach,
    reviews, setReviews,
    reels,
    completedSessions,
    loading,
    requested, setRequested,
    pendingRequestId, setPendingRequestId,
    eligibleBooking, setEligibleBooking,
    programs, setPrograms,
    enrolledIds, setEnrolledIds,
  } = useCoachProfileData({ coachId, user });

  const {
    requesting,
    showReviewForm, setShowReviewForm,
    reviewRating, setReviewRating,
    reviewText, setReviewText,
    reviewSubmitting, reviewSuccess, reviewError,
    enrolling,
    handleRequest, handleCancelCoachRequest, handleReviewSubmit, handleEnroll,
  } = useCoachProfileActions({
    user, router, locale, t, coachId,
    setRequested, setPendingRequestId, pendingRequestId,
    setReviews, setEligibleBooking, eligibleBooking,
    setEnrolledIds, setPrograms, enrolledIds,
  });

  if (authLoading || loading) {
    return <div style={styles.loading}>{t("loading")}</div>;
  }
  if (!coach) {
    return (
      <div style={styles.loading}>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>Coach not found.</p>
      </div>
    );
  }

  const displayName = coach.displayName || coach.username || "Coach";
  const initials = displayName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const avgRating = Number.isFinite(coach.coachRating) ? coach.coachRating : null;
  const totalReviews = Number.isFinite(coach.coachTotalReviews) ? coach.coachTotalReviews : reviews.length;
  const isOwnProfile = user?.uid === coachId;

  return (
    <main style={styles.page} className="page-enter">
      {/* Header */}
      <div style={styles.headerBar}>
        <button type="button" style={styles.backBtn} onClick={() => router.back()}>← {t("back")}</button>
        <span style={styles.headerTitle}>{t("coachProfileTitle")}</span>
        <div style={{ width: 60 }} />
      </div>

      <div style={styles.profileSection}>
        {/* Avatar */}
        <div style={styles.avatarWrap}>
          {coach.photoURL || coach.profileImageUrl ? (
            <Image src={coach.photoURL || coach.profileImageUrl} alt="" width={88} height={88} style={{ borderRadius: 44, objectFit: "cover" }} />
          ) : (
            <div style={styles.avatarInitials}>{initials}</div>
          )}
          {coach.coachVerified && (
            <span style={styles.verifiedDot} title={t("verifiedCoach")}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </div>

        {/* Name + verified */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <h1 style={{ ...styles.name, margin: 0 }}>{displayName}</h1>
          {coach.coachVerified && (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" title={t("verifiedCoach")} aria-label={t("verifiedCoach")}>
              <circle cx="12" cy="12" r="11" fill={GOLD} />
              <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        {coach.coachVerified && (
          <div style={styles.verifiedBadge}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="11" fill={GOLD} />
              <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t("verifiedCoach")}
          </div>
        )}
        {coach.coachLocation && (
          <p style={styles.location}>📍 {coach.coachLocation}</p>
        )}

        {/* Trust stats row */}
        <div style={styles.trustRow}>
          {avgRating !== null && (
            <div style={styles.trustStat}>
              <span style={styles.trustNum}>⭐ {avgRating.toFixed(1)}</span>
              <span style={styles.trustLbl}>{t("coachRating")}</span>
            </div>
          )}
          {totalReviews > 0 && (
            <div style={styles.trustStat}>
              <span style={styles.trustNum}>{totalReviews}</span>
              <span style={styles.trustLbl}>{t("coachTotalReviews")}</span>
            </div>
          )}
          {completedSessions > 0 && (
            <div style={styles.trustStat}>
              <span style={styles.trustNum}>{completedSessions}</span>
              <span style={styles.trustLbl}>{t("coachCompletedSessions")}</span>
            </div>
          )}
          {Number.isFinite(coach.coachExperienceYears) && coach.coachExperienceYears > 0 && (
            <div style={styles.trustStat}>
              <span style={styles.trustNum}>{coach.coachExperienceYears}</span>
              <span style={styles.trustLbl}>{t("coachExperience").replace("{n}", "").trim() || "yrs"}</span>
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
                  style={spColor ? {
                    ...styles.specialtyChip,
                    color: spColor,
                    background: `${spColor}14`,
                    border: `1px solid ${spColor}44`,
                  } : styles.specialtyChip}
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
              <span key={v} style={styles.vibeChip}>{v}</span>
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
        {(() => {
          const { bestFor, improves } = getCoachInsight(coach);
          if (!bestFor && !improves.length) return null;
          return (
            <>
              {bestFor && (
                <div style={styles.insightCard}>
                  <span style={styles.insightLabel}>{t("coachBestFor")}</span>
                  <span style={styles.insightText}>{bestFor[locale] || bestFor.en}</span>
                </div>
              )}
              {improves.length > 0 && (
                <div style={styles.insightCard}>
                  <span style={styles.insightLabel}>{t("coachWillImprove")}</span>
                  <div style={styles.improveList}>
                    {improves.map((imp) => (
                      <span key={imp} style={styles.improveChip}>✓ {imp}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}

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
                href={coach.coachYoutube.startsWith("http") ? coach.coachYoutube : `https://youtube.com/@${coach.coachYoutube.replace("@", "")}`}
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
            <span style={styles.priceLbl}>{t("coachPrice")}</span>
          </div>
        )}

        {/* CTA buttons */}
        {!isOwnProfile && (
          <div style={styles.ctaRow}>
            {pendingRequestId ? (
              <div style={styles.pendingRow}>
                <span style={styles.pendingBadge}>⏳ {t("requestPendingLabel")}</span>
                <button type="button" style={styles.cancelReqBtn} onClick={handleCancelCoachRequest}>
                  {t("cancelRequest")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                style={requesting ? styles.requestedBtn : styles.requestBtn}
                onClick={handleRequest}
                disabled={requesting}
              >
                {requesting ? "..." : t("requestCoach")}
              </button>
            )}
          </div>
        )}
        {isOwnProfile && (
          <div style={styles.ctaRow}>
            <button type="button" style={styles.requestBtn} onClick={() => router.push(`/${locale}/coach/dashboard`)}>
              {t("coachDashboard")}
            </button>
          </div>
        )}
      </div>

      {/* Leave a review prompt */}
      {eligibleBooking && !reviewSuccess && (
        <div style={styles.reviewPrompt}>
          <p style={styles.reviewPromptText}>{t("coachReviewSessionCompleted")}</p>
          <button type="button" style={styles.leaveReviewBtn} onClick={() => setShowReviewForm(true)}>
            {t("leaveReview")}
          </button>
        </div>
      )}
      {reviewSuccess && (
        <div style={{ ...styles.reviewPrompt, borderColor: "rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.08)" }}>
          <p style={{ ...styles.reviewPromptText, color: "#34D399" }}>✓ {t("coachReviewSuccess")}</p>
        </div>
      )}

      {/* Review form */}
      {showReviewForm && (
        <div style={styles.reviewFormCard}>
          <h3 style={styles.reviewFormTitle}>{t("leaveReview")}</h3>
          <div style={styles.ratingRow}>
            <span style={styles.fieldLabel}>{t("coachReviewRating")}</span>
            <StarRating value={reviewRating} onChange={setReviewRating} />
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder={t("coachReviewPlaceholder")}
            style={styles.reviewTextarea}
            rows={3}
          />
          {reviewError && <p style={styles.reviewErr}>{reviewError}</p>}
          <div style={styles.reviewFormActions}>
            <button type="button" style={styles.cancelBtn} onClick={() => setShowReviewForm(false)}>{t("cancel")}</button>
            <button
              type="button"
              style={reviewSubmitting ? styles.submitBtnDisabled : styles.submitBtn}
              onClick={handleReviewSubmit}
              disabled={reviewSubmitting}
            >
              {reviewSubmitting ? t("coachReviewSubmitting") : t("coachReviewSubmit")}
            </button>
          </div>
        </div>
      )}

      {/* Reviews section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>{t("coachReviews")}</h2>
        {reviews.length === 0 ? (
          <div style={{ borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)" }}>
            <EmptyState emoji="⭐" title={t("coachReviewsEmpty")} hint={t("coachIdReviewsEmpty")} padding="28px 16px" />
          </div>
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} styles={styles} />)
        )}
      </div>

      {/* Training Programs section */}
      {programs.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            📋 {t("coachIdTrainingPrograms")}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {programs.map((prog) => {
              const enrolled = enrolledIds.has(prog.id);
              const isBusy = enrolling === prog.id;
              const LEVEL_COLOR = { beginner: "#34D399", intermediate: GOLD, advanced: RED };
              const levelColor = LEVEL_COLOR[prog.level] || "#888";
              return (
                <div key={prog.id} style={{
                  background: "linear-gradient(145deg, #111012, #0a0a0a)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderLeft: `2.5px solid ${levelColor}`,
                  borderRadius: "3px 14px 14px 3px",
                  padding: "14px 14px 12px",
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{prog.title}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: prog.description ? 6 : 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: levelColor, background: `${levelColor}15`, border: `1px solid ${levelColor}44`, borderRadius: 999, padding: "2px 8px" }}>
                          {prog.level ? prog.level.charAt(0).toUpperCase() + prog.level.slice(1) : ""}
                        </span>
                        {prog.duration && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#888", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "2px 8px" }}>
                            📅 {prog.duration} {t("coachIdDaysUnit")}
                          </span>
                        )}
                        {prog.enrolledCount > 0 && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#888", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "2px 8px" }}>
                            👥 {prog.enrolledCount}
                          </span>
                        )}
                      </div>
                      {prog.description && (
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                          {prog.description.slice(0, 100)}{prog.description.length > 100 ? "…" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  {!isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => handleEnroll(prog)}
                      disabled={isBusy}
                      style={{
                        padding: "9px 0", borderRadius: 10, border: enrolled ? `1px solid ${levelColor}44` : "none",
                        background: enrolled ? `${levelColor}12` : `linear-gradient(135deg, ${levelColor}, ${levelColor}bb)`,
                        color: enrolled ? levelColor : "#fff",
                        fontSize: 12, fontWeight: 900, cursor: isBusy ? "wait" : "pointer",
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      {isBusy ? "…" : enrolled
                        ? t("coachIdEnrolled")
                        : t("coachIdFollowProgram")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reels section */}
      {reels.length > 0 && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>{t("reels")}</h2>
          <div style={styles.reelsGrid}>
            {reels.slice(0, 6).map((reel) => (
              <button
                key={reel.id}
                type="button"
                style={styles.reelThumb}
                onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}
              >
                {reel.thumbnailUrl ? (
                  <div style={{ position: "relative", width: "100%", height: "100%" }}>
                    <Image src={reel.thumbnailUrl} alt="" fill style={{ objectFit: "cover" }} />
                  </div>
                ) : (
                  <div style={styles.reelThumbPlaceholder}>▶</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </main>
  );
}

