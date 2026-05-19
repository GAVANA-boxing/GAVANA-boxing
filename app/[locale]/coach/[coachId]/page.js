"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, increment, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, GOLD, PURPLE, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/coach/coachIdStyles";
import { snapToDocs } from "@/lib/firestore";

const SPECIALTY_COLORS = {
  Amateur:      "#34D399",
  Pro:          RED,
  Sparring:     "#FB923C",
  Defense:      "#60A5FA",
  Counter:      "#60A5FA",
  Footwork:     PURPLE,
  "Pad work":   "#F59E0B",
  Conditioning: "#34D399",
  Beginners:    "#34D399",
  Pressure:     "#F87171",
};

const BEST_FOR_MAP = {
  Footwork: { en: "Fighters wanting better ring movement & pivots", mn: "Хөдөлгөөн, хөлийн ажлаа сайжруулахыг хүсэгчид", ko: "이동 동작을 향상시키려는 선수" },
  Pressure: { en: "Brawlers building aggressive pressure fighting", mn: "Дайралтын арга барилаа хөгжүүлэхийг хүсэгчид", ko: "압박 파이팅을 구사하려는 선수" },
  Counter: { en: "Defensive fighters learning counter-punching", mn: "Тохой үхэлт тоглогч болохыг хүсэгчид", ko: "카운터펀치를 익히려는 수비 지향 선수" },
  Beginners: { en: "First-time boxers — all levels welcome", mn: "Анх удаа боксыг эзэмшигчид", ko: "처음 복싱을 시작하는 입문자" },
  Sparring: { en: "Fighters ready to test themselves in the ring", mn: "Рингд сорилоо туршихад бэлэн тамирчид", ko: "실전 훈련을 하고 싶은 선수" },
  Conditioning: { en: "Athletes improving fitness and endurance", mn: "Бие бялдараа сайжруулахыг хүсэгчид", ko: "체력과 지구력을 강화하려는 운동선수" },
  Defense: { en: "Fighters wanting a tighter guard and better slipping", mn: "Хамгаалалтаа бат бэх болгохыг хүсэгчид", ko: "가드와 슬리핑을 개선하고 싶은 선수" },
  "Pad work": { en: "Anyone wanting sharper, faster hands", mn: "Гарын хурд, нарийвчлалаа дээшлүүлэхийг хүсэгчид", ko: "더 빠르고 정확한 손기술을 원하는 선수" },
  Amateur: { en: "Competitors training for amateur fights", mn: "Аматур тэмцээнд бэлтгэж буй тамирчид", ko: "아마추어 대회를 준비하는 선수" },
  Pro: { en: "Professional-level fighters and competitors", mn: "Мэргэжлийн түвшний тамирчид", ko: "프로 레벨의 파이터" },
};

const IMPROVE_MAP = {
  Footwork: ["Footwork & Pivots", "Ring positioning", "Defensive movement"],
  Pressure: ["Forward pressure", "Body work", "Cutting off the ring"],
  Counter: ["Timing & counters", "Head movement", "Defensive IQ"],
  Beginners: ["Basic stance & guard", "Punching mechanics", "Confidence"],
  Sparring: ["Timing & reaction", "Ring generalship", "Composure"],
  Conditioning: ["Endurance", "Core strength", "Recovery speed"],
  Defense: ["Slipping & rolling", "Guard stability", "Block mechanics"],
  "Pad work": ["Hand speed", "Combination flow", "Accuracy"],
  Amateur: ["Fight IQ", "Scoring punches", "Amateur tactics"],
  Pro: ["Advanced tactics", "Mental game", "Peak conditioning"],
};

function getCoachInsight(coach) {
  const specs = coach.coachSpecialties || [];
  const first = specs[0];
  const bestFor = first ? BEST_FOR_MAP[first] : null;
  const improves = specs
    .flatMap((s) => IMPROVE_MAP[s] || [])
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4);
  return { bestFor, improves };
}

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
            color: n <= value ? GOLD : "rgba(255,255,255,0.2)",
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
  const [pendingRequestId, setPendingRequestId] = useState(null);
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

  // Training programs
  const [programs, setPrograms] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState(new Set()); // programIds user is enrolled in
  const [enrolling, setEnrolling] = useState(null); // programId being toggled

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
        setReviews(snapToDocs(reviewsSnap));
        setReels(snapToDocs(reelsSnap));
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
        const [bookingsSnap, existingReviewSnap, pendingReqSnap] = await Promise.all([
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
          getDocs(query(
            collection(db, "coach_requests"),
            where("userId", "==", user.uid),
            where("coachId", "==", coachId),
            where("status", "==", "pending")
          )),
        ]);
        if (!active) return;

        if (!bookingsSnap.empty && existingReviewSnap.empty) {
          setEligibleBooking(bookingsSnap.docs[0].id);
        }
        if (!pendingReqSnap.empty) {
          setRequested(true);
          setPendingRequestId(pendingReqSnap.docs[0].id);
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
      const reqDoc = await addDoc(collection(db, "coach_requests"), {
        coachId,
        userId: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
        message: "",
        locale,
      });
      setRequested(true);
      setPendingRequestId(reqDoc.id);
      // Notify the coach
      await addDoc(collection(db, "notifications"), {
        recipientId: coachId,
        actorId: user.uid,
        actorName: user.displayName || "Someone",
        fromUserId: user.uid,
        fromUsername: user.displayName || "Someone",
        fromUserPhotoURL: user.photoURL || "",
        type: "coach_request",
        message: t("notifCoachRequest").replace("{actor}", user.displayName || "Someone"),
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Request error:", e);
    } finally {
      setRequesting(false);
    }
  };

  const handleCancelCoachRequest = async () => {
    if (!pendingRequestId) return;
    try {
      await deleteDoc(doc(db, "coach_requests", pendingRequestId));
      setRequested(false);
      setPendingRequestId(null);
    } catch (e) {
      console.error("Cancel request error:", e);
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

  // Load training programs for this coach + own enrollments
  useEffect(() => {
    if (!coachId) return;
    let active = true;
    async function loadPrograms() {
      try {
        const snap = await getDocs(query(collection(db, "training_programs"), where("coachId", "==", coachId)));
        if (!active) return;
        setPrograms(snapToDocs(snap).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      } catch { if (active) setPrograms([]); }
    }
    loadPrograms();
    return () => { active = false; };
  }, [coachId]);

  useEffect(() => {
    if (!user?.uid) { setEnrolledIds(new Set()); return; }
    let active = true;
    async function loadEnrollments() {
      try {
        const snap = await getDocs(query(collection(db, "program_enrollments"), where("userId", "==", user.uid)));
        if (!active) return;
        setEnrolledIds(new Set(snap.docs.map((d) => d.data().programId)));
      } catch { if (active) setEnrolledIds(new Set()); }
    }
    loadEnrollments();
    return () => { active = false; };
  }, [user?.uid]);

  const handleEnroll = async (program) => {
    if (!user) { router.push(`/${locale}/login`); return; }
    if (enrolling) return;
    setEnrolling(program.id);
    const alreadyEnrolled = enrolledIds.has(program.id);
    try {
      if (alreadyEnrolled) {
        const snap = await getDocs(query(collection(db, "program_enrollments"), where("userId", "==", user.uid), where("programId", "==", program.id)));
        await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        await updateDoc(doc(db, "training_programs", program.id), { enrolledCount: increment(-1) }).catch(() => {});
        setEnrolledIds((prev) => { const next = new Set(prev); next.delete(program.id); return next; });
        setPrograms((prev) => prev.map((p) => p.id === program.id ? { ...p, enrolledCount: Math.max(0, (p.enrolledCount || 1) - 1) } : p));
      } else {
        await addDoc(collection(db, "program_enrollments"), {
          userId: user.uid,
          programId: program.id,
          coachId: program.coachId,
          enrolledAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "training_programs", program.id), { enrolledCount: increment(1) }).catch(() => {});
        setEnrolledIds((prev) => new Set([...prev, program.id]));
        setPrograms((prev) => prev.map((p) => p.id === program.id ? { ...p, enrolledCount: (p.enrolledCount || 0) + 1 } : p));
      }
    } catch (e) {
      console.error("Enroll error:", e);
    } finally {
      setEnrolling(null);
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
          reviews.map((r) => <ReviewCard key={r.id} review={r} />)
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
                  <img src={reel.thumbnailUrl} alt="" style={styles.reelThumbImg} />
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

