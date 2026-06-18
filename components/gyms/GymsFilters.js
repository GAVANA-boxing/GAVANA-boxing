"use client";

import { GOLD } from "@/lib/tokens";
import styles from "@/components/gyms/gymsStyles";
import { GYM_TYPES, GYM_TYPE_KEYS, VIBE_FILTERS, VIBE_LABELS } from "@/lib/gymConstants";

export function GymsSortRow({ sortMode, nearbyLoading, onSortChange, onNearby, t }) {
  return (
    <div style={styles.sortRow}>
      {[
        { key: "topRated", label: t("gymsTopRated") },
        { key: "newest",   label: t("gymsNewest") },
        { key: "nearby",   label: t("gymsNearby") },
      ].map(({ key, label }) => (
        <button
          key={key}
          type="button"
          style={sortMode === key ? styles.sortBtnActive : styles.sortBtn}
          onClick={() => {
            if (key === "nearby") onNearby();
            else onSortChange(key);
          }}
        >
          {nearbyLoading && key === "nearby" ? "…" : label}
        </button>
      ))}
    </div>
  );
}

export function GymsFiltersRow({ cityFilter, cities, verifiedOnly, onCityChange, onVerifiedChange, t }) {
  return (
    <div style={styles.filtersRow}>
      <select
        value={cityFilter}
        onChange={(e) => onCityChange(e.target.value)}
        style={styles.filterSelect}
      >
        <option value="">{t("gymsAllCities")}</option>
        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>

      <label style={styles.verifiedToggle}>
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={(e) => onVerifiedChange(e.target.checked)}
          style={{ marginRight: 6, accentColor: GOLD }}
        />
        {t("gymsVerifiedOnly")}
      </label>
    </div>
  );
}

export function GymsVibeRow({ filterVibe, onVibeChange, locale }) {
  return (
    <div style={styles.vibeRow}>
      {VIBE_FILTERS.map((v) => {
        const lbl =
          locale === "mn" ? (VIBE_LABELS[v]?.mn || v) :
          locale === "ko" ? (VIBE_LABELS[v]?.ko || v) : v;
        return (
          <button
            key={v}
            type="button"
            style={filterVibe === v ? styles.vibeActive : styles.vibeBtn}
            onClick={() => onVibeChange((prev) => (prev === v ? "" : v))}
          >
            {lbl}
          </button>
        );
      })}
    </div>
  );
}

export function GymsCategoryRow({ selectedType, onTypeChange, t }) {
  return (
    <div style={styles.catRow}>
      <button
        type="button"
        style={selectedType === "all" ? styles.catActive : styles.catBtn}
        onClick={() => onTypeChange("all")}
      >
        {t("gymsAll")}
      </button>
      {GYM_TYPES.map((type) => (
        <button
          key={type}
          type="button"
          style={selectedType === type ? styles.catActive : styles.catBtn}
          onClick={() => onTypeChange(type)}
        >
          {t(GYM_TYPE_KEYS[type])}
        </button>
      ))}
    </div>
  );
}
