"use client";

import s from "@/components/events/eventsStyles";

/**
 * Sticky page header with title and create-event toggle button.
 *
 * Props:
 *   locale       {string}   – current locale ("mn" | "ko" | "en")
 *   showCreate   {boolean}  – whether the create form is open
 *   onToggle     {Function} – called when the button is clicked
 *   labels       {object}   – { title, createBtn, createClose }
 */
export default function EventsPageHeader({ locale, showCreate, onToggle, labels }) {
  return (
    <div style={s.pageHeader}>
      <div>
        <p style={s.kicker}>COMBAT · EVENTS</p>
        <h1 style={s.title}>{labels.title}</h1>
      </div>
      <button type="button" style={s.createBtn} onClick={onToggle}>
        {showCreate ? labels.createClose : `+ ${labels.createBtn}`}
      </button>
    </div>
  );
}
