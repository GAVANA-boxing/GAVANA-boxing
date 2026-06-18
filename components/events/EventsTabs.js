"use client";

import s from "@/components/events/eventsStyles";

/**
 * Upcoming / All / Mine tab bar.
 *
 * Props:
 *   tab       {string}   – "upcoming" | "all" | "mine"
 *   onTabChange {Function} – called with new tab key
 *   labels    {object}   – { upcoming, all, mine }
 */
export default function EventsTabs({ tab, onTabChange, labels }) {
  const tabs = [
    { key: "upcoming", label: labels.upcoming },
    { key: "all",      label: labels.all },
    { key: "mine",     label: labels.mine },
  ];

  return (
    <div style={s.tabs}>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          style={tab === key ? s.tabActive : s.tab}
          onClick={() => onTabChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
