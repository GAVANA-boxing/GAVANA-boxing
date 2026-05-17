"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  increment,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";

const GYM_TYPE_KEYS = {
  Boxing: "gymTypeBoxing",
  MMA: "gymTypeMMA",
  "Muay Thai": "gymTypeMuayThai",
  Fitness: "gymTypeFitness",
  Crossfit: "gymTypeCrossfit",
  "Street Workout": "gymTypeStreetWorkout",
  Powerlifting: "gymTypePowerlifting",
  "Running Club": "gymTypeRunningClub",
};

function getGymVibes(gym) {
  if (gym.vibes?.length) return gym.vibes;
  const v = [];
  if (gym.gymType === "Boxing") { v.push("Technical", "Sparring"); }
  else if (gym.gymType === "MMA") { v.push("Hard training", "Competitive"); }
  else if (gym.gymType === "Muay Thai") { v.push("Traditional", "Technical"); }
  else if (gym.gymType === "Fitness") { v.push("Beginner-Friendly", "Conditioning"); }
  else if (gym.gymType === "Crossfit") { v.push("High intensity", "Conditioning"); }
  return v;
}

function getGymGoodFor(gym) {
  const map = {
    Boxing: ["Fighters", "Sparring", "Technical work"],
    MMA: ["Mixed fighting", "Strike defense", "Grappling"],
    "Muay Thai": ["Kicks & knees", "Clinch work", "Traditional training"],
    Fitness: ["Weight loss", "Cardio", "General fitness"],
    Crossfit: ["Strength", "Conditioning", "Athletic performance"],
    "Street Workout": ["Calisthenics", "Outdoor training", "Body control"],
    Powerlifting: ["Max strength", "Barbell training", "Power sports"],
    "Running Club": ["Endurance", "Cardio", "Community running"],
  };
  return map[gym.gymType] || gym.specialties?.slice(0, 3) || [];
}

function StarRating({ value, onChange, readonly = false }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !readonly && onChange?.(n)}
          style={{
            background: "none",
            border: "none",
            fontSize: 22,
            cursor: readonly ? "default" : "pointer",
            color: n <= value ? "#D4AF37" : "rgba(255,255,255,0.2)",
            padding: "1px",
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

function ReelThumb({ reel, router, locale }) {
  return (
    <div
      style={styles.reelThumb}
      onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}
    >
      {reel.thumbnailUrl ? (
        <img src={reel.thumbnailUrl} alt="" style={styles.reelThumbImg} />
      ) : (
        <div style={styles.reelThumbPlaceholder}>🥊</div>
      )}
    </div>
  );
}

export default function GymProfilePage() {
  const params = useParams();
  const gymId = params?.gymId;
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [gym, setGym] = useState(null);
  const [reels, setReels] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Join request
  const [joinMessage, setJoinMessage] = useState("");
  const [joinRequested, setJoinRequested] = useState(false);
  const [pendingJoinRequestId, setPendingJoinRequestId] = useState(null);
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);

  // Members
  const [members, setMembers] = useState([]);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    if (!gymId) return;
    let active = true;
    async function load() {
      try {
        const byTs = (a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
        const [gymSnap, reelsSnap, reviewsSnap, announcementsSnap] = await Promise.all([
          getDoc(doc(db, "gyms", gymId)),
          getDocs(query(collection(db, "reels"), where("gymId", "==", gymId))),
          getDocs(query(collection(db, "gym_reviews"), where("gymId", "==", gymId))),
          getDocs(query(collection(db, "gym_announcements"), where("gymId", "==", gymId))),
        ]);
        if (!active) return;
        if (gymSnap.exists()) setGym({ id: gymSnap.id, ...gymSnap.data() });
        setReels(reelsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byTs));
        setReviews(reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byTs));
        setAnnouncements(announcementsSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byTs));

        // Load approved members
        const membersSnap = await getDocs(query(
          collection(db, "gym_join_requests"),
          where("gymId", "==", gymId),
          where("status", "==", "approved")
        ));
        const memberDocs = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const memberUserIds = [...new Set(memberDocs.map((m) => m.userId).filter(Boolean))];
        const memberUserMap = {};
        if (memberUserIds.length > 0) {
          await Promise.all(memberUserIds.map(async (uid) => {
            const uSnap = await getDoc(doc(db, "users", uid));
            if (uSnap.exists()) memberUserMap[uid] = uSnap.data();
          }));
        }
        if (active) {
          setMembers(memberDocs.map((m) => ({
            ...m,
            user: memberUserMap[m.userId] || null,
          })));
        }
      } catch (e) {
        console.error("gym profile load error", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [gymId]);

  // Check join/review status after user loads
  useEffect(() => {
    if (!user?.uid || !gymId) return;
    async function checkStatus() {
      const [joinSnap, reviewSnap] = await Promise.all([
        getDocs(query(collection(db, "gym_join_requests"), where("gymId", "==", gymId), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "gym_reviews"), where("gymId", "==", gymId), where("userId", "==", user.uid))),
      ]);
      if (!joinSnap.empty) {
        setJoinRequested(true);
        const pending = joinSnap.docs.find((d) => d.data().status === "pending");
        if (pending) setPendingJoinRequestId(pending.id);
      }
      if (!reviewSnap.empty) setAlreadyReviewed(true);
    }
    checkStatus().catch(() => {});
  }, [user?.uid, gymId]);

  const handleJoinRequest = async () => {
    if (!user) { router.push(`/${locale}/login`); return; }
    setJoinSubmitting(true);
    setJoinError("");
    try {
      const reqDoc = await addDoc(collection(db, "gym_join_requests"), {
        userId: user.uid,
        gymId,
        gymOwnerId: gym.ownerId,
        message: joinMessage.trim(),
        createdAt: serverTimestamp(),
        status: "pending",
      });
      setJoinRequested(true);
      setPendingJoinRequestId(reqDoc.id);
      setShowJoinForm(false);
      // Notify gym owner
      if (gym.ownerId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: gym.ownerId,
          actorId: user.uid,
          actorName: user.displayName || "Someone",
          fromUserId: user.uid,
          fromUsername: user.displayName || "Someone",
          fromUserPhotoURL: user.photoURL || "",
          type: "gym_join_request",
          message: t("notifGymJoinRequest").replace("{actor}", user.displayName || "Someone"),
          gymId,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch {
      setJoinError(t("gymJoinRequestError"));
    } finally {
      setJoinSubmitting(false);
    }
  };

  const handleCancelJoinRequest = async () => {
    if (!pendingJoinRequestId) return;
    try {
      await deleteDoc(doc(db, "gym_join_requests", pendingJoinRequestId));
      setJoinRequested(false);
      setPendingJoinRequestId(null);
    } catch (e) {
      console.error("Cancel join request error:", e);
    }
  };

  const handleReviewSubmit = async () => {
    if (!user) { router.push(`/${locale}/login`); return; }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      await addDoc(collection(db, "gym_reviews"), {
        gymId,
        userId: user.uid,
        rating: reviewRating,
        review: reviewText.trim(),
        createdAt: serverTimestamp(),
      });
      // Recalculate gym rating
      const allReviews = await getDocs(query(collection(db, "gym_reviews"), where("gymId", "==", gymId)));
      const ratings = allReviews.docs.map((d) => d.data().rating || 0);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      await updateDoc(doc(db, "gyms", gymId), {
        rating: Math.round(avg * 10) / 10,
        totalReviews: ratings.length,
      });
      setReviews((prev) => [{ id: Date.now().toString(), gymId, userId: user.uid, rating: reviewRating, review: reviewText.trim(), createdAt: null }, ...prev]);
      setReviewSuccess(true);
      setAlreadyReviewed(true);
      setShowReviewForm(false);
    } catch {
      setReviewError(t("gymReviewError"));
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <div style={styles.loading}>{t("loading")}</div>;
  }
  if (!gym) {
    return (
      <div style={styles.page}>
        <div style={styles.content}>
          <button type="button" style={styles.backBtn} onClick={() => router.push(`/${locale}/gyms`)}>← {t("back")}</button>
          <p style={{ color: "rgba(255,255,255,0.62)", textAlign: "center", padding: "60px 0" }}>Gym not found.</p>
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
      </div>
    );
  }

  const isOwner = user?.uid === gym.ownerId;

  return (
    <div style={styles.page}>
      <div style={styles.content}>
        <button type="button" style={styles.backBtn} onClick={() => router.push(`/${locale}/gyms`)}>← {t("back")}</button>

        {/* Hero */}
        <div style={styles.hero}>
          {gym.images?.[0] ? (
            <img src={gym.images[0]} alt="" style={styles.heroImg} />
          ) : (
            <div style={styles.heroPlaceholder}>
              <span style={{ fontSize: 52 }}>🥊</span>
            </div>
          )}
          {gym.logo && (
            <img src={gym.logo} alt="" style={styles.logoOverlay} />
          )}
        </div>

        {/* Gym header */}
        <div style={styles.gymHeader}>
          <div style={styles.gymNameRow}>
            <h1 style={styles.gymName}>{gym.gymName}</h1>
            {gym.verified && (
              <span style={styles.verifiedBadge}>✓ {t("gymVerified")}</span>
            )}
          </div>
          {gym.gymType && (
            <span style={styles.typeChip}>{t(GYM_TYPE_KEYS[gym.gymType]) || gym.gymType}</span>
          )}
          {(gym.city || gym.country) && (
            <p style={styles.gymLocation}>📍 {[gym.district, gym.city, gym.country].filter(Boolean).join(", ")}</p>
          )}
          {gym.address && <p style={styles.gymAddress}>{gym.address}</p>}
          {getGymVibes(gym).length > 0 && (
            <div style={styles.vibeRow}>
              {getGymVibes(gym).map((v) => (
                <span key={v} style={styles.vibeBadge}>{v}</span>
              ))}
            </div>
          )}
        </div>

        {/* Trust stats */}
        <div style={styles.statsRow}>
          {gym.rating > 0 && (
            <div style={styles.statCell}>
              <span style={styles.statNum}>⭐ {gym.rating.toFixed(1)}</span>
              <span style={styles.statLbl}>{t("gymRating")}</span>
            </div>
          )}
          {gym.totalReviews > 0 && (
            <div style={styles.statCell}>
              <span style={styles.statNum}>{gym.totalReviews}</span>
              <span style={styles.statLbl}>{t("gymReviews")}</span>
            </div>
          )}
          {gym.memberCount > 0 && (
            <div style={styles.statCell}>
              <span style={styles.statNum}>{gym.memberCount}</span>
              <span style={styles.statLbl}>{t("gymMembers")}</span>
            </div>
          )}
        </div>

        {/* Join / Owner CTA */}
        <div style={styles.ctaRow}>
          {isOwner ? (
            <button type="button" style={styles.manageBtn} onClick={() => router.push(`/${locale}/gyms/dashboard`)}>
              {t("gymManage")}
            </button>
          ) : pendingJoinRequestId ? (
            <div style={styles.pendingJoinCol}>
              <span style={styles.pendingJoinBadge}>⏳ {t("requestPendingLabel")}</span>
              <button type="button" style={styles.cancelJoinBtn} onClick={handleCancelJoinRequest}>
                {t("cancelRequest")}
              </button>
            </div>
          ) : joinRequested ? (
            <span style={styles.approvedBadge}>✓ {t("gymMembers")}</span>
          ) : (
            <button type="button" style={styles.joinBtn} onClick={() => setShowJoinForm(true)}>{t("gymJoin")}</button>
          )}
          {gym.phone && (
            <a href={`tel:${gym.phone}`} style={styles.contactBtn}>📞</a>
          )}
          {gym.instagram && (
            <a href={`https://instagram.com/${gym.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" style={styles.contactBtn}>IG</a>
          )}
          {gym.website && (
            <a href={gym.website} target="_blank" rel="noopener noreferrer" style={styles.contactBtn}>🌐</a>
          )}
        </div>

        {/* Join form */}
        {showJoinForm && (
          <div style={styles.joinForm}>
            <p style={styles.sectionTitle}>{t("gymJoin")}</p>
            <textarea
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder={t("gymJoinMessagePlaceholder")}
              style={styles.textarea}
              rows={3}
            />
            {joinError && <p style={styles.errorText}>{joinError}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" style={styles.cancelBtn} onClick={() => setShowJoinForm(false)}>{t("cancel")}</button>
              <button type="button" style={styles.submitBtn} onClick={handleJoinRequest} disabled={joinSubmitting}>
                {joinSubmitting ? t("gymJoinSubmitting") : t("gymJoinSubmit")}
              </button>
            </div>
          </div>
        )}

        {/* Good for */}
        {getGymGoodFor(gym).length > 0 && (
          <section style={styles.section}>
            <p style={styles.sectionTitle}>{t("gymGoodFor")}</p>
            <div style={styles.pillsRow}>
              {getGymGoodFor(gym).map((g) => (
                <span key={g} style={styles.goodForPill}>{g}</span>
              ))}
            </div>
          </section>
        )}

        {/* Description */}
        {gym.description && (
          <section style={styles.section}>
            <p style={styles.sectionTitle}>{t("gymDescription")}</p>
            <p style={styles.bodyText}>{gym.description}</p>
          </section>
        )}

        {/* Specialties */}
        {gym.specialties?.length > 0 && (
          <section style={styles.section}>
            <p style={styles.sectionTitle}>{t("gymSpecialties")}</p>
            <div style={styles.pillsRow}>
              {gym.specialties.map((s) => (
                <span key={s} style={styles.pill}>{s}</span>
              ))}
            </div>
          </section>
        )}

        {/* Amenities */}
        {gym.amenities?.length > 0 && (
          <section style={styles.section}>
            <p style={styles.sectionTitle}>{t("gymAmenities")}</p>
            <div style={styles.pillsRow}>
              {gym.amenities.map((a) => (
                <span key={a} style={styles.amenityPill}>{a}</span>
              ))}
            </div>
          </section>
        )}

        {/* Announcements */}
        {announcements.length > 0 && (
          <section style={styles.section}>
            <p style={styles.sectionTitle}>{t("gymAnnouncements")}</p>
            <div style={styles.announcementList}>
              {announcements.map((ann) => (
                <div key={ann.id} style={styles.announcementCard}>
                  <p style={styles.annTitle}>{ann.title}</p>
                  <p style={styles.annBody}>{ann.body}</p>
                  <span style={styles.annDate}>
                    {ann.createdAt?.toDate ? new Date(ann.createdAt.toDate()).toLocaleDateString() : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Members */}
        {members.length > 0 && (
          <section style={styles.section}>
            <p style={styles.sectionTitle}>{t("gymMembersSection")} ({members.length})</p>
            <div style={styles.membersRow}>
              {members.slice(0, 12).map((m) => {
                const name = m.user?.displayName || m.user?.username || "Member";
                const photo = m.user?.photoURL || m.user?.profileImageUrl || "";
                return (
                  <div key={m.id} style={styles.memberSlot}>
                    <div style={styles.memberAvatar}>
                      {photo
                        ? <img src={photo} alt="" style={styles.memberAvatarImg} />
                        : <span style={styles.memberAvatarInitial}>{name[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <span style={styles.memberName}>{name.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Reels */}
        <section style={styles.section}>
          <p style={styles.sectionTitle}>{t("gymReels")}</p>
          {reels.length === 0 ? (
            <p style={styles.emptyText}>{t("gymNoReels")}</p>
          ) : (
            <div style={styles.reelsGrid}>
              {reels.map((reel) => (
                <ReelThumb key={reel.id} reel={reel} router={router} locale={locale} />
              ))}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section style={styles.section}>
          <div style={styles.reviewsHeader}>
            <p style={styles.sectionTitle}>{t("gymReviewsSection")}</p>
            {!alreadyReviewed && !showReviewForm && user && (
              <button type="button" style={styles.leaveReviewBtn} onClick={() => setShowReviewForm(true)}>
                + {t("gymLeaveReview")}
              </button>
            )}
          </div>

          {reviewSuccess && (
            <p style={styles.successText}>{t("gymReviewSuccess")}</p>
          )}

          {showReviewForm && (
            <div style={styles.reviewForm}>
              <StarRating value={reviewRating} onChange={setReviewRating} />
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={t("gymReviewPlaceholder")}
                style={styles.textarea}
                rows={3}
              />
              {reviewError && <p style={styles.errorText}>{reviewError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowReviewForm(false)}>{t("cancel")}</button>
                <button type="button" style={styles.submitBtn} onClick={handleReviewSubmit} disabled={reviewSubmitting}>
                  {reviewSubmitting ? t("gymReviewSubmitting") : t("gymReviewSubmit")}
                </button>
              </div>
            </div>
          )}

          {reviews.length === 0 ? (
            <p style={styles.emptyText}>{t("gymReviewEmpty")}</p>
          ) : (
            <div style={styles.reviewList}>
              {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
            </div>
          )}
        </section>
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
    </div>
  );
}

const styles = {
  loading: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "system-ui, sans-serif" },
  page: { minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "system-ui, sans-serif" },
  content: { maxWidth: 520, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
  backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.65)", fontSize: 14, cursor: "pointer", padding: "16px 0", display: "block" },
  hero: { position: "relative", height: 200, borderRadius: 16, overflow: "hidden", background: "linear-gradient(135deg,#1a1a1a,#111)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 0 },
  heroImg: { width: "100%", height: "100%", objectFit: "cover" },
  heroPlaceholder: { display: "flex", alignItems: "center", justifyContent: "center" },
  logoOverlay: { position: "absolute", bottom: -20, left: 20, width: 60, height: 60, borderRadius: 12, border: "3px solid #0A0A0A", objectFit: "cover", background: "#111" },
  gymHeader: { paddingTop: 28, paddingBottom: 12 },
  gymNameRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  gymName: { margin: 0, fontSize: 26, fontWeight: 1000, lineHeight: 1.1 },
  verifiedBadge: { fontSize: 11, fontWeight: 900, color: "#D4AF37", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 999, padding: "3px 10px" },
  typeChip: { display: "inline-block", fontSize: 11, fontWeight: 900, color: "#C1121F", background: "rgba(193,18,31,0.12)", border: "1px solid rgba(193,18,31,0.25)", borderRadius: 999, padding: "3px 10px", marginBottom: 6 },
  gymLocation: { margin: "4px 0 2px", fontSize: 13, color: "rgba(255,255,255,0.5)" },
  gymAddress: { margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)" },
  statsRow: { display: "flex", gap: 0, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 16, overflow: "hidden" },
  statCell: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "14px 8px" },
  statNum: { fontSize: 17, fontWeight: 1000, color: "#fff" },
  statLbl: { fontSize: 10, color: "rgba(255,255,255,0.62)", fontWeight: 700, textTransform: "uppercase" },
  ctaRow: { display: "flex", gap: 10, marginBottom: 20, alignItems: "center" },
  joinBtn: { flex: 1, minHeight: 44, border: "none", borderRadius: 12, background: "linear-gradient(135deg,#C1121F,#7d0812)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer" },
  requestedBtn: { flex: 1, minHeight: 44, border: "1px solid rgba(52,211,153,0.35)", borderRadius: 12, background: "rgba(52,211,153,0.08)", color: "#34D399", fontSize: 15, fontWeight: 900, cursor: "default" },
  manageBtn: { flex: 1, minHeight: 44, border: "1px solid rgba(212,175,55,0.4)", borderRadius: 12, background: "rgba(212,175,55,0.1)", color: "#D4AF37", fontSize: 15, fontWeight: 900, cursor: "pointer" },
  contactBtn: { width: 44, height: 44, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", textDecoration: "none" },
  joinForm: { borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", padding: "16px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 },
  section: { marginBottom: 24 },
  sectionTitle: { margin: "0 0 10px", fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.65)", letterSpacing: 1, textTransform: "uppercase" },
  bodyText: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 },
  pillsRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  pill: { fontSize: 12, color: "#F87171", background: "rgba(193,18,31,0.12)", border: "1px solid rgba(193,18,31,0.2)", borderRadius: 999, padding: "4px 12px", fontWeight: 700 },
  amenityPill: { fontSize: 12, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 999, padding: "4px 12px" },
  announcementList: { display: "flex", flexDirection: "column", gap: 10 },
  announcementCard: { borderRadius: 12, background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.15)", padding: "12px 14px" },
  annTitle: { margin: "0 0 4px", fontSize: 14, fontWeight: 900, color: "#D4AF37" },
  annBody: { margin: "0 0 6px", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 },
  annDate: { fontSize: 11, color: "rgba(255,255,255,0.55)" },
  reelsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 },
  reelThumb: { aspectRatio: "9/16", borderRadius: 10, overflow: "hidden", background: "#111", cursor: "pointer" },
  reelThumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  reelThumbPlaceholder: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 },
  reviewsHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  leaveReviewBtn: { background: "none", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 999, color: "#D4AF37", fontSize: 12, fontWeight: 900, cursor: "pointer", padding: "5px 12px" },
  reviewForm: { borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", padding: 16, marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 },
  reviewList: { display: "flex", flexDirection: "column", gap: 10 },
  reviewCard: { borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", padding: "12px 14px" },
  reviewTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  reviewDate: { fontSize: 11, color: "rgba(255,255,255,0.55)" },
  reviewText: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 },
  textarea: { width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 14, resize: "vertical", outline: "none", fontFamily: "inherit" },
  cancelBtn: { flex: 1, minHeight: 40, border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10, background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  submitBtn: { flex: 2, minHeight: 40, border: "none", borderRadius: 10, background: "linear-gradient(135deg,#C1121F,#7d0812)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" },
  errorText: { margin: 0, fontSize: 13, color: "#F87171" },
  successText: { margin: "0 0 10px", fontSize: 13, color: "#34D399", fontWeight: 700 },
  emptyText: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.55)" },
  vibeRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
  vibeBadge: { fontSize: 11, fontWeight: 800, color: "#F87171", background: "rgba(193,18,31,0.1)", border: "1px solid rgba(193,18,31,0.25)", borderRadius: 999, padding: "3px 10px" },
  goodForPill: { fontSize: 12, color: "rgba(255,255,255,0.65)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "4px 12px", fontWeight: 600 },
  pendingJoinCol: { flex: 1, display: "flex", flexDirection: "column", gap: 8 },
  pendingJoinBadge: { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 16px", borderRadius: 12, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.35)", color: "#F59E0B", fontSize: 14, fontWeight: 800 },
  cancelJoinBtn: { width: "100%", padding: "10px", border: "1px solid rgba(248,113,113,0.35)", borderRadius: 12, background: "rgba(248,113,113,0.08)", color: "#F87171", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  approvedBadge: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 16px", borderRadius: 12, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", color: "#34D399", fontSize: 14, fontWeight: 800 },
  membersRow: { display: "flex", flexWrap: "wrap", gap: 12 },
  memberSlot: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  memberAvatar: { width: 44, height: 44, borderRadius: "50%", overflow: "hidden", background: "rgba(193,18,31,0.2)", display: "flex", alignItems: "center", justifyContent: "center" },
  memberAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  memberAvatarInitial: { fontSize: 16, fontWeight: 800, color: "#fff" },
  memberName: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.55)", maxWidth: 44, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "center" },
};
