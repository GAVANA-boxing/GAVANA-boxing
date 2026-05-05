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
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";

function formatTimeAgo(timestamp) {
  if (!timestamp) return "";
  const ms = timestamp.toMillis ? timestamp.toMillis() : new Date(timestamp).getTime();
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
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

function RequestCard({ request, requesterUser, t, onAccept, onDecline, onSchedule, updating }) {
  const typeLbl = request.type === "sparring" ? t("sparringRequestType") : t("coachRequestType");

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <RequesterAvatar user={requesterUser} />
        <div style={styles.cardMeta}>
          <div style={styles.cardNameRow}>
            <span style={styles.cardName}>
              {requesterUser?.displayName || requesterUser?.username || "Fighter"}
            </span>
            <span style={request.type === "sparring" ? styles.typeChipSparring : styles.typeChipCoach}>
              {typeLbl}
            </span>
          </div>
          <span style={styles.cardTime}>{formatTimeAgo(request.createdAt)}</span>
        </div>
        <StatusBadge status={request.status} t={t} />
      </div>

      {request.message && (
        <p style={styles.cardMessage}>{request.message}</p>
      )}

      {request.type === "sparring" && request.sparringPostId && (
        <div style={styles.sparringTag}>
          Sparring post request
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

      {request.bookedAt && (
        <div style={styles.bookedTag}>
          📅 {request.bookedDate} {request.bookedTime} · {request.bookedDuration}min
        </div>
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

  // Booking modal state
  const [bookingRequest, setBookingRequest] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState(60);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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
        }
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
          query(
            collection(db, "coach_requests"),
            where("coachId", "==", user.uid),
            orderBy("createdAt", "desc")
          )
        );
        if (!active) return;

        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    try {
      await updateDoc(doc(db, "coach_requests", requestId), {
        status: "declined",
      });
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
      await addDoc(collection(db, "coach_bookings"), {
        coachId: user.uid,
        userId: bookingRequest.userId,
        requestId: bookingRequest.id,
        date: bookingDate,
        time: bookingTime,
        durationMinutes: bookingDuration,
        status: "scheduled",
        createdAt: serverTimestamp(),
      });

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

  if (authLoading || accessDenied) return null;

  const total = requests.length;
  const pending = requests.filter((r) => r.status === "pending").length;
  const accepted = requests.filter((r) => r.status === "accepted").length;
  const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

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
            <span style={{ ...styles.statNum, color: "#34D399" }}>{accepted}</span>
            <span style={styles.statLbl}>{t("acceptedRequests")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <span style={{ ...styles.statNum, color: "#60A5FA" }}>{acceptRate}%</span>
            <span style={styles.statLbl}>{t("coachWinRate")}</span>
          </div>
        </div>

        {/* Requests list */}
        <h2 style={styles.sectionTitle}>{t("coachRequests")}</h2>

        {loadingRequests && (
          <div style={styles.loadingText}>Loading…</div>
        )}

        {!loadingRequests && requests.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyTitle}>{t("noRequests")}</div>
            <div style={styles.emptyDesc}>
              New coaching and sparring requests will appear here.
            </div>
          </div>
        )}

        <div style={styles.cardList}>
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              requesterUser={requesterUsers[req.userId]}
              t={t}
              updating={updating}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onSchedule={openBookingModal}
            />
          ))}
        </div>
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />

      {/* Booking modal */}
      {bookingRequest && (
        <div style={styles.modalBackdrop} onClick={() => setBookingRequest(null)}>
          <div style={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHandle} />
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>📅 {t("scheduleSession")}</span>
              <button type="button" style={styles.modalCloseBtn} onClick={() => setBookingRequest(null)}>✕</button>
            </div>
            <div style={styles.modalSubtitle}>
              {requesterUsers[bookingRequest.userId]?.displayName || requesterUsers[bookingRequest.userId]?.username || "Fighter"}
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
          </div>
        </div>
      )}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 0%, rgba(193,18,31,0.18), transparent 30%), linear-gradient(180deg, #080808 0%, #0B0B0B 100%)",
    color: "#fff",
    fontFamily: "sans-serif",
  },
  content: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "calc(18px + env(safe-area-inset-top)) 16px calc(104px + env(safe-area-inset-bottom))",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 22,
  },
  backBtn: {
    alignSelf: "flex-start",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.4)",
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    marginBottom: 4,
  },
  kicker: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 1000,
    lineHeight: 1.1,
  },
  statsPanel: {
    display: "flex",
    alignItems: "center",
    borderRadius: 18,
    background: "linear-gradient(145deg, #131313, #0a0a0a)",
    border: "1px solid rgba(255,255,255,0.09)",
    padding: "16px 0",
    marginBottom: 24,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  statCell: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
  },
  statNum: {
    fontSize: 22,
    fontWeight: 1000,
    color: "#fff",
    lineHeight: 1,
  },
  statLbl: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    background: "rgba(255,255,255,0.08)",
  },
  sectionTitle: {
    margin: "0 0 14px",
    fontSize: 15,
    fontWeight: 1000,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  loadingText: {
    textAlign: "center",
    padding: "40px 0",
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "52px 24px",
    borderRadius: 18,
    background: "linear-gradient(145deg, #111, #0a0a0a)",
    border: "1px solid rgba(255,255,255,0.07)",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 44,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 1000,
    color: "rgba(255,255,255,0.7)",
  },
  emptyDesc: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 1.5,
    maxWidth: 260,
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: "14px 16px",
    background: "linear-gradient(145deg, #131313, #0a0a0a)",
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "0 6px 24px rgba(0,0,0,0.35)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(212,175,55,0.35)",
    flexShrink: 0,
  },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #C1121F, #7d0812)",
    border: "2px solid rgba(212,175,55,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 16,
    fontWeight: 1000,
    color: "#fff",
    flexShrink: 0,
  },
  cardMeta: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 0,
  },
  cardNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  cardName: {
    fontSize: 15,
    fontWeight: 1000,
    color: "#fff",
  },
  typeChipCoach: {
    fontSize: 10,
    fontWeight: 900,
    color: "#D4AF37",
    background: "rgba(212,175,55,0.12)",
    border: "1px solid rgba(212,175,55,0.25)",
    borderRadius: 999,
    padding: "2px 8px",
    letterSpacing: 0.5,
  },
  typeChipSparring: {
    fontSize: 10,
    fontWeight: 900,
    color: "#60A5FA",
    background: "rgba(96,165,250,0.12)",
    border: "1px solid rgba(96,165,250,0.25)",
    borderRadius: 999,
    padding: "2px 8px",
    letterSpacing: 0.5,
  },
  cardTime: {
    fontSize: 11,
    color: "rgba(255,255,255,0.38)",
    fontWeight: 600,
  },
  badgePending: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 900,
    color: "#F59E0B",
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.28)",
    borderRadius: 999,
    padding: "4px 10px",
  },
  badgeAccepted: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 900,
    color: "#34D399",
    background: "rgba(52,211,153,0.12)",
    border: "1px solid rgba(52,211,153,0.28)",
    borderRadius: 999,
    padding: "4px 10px",
  },
  badgeDeclined: {
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 900,
    color: "#F87171",
    background: "rgba(248,113,113,0.1)",
    border: "1px solid rgba(248,113,113,0.22)",
    borderRadius: 999,
    padding: "4px 10px",
  },
  cardMessage: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.5,
    fontStyle: "italic",
    borderLeft: "2px solid rgba(255,255,255,0.1)",
    paddingLeft: 10,
  },
  sparringTag: {
    fontSize: 11,
    color: "#60A5FA",
    fontWeight: 700,
  },
  cardActions: {
    display: "flex",
    gap: 8,
    marginTop: 2,
  },
  scheduleBtn: {
    width: "100%",
    minHeight: 38,
    border: "1px solid rgba(212,175,55,0.35)",
    borderRadius: 10,
    background: "rgba(212,175,55,0.08)",
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    marginTop: 2,
  },
  bookedTag: {
    fontSize: 12,
    color: "#34D399",
    fontWeight: 700,
    paddingTop: 2,
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    zIndex: 200,
    background: "rgba(0,0,0,0.72)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  modalSheet: {
    width: "min(100%, 520px)",
    borderRadius: "24px 24px 0 0",
    background: "linear-gradient(180deg, #161616 0%, #0f0f0f 100%)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderBottom: "none",
    padding: "12px 20px calc(28px + env(safe-area-inset-bottom))",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    background: "rgba(255,255,255,0.18)",
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 1000,
    color: "#fff",
  },
  modalCloseBtn: {
    background: "none",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    fontSize: 18,
    cursor: "pointer",
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    marginTop: -8,
    fontWeight: 700,
  },
  modalField: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: "rgba(255,255,255,0.45)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  modalInput: {
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 15,
    padding: "0 14px",
    outline: "none",
    colorScheme: "dark",
  },
  modalSelect: {
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 15,
    padding: "0 14px",
    outline: "none",
    colorScheme: "dark",
  },
  confirmBtn: {
    minHeight: 48,
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #C1121F, #7d0812)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(193,18,31,0.35)",
    marginTop: 4,
  },
  bookingSuccessMsg: {
    textAlign: "center",
    padding: "24px 0",
    fontSize: 18,
    fontWeight: 1000,
    color: "#34D399",
  },
  declineBtn: {
    flex: 1,
    minHeight: 38,
    border: "1px solid rgba(248,113,113,0.3)",
    borderRadius: 10,
    background: "rgba(248,113,113,0.08)",
    color: "#F87171",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  acceptBtn: {
    flex: 2,
    minHeight: 38,
    border: "none",
    borderRadius: 10,
    background: "linear-gradient(135deg, #166534, #15803d)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "0 6px 18px rgba(22,101,52,0.35)",
  },
};
