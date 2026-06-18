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
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import s from "@/components/events/eventsStyles";

import EventsPageHeader from "@/components/events/EventsPageHeader";
import DNAMatchBanner   from "@/components/events/DNAMatchBanner";
import CreateEventForm  from "@/components/events/CreateEventForm";
import EventsTabs       from "@/components/events/EventsTabs";
import EventTypeFilter  from "@/components/events/EventTypeFilter";
import EventsList       from "@/components/events/EventsList";

export default function EventsPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = (key) => translate(locale, key);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [events, setEvents]         = useState([]);
  const [myRsvpIds, setMyRsvpIds]   = useState(new Set());
  const [loading, setLoading]       = useState(true);
  const [userArchetype, setUserArchetype] = useState(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [tab, setTab]               = useState("upcoming"); // upcoming | all | mine
  const [typeFilter, setTypeFilter] = useState("all");
  const [rsvping, setRsvping]       = useState(null);

  // ── Create form state ──────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [cfTitle, setCfTitle]       = useState("");
  const [cfDesc, setCfDesc]         = useState("");
  const [cfType, setCfType]         = useState("boxing");
  const [cfDate, setCfDate]         = useState("");
  const [cfLocation, setCfLocation] = useState("");
  const [cfCity, setCfCity]         = useState("");
  const [cfMax, setCfMax]           = useState("");
  const [creating, setCreating]     = useState(false);
  const [createError, setCreateError] = useState("");

  // ── Auth redirect ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.push(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  // ── Load events + RSVPs ────────────────────────────────────────────────────
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
        setEvents(eventsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setMyRsvpIds(new Set(rsvpSnap.docs.map((d) => d.data().eventId)));
      } catch (e) {
        // silent
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user?.uid]);

  // ── Load fighter DNA archetype ─────────────────────────────────────────────
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { getDoc, doc: fsDoc } = await import("firebase/firestore");
        const snap = await getDoc(fsDoc(db, "users", user.uid));
        if (active && snap.exists()) {
          const arch = snap.data()?.fighterDNA?.archetypeKey;
          if (arch) setUserArchetype(arch);
        }
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

  // ── RSVP handler ──────────────────────────────────────────────────────────
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
        setEvents((prev) => prev.map((e) =>
          e.id === event.id ? { ...e, participantCount: Math.max(0, (e.participantCount || 1) - 1) } : e
        ));
      } else {
        await setDoc(doc(db, "event_rsvps", rsvpDocId), {
          eventId: event.id,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "events", event.id), { participantCount: increment(1) });
        setMyRsvpIds((prev) => new Set([...prev, event.id]));
        setEvents((prev) => prev.map((e) =>
          e.id === event.id ? { ...e, participantCount: (e.participantCount || 0) + 1 } : e
        ));
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
            message: `${user.displayName || "Fighter"} ${
              locale === "mn" ? "таны event-д RSVP хийлээ"
              : locale === "ko" ? "님이 이벤트에 참가 신청했습니다"
              : "RSVP'd to your event"
            }: ${event.title}`,
            eventId: event.id,
            read: false,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (e) {
      // silent
    } finally {
      setRsvping(null);
    }
  };

  // ── Create event handler ───────────────────────────────────────────────────
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
      setEvents((prev) =>
        [newEvent, ...prev].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
      );
      setCfTitle(""); setCfDesc(""); setCfType("boxing");
      setCfDate(""); setCfLocation(""); setCfCity(""); setCfMax("");
      setShowCreate(false);
    } catch (e) {
      setCreateError(t("eventErrorGeneric"));
    } finally {
      setCreating(false);
    }
  };

  // ── Derived filtered list ──────────────────────────────────────────────────
  const filteredEvents = events.filter((e) => {
    if (typeFilter !== "all" && e.eventType !== typeFilter) return false;
    if (tab === "upcoming") return new Date(e.date) >= new Date();
    if (tab === "mine") return myRsvpIds.has(e.id) || e.organizerId === user?.uid;
    return true;
  });

  if (!user && !authLoading) return null;

  return (
    <div style={s.page} className="page-enter">
      <EventsPageHeader
        locale={locale}
        showCreate={showCreate}
        onToggle={() => setShowCreate((v) => !v)}
        labels={{
          title:       t("eventsTitle"),
          createBtn:   t("eventCreateBtn"),
          createClose: t("eventCreateClose"),
        }}
      />

      <div style={s.content}>
        <DNAMatchBanner
          userArchetype={userArchetype}
          events={events}
          locale={locale}
          onEventClick={(id) => router.push(`/${locale}/events/${id}`)}
        />

        {showCreate && (
          <CreateEventForm
            locale={locale}
            cfTitle={cfTitle}       setCfTitle={setCfTitle}
            cfDesc={cfDesc}         setCfDesc={setCfDesc}
            cfType={cfType}         setCfType={setCfType}
            cfDate={cfDate}         setCfDate={setCfDate}
            cfLocation={cfLocation} setCfLocation={setCfLocation}
            cfCity={cfCity}         setCfCity={setCfCity}
            cfMax={cfMax}           setCfMax={setCfMax}
            creating={creating}
            createError={createError}
            onSubmit={handleCreate}
            labels={{
              formTitle:  t("eventNewFormTitle"),
              titlePh:    t("eventTitlePlaceholder"),
              descPh:     t("eventDescPlaceholder"),
              typeLabel:  t("eventTypeLabel"),
              maxLabel:   t("eventMaxLabel"),
              cityPh:     t("eventCityPlaceholder"),
              locationPh: t("eventLocationPlaceholder"),
              publish:    t("eventPublish"),
              publishing: t("eventPublishing"),
            }}
          />
        )}

        <EventsTabs
          tab={tab}
          onTabChange={setTab}
          labels={{
            upcoming: t("eventTabUpcoming"),
            all:      t("eventTabAll"),
            mine:     t("eventTabMine"),
          }}
        />

        <EventTypeFilter
          typeFilter={typeFilter}
          onFilterChange={setTypeFilter}
          locale={locale}
          allLabel={t("eventTabAll")}
        />

        <EventsList
          loading={loading}
          authLoading={authLoading}
          tab={tab}
          filteredEvents={filteredEvents}
          myRsvpIds={myRsvpIds}
          rsvping={rsvping}
          locale={locale}
          onRsvp={handleRsvp}
          onEventClick={(id) => router.push(`/${locale}/events/${id}`)}
          labels={{
            noMine:          t("eventNoMine"),
            noUpcoming:      t("eventNoUpcoming"),
            noneAtAll:       t("eventNone"),
            createHint:      t("eventCreateHint"),
            dividerUpcoming: t("eventDividerUpcoming"),
            dividerPast:     t("eventDividerPast"),
            cardLabels: {
              organizer: t("eventOrganizer"),
              going:     t("eventGoing"),
              full:      t("eventFull"),
              rsvp:      t("eventRsvp"),
              badgePast: t("eventBadgePast"),
            },
          }}
        />
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="" />
    </div>
  );
}
