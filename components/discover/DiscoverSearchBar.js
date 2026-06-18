"use client";

import { s } from "@/components/discover/discoverStyles";

export default function DiscoverSearchBar({
  query,
  setQuery,
  searching,
  onSubmit,
  onClear,
  t,
}) {
  return (
    <form onSubmit={onSubmit} style={s.searchRow}>
      <div style={s.searchWrap}>
        <svg style={s.searchIconSvg} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder=""
          style={s.searchInput}
        />
        {query && (
          <button type="button" onClick={onClear} style={s.clearBtn} aria-label="Clear search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      <button
        type="submit"
        style={{ ...s.searchBtn, opacity: searching || !query.trim() ? 0.55 : 1, cursor: searching || !query.trim() ? "default" : "pointer" }}
        disabled={searching || !query.trim()}
      >
        {searching ? (
          <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        ) : t("discoverSearch")}
      </button>
    </form>
  );
}
