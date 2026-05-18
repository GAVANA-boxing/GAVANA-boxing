"use client";

import styles from "./reelStyles";

export default function FilterSheet({
  showFilterSheet,
  diffFilter,
  ctFilter,
  setDiffFilter,
  setCtFilter,
  setShowFilterSheet,
  currentLocale,
  t,
}) {
  if (!showFilterSheet) return null;

  return (
    <div style={styles.filterSheetOverlay} onClick={() => setShowFilterSheet(false)}>
      <div style={styles.filterSheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.filterSheetHandle} />
        <div style={styles.filterSheetHeader}>
          <span style={styles.filterSheetTitle}>
            {t("filterSheetTitle") || (currentLocale === "mn" ? "ШҮҮЛТҮҮР" : currentLocale === "ko" ? "필터" : "FILTERS")}
          </span>
          <button type="button" style={styles.filterSheetClose} onClick={() => setShowFilterSheet(false)}>✕</button>
        </div>
        <div style={styles.filterSheetBody}>
          <p style={styles.filterSheetLabel}>
            {t("filterLevelLabel") || (currentLocale === "mn" ? "ТҮВШИН" : currentLocale === "ko" ? "레벨" : "LEVEL")}
          </p>
          <div style={styles.filterSheetRow}>
            {[
              { key: "all", label: currentLocale === "mn" ? "Бүх түвшин" : currentLocale === "ko" ? "전체" : "All levels" },
              { key: "beginner", label: `🟢 ${t("diffBeginner")}` },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setDiffFilter(key)}
                style={{ ...styles.filterChip, ...(diffFilter === key ? styles.filterChipActive : {}) }}
              >
                {label}
              </button>
            ))}
          </div>
          <p style={{ ...styles.filterSheetLabel, marginTop: 16 }}>
            {t("filterContentLabel") || (currentLocale === "mn" ? "КОНТЕНТ" : currentLocale === "ko" ? "콘텐츠" : "CONTENT")}
          </p>
          <div style={styles.filterSheetRow}>
            {[
              { key: "all", label: `📂 ${t("ctFilterAll")}` },
              { key: "training", label: `🥊 ${t("ctFilterTraining")}` },
              { key: "lifestyle", label: `🎬 ${t("ctFilterLifestyle")}` },
              { key: "educational", label: `📚 ${t("ctFilterEducational")}` },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setCtFilter(key)}
                style={{ ...styles.filterChip, ...(ctFilter === key ? styles.filterChipActive : {}) }}
              >
                {label}
              </button>
            ))}
          </div>
          {(diffFilter !== "all" || ctFilter !== "all") && (
            <button
              type="button"
              style={styles.filterClearBtn}
              onClick={() => { setDiffFilter("all"); setCtFilter("all"); }}
            >
              {t("filterClear") || (currentLocale === "mn" ? "Шүүлтүүр арилгах" : currentLocale === "ko" ? "필터 초기화" : "Clear filters")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
