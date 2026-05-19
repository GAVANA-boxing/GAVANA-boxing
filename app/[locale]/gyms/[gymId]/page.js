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
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/gyms/gymIdStyles";
import { StarRating, ReviewCard } from "@/components/shared/ReviewCard";
import { useGymData } from "@/hooks/useGymData";

const AMENITY_ICONS = {
  Shower: "🚿", Showers: "🚿",
  Parking: "🅿️", "Free Parking": "🅿️",
  Locker: "🔒", Lockers: "🔒", "Locker Room": "🔒",
  WiFi: "📶", "Free WiFi": "📶",
  Ring: "🥊", "Boxing Ring": "🥊",
  "Heavy Bags": "🥊", "Punching Bags": "🥊",
  "Speed Bags": "🎯",
  Sauna: "🧖", "Steam Room": "🧖",
  "Juice Bar": "🥤", Café: "☕", Cafe: "☕",
  "Strength Equipment": "🏋️", Gym: "🏋️", Equipment: "🏋️",
  "Changing Room": "👔", "Change Room": "👔",
  "Open Mat": "🟩",
  "Air Conditioning": "❄️", AC: "❄️",
  Cardio: "🏃", "Cardio Equipment": "🏃",
  "Sparring": "🤝",
  "Pro Shop": "🛒",
  "Personal Training": "👤",
  Pool: "🏊",
  Yoga: "🧘",
};

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

  const { gym, setGym, reels, reviews, setReviews, announcements, members, loading } = useGymData({ gymId });

  // Join request
  const [joinMessage, setJoinMessage] = useState("");
  const [joinRequested, setJoinRequested] = useState(false);
  const [pendingJoinRequestId, setPendingJoinRequestId] = useState(null);
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showJoinForm, setShowJoinForm] = useState(false);

  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

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
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", padding: "calc(28px + env(safe-area-inset-top)) 16px 40px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "grid", gap: 14 }}>
          <div className="shimmer" style={{ width: 40, height: 40, borderRadius: 10 }} />
          <div className="shimmer" style={{ height: 200, borderRadius: 18 }} />
          <div className="shimmer" style={{ height: 80, borderRadius: 14 }} />
          <div className="shimmer" style={{ height: 60, borderRadius: 14 }} />
          <div className="shimmer" style={{ height: 120, borderRadius: 14 }} />
        </div>
      </div>
    );
  }
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
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
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
          {(gym.city || gym.address) && (
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={styles.contactBtn} title={t("gymIdMapTitle")}>📍</a>
          )}
          <button type="button" style={styles.contactBtn} onClick={handleShare} title={t("share")}>
            ↗
          </button>
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
                <span key={a} style={styles.amenityPill}>
                  {AMENITY_ICONS[a] && <span style={{ marginRight: 4 }}>{AMENITY_ICONS[a]}</span>}{a}
                </span>
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
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📌</span>
                    <p style={{ ...styles.annTitle, margin: 0 }}>{ann.title}</p>
                  </div>
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ ...styles.sectionTitle, margin: 0 }}>{t("gymReels")}</p>
            {isOwner && (
              <button
                onClick={() => router.push(`/${locale}/upload`)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 11px", borderRadius: 999,
                  background: `${redAlpha(0.12)}`, border: `1px solid ${redAlpha(0.3)}`,
                  color: "#F87171", fontSize: 11, fontWeight: 800, cursor: "pointer",
                }}
              >
                + {t("gymIdAddReel")}
              </button>
            )}
          </div>
          {reels.length === 0 ? (
            isOwner ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "28px 16px", borderRadius: 14,
                background: `${redAlpha(0.05)}`, border: `1px dashed ${redAlpha(0.25)}`,
                gap: 10,
              }}>
                <span style={{ fontSize: 28 }}>🎥</span>
                <p style={{ margin: 0, fontSize: 13, color: "#777", fontWeight: 700 }}>
                  {t("gymIdNoReels")}
                </p>
                <button
                  onClick={() => router.push(`/${locale}/upload`)}
                  style={{
                    padding: "8px 20px", borderRadius: 999,
                    background: "linear-gradient(135deg, #C1121F, #8f0d17)",
                    color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer",
                    border: "none",
                  }}
                >
                  {t("gymIdUploadFirstReel")}
                </button>
              </div>
            ) : (
              <p style={styles.emptyText}>{t("gymNoReels")}</p>
            )
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
              {reviews.map((r) => <ReviewCard key={r.id} review={r} styles={styles} />)}
            </div>
          )}
        </section>
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
    </div>
  );
}

