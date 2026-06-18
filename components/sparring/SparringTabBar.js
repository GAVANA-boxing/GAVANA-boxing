"use client";

import s from "@/components/sparring/sparringStyles";

/**
 * Props:
 *   tab            – current active tab key
 *   setTab         – setter
 *   tabs           – array of { key, label, badge? }
 */
export default function SparringTabBar({ tab, setTab, tabs }) {
  return (
    <div style={s.tabBar}>
      {tabs.map(({ key, label, badge }) => (
        <button
          key={key}
          type="button"
          onClick={() => setTab(key)}
          style={{ ...s.tabBtn, ...(tab === key ? s.tabBtnActive : {}) }}
        >
          {label}
          {badge > 0 && (
            <span style={s.tabBadge}>{badge > 9 ? "9+" : badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}
