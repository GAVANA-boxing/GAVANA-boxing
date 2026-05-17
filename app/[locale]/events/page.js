"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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
import { getLocaleFromPathname } from "@/lib/i18n";

const EVENT_TYPES = ["boxing", "mma", "muay_thai", "sparring", "tournament", "seminar"];

const TYPE_META = {
  boxing:     { mn: "Бокс",     ko: "복싱",    en: "Boxing",      color: "#C1121F", emoji: "🥊" },
  mma:        { mn: "MMA",      ko: "MMA",     en: "MMA",         color: "#A78BFA", emoji: "⚔️" },
  muay_thai:  { mn: "Муай Тай", ko: "무에타이", en: "Muay Thai",   color: "#F97316", emoji: "🦵" },
  sparring:   { mn: "Спарринг", ko: "스파링",   en: "Sparring",    color: "#34D399", emoji: "🤜" },
  tournament: { mn: "Тэмцээн",  ko: "토너먼트", en: "Tournament",  color: "#D4AF37", emoji: "🏆" },
  seminar:    { mn: "Семинар",   ko: "세미나",   en: "Seminar",    color: "#60A5FA", emoji: "📚" },
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
    { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
  );
}

function isUpcoming(event) {
  if (!event.date) return false;
  return new Date(event.date) >= new Date();
}

function isLive(event) {
  if (!event.date) return false;
  const now = Date.now();
  const start = new Date(event.date).getTime();
  const end = start + (event.durationMinutes || 120) * 60 * 1000;
  return now >= start && now <= end;
}

export default function EventsPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [events, setEvents] = useState([]);
  const [myRsvpIds, setMyRsvpIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming"); // upcoming | all | mine
  const [typeFilter, setTypeFilter] = useState("all");
  const [rsvping, setRsvping] = useState(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [cfTitle, setCfTitle] = useState("");
  const [cfDesc, setCfDesc] = useState("");
  const [cfType, setCfType] = useState("boxing");
  const [cfDate, setCfDate] = useState("");
  const [cfLocation, setCfLocation] = useState("");
  const [cfCity, setCfCity] = useState("");
  const [cfMax, setCfMax] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    async function load() {
      try {
        const [eventsSnap, rsvpSnap] = await Promise.all([
          getDocs(collection(db, "events")),
          getDocs(query(collection(db, "event_rsvps"), where("userId", "==", user.uid))),
        ]);
        if (!active) return;
        const evs = eventsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
        setEvents(evs);
        setMyRsvpIds(new Set(rsvpSnap.docs.map((d) => d.data().eventId)));
      } catch (e) {
        console.error("events load error", e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user?.uid]);

  const handleRsvp = async (event) => {
    if (!user || rsvping) return;
    setRsvping(event.id);
    const rsvpDocId = `${user.uid}_${event.id}`;
    const isGoing = myRsvpIds.has(event.id);
    try {
      if (isGoing) {
        await deleteDoc(doc(db, "event_rsvps", rsvpDocId));
        await updateDoc(doc(db, "events", event.id), { participantCount: increment(-1) });
        setMyRsvpIds((prev) => { const next = new Set(prev); next.delete(event.id); return next; });
        setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, participantCount: Math.max(0, (e.participantCount || 1) - 1) } : e));
      } else {
        await setDoc(doc(db, "event_rsvps", rsvpDocId), {
          eventId: event.id,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "events", event.id), { participantCount: increment(1) });
        setMyRsvpIds((prev) => new Set([...prev, event.id]));
        setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, participantCount: (e.participantCount || 0) + 1 } : e));
        // Notify organizer if different user
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
            eventId: event.id,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (e) {
      console.error("rsvp error", e);
    } finally {
      setRsvping(null);
    }
  };

  const handleCreate = async () => {
    if (!cfTitle.trim() || !cfDate) { setCreateError(locale === "mn" ? "Гарчиг болон огноо шаардлагатай" : locale === "ko" ? "제목과 날짜를 입력하세요" : "Title and date are required"); return; }
    setCreating(true);
    setCreateError("");
    try {
      const newDoc = await addDoc(collection(db, "events"), {
        title: cfTitle.trim(),
        description: cfDesc.trim(),
        eventType: cfType,
        date: new Date(cfDate).toISOString(),
        location: cfLocation.trim(),
        city: cfCity.trim(),
        maxParticipants: cfMax ? Number(cfMax) : null,
        organizerId: user.uid,
        organizerName: user.displayName || user.email?.split("@")[0] || "Organizer",
        participantCount: 0,
        createdAt: serverTimestamp(),
      });
      const newEvent = {
        id: newDoc.id,
        title: cfTitle.trim(),
        description: cfDesc.trim(),
        eventType: cfType,
        date: new Date(cfDate).toISOString(),
        location: cfLocation.trim(),
        city: cfCity.trim(),
        maxParticipants: cfMax ? Number(cfMax) : null,
        organizerId: user.uid,
        organizerName: user.displayName || user.email?.split("@")[0] || "Organizer",
        participantCount: 0,
      };
      setEvents((prev) => [newEvent, ...prev].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0)));
      setCfTitle(""); setCfDesc(""); setCfType("boxing"); setCfDate(""); setCfLocation(""); setCfCity(""); setCfMax("");
      setShowCreate(false);
    } catch (e) {
      console.error("create event error", e);
      setCreateError(locale === "mn" ? "Алдаа гарлаа" : locale === "ko" ? "오류가 발생했습니다" : "Something went wrong");
    } finally {
      setCreating(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (typeFilter !== "all" && e.eventType !== typeFilter) return false;
    if (tab === "upcoming") return isUpcoming(e);
    if (tab === "mine") return myRsvpIds.has(e.id) || e.organizerId === user?.uid;
    return true;
  });

  if (!user && !authLoading) return null;

  return (
    <div style={s.page}>
      <div style={s.content}>
        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <p style={s.kicker}>GAVANA</p>
            <h1 style={s.title}>{locale === "mn" ? "Тэмцээн & Арга хэмжээ" : locale === "ko" ? "이벤트 & 토너먼트" : "Events & Tournaments"}</h1>
          </div>
          <button type="button" style={s.createBtn} onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? "×" : "+ " + (locale === "mn" ? "Үүсгэх" : locale === "ko" ? "만들기" : "Create")}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div style={s.createForm}>
            <p style={s.formTitle}>{locale === "mn" ? "Шинэ арга хэмжээ" : locale === "ko" ? "새 이벤트" : "New Event"}</p>
            <input type="text" value={cfTitle} onChange={(e) => setCfTitle(e.target.value)} placeholder={locale === "mn" ? "Гарчиг *" : locale === "ko" ? "제목 *" : "Title *"} style={s.input} />
            <textarea value={cfDesc} onChange={(e) => setCfDesc(e.target.value)} placeholder={locale === "mn" ? "Тайлбар" : locale === "ko" ? "설명" : "Description"} style={s.textarea} rows={3} />
            <div style={s.formRow}>
              <div style={{ flex: 1 }}>
                <label style={s.fieldLabel}>{locale === "mn" ? "Төрөл" : locale === "ko" ? "유형" : "Type"}</label>
                <select value={cfType} onChange={(e) => setCfType(e.target.value)} style={s.select}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_META[t].emoji} {getTypeLabel(t, locale)}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.fieldLabel}>{locale === "mn" ? "Хамгийн ихдээ" : locale === "ko" ? "최대 인원" : "Max participants"}</label>
                <input type="number" value={cfMax} onChange={(e) => setCfMax(e.target.value)} placeholder="∞" style={s.input} min={1} />
              </div>
            </div>
            <input type="datetime-local" value={cfDate} onChange={(e) => setCfDate(e.target.value)} style={s.input} />
            <div style={s.formRow}>
              <input type="text" value={cfCity} onChange={(e) => setCfCity(e.target.value)} placeholder={locale === "mn" ? "Хот" : locale === "ko" ? "도시" : "City"} style={{ ...s.input, flex: 1 }} />
              <input type="text" value={cfLocation} onChange={(e) => setCfLocation(e.target.value)} placeholder={locale === "mn" ? "Газар" : locale === "ko" ? "장소" : "Location / venue"} style={{ ...s.input, flex: 2 }} />
            </div>
            {createError && <p style={s.errorText}>{createError}</p>}
            <button type="button" style={creating ? s.submitBtnDisabled : s.submitBtn} onClick={handleCreate} disabled={creating}>
              {creating ? "…" : (locale === "mn" ? "Нийтлэх" : locale === "ko" ? "게시" : "Publish")}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          {[
            { key: "upcoming", label: locale === "mn" ? "Ойрын" : locale === "ko" ? "예정" : "Upcoming" },
            { key: "all", label: locale === "mn" ? "Бүгд" : locale === "ko" ? "전체" : "All" },
            { key: "mine", label: locale === "mn" ? "Миний" : locale === "ko" ? "내 이벤트" : "My Events" },
          ].map(({ key, label }) => (
            <button key={key} type="button" style={tab === key ? s.tabActive : s.tab} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* Type filter pills */}
        <div style={s.typeFilters}>
          <button type="button" style={typeFilter === "all" ? s.typePillActive : s.typePill} onClick={() => setTypeFilter("all")}>
            {locale === "mn" ? "Бүгд" : locale === "ko" ? "전체" : "All"}
          </button>
          {EVENT_TYPES.map((t) => {
            const meta = TYPE_META[t];
            return (
              <button
                key={t}
                type="button"
                style={typeFilter === t
                  ? { ...s.typePillActive, borderColor: meta.color, background: `${meta.color}18`, color: meta.color }
                  : s.typePill}
                onClick={() => setTypeFilter(t)}
              >
                {meta.emoji} {getTypeLabel(t, locale)}
              </button>
            );
          })}
        </div>

        {/* Events list */}
        {(authLoading || loading) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer" style={{ height: 130, borderRadius: "3px 16px 16px 3px", background: "rgba(255,255,255,0.06)" }} />
            ))}
          </div>
        )}

        {!loading && filteredEvents.length === 0 ? (
          <div style={s.emptyState}>
            <span style={{ fontSize: 44, opacity: 0.35 }}>🏆</span>
            <p style={s.emptyTitle}>
              {tab === "mine"
                ? (locale === "mn" ? "Таны арга хэмжээ байхгүй" : locale === "ko" ? "내 이벤트 없음" : "No events yet")
                : tab === "upcoming"
                ? (locale === "mn" ? "Ойрын арга хэмжээ байхгүй" : locale === "ko" ? "예정된 이벤트 없음" : "No upcoming events")
                : (locale === "mn" ? "Арга хэмжээ байхгүй" : locale === "ko" ? "이벤트 없음" : "No events found")}
            </p>
            <p style={s.emptyText}>
              {locale === "mn" ? "Шинэ арга хэмжээ үүсгэхийн тулд дээрх + товч дарна уу" : locale === "ko" ? "위의 + 버튼으로 이벤트를 만들어보세요" : "Use the + Create button above to add one"}
            </p>
          </div>
        ) : !loading ? (
          <div style={s.eventList}>
            {filteredEvents.map((event) => {
              const meta = TYPE_META[event.eventType] || TYPE_META.boxing;
              const isGoing = myRsvpIds.has(event.id);
              const upcoming = isUpcoming(event);
              const live = isLive(event);
              const isFull = event.maxParticipants && (event.participantCount || 0) >= event.maxParticipants;
              return (
                <div key={event.id} style={{ ...s.eventCard, borderLeftColor: live ? "#34D399" : meta.color }}
                  onClick={() => router.push(`/${locale}/events/${event.id}`)}
                >
                  <div style={s.eventCardTop}>
                    <div style={{ ...s.typeBadge, background: `${meta.color}18`, color: meta.color, borderColor: `${meta.color}35` }}>
                      {meta.emoji} {getTypeLabel(event.eventType, locale)}
                    </div>
                    {live && (
                      <span style={s.liveBadge}>
                        <span style={s.liveDot} />
                        LIVE
                      </span>
                    )}
                    {!live && !upcoming && <span style={s.pastBadge}>{locale === "mn" ? "Дууссан" : locale === "ko" ? "종료" : "Past"}</span>}
                  </div>

                  <h3 style={s.eventTitle}>{event.title}</h3>

                  <div style={s.eventMeta}>
                    {event.date && (
                      <span style={s.metaChip}>📅 {formatEventDate(event.date, locale)}</span>
                    )}
                    {(event.city || event.location) && (
                      <span style={s.metaChip}>📍 {[event.city, event.location].filter(Boolean).join(" · ")}</span>
                    )}
                    <span style={s.metaChip}>
                      👥 {event.participantCount || 0}
                      {event.maxParticipants ? ` / ${event.maxParticipants}` : ""}
                    </span>
                  </div>

                  {event.description ? (
                    <p style={s.eventDesc}>{event.description.slice(0, 100)}{event.description.length > 100 ? "…" : ""}</p>
                  ) : null}

                  <div style={s.eventFooter} onClick={(e) => e.stopPropagation()}>
                    <span style={s.organizerLabel}>
                      {locale === "mn" ? "Зохион байгуулагч" : locale === "ko" ? "주최자" : "By"}: {event.organizerName}
                    </span>
                    {upcoming && (
                      <button
                        type="button"
                        disabled={rsvping === event.id || (isFull && !isGoing)}
                        onClick={() => handleRsvp(event)}
                        style={
                          isGoing ? s.goingBtn
                          : isFull ? s.fullBtn
                          : s.rsvpBtn
                        }
                      >
                        {rsvping === event.id ? "…"
                          : isGoing ? (locale === "mn" ? "✓ Оролцоно" : locale === "ko" ? "✓ 참가" : "✓ Going")
                          : isFull ? (locale === "mn" ? "Дүүрсэн" : locale === "ko" ? "마감" : "Full")
                          : (locale === "mn" ? "RSVP" : locale === "ko" ? "참가 신청" : "RSVP")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="discover" />
    </div>
  );
}

const s = {
  loading: { minHeight: "100vh", background: "#0A0A0A", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" },
  page: { minHeight: "100vh", background: "#0A0A0A", color: "#fff", fontFamily: "system-ui, sans-serif" },
  content: { maxWidth: 520, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingTop: "calc(20px + env(safe-area-inset-top))", paddingBottom: 16 },
  kicker: { margin: "0 0 4px", fontSize: 10, letterSpacing: 2.5, color: "#D4AF37", textTransform: "uppercase", fontWeight: 900 },
  title: { margin: 0, fontSize: 24, fontWeight: 1000, lineHeight: 1.1 },
  createBtn: { padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(193,18,31,0.4)", background: "rgba(193,18,31,0.1)", color: "#F87171", fontSize: 13, fontWeight: 900, cursor: "pointer", flexShrink: 0, marginTop: 4 },
  createForm: { background: "linear-gradient(145deg, #111012, #0a0a0a)", border: "1px solid rgba(212,175,55,0.2)", borderLeft: "2.5px solid #D4AF37", borderRadius: "3px 16px 16px 3px", padding: "16px", marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 },
  formTitle: { margin: 0, fontSize: 12, fontWeight: 900, color: "#D4AF37", letterSpacing: 1.5, textTransform: "uppercase" },
  formRow: { display: "flex", gap: 8 },
  fieldLabel: { display: "block", fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  input: { width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark" },
  textarea: { width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit" },
  select: { width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark" },
  submitBtn: { width: "100%", padding: 13, borderRadius: 12, border: "none", background: "linear-gradient(135deg,#C1121F,#7d0812)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" },
  submitBtnDisabled: { width: "100%", padding: 13, borderRadius: 12, border: "none", background: "rgba(193,18,31,0.3)", color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 900, cursor: "not-allowed" },
  errorText: { margin: 0, fontSize: 12, color: "#F87171" },
  tabs: { display: "flex", gap: 6, marginBottom: 12 },
  tab: { flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  tabActive: { flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.08)", color: "#D4AF37", fontSize: 12, fontWeight: 900, cursor: "pointer" },
  typeFilters: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" },
  typePill: { padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  typePillActive: { padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(212,175,55,0.4)", background: "rgba(212,175,55,0.12)", color: "#D4AF37", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "60px 0", textAlign: "center" },
  emptyTitle: { margin: 0, fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.55)" },
  emptyText: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.35)" },
  eventList: { display: "flex", flexDirection: "column", gap: 12 },
  eventCard: { background: "linear-gradient(145deg, #111012, #0a0a0a)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: "2.5px solid #C1121F", borderRadius: "3px 16px 16px 3px", padding: "14px 16px", cursor: "pointer", transition: "border-color 0.2s" },
  eventCardTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  typeBadge: { display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 999, border: "1px solid", fontSize: 10, fontWeight: 900, letterSpacing: 0.3 },
  pastBadge: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: 0.5 },
  liveBadge: { display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 999, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.4)", color: "#34D399", fontSize: 10, fontWeight: 900, letterSpacing: 1.2 },
  liveDot: { width: 6, height: 6, borderRadius: "50%", background: "#34D399", boxShadow: "0 0 6px #34D399", animation: "pulse 1.4s infinite" },
  eventTitle: { margin: "0 0 8px", fontSize: 16, fontWeight: 900, lineHeight: 1.2, color: "#fff" },
  eventMeta: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  metaChip: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 600 },
  eventDesc: { margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 },
  eventFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  organizerLabel: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  rsvpBtn: { padding: "7px 18px", borderRadius: 999, border: "none", background: "linear-gradient(135deg,#C1121F,#7d0812)", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 },
  goingBtn: { padding: "7px 18px", borderRadius: 999, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.1)", color: "#34D399", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 },
  fullBtn: { padding: "7px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 700, cursor: "not-allowed", flexShrink: 0 },
};
