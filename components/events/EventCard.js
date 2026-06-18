"use client";

import s from "@/components/events/eventsStyles";
import { GOLD } from "@/lib/tokens";
import { TYPE_META, getTypeLabel, formatEventDate, isUpcoming, isLive } from "@/components/events/eventHelpers";

/**
 * Single event card.
 *
 * Props:
 *   event        {object}   – event document
 *   locale       {string}
 *   isGoing      {boolean}  – current user has RSVP'd
 *   rsvping      {string|null} – id of event currently being RSVP'd (loading state)
 *   onRsvp       {Function} – called with (event)
 *   onClick      {Function} – called when card body is clicked
 *   labels       {object}   – { organizer, going, full, rsvp, badgePast }
 */
export default function EventCard({ event, locale, isGoing, rsvping, onRsvp, onClick, labels }) {
  const meta = TYPE_META[event.eventType] || TYPE_META.boxing;
  const upcoming = isUpcoming(event);
  const live = isLive(event);
  const isFull = event.maxParticipants && (event.participantCount || 0) >= event.maxParticipants;
  const spotsUsed = Math.min(event.participantCount || 0, event.maxParticipants || 0);
  const spotsPct = event.maxParticipants ? Math.round((spotsUsed / event.maxParticipants) * 100) : 0;

  return (
    <div
      style={{ ...s.eventCard, borderLeftColor: live ? "#34D399" : meta.color, opacity: !upcoming && !live ? 0.72 : 1 }}
      onClick={onClick}
    >
      {/* Top row: type badge + live/past badge */}
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
        {!live && !upcoming && (
          <span style={s.pastBadge}>{labels.badgePast}</span>
        )}
      </div>

      <h3 style={s.eventTitle}>{event.title}</h3>

      {/* Meta chips */}
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

      {/* Spots progress bar */}
      {event.maxParticipants > 0 && (
        <div style={{ height: 3, borderRadius: 999, background: "rgba(255,255,255,0.08)", marginBottom: 8, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${spotsPct}%`,
              borderRadius: 999,
              background: spotsPct >= 90 ? "#F87171" : spotsPct >= 60 ? GOLD : "#34D399",
              transition: "width 600ms ease",
            }}
          />
        </div>
      )}

      {event.description ? (
        <p style={s.eventDesc}>
          {event.description.slice(0, 100)}{event.description.length > 100 ? "…" : ""}
        </p>
      ) : null}

      {/* Footer: organizer + RSVP button */}
      <div style={s.eventFooter} onClick={(e) => e.stopPropagation()}>
        <span style={s.organizerLabel}>
          {labels.organizer}: {event.organizerName}
        </span>
        {upcoming && (
          <button
            type="button"
            disabled={rsvping === event.id || (isFull && !isGoing)}
            onClick={() => onRsvp(event)}
            style={isGoing ? s.goingBtn : isFull ? s.fullBtn : s.rsvpBtn}
          >
            {rsvping === event.id ? "…"
              : isGoing   ? labels.going
              : isFull    ? labels.full
              : labels.rsvp}
          </button>
        )}
      </div>
    </div>
  );
}
