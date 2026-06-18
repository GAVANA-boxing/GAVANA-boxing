"use client";

import s from "@/components/events/eventsStyles";
import { EVENT_TYPES, TYPE_META, getTypeLabel } from "@/components/events/eventHelpers";

/**
 * Horizontal scrollable type-filter pill bar.
 *
 * Props:
 *   typeFilter   {string}   – current filter ("all" or an EVENT_TYPES value)
 *   onFilterChange {Function} – called with new filter value
 *   locale       {string}
 *   allLabel     {string}   – translated "All" label
 */
export default function EventTypeFilter({ typeFilter, onFilterChange, locale, allLabel }) {
  return (
    <div style={s.typeFilters}>
      <button
        type="button"
        style={typeFilter === "all" ? s.typePillActive : s.typePill}
        onClick={() => onFilterChange("all")}
      >
        {allLabel}
      </button>

      {EVENT_TYPES.map((type) => {
        const meta = TYPE_META[type];
        return (
          <button
            key={type}
            type="button"
            style={
              typeFilter === type
                ? { ...s.typePillActive, borderColor: meta.color, background: `${meta.color}18`, color: meta.color }
                : s.typePill
            }
            onClick={() => onFilterChange(type)}
          >
            {meta.emoji} {getTypeLabel(type, locale)}
          </button>
        );
      })}
    </div>
  );
}
