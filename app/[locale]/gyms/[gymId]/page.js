"use client";

import { useParams, usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import styles from "@/components/gyms/gymIdStyles";
import { useGymData } from "@/hooks/useGymData";
import { useGymActions } from "@/hooks/useGymActions";

import GymLoadingSkeleton from "@/components/gyms/GymLoadingSkeleton";
import GymHero from "@/components/gyms/GymHero";
import GymHeader from "@/components/gyms/GymHeader";
import GymStatsRow from "@/components/gyms/GymStatsRow";
import GymCtaRow from "@/components/gyms/GymCtaRow";
import GymJoinForm from "@/components/gyms/GymJoinForm";
import GymInfoSections from "@/components/gyms/GymInfoSections";
import GymAnnouncementsSection from "@/components/gyms/GymAnnouncementsSection";
import GymMembersSection from "@/components/gyms/GymMembersSection";
import GymReelsSection from "@/components/gyms/GymReelsSection";
import GymReviewsSection from "@/components/gyms/GymReviewsSection";

export default function GymProfilePage() {
  const params = useParams();
  const gymId = params?.gymId;
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const { gym, setGym, reels, reviews, setReviews, announcements, members, loading } = useGymData({ gymId });

  const {
    joinMessage, setJoinMessage,
    joinRequested, pendingJoinRequestId, joinSubmitting, joinError,
    showJoinForm, setShowJoinForm,
    showReviewForm, setShowReviewForm,
    reviewRating, setReviewRating,
    reviewText, setReviewText,
    reviewSubmitting, reviewSuccess, reviewError, alreadyReviewed,
    handleJoinRequest, handleCancelJoinRequest, handleReviewSubmit,
  } = useGymActions({ user, gymId, gym, locale, router, setReviews, t });

  if (loading || authLoading) return <GymLoadingSkeleton />;

  if (!gym) {
    return (
      <div style={styles.page}>
        <div style={styles.content}>
          <button type="button" style={styles.backBtn} onClick={() => router.push(`/${locale}/gyms`)} aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p style={{ color: "rgba(255,255,255,0.62)", textAlign: "center", padding: "60px 0" }}>
            {t("gymIdNotFound")}
          </p>
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="" />
      </div>
    );
  }

  const mapsQuery = [gym.gymName, gym.address, gym.city, gym.country].filter(Boolean).join(", ");
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`;

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const text = locale === "mn"
      ? `${gym.gymName} — GAVANA дээр харах`
      : locale === "ko"
        ? `${gym.gymName} — GAVANA에서 보기`
        : `Check out ${gym.gymName} on GAVANA`;
    try {
      if (navigator.share) {
        await navigator.share({ title: gym.gymName, text, url: shareUrl });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n${shareUrl}`);
      }
    } catch {
      // silent
    }
  };

  const isOwner = user?.uid === gym.ownerId;

  return (
    <div style={styles.page} className="page-enter">
      <div style={styles.content}>
        <button type="button" style={styles.backBtn} onClick={() => router.push(`/${locale}/gyms`)}>← {t("back")}</button>

        <GymHero gym={gym} />

        <GymHeader gym={gym} t={t} />

        <GymStatsRow gym={gym} t={t} />

        <GymCtaRow
          gym={gym}
          isOwner={isOwner}
          pendingJoinRequestId={pendingJoinRequestId}
          joinRequested={joinRequested}
          mapsUrl={mapsUrl}
          locale={locale}
          router={router}
          t={t}
          onJoinClick={() => setShowJoinForm(true)}
          onCancelJoin={handleCancelJoinRequest}
          onShare={handleShare}
        />

        {showJoinForm && (
          <GymJoinForm
            joinMessage={joinMessage}
            onMessageChange={setJoinMessage}
            joinError={joinError}
            joinSubmitting={joinSubmitting}
            onCancel={() => setShowJoinForm(false)}
            onSubmit={handleJoinRequest}
            t={t}
          />
        )}

        <GymInfoSections gym={gym} t={t} />

        <GymAnnouncementsSection announcements={announcements} t={t} />

        <GymMembersSection members={members} t={t} />

        <GymReelsSection
          reels={reels}
          isOwner={isOwner}
          locale={locale}
          router={router}
          t={t}
        />

        <GymReviewsSection
          reviews={reviews}
          user={user}
          alreadyReviewed={alreadyReviewed}
          showReviewForm={showReviewForm}
          reviewRating={reviewRating}
          reviewText={reviewText}
          reviewSubmitting={reviewSubmitting}
          reviewSuccess={reviewSuccess}
          reviewError={reviewError}
          onShowForm={() => setShowReviewForm(true)}
          onHideForm={() => setShowReviewForm(false)}
          onRatingChange={setReviewRating}
          onTextChange={setReviewText}
          onSubmit={handleReviewSubmit}
          t={t}
        />
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="" />
    </div>
  );
}
