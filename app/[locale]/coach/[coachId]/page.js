"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import { getLocaleFromPathname, translate } from "@/lib/i18n";

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange && onChange(n)}
          style={{
            background: "none",
            border: "none",
            fontSize: 24,
            cursor: readonly ? "default" : "pointer",
            color: n <= value ? "#D4AF37" : "rgba(255,255,255,0.2)",
            padding: "2px 1px",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div style={styles.reviewCard}>
      <div style={styles.reviewTop}>
        <StarRating value={review.rating} readonly />
        <span style={styles.reviewDate}>
          {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString() : ""}
        </span>
      </div>
      {review.review && <p style={styles.reviewText}>{review.review}</p>}
    </div>
  );
}

export default function CoachProfilePage() {
  const params = useParams();
  const coachId = params?.coachId;
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [coach, setCoach] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reels, setReels] = useState([]);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // Completed booking eligible for review
  const [eligibleBooking, setEligibleBooking] = useState(null);

  useEffect(() => {
    if (!coachId) return;
    let active = true;

    async function load() {
      try {
        const [coachSnap, reviewsSnap, reelsSnap, bookingsSnap] = await Promise.all([
          getDoc(doc(db, "users", coachId)),
          getDocs(query(collection(db, "coach_reviews"), where("coachId", "==", coachId))),
          getDocs(query(collection(db, "reels"), where("userId", "==", coachId))),
          getDocs(query(collection(db, "coach_bookings"), where("coachId", "==", coachId), where("status", "==", "completed"))),
        ]);
        if (!active) return;

        setCoach(coachSnap.exists() ? { id: coachSnap.id, ...coachSnap.data() } : null);
        setReviews(reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setReels(reelsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCompletedSessions(bookingsSnap.size);
      } catch (e) {
        console.error("Coach profile load error:", e);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [coachId]);

  // Check if current user has a completed booking eligible for review
  useEffect(() => {
    if (!user?.uid || !coachId) return;
    let active = true;

    async function checkEligible() {
      try {
        const [bookingsSnap, existingReviewSnap] = await Promise.all([
          getDocs(query(
            collection(db, "coach_bookings"),
            where("userId", "==", user.uid),
            where("coachId", "==", coachId),
            where("status", "==", "completed")
          )),
          getDocs(query(
            collection(db, "coach_reviews"),
            where("userId", "==", user.uid),
            where("coachId", "==", coachId)
          )),
        ]);
        if (!active) return;

        if (!bookingsSnap.empty && existingReviewSnap.empty) {
          setEligibleBooking(bookingsSnap.docs[0].id);
        }
      } catch { /* silent */ }
    }

    checkEligible();
    return () => { active = false; };
  }, [user?.uid, coachId]);

  const handleRequest = async () => {
    if (!user?.uid) { router.push(`/${locale}/login`); return; }
    setRequesting(true);
    try {
      await addDoc(collection(db, "coach_requests"), {
        coachId,
        userId: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
        message: "",
        locale,
      });
      setRequested(true);
    } catch (e) {
      console.error("Request error:", e);
    } finally {
      setRequesting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user?.uid || !eligibleBooking) return;
    setReviewSubmitting(true);
    setReviewError("");
    try {
      // Double-check no existing review for this booking
      const existing = await getDocs(query(
        collection(db, "coach_reviews"),
        where("bookingId", "==", eligibleBooking),
        where("userId", "==", user.uid)
      ));
      if (!existing.empty) {
        setReviewError(t("coachReviewAlreadyReviewed"));
        setReviewSubmitting(false);
        return;
      }

      await addDoc(collection(db, "coach_reviews"), {
        coachId,
        userId: user.uid,
        bookingId: eligibleBooking,
        rating: reviewRating,
        review: reviewText.trim(),
        createdAt: serverTimestamp(),
      });

      // Recalculate average rating
      const allReviews = await getDocs(query(collection(db, "coach_reviews"), where("coachId", "==", coachId)));
      const ratings = allReviews.docs.map((d) => Number(d.data().rating)).filter(Number.isFinite);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 5;

      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", coachId), {
        coachRating: Number(avg.toFixed(1)),
        coachTotalReviews: ratings.length,
      });

      setReviews((prev) => [{ id: Date.now(), coachId, userId: user.uid, bookingId: eligibleBooking, rating: reviewRating, review: reviewText.trim(), createdAt: null }, ...prev]);
      setReviewSuccess(true);
      setEligibleBooking(null);
      setShowReviewForm(false);
    } catch (e) {
      console.error("Review submit error:", e);
      setReviewError(t("coachReviewError"));
    } finally {
      setReviewSubmitting(false);
    }
  };

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
    <main style={styles.page}>
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
            <img src={coach.photoURL || coach.profileImageUrl} alt="" style={styles.avatar} />
          ) : (
            <div style={styles.avatarInitials}>{initials}</div>
          )}
          {coach.coachVerified && (
            <span style={styles.verifiedDot} title={t("verifiedCoach")}>✓</span>
          )}
        </div>

        {/* Name + verified */}
        <h1 style={styles.name}>{displayName}</h1>
        {coach.coachVerified && (
          <div style={styles.verifiedBadge}>
            <span style={styles.verifiedIcon}>✓</span>
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
            {coach.coachSpecialties.map((s) => (
              <span key={s} style={styles.specialtyChip}>{s}</span>
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

        {/* Social links */}
        {(coach.coachInstagram || coach.coachYoutube) && (
          <div style={styles.socialRow}>
            {coach.coachInstagram && (
              <span style={styles.socialChip}>📸 @{coach.coachInstagram.replace("@", "")}</span>
            )}
            {coach.coachYoutube && (
              <span style={styles.socialChip}>▶ YouTube</span>
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
            <button
              type="button"
              style={requested ? styles.requestedBtn : styles.requestBtn}
              onClick={handleRequest}
              disabled={requested || requesting}
            >
              {requested ? t("requestSent") : requesting ? "..." : t("requestCoach")}
            </button>
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
          <p style={styles.empty}>{t("coachReviewsEmpty")}</p>
        ) : (
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </div>

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
                  <img src={reel.thumbnailUrl} alt="" style={styles.reelThumbImg} />
                ) : (
                  <div style={styles.reelThumbPlaceholder}>▶</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
    </main>
  );
}

const styles = {
  loading: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "system-ui, sans-serif", flexDirection: "column", gap: 12 },
  page: { minHeight: "100vh", background: "#0A0A0A", fontFamily: "system-ui, sans-serif", color: "#fff", paddingBottom: 80 },
  headerBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 8px" },
  backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", padding: 0 },
  headerTitle: { fontSize: 15, fontWeight: 600, color: "#fff" },
  profileSection: { padding: "8px 20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  avatarWrap: { position: "relative", width: 88, height: 88 },
  avatar: { width: 88, height: 88, borderRadius: 44, objectFit: "cover", border: "2px solid rgba(212,175,55,0.4)" },
  avatarInitials: { width: 88, height: 88, borderRadius: 44, background: "rgba(193,18,31,0.2)", border: "2px solid rgba(193,18,31,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 700, color: "#fff" },
  verifiedDot: { position: "absolute", bottom: 2, right: 2, width: 22, height: 22, borderRadius: 11, background: "#D4AF37", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, boxShadow: "0 0 0 2px #0A0A0A" },
  name: { fontSize: 22, fontWeight: 700, margin: 0, textAlign: "center" },
  verifiedBadge: { display: "flex", alignItems: "center", gap: 5, background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.4)", borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600, color: "#D4AF37" },
  verifiedIcon: { fontSize: 11, fontWeight: 700 },
  location: { fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 },
  trustRow: { display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", margin: "4px 0" },
  trustStat: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  trustNum: { fontSize: 17, fontWeight: 700, color: "#fff" },
  trustLbl: { fontSize: 10, color: "rgba(255,255,255,0.62)", textTransform: "uppercase", letterSpacing: 0.5 },
  specialtyRow: { display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" },
  specialtyChip: { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "rgba(255,255,255,0.7)" },
  bio: { fontSize: 14, color: "rgba(255,255,255,0.65)", textAlign: "center", lineHeight: 1.55, maxWidth: 380, margin: 0 },
  cert: { fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 },
  socialRow: { display: "flex", gap: 8 },
  socialChip: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "rgba(255,255,255,0.6)" },
  priceRow: { display: "flex", alignItems: "baseline", gap: 6 },
  price: { fontSize: 22, fontWeight: 700, color: "#D4AF37" },
  priceLbl: { fontSize: 13, color: "rgba(255,255,255,0.62)" },
  ctaRow: { display: "flex", gap: 10, width: "100%", maxWidth: 360, marginTop: 4 },
  requestBtn: { flex: 1, padding: "14px", background: "#C1121F", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" },
  requestedBtn: { flex: 1, padding: "14px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, color: "rgba(255,255,255,0.5)", fontSize: 15, fontWeight: 600, cursor: "default" },
  submitBtn: { flex: 1, padding: "12px", background: "#C1121F", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  submitBtnDisabled: { flex: 1, padding: "12px", background: "rgba(193,18,31,0.4)", border: "none", borderRadius: 10, color: "rgba(255,255,255,0.62)", fontSize: 14, cursor: "not-allowed" },
  cancelBtn: { flex: 1, padding: "12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "rgba(255,255,255,0.6)", fontSize: 14, cursor: "pointer" },
  reviewPrompt: { margin: "0 16px 16px", padding: "14px 16px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" },
  reviewPromptText: { fontSize: 13, color: "#D4AF37", margin: 0 },
  leaveReviewBtn: { background: "#D4AF37", border: "none", borderRadius: 8, padding: "8px 14px", color: "#000", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  reviewFormCard: { margin: "0 16px 16px", padding: "18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, display: "flex", flexDirection: "column", gap: 12 },
  reviewFormTitle: { fontSize: 16, fontWeight: 700, margin: 0, color: "#fff" },
  ratingRow: { display: "flex", alignItems: "center", gap: 12 },
  fieldLabel: { fontSize: 12, color: "rgba(255,255,255,0.65)", textTransform: "uppercase", letterSpacing: 0.5 },
  reviewTextarea: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", width: "100%", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" },
  reviewErr: { color: "#F87171", fontSize: 13, margin: 0 },
  reviewFormActions: { display: "flex", gap: 10 },
  section: { padding: "0 16px 24px" },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 12 },
  empty: { fontSize: 14, color: "rgba(255,255,255,0.55)", textAlign: "center", padding: "20px 0" },
  reviewCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px", marginBottom: 10 },
  reviewTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  reviewDate: { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  reviewText: { fontSize: 14, color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: 1.5 },
  reelsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 },
  reelThumb: { aspectRatio: "9/16", background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 8, cursor: "pointer", overflow: "hidden", padding: 0 },
  reelThumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  reelThumbPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.65)", fontSize: 20 },
};
