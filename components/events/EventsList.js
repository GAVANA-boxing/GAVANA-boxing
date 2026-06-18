"use client";

import SkeletonBlock from "@/components/SkeletonBlock";
import EmptyState from "@/components/EmptyState";
import EventCard from "@/components/events/EventCard";
import s from "@/components/events/eventsStyles";
import { isUpcoming } from "@/components/events/eventHelpers";

/**
 * Renders the full events list — skeletons while loading, empty state, or cards.
 * When tab === "all" it inserts upcoming/past dividers automatically.
 *
 * Props:
 *   loading        {boolean}
 *   authLoading    {boolean}
 *   tab            {string}    – "upcoming" | "all" | "mine"
 *   filteredEvents {Array}
 *   myRsvpIds      {Set}
 *   rsvping        {string|null}
 *   locale         {string}
 *   onRsvp         {Function} – (event) => void
 *   onEventClick   {Function} – (eventId) => void
 *   labels         {object}   – {
 *                     noMine, noUpcoming, noneAtAll, createHint,
 *                     dividerUpcoming, dividerPast,
 *                     cardLabels: { organizer, going, full, rsvp, badgePast }
 *                   }
 */
export default function EventsList({
  loading,
  authLoading,
  tab,
  filteredEvents,
  myRsvpIds,
  rsvping,
  locale,
  onRsvp,
  onEventClick,
  labels,
}) {
  if (authLoading || loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <SkeletonBlock key={i} height={130} radius="3px 16px 16px 3px" />
        ))}
      </div>
    );
  }

  if (filteredEvents.length === 0) {
    const title =
      tab === "mine"     ? labels.noMine
      : tab === "upcoming" ? labels.noUpcoming
      : labels.noneAtAll;
    return <EmptyState emoji="🏆" title={title} hint={labels.createHint} />;
  }

  const upcomingFiltered = filteredEvents.filter(isUpcoming);
  const pastFiltered     = filteredEvents.filter((e) => !isUpcoming(e));

  const items =
    tab === "all"
      ? [
          ...(upcomingFiltered.length > 0 ? [{ _divider: true, key: "div-up",   label: labels.dividerUpcoming }] : []),
          ...upcomingFiltered,
          ...(pastFiltered.length    > 0 ? [{ _divider: true, key: "div-past", label: labels.dividerPast }]     : []),
          ...pastFiltered,
        ]
      : filteredEvents;

  return (
    <div style={s.eventList} className="stagger-list">
      {items.map((event) => {
        if (event._divider) {
          return (
            <div
              key={event.key}
              style={{
                fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.3)",
                letterSpacing: 1.5, textTransform: "uppercase", padding: "8px 4px 4px",
              }}
            >
              {event.label}
            </div>
          );
        }

        return (
          <EventCard
            key={event.id}
            event={event}
            locale={locale}
            isGoing={myRsvpIds.has(event.id)}
            rsvping={rsvping}
            onRsvp={onRsvp}
            onClick={() => onEventClick(event.id)}
            labels={labels.cardLabels}
          />
        );
      })}
    </div>
  );
}
