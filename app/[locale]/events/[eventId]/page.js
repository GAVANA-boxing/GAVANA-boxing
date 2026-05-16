"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocale } from "@/lib/i18n";

const TYPE_META = {
  boxing:     { mn: "Бокс",     ko: "복싱",    en: "Boxing",     color: "#C1121F", emoji: "🥊" },
  mma:        { mn: "MMA",      ko: "MMA",     en: "MMA",        color: "#A78BFA", emoji: "⚔️" },
  muay_thai:  { mn: "Муай Тай", ko: "무에타이", en: "Muay Thai",  color: "#F97316", emoji: "🦵" },
  sparring:   { mn: "Спарринг", ko: "스파링",   en: "Sparring",   color: "#34D399", emoji: "🤜" },
  tournament: { mn: "Тэмцээн",  ko: "토너먼트", en: "Tournament", color: "#D4AF37", emoji: "🏆" },
  seminar:    { mn: "Семинар",   ko: "세미나",   en: "Seminar",   color: "#60A5FA", emoji: "📚" },
};

function getTypeLabel(type, locale) {
  const meta = TYPE_META[type];
  if (!meta) return type;
  return meta[locale] || meta.en;
}

function formatEventDate(dateStr, locale) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(
    locale === "mn" ? "mn-MN" : locale === "ko" ? "ko-KR" : "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) >= new Date();
}

export default function EventDetailPage() {
  const params = useParams();
  const locale = getLocale(params?.locale);
  const eventId = params?.eventId;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [event, setEvent] = useState(null);
  const [rsvps, setRsvps] = useState([]); // {userId, ...}
  const [participants, setParticipants] = useState({}); // userId → user data
  const [isGoing, setIsGoing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rsvping, setRsvping] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (!eventId || !user?.uid) return;
    let active = true;
    async function load() {
      try {
        const [eventDoc, rsvpSnap] = await Promise.all([
          getDoc(doc(db, "events", eventId)),
          getDocs(query(collection(db, "event_rsvps"), where("eventId", "==", eventId))),
        ]);
        if (!active) return;
        if (!eventDoc.exists()) { setLoading(false); return; }
        setEvent({ id: eventDoc.id, ...eventDoc.data() });

        const rsvpList = rsvpSnap.docs.map((d) => d.data());
        setRsvps(rsvpList);
        setIsGoing(rsvpList.some((r) => r.userId === user.uid));

        // Batch-load participant profiles
        const uids = [...new Set(rsvpList.map((r) => r.userId).filter(Boolean))];
        if (uids.length > 0) {
          const chunks = [];
          for (let i = 0; i < uids.length; i += 10) chunks.push(uids.slice(i, i + 10));
          const userMap = {};
          await Promise.all(chunks.map(async (chunk) => {
            const uSnap = await getDocs(query(collection(db, "users"), where(documentId(), "in", chunk)));
            uSnap.docs.forEach((d) => { userMap[d.id] = d.data(); });
          }));
          if (active) setParticipants(userMap);
        }
      } catch (e) {
        console.error("event detail load error", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [eventId, user?.uid, authLoading]);

  const handleRsvp = async () => {
    if (!user || rsvping || !event) return;
    setRsvping(true);
    const rsvpDocId = `${user.uid}_${eventId}`;
    try {
      if (isGoing) {
        await deleteDoc(doc(db, "event_rsvps", rsvpDocId));
        await updateDoc(doc(db, "events", eventId), { participantCount: increment(-1) });
        setIsGoing(false);
        setRsvps((prev) => prev.filter((r) => r.userId !== user.uid));
        setEvent((prev) => ({ ...prev, participantCount: Math.max(0, (prev.participantCount || 1) - 1) }));
      } else {
        await setDoc(doc(db, "event_rsvps", rsvpDocId), {
          eventId,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "events", eventId), { participantCount: increment(1) });
        setIsGoing(true);
        setRsvps((prev) => [...prev, { eventId, userId: user.uid }]);
        setEvent((prev) => ({ ...prev, participantCount: (prev.participantCount || 0) + 1 }));
        if (event.organizerId && event.organizerId !== user.uid) {
          await addDoc(collection(db, "notifications"), {
            recipientId: event.organizerId,
            actorId: user.uid,
            actorName: user.displayName || user.email?.split("@")[0] || "Fighter",
            fromUserId: user.uid,
            fromUsername: user.displayName || user.email?.split("@")[0] || "Fighter",
            fromUserPhotoURL: user.photoURL || "",
            type: "event_rsvp",
            message: `${user.displayName || "Fighter"} ${locale === "mn" ? "таны event-д RSVP хийлээ" : locale === "ko" ? "님이 이벤트에 참가 신청했습니다" : "RSVP'd to your event"}: ${event.title}`,
            eventId,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (e) {
      console.error("rsvp error", e);
    } finally {
      setRsvping(false);
    }
  };

  if (authLoading || loading) {
    return <div style={s.loading}>…</div>;
  }
  if (!user) return null;
  if (!event) {
    return (
      <div style={s.page}>
        <div style={s.inner}>
          <button type="button" style={s.backBtn} onClick={() => router.push(`/${locale}/events`)}>← {locale === "mn" ? "Буцах" : locale === "ko" ? "돌아가기" : "Back"}</button>
          <div style={s.notFound}>
            <span style={{ fontSize: 44, opacity: 0.4 }}>🏆</span>
            <p style={{ color: "rgba(255,255,255,0.45)", margin: 0 }}>{locale === "mn" ? "Арга хэмжээ олдсонгүй" : locale === "ko" ? "이벤트를 찾을 수 없습니다" : "Event not found"}</p>
          </div>
        </div>
        <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
      </div>
    );
  }

  const meta = TYPE_META[event.eventType] || TYPE_META.boxing;
  const upcoming = isUpcoming(event.date);
  const isFull = event.maxParticipants && (event.participantCount || 0) >= event.maxParticipants && !isGoing;
  const isOrganizer = event.organizerId === user.uid;

  return (
    <div style={{ ...s.page, background: `radial-gradient(ellipse at top, ${meta.color}10 0%, transparent 40%), #0A0A0A` }}>
      <div style={s.inner}>
        <button type="button" style={s.backBtn} onClick={() => router.push(`/${locale}/events`)}>
          ← {locale === "mn" ? "Арга хэмжээнүүд" : locale === "ko" ? "이벤트 목록" : "Events"}
        </button>

        {/* Hero */}
        <div style={{ ...s.heroCard, borderLeftColor: meta.color }}>
          <div style={s.heroTop}>
            <span style={{ ...s.typeBadge, background: `${meta.color}18`, color: meta.color, borderColor: `${meta.color}35` }}>
              {meta.emoji} {getTypeLabel(event.eventType, locale)}
            </span>
            {!upcoming && <span style={s.pastLabel}>{locale === "mn" ? "Дууссан" : locale === "ko" ? "종료" : "Past event"}</span>}
          </div>
          <h1 style={s.eventTitle}>{event.title}</h1>
          {event.description && <p style={s.eventDesc}>{event.description}</p>}
        </div>

        {/* Details */}
        <div style={s.detailsCard}>
          {event.date && (
            <div style={s.detailRow}>
              <span style={s.detailIcon}>📅</span>
              <div>
                <p style={s.detailLabel}>{locale === "mn" ? "Огноо, цаг" : locale === "ko" ? "날짜 및 시간" : "Date & Time"}</p>
                <p style={s.detailValue}>{formatEventDate(event.date, locale)}</p>
              </div>
            </div>
          )}
          {(event.city || event.location) && (
            <div style={s.detailRow}>
              <span style={s.detailIcon}>📍</span>
              <div>
                <p style={s.detailLabel}>{locale === "mn" ? "Байршил" : locale === "ko" ? "장소" : "Location"}</p>
                <p style={s.detailValue}>{[event.city, event.location].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
          )}
          <div style={s.detailRow}>
            <span style={s.detailIcon}>👥</span>
            <div>
              <p style={s.detailLabel}>{locale === "mn" ? "Оролцогчид" : locale === "ko" ? "참가자" : "Participants"}</p>
              <p style={s.detailValue}>
                {event.participantCount || 0}
                {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
                {event.maxParticipants && <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}> {locale === "mn" ? "орон байр" : locale === "ko" ? "자리" : "spots"}</span>}
              </p>
            </div>
          </div>
          <div style={s.detailRow}>
            <span style={s.detailIcon}>🎤</span>
            <div>
              <p style={s.detailLabel}>{locale === "mn" ? "Зохион байгуулагч" : locale === "ko" ? "주최자" : "Organizer"}</p>
              <p style={s.detailValue}>{event.organizerName}</p>
            </div>
          </div>
        </div>

        {/* RSVP button */}
        {upcoming && !isOrganizer && (
          <button
            type="button"
            disabled={rsvping || isFull}
            onClick={handleRsvp}
            style={isGoing ? s.cancelRsvpBtn : isFull ? s.fullBtn : s.rsvpBtn}
          >
            {rsvping ? "…"
              : isGoing ? (locale === "mn" ? "✓ Оролцоно — Цуцлах" : locale === "ko" ? "✓ 참가 취소" : "✓ Going — Cancel RSVP")
              : isFull ? (locale === "mn" ? "Бүрэн дүүрсэн" : locale === "ko" ? "마감됨" : "Event is full")
              : (locale === "mn" ? "🥊 Оролцоно" : locale === "ko" ? "🥊 참가 신청" : "🥊 RSVP — I'm Going")}
          </button>
        )}
        {isOrganizer && (
          <div style={s.organizerBanner}>
            🎤 {locale === "mn" ? "Та энэ арга хэмжээг зохион байгуулж байна" : locale === "ko" ? "귀하가 이 이벤트의 주최자입니다" : "You are the organizer of this event"}
          </div>
        )}

        {/* Participants list */}
        {rsvps.length > 0 && (
          <div style={s.participantSection}>
            <p style={s.sectionLabel}>
              {locale === "mn" ? "Оролцогчид" : locale === "ko" ? "참가자 목록" : "Participants"} ({rsvps.length})
            </p>
            <div style={s.participantGrid}>
              {rsvps.map((r) => {
                const pu = participants[r.userId] || {};
                const name = pu.displayName || pu.username || "Fighter";
                const photo = pu.photoURL || pu.profileImageUrl || "";
                return (
                  <div key={r.userId} style={s.participantChip}
                    onClick={() => router.push(`/${locale}/profile/${r.userId}`)}>
                    <div style={s.partAvatar}>
                      {photo
                        ? <img src={photo} alt="" style={s.partAvatarImg} />
                        : <span style={s.partAvatarInitial}>{name[0]?.toUpperCase()}</span>}
                    </div>
                    <span style={s.partName}>{name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
    </div>
  );
}

const s = {
  loading: { minHeight: "100vh", background: "#0A0A0A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" },
  page: { minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif" },
  inner: { maxWidth: 520, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
  backBtn: { background: "none", border: "none", color: "rgba(255,255,255,0.55)", fontSize: 14, cursor: "pointer", padding: "16px 0", display: "block" },
  notFound: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "80px 0", textAlign: "center" },
  heroCard: { background: "linear-gradient(145deg, #111012, #0a0a0a)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "3px solid #C1121F", borderRadius: "3px 20px 20px 3px", padding: "18px 18px 20px", marginBottom: 12 },
  heroTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  typeBadge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 999, border: "1px solid", fontSize: 11, fontWeight: 900, letterSpacing: 0.3 },
  pastLabel: { fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700 },
  eventTitle: { margin: "0 0 10px", fontSize: 24, fontWeight: 1000, lineHeight: 1.15, color: "#fff" },
  eventDesc: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 },
  detailsCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 },
  detailRow: { display: "flex", alignItems: "flex-start", gap: 12 },
  detailIcon: { fontSize: 18, flexShrink: 0, marginTop: 1 },
  detailLabel: { margin: "0 0 2px", fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { margin: 0, fontSize: 14, color: "#fff", fontWeight: 700 },
  rsvpBtn: { width: "100%", padding: 16, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#C1121F,#7d0812)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 28px rgba(193,18,31,0.32)", marginBottom: 16 },
  cancelRsvpBtn: { width: "100%", padding: 16, borderRadius: 14, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.08)", color: "#34D399", fontSize: 15, fontWeight: 900, cursor: "pointer", marginBottom: 16 },
  fullBtn: { width: "100%", padding: 16, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 15, fontWeight: 700, cursor: "not-allowed", marginBottom: 16 },
  organizerBanner: { padding: "12px 16px", borderRadius: 12, background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", color: "#D4AF37", fontSize: 13, fontWeight: 700, marginBottom: 16, textAlign: "center" },
  participantSection: { marginTop: 4 },
  sectionLabel: { margin: "0 0 10px", fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 },
  participantGrid: { display: "flex", flexDirection: "column", gap: 8 },
  participantChip: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer" },
  partAvatar: { width: 34, height: 34, borderRadius: "50%", background: "rgba(193,18,31,0.2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 },
  partAvatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  partAvatarInitial: { fontSize: 13, fontWeight: 900, color: "#fff" },
  partName: { fontSize: 14, fontWeight: 700, color: "#fff" },
};
