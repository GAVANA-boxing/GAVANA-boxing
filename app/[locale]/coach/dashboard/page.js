"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/BottomSheet";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/coach/coachDashboardStyles";
import { snapToDocs } from "@/lib/firestore";

function formatTimeAgo(timestamp, locale = "en") {
  if (!timestamp) return "";
  const ms = timestamp.toMillis ? timestamp.toMillis() : new Date(timestamp).getTime();
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (locale === "mn") {
    if (m < 1) return "Дөнгөж сая";
    if (m < 60) return `${m}м өмнө`;
    if (h < 24) return `${h}ц өмнө`;
    return `${d}өдр өмнө`;
  }
  if (locale === "ko") {
    if (m < 1) return "방금";
    if (m < 60) return `${m}분 전`;
    if (h < 24) return `${h}시간 전`;
    return `${d}일 전`;
  }
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function RequesterAvatar({ user: u }) {
  if (!u) {
    return <div style={styles.avatarFallback}>?</div>;
  }
  const initials = (u.displayName || u.username || "?")
    .split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (u.photoURL) {
    return <img src={u.photoURL} alt="" style={styles.avatar} />;
  }
  return <div style={styles.avatarFallback}>{initials}</div>;
}

function StatusBadge({ status, t }) {
  if (status === "accepted") {
    return <span style={styles.badgeAccepted}>{t("requestAccepted")}</span>;
  }
  if (status === "declined") {
    return <span style={styles.badgeDeclined}>{t("requestDeclined")}</span>;
  }
  return <span style={styles.badgePending}>{t("requestPending")}</span>;
}

function RequestCard({ request, requesterUser, t, locale, onAccept, onDecline, onSchedule, onMarkComplete, onViewProfile, updating, completingId }) {
  const typeLbl = request.type === "sparring" ? t("sparringRequestType") : t("coachRequestType");

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <button type="button" style={styles.avatarBtn} onClick={() => onViewProfile?.(requesterUser, request)}>
          <RequesterAvatar user={requesterUser} />
        </button>
        <div style={styles.cardMeta}>
          <div style={styles.cardNameRow}>
            <span style={styles.cardName}>
              {requesterUser?.displayName || requesterUser?.username || "Fighter"}
            </span>
            <span style={request.type === "sparring" ? styles.typeChipSparring : styles.typeChipCoach}>
              {typeLbl}
            </span>
          </div>
          <span style={styles.cardTime}>{formatTimeAgo(request.createdAt, locale)}</span>
        </div>
        <StatusBadge status={request.status} t={t} />
      </div>

      {request.message && (
        <p style={styles.cardMessage}>{request.message}</p>
      )}

      {request.type === "sparring" && request.sparringPostId && (
        <div style={styles.sparringTag}>
          {t("coachSparringPostTag")}
        </div>
      )}

      {request.status === "pending" && (
        <div style={styles.cardActions}>
          <button
            type="button"
            style={styles.declineBtn}
            disabled={updating === request.id}
            onClick={() => onDecline(request.id)}
          >
            {t("decline")}
          </button>
          <button
            type="button"
            style={styles.acceptBtn}
            disabled={updating === request.id}
            onClick={() => onAccept(request.id, request.userId)}
          >
            {updating === request.id ? "…" : t("accept")}
          </button>
        </div>
      )}

      {request.status === "accepted" && !request.bookedAt && (
        <button
          type="button"
          style={styles.scheduleBtn}
          onClick={() => onSchedule(request)}
        >
          📅 {t("scheduleSession")}
        </button>
      )}

      {request.bookedAt && !request.sessionCompleted && (
        <div style={styles.bookedRow}>
          <div style={styles.bookedTag}>
            📅 {request.bookedDate} {request.bookedTime} · {request.bookedDuration}min
          </div>
          {request.bookingId && (
            <button
              type="button"
              style={styles.completeBtn}
              disabled={completingId === request.id}
              onClick={() => onMarkComplete(request)}
            >
              {completingId === request.id ? t("coachMarkCompleting") : t("coachMarkComplete")}
            </button>
          )}
        </div>
      )}

      {request.sessionCompleted && (
        <div style={styles.completedTag}>✓ {t("coachBookingCompleted")}</div>
      )}
    </div>
  );
}

export default function CoachDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();

  const [requests, setRequests] = useState([]);
  const [requesterUsers, setRequesterUsers] = useState({});
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const loadedRef = useRef(false);

  // Programs
  const [programs, setPrograms] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [progTitle, setProgTitle] = useState("");
  const [progDesc, setProgDesc] = useState("");
  const [progDuration, setProgDuration] = useState(7);
  const [progLevel, setProgLevel] = useState("beginner");
  const [progSaving, setProgSaving] = useState(false);

  // Booking modal state
  const [bookingRequest, setBookingRequest] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState(60);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");

  // Profile quick-view modal
  const [profileModal, setProfileModal] = useState(null);

  // Auth + coach guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/${locale}/login`);
      return;
    }
    async function checkCoach() {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists() || !snap.data().isCoach) {
          setAccessDenied(true);
          router.replace(`/${locale}/coach`);
          return;
        }
        setCompletedSessions(Number(snap.data().completedSessions) || 0);
      } catch {
        setAccessDenied(true);
        router.replace(`/${locale}/coach`);
      }
    }
    checkCoach();
  }, [authLoading, user, router, locale]);

  // Load requests
  useEffect(() => {
    if (!user?.uid || loadedRef.current) return;
    loadedRef.current = true;
    let active = true;

    async function loadRequests() {
      setLoadingRequests(true);
      try {
        const snap = await getDocs(
          query(collection(db, "coach_requests"), where("coachId", "==", user.uid))
        );
        if (!active) return;

        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setRequests(docs);

        // Batch-load requester profiles
        const uniqueIds = [...new Set(docs.map((r) => r.userId).filter(Boolean))];
        if (uniqueIds.length === 0) return;

        // Split into chunks of 10 (Firestore `in` limit per query)
        const chunks = [];
        for (let i = 0; i < uniqueIds.length; i += 10) {
          chunks.push(uniqueIds.slice(i, i + 10));
        }
        const userMap = {};
        await Promise.all(
          chunks.map(async (chunk) => {
            const uSnap = await getDocs(
              query(collection(db, "users"), where(documentId(), "in", chunk))
            );
            uSnap.docs.forEach((d) => { userMap[d.id] = d.data(); });
          })
        );
        if (active) setRequesterUsers(userMap);
      } catch (e) {
        console.error("Failed to load coach requests:", e);
      } finally {
        if (active) setLoadingRequests(false);
      }
    }

    loadRequests();
    return () => { active = false; };
  }, [user?.uid]);

  const handleAccept = async (requestId, requesterId) => {
    setUpdating(requestId);
    try {
      await updateDoc(doc(db, "coach_requests", requestId), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
      });

      // Notify requester
      if (requesterId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: requesterId,
          actorId: user.uid,
          actorName: user.displayName || "Coach",
          fromUserId: user.uid,
          fromUsername: user.displayName || "Coach",
          fromUserPhotoURL: user.photoURL || "",
          type: "coach_accept",
          message: "Your coach request was accepted!",
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setRequests((prev) =>
        prev.map((r) => r.id === requestId ? { ...r, status: "accepted" } : r)
      );
    } catch (e) {
      console.error("Failed to accept request:", e);
    } finally {
      setUpdating(null);
    }
  };

  const handleDecline = async (requestId) => {
    setUpdating(requestId);
    const req = requests.find((r) => r.id === requestId);
    try {
      await updateDoc(doc(db, "coach_requests", requestId), {
        status: "declined",
        declinedAt: serverTimestamp(),
      });
      if (req?.userId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: req.userId,
          actorId: user.uid,
          actorName: user.displayName || "Coach",
          fromUserId: user.uid,
          fromUsername: user.displayName || "Coach",
          fromUserPhotoURL: user.photoURL || "",
          type: "coach_decline",
          message: t("notifCoachDeclined"),
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      setRequests((prev) =>
        prev.map((r) => r.id === requestId ? { ...r, status: "declined" } : r)
      );
    } catch (e) {
      console.error("Failed to decline request:", e);
    } finally {
      setUpdating(null);
    }
  };

  const openBookingModal = (request) => {
    setBookingRequest(request);
    setBookingDate("");
    setBookingTime("");
    setBookingDuration(60);
    setBookingSuccess(false);
  };

  const handleBookingSubmit = async () => {
    if (!bookingDate || !bookingTime || !bookingRequest) return;
    setBookingSubmitting(true);
    try {
      const bookingDoc = await addDoc(collection(db, "coach_bookings"), {
        coachId: user.uid,
        userId: bookingRequest.userId,
        requestId: bookingRequest.id,
        date: bookingDate,
        time: bookingTime,
        durationMinutes: bookingDuration,
        status: "scheduled",
        createdAt: serverTimestamp(),
      });
      // Store bookingId back on request for easy Mark Complete lookup
      await updateDoc(doc(db, "coach_requests", bookingRequest.id), { bookingId: bookingDoc.id });

      if (bookingRequest.userId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: bookingRequest.userId,
          actorId: user.uid,
          actorName: user.displayName || "Coach",
          fromUserId: user.uid,
          fromUsername: user.displayName || "Coach",
          fromUserPhotoURL: user.photoURL || "",
          type: "booking_scheduled",
          message: t("sessionScheduled"),
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.id === bookingRequest.id
            ? { ...r, bookedAt: true, bookedDate: bookingDate, bookedTime: bookingTime, bookedDuration: bookingDuration }
            : r
        )
      );
      setBookingSuccess(true);
      setTimeout(() => setBookingRequest(null), 1400);
    } catch (e) {
      console.error("Failed to create booking:", e);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleMarkComplete = async (request) => {
    if (!request.bookingId) return;
    setCompletingId(request.id);
    try {
      // 1. Update booking status
      await updateDoc(doc(db, "coach_bookings", request.bookingId), {
        status: "completed",
        completedAt: serverTimestamp(),
      });

      // 2. Increment coach completedSessions
      const { increment } = await import("firebase/firestore");
      const coachRef = doc(db, "users", user.uid);
      const coachSnap = await getDoc(coachRef);
      const coachData = coachSnap.exists() ? coachSnap.data() : {};
      const newCompleted = (Number(coachData.completedSessions) || 0) + 1;

      // 3. Recalculate avg rating from reviews
      const reviewsSnap = await getDocs(query(collection(db, "coach_reviews"), where("coachId", "==", user.uid)));
      const ratings = reviewsSnap.docs.map((d) => Number(d.data().rating)).filter(Number.isFinite);
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : Number(coachData.coachRating) || 5;

      await updateDoc(coachRef, {
        completedSessions: newCompleted,
        coachRating: Number(avgRating.toFixed(1)),
        coachTotalReviews: ratings.length,
      });
      setCompletedSessions(newCompleted);

      // 4. Notify student
      if (request.userId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: request.userId,
          actorId: user.uid,
          actorName: user.displayName || "Coach",
          fromUserId: user.uid,
          fromUsername: user.displayName || "Coach",
          fromUserPhotoURL: user.photoURL || "",
          type: "session_completed",
          message: t("coachSessionCompleted"),
          read: false,
          createdAt: serverTimestamp(),
        });
      }

      // 5. Update local state
      setRequests((prev) =>
        prev.map((r) => r.id === request.id ? { ...r, sessionCompleted: true } : r)
      );
    } catch (e) {
      console.error("Failed to mark complete:", e);
    } finally {
      setCompletingId(null);
    }
  };

  // Load own programs
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    getDocs(query(collection(db, "training_programs"), where("coachId", "==", user.uid)))
      .then((snap) => {
        if (!active) return;
        setPrograms(snapToDocs(snap).sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)));
      }).catch(() => {});
    return () => { active = false; };
  }, [user?.uid]);

  const handleCreateProgram = async () => {
    if (!progTitle.trim() || progSaving) return;
    setProgSaving(true);
    try {
      const userData = await getDoc(doc(db, "users", user.uid));
      const uData = userData.exists() ? userData.data() : {};
      const ref = await addDoc(collection(db, "training_programs"), {
        coachId: user.uid,
        coachName: uData.displayName || uData.username || "",
        coachPhotoURL: uData.photoURL || "",
        title: progTitle.trim(),
        description: progDesc.trim(),
        duration: progDuration,
        level: progLevel,
        enrolledCount: 0,
        createdAt: serverTimestamp(),
      });
      setPrograms((prev) => [{ id: ref.id, coachId: user.uid, title: progTitle.trim(), description: progDesc.trim(), duration: progDuration, level: progLevel, enrolledCount: 0 }, ...prev]);
      setProgTitle(""); setProgDesc(""); setProgDuration(7); setProgLevel("beginner");
      setShowCreateForm(false);
    } catch (e) {
      console.error("Create program error:", e);
    } finally {
      setProgSaving(false);
    }
  };

  if (authLoading || accessDenied) return null;

  const total = requests.length;
  const pending = requests.filter((r) => r.status === "pending").length;
  const accepted = requests.filter((r) => r.status === "accepted").length;
  const declined = requests.filter((r) => r.status === "declined").length;
  const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const filteredRequests = activeFilter === "all"
    ? requests
    : requests.filter((r) => r.status === activeFilter);

  const FILTER_TABS = [
    { key: "all", label: t("coachFilterAll"), count: total },
    { key: "pending", label: t("requestPending"), count: pending },
    { key: "accepted", label: t("coachDashAccepted"), count: accepted },
    { key: "declined", label: t("coachDashDeclined"), count: declined },
  ];

  return (
    <main style={styles.page}>
      <div style={styles.content}>
        {/* Header */}
        <header style={styles.header}>
          <button
            type="button"
            style={styles.backBtn}
            onClick={() => router.push(`/${locale}/coach`)}
          >
            {"<"} {t("navCoach")}
          </button>
          <p style={styles.kicker}>{t("coachDashboardKicker")}</p>
          <h1 style={styles.title}>{t("coachDashboard")}</h1>
        </header>

        {/* Stats panel */}
        <div style={styles.statsPanel}>
          <div style={styles.statCell}>
            <span style={styles.statNum}>{total}</span>
            <span style={styles.statLbl}>{t("totalRequests")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <span style={{ ...styles.statNum, color: "#F59E0B" }}>{pending}</span>
            <span style={styles.statLbl}>{t("pendingRequests")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <span style={{ ...styles.statNum, color: "#34D399" }}>{completedSessions}</span>
            <span style={styles.statLbl}>{t("coachDashCompleted")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <span style={{ ...styles.statNum, color: "#60A5FA" }}>{acceptRate}%</span>
            <span style={styles.statLbl}>{t("coachWinRate")}</span>
          </div>
        </div>

        {/* Requests list */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ ...styles.sectionTitle, margin: 0 }}>{t("coachRequests")}</h2>
        </div>

        {/* Filter tabs */}
        <div style={styles.filterRow}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              style={{ ...styles.filterTab, ...(activeFilter === tab.key ? styles.filterTabActive : {}) }}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{ ...styles.filterTabCount, ...(activeFilter === tab.key ? { background: "rgba(255,255,255,0.25)" } : {}) }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loadingRequests && (
          <div style={styles.skeletonWrap}>
            {[0, 1].map((i) => (
              <div key={i} style={styles.skeletonCard} className="skeleton-pulse" />
            ))}
          </div>
        )}

        {!loadingRequests && filteredRequests.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyTitle}>
              {activeFilter === "all" ? t("noRequests") : t("coachDashNoRequests")}
            </div>
            <div style={styles.emptyDesc}>
              {activeFilter === "all"
                ? t("coachDashNoRequestsDesc")
                : (locale === "mn" ? `${FILTER_TABS.find(tab => tab.key === activeFilter)?.label} хүсэлт байхгүй.` : locale === "ko" ? "해당 카테고리에 요청이 없습니다." : `No ${activeFilter} requests.`)}
            </div>
          </div>
        )}

        <div style={styles.cardList}>
          {filteredRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              requesterUser={requesterUsers[req.userId]}
              t={t}
              locale={locale}
              updating={updating}
              completingId={completingId}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onSchedule={openBookingModal}
              onMarkComplete={handleMarkComplete}
              onViewProfile={(u, r) => setProfileModal({ user: u, request: r })}
            />
          ))}
        </div>

        {/* Training Programs section — inside same content wrapper */}
        <div style={{ marginTop: 32, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ ...styles.sectionTitle, margin: 0 }}>
              📋 {t("coachDashMyPrograms")}
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, #C1121F, #8f0d17)", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer" }}
            >
              {showCreateForm ? "✕" : "+ " + t("coachDashNew")}
            </button>
          </div>

          {showCreateForm && (
            <div style={{ background: "linear-gradient(145deg, #111012, #0a0a0a)", border: "1px solid rgba(255,255,255,0.09)", borderLeft: "2.5px solid #C1121F", borderRadius: "3px 14px 14px 3px", padding: "16px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                value={progTitle}
                onChange={(e) => setProgTitle(e.target.value)}
                placeholder={t("coachDashProgTitle")}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, outline: "none" }}
              />
              <textarea
                value={progDesc}
                onChange={(e) => setProgDesc(e.target.value)}
                placeholder={t("coachDashProgDesc")}
                rows={3}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888", fontWeight: 700, flexShrink: 0 }}>
                  {t("coachDashDurationLabel")}
                </span>
                {[7, 14, 30].map((d) => (
                  <button key={d} type="button" onClick={() => setProgDuration(d)} style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: progDuration === d ? RED : "rgba(255,255,255,0.08)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                    {d}{t("coachDashDayShort")}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  ["beginner", "#34D399", t("coachDashLevelBeginner")],
                  ["intermediate", GOLD, t("coachDashLevelIntermediate")],
                  ["advanced", RED, t("coachDashLevelAdvanced")],
                ].map(([lvl, col, lbl]) => (
                  <button key={lvl} type="button" onClick={() => setProgLevel(lvl)} style={{ flex: 1, padding: "6px 0", borderRadius: 999, border: `1px solid ${progLevel === lvl ? col : "rgba(255,255,255,0.1)"}`, background: progLevel === lvl ? `${col}18` : "transparent", color: progLevel === lvl ? col : "#888", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleCreateProgram}
                disabled={!progTitle.trim() || progSaving}
                style={{ padding: "11px 0", borderRadius: 10, border: "none", background: progTitle.trim() ? "linear-gradient(135deg, #C1121F, #8f0d17)" : "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: progTitle.trim() ? "pointer" : "not-allowed", opacity: progSaving ? 0.6 : 1 }}
              >
                {progSaving ? "…" : t("coachDashSaveProgram")}
              </button>
            </div>
          )}

          {programs.length === 0 && !showCreateForm && (
            <div style={{ textAlign: "center", padding: "32px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.09)" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                {t("coachDashNoPrograms")}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
                {t("coachDashNoProgramsHint")}
              </p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {programs.map((prog) => {
              const LEVEL_COLOR = { beginner: "#34D399", intermediate: GOLD, advanced: RED };
              const LEVEL_LBL = {
                beginner: locale === "mn" ? "Анхан" : locale === "ko" ? "입문" : "Beginner",
                intermediate: locale === "mn" ? "Дунд" : locale === "ko" ? "중급" : "Intermediate",
                advanced: locale === "mn" ? "Ахисан" : locale === "ko" ? "고급" : "Advanced",
              };
              const col = LEVEL_COLOR[prog.level] || "#888";
              return (
                <div key={prog.id} style={{ background: "linear-gradient(145deg, #111012, #0a0a0a)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `2.5px solid ${col}`, borderRadius: "3px 14px 14px 3px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{prog.title}</div>
                    <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#555", fontWeight: 700 }}>
                      <span style={{ color: col }}>{LEVEL_LBL[prog.level] || prog.level}</span>
                      {prog.duration && <span>📅 {prog.duration}{t("coachDashDayShort")}</span>}
                      <span>👥 {prog.enrolledCount || 0} {t("coachDashEnrolled")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ height: "calc(16px + env(safe-area-inset-bottom))" }} />
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />

      {/* Booking modal */}
      <BottomSheet
        open={!!bookingRequest}
        onClose={() => setBookingRequest(null)}
        title={`📅 ${t("scheduleSession")}`}
      >
        <div style={styles.modalSubtitle}>
          {requesterUsers[bookingRequest?.userId]?.displayName || requesterUsers[bookingRequest?.userId]?.username || "Fighter"}
        </div>
        {bookingSuccess ? (
          <div style={styles.bookingSuccessMsg}>✓ {t("sessionScheduled")}</div>
        ) : (
          <>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>{t("bookingDate")}</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                style={styles.modalInput}
              />
            </div>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>{t("bookingTime")}</label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                style={styles.modalInput}
              />
            </div>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>{t("duration")}</label>
              <select
                value={bookingDuration}
                onChange={(e) => setBookingDuration(Number(e.target.value))}
                style={styles.modalSelect}
              >
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
            <button
              type="button"
              style={{
                ...styles.confirmBtn,
                opacity: (!bookingDate || !bookingTime || bookingSubmitting) ? 0.5 : 1,
              }}
              disabled={!bookingDate || !bookingTime || bookingSubmitting}
              onClick={handleBookingSubmit}
            >
              {bookingSubmitting ? "…" : t("scheduleSession")}
            </button>
          </>
        )}
      </BottomSheet>

      {/* Student profile quick-view modal */}
      <BottomSheet
        open={!!profileModal}
        onClose={() => setProfileModal(null)}
        title={t("coachDashFighterProfile")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <RequesterAvatar user={profileModal?.user} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 1000, color: "#fff" }}>
              {profileModal?.user?.displayName || profileModal?.user?.username || "Fighter"}
            </div>
            {profileModal?.user?.gym && (
              <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginTop: 2 }}>🏋️ {profileModal.user.gym}</div>
            )}
            {profileModal?.user?.bio && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4, lineHeight: 1.4 }}>
                {profileModal.user.bio}
              </div>
            )}
          </div>
        </div>
        {profileModal?.request?.message && (
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, fontStyle: "italic" }}>
            "{profileModal.request.message}"
          </div>
        )}
        <button
          type="button"
          style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}
          onClick={() => { setProfileModal(null); router.push(`/${locale}/profile/${profileModal?.request?.userId}`); }}
        >
          {t("coachDashViewFull")}
        </button>
      </BottomSheet>

    </main>
  );
}

