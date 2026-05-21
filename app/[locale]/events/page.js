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
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import BottomNav from "@/components/BottomNav";
import EmptyState from "@/components/EmptyState";
import SkeletonBlock from "@/components/SkeletonBlock";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname } from "@/lib/i18n";
import { RED, GOLD , PURPLE, redAlpha, goldAlpha} from "@/lib/tokens";

const EVENT_TYPES = ["boxing", "mma", "muay_thai", "sparring", "tournament", "seminar"];

const TYPE_META = {
  boxing:     { mn: "Бокс",     ko: "복싱",    en: "Boxing",      color: RED, emoji: "🥊" },
  mma:        { mn: "MMA",      ko: "MMA",     en: "MMA",         color: PURPLE, emoji: "⚔️" },
  muay_thai:  { mn: "Муай Тай", ko: "무에타이", en: "Muay Thai",   color: "#F97316", emoji: "🦵" },
  sparring:   { mn: "Спарринг", ko: "스파링",   en: "Sparring",    color: "#34D399", emoji: "🤜" },
  tournament: { mn: "Тэмцээн",  ko: "토너먼트", en: "Tournament",  color: GOLD, emoji: "🏆" },
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
          getDocs(query(collection(db, "events"), orderBy("date", "asc"), limit(100))),
          getDocs(query(collection(db, "event_rsvps"), where("userId", "==", user.uid))),
        ]);
        if (!active) return;
        const evs = eventsSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }));
        setEvents(evs);
        setMyRsvpIds(new Set(rsvpSnap.docs.map((d) => d.data().eventId)));
      } catch (e) {
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
    } finally {
      setRsvping(null);
    }
  };

  const handleCreate = async () => {
    if (!cfTitle.trim() || !cfDate) { setCreateError(t("eventErrorRequired")); return; }
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
      setCreateError(t("eventErrorGeneric"));
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

  const upcomingFiltered = filteredEvents.filter(isUpcoming);
  const pastFiltered = filteredEvents.filter((e) => !isUpcoming(e));

  if (!user && !authLoading) return null;

  return (
    <div style={s.page}>
      <div style={s.content}>
        {/* Header */}
        <div style={s.pageHeader}>
          <div>
            <p style={s.kicker}>GAVANA</p>
            <h1 style={s.title}>{t("eventsTitle")}</h1>
          </div>
          <button type="button" style={s.createBtn} onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? t("eventCreateClose") : `+ ${t("eventCreateBtn")}`}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div style={s.createForm}>
            <p style={s.formTitle}>{t("eventNewFormTitle")}</p>
            <input type="text" value={cfTitle} onChange={(e) => setCfTitle(e.target.value)} placeholder={t("eventTitlePlaceholder")} style={s.input} />
            <textarea value={cfDesc} onChange={(e) => setCfDesc(e.target.value)} placeholder={t("eventDescPlaceholder")} style={s.textarea} rows={3} />
            <div style={s.formRow}>
              <div style={{ flex: 1 }}>
                <label style={s.fieldLabel}>{t("eventTypeLabel")}</label>
                <select value={cfType} onChange={(e) => setCfType(e.target.value)} style={s.select}>
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{TYPE_META[t].emoji} {getTypeLabel(t, locale)}</option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.fieldLabel}>{t("eventMaxLabel")}</label>
                <input type="number" value={cfMax} onChange={(e) => setCfMax(e.target.value)} placeholder="∞" style={s.input} min={1} />
              </div>
            </div>
            <input type="datetime-local" value={cfDate} onChange={(e) => setCfDate(e.target.value)} style={s.input} />
            <div style={s.formRow}>
              <input type="text" value={cfCity} onChange={(e) => setCfCity(e.target.value)} placeholder={t("eventCityPlaceholder")} style={{ ...s.input, flex: 1 }} />
              <input type="text" value={cfLocation} onChange={(e) => setCfLocation(e.target.value)} placeholder={t("eventLocationPlaceholder")} style={{ ...s.input, flex: 2 }} />
            </div>
            {createError && <p style={s.errorText}>{createError}</p>}
            <button type="button" style={creating ? s.submitBtnDisabled : s.submitBtn} onClick={handleCreate} disabled={creating}>
              {creating ? t("eventPublishing") : t("eventPublish")}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          {[
            { key: "upcoming", label: t("eventTabUpcoming") },
            { key: "all",      label: t("eventTabAll") },
            { key: "mine",     label: t("eventTabMine") },
          ].map(({ key, label }) => (
            <button key={key} type="button" style={tab === key ? s.tabActive : s.tab} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        {/* Type filter pills */}
        <div style={s.typeFilters}>
          <button type="button" style={typeFilter === "all" ? s.typePillActive : s.typePill} onClick={() => setTypeFilter("all")}>
            {t("eventTabAll")}
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
              <SkeletonBlock key={i} height={130} radius="3px 16px 16px 3px" />
            ))}
          </div>
        )}

        {!loading && filteredEvents.length === 0 ? (
          <EmptyState
            emoji="🏆"
            title={tab === "mine" ? t("eventNoMine") : tab === "upcoming" ? t("eventNoUpcoming") : t("eventNone")}
            hint={t("eventCreateHint")}
          />
        ) : !loading ? (
          <div style={s.eventList}>
            {(tab === "all" ? [
              ...(upcomingFiltered.length > 0 ? [{ _divider: true, key: "div-up", label: t("eventDividerUpcoming") }] : []),
              ...upcomingFiltered,
              ...(pastFiltered.length > 0 ? [{ _divider: true, key: "div-past", label: t("eventDividerPast") }] : []),
              ...pastFiltered,
            ] : filteredEvents).map((event) => {
              if (event._divider) {
                return (
                  <div key={event.key} style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.3)", letterSpacing: 1.5, textTransform: "uppercase", padding: "8px 4px 4px" }}>
                    {event.label}
                  </div>
                );
              }
              const meta = TYPE_META[event.eventType] || TYPE_META.boxing;
              const isGoing = myRsvpIds.has(event.id);
              const upcoming = isUpcoming(event);
              const live = isLive(event);
              const isFull = event.maxParticipants && (event.participantCount || 0) >= event.maxParticipants;
              const spotsUsed = Math.min(event.participantCount || 0, event.maxParticipants || 0);
              const spotsPct = event.maxParticipants ? Math.round((spotsUsed / event.maxParticipants) * 100) : 0;
              return (
                <div key={event.id} style={{ ...s.eventCard, borderLeftColor: live ? "#34D399" : meta.color, opacity: !upcoming && !live ? 0.72 : 1 }}
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
                    {!live && !upcoming && <span style={s.pastBadge}>{t("eventBadgePast")}</span>}
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

                  {/* Spots bar */}
                  {event.maxParticipants > 0 && (
                    <div style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,0.08)", marginBottom: 8, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${spotsPct}%`, borderRadius: 999, background: spotsPct >= 90 ? "#F87171" : spotsPct >= 60 ? GOLD : "#34D399", transition: "width 600ms ease" }} />
                    </div>
                  )}

                  {event.description ? (
                    <p style={s.eventDesc}>{event.description.slice(0, 100)}{event.description.length > 100 ? "…" : ""}</p>
                  ) : null}

                  <div style={s.eventFooter} onClick={(e) => e.stopPropagation()}>
                    <span style={s.organizerLabel}>
                      {t("eventOrganizer")}: {event.organizerName}
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
                          : isGoing ? t("eventGoing")
                          : isFull ? t("eventFull")
                          : t("eventRsvp")}
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
  page: { minHeight: "100dvh", background: "#0B0B0C", color: "#fff" },
  content: { maxWidth: 520, margin: "0 auto", padding: "0 16px calc(90px + env(safe-area-inset-bottom))" },
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingTop: "calc(20px + env(safe-area-inset-top))", paddingBottom: 16 },
  kicker: { margin: "0 0 4px", fontSize: 10, letterSpacing: 2.5, color: GOLD, textTransform: "uppercase", fontWeight: 900 },
  title: { margin: 0, fontSize: 24, fontWeight: 1000, lineHeight: 1.1 },
  createBtn: { padding: "8px 16px", borderRadius: 999, border: `1px solid ${redAlpha(0.4)}`, background: `${redAlpha(0.1)}`, color: "#F87171", fontSize: 13, fontWeight: 900, cursor: "pointer", flexShrink: 0, marginTop: 4 },
  createForm: { background: "#141416", border: `1px solid ${goldAlpha(0.2)}`, borderLeft: `2.5px solid ${GOLD}`, borderRadius: "3px 16px 16px 3px", padding: "16px", marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 },
  formTitle: { margin: 0, fontSize: 12, fontWeight: 900, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase" },
  formRow: { display: "flex", gap: 8 },
  fieldLabel: { display: "block", fontSize: 10, color: "rgba(255,255,255,0.45)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 },
  input: { width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark" },
  textarea: { width: "100%", boxSizing: "border-box", padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit" },
  select: { width: "100%", padding: "11px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark" },
  submitBtn: { width: "100%", padding: 13, borderRadius: 12, border: "none", background: "#FF3B30", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" },
  submitBtnDisabled: { width: "100%", padding: 13, borderRadius: 12, border: "none", background: `${redAlpha(0.3)}`, color: "rgba(255,255,255,0.5)", fontSize: 14, fontWeight: 900, cursor: "not-allowed" },
  errorText: { margin: 0, fontSize: 12, color: "#F87171" },
  tabs: { display: "flex", gap: 6, marginBottom: 12 },
  tab: { flex: 1, padding: "9px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  tabActive: { flex: 1, padding: "9px 0", borderRadius: 10, border: `1px solid ${goldAlpha(0.3)}`, background: `${goldAlpha(0.08)}`, color: GOLD, fontSize: 12, fontWeight: 900, cursor: "pointer" },
  typeFilters: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 14, scrollbarWidth: "none" },
  typePill: { padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  typePillActive: { padding: "5px 12px", borderRadius: 999, border: `1px solid ${goldAlpha(0.4)}`, background: `${goldAlpha(0.12)}`, color: GOLD, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 },
  eventList: { display: "flex", flexDirection: "column", gap: 12 },
  eventCard: { background: "#141416", border: "1px solid rgba(255,255,255,0.06)", borderLeft: "2.5px solid #FF3B30", borderRadius: "3px 16px 16px 3px", padding: "14px 16px", cursor: "pointer", transition: "border-color 0.2s" },
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
  rsvpBtn: { padding: "7px 18px", borderRadius: 999, border: "none", background: "#FF3B30", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 },
  goingBtn: { padding: "7px 18px", borderRadius: 999, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.1)", color: "#34D399", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 },
  fullBtn: { padding: "7px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 700, cursor: "not-allowed", flexShrink: 0 },
};
