"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import styles from "@/components/coach/coachIdStyles";
import { useCoachProfileData } from "@/hooks/useCoachProfileData";
import { useCoachProfileActions } from "@/hooks/useCoachProfileActions";

import CoachProfileHeader from "@/components/coach/CoachProfileHeader";
import CoachReviewPrompt from "@/components/coach/CoachReviewPrompt";
import CoachReviewForm from "@/components/coach/CoachReviewForm";
import CoachReviewsSection from "@/components/coach/CoachReviewsSection";
import CoachProgramsSection from "@/components/coach/CoachProgramsSection";
import CoachReelsSection from "@/components/coach/CoachReelsSection";

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
        <p style={{ color: "rgba(255,255,255,0.5)" }}>{t("coachNotFound")}</p>
      </div>
    );
  }

  const avgRating = Number.isFinite(coach.coachRating) ? coach.coachRating : null;
  const totalReviews = Number.isFinite(coach.coachTotalReviews) ? coach.coachTotalReviews : reviews.length;
  const isOwnProfile = user?.uid === coachId;

  return (
    <main style={styles.page} className="page-enter">
      <CoachProfileHeader
        coach={coach}
        locale={locale}
        isOwnProfile={isOwnProfile}
        pendingRequestId={pendingRequestId}
        requesting={requesting}
        completedSessions={completedSessions}
        avgRating={avgRating}
        totalReviews={totalReviews}
        onBack={() => router.back()}
        onRequest={handleRequest}
        onCancelRequest={handleCancelCoachRequest}
        onDashboard={() => router.push(`/${locale}/coach/dashboard`)}
      />

      <CoachReviewPrompt
        locale={locale}
        eligibleBooking={eligibleBooking}
        reviewSuccess={reviewSuccess}
        onLeaveReview={() => setShowReviewForm(true)}
      />

      {showReviewForm && (
        <CoachReviewForm
          locale={locale}
          reviewRating={reviewRating}
          reviewText={reviewText}
          reviewError={reviewError}
          reviewSubmitting={reviewSubmitting}
          onRatingChange={setReviewRating}
          onTextChange={setReviewText}
          onCancel={() => setShowReviewForm(false)}
          onSubmit={handleReviewSubmit}
        />
      )}

      <CoachReviewsSection locale={locale} reviews={reviews} />

      <CoachProgramsSection
        locale={locale}
        programs={programs}
        enrolledIds={enrolledIds}
        enrolling={enrolling}
        isOwnProfile={isOwnProfile}
        onEnroll={handleEnroll}
      />

      <CoachReelsSection
        locale={locale}
        reels={reels}
        onReelClick={(reelId) => router.push(`/${locale}/reels?reelId=${reelId}`)}
      />

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </main>
  );
}
