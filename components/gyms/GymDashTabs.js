"use client";

import { RED, GOLD } from "@/lib/tokens";
import styles from "@/components/gyms/gymsDashboardStyles";

export default function GymDashTabs({ activeTab, setActiveTab, joinRequests, members, locale, t }) {
  const tabs = [
    { key: "requests", label: t("gymJoinRequests"), badge: joinRequests.length > 0 ? joinRequests.length : null },
    { key: "members",  label: `${t("gymDashMembersTab")} (${members.length})` },
    { key: "dna",      label: locale === "mn" ? "ДНХ" : locale === "ko" ? "DNA" : "DNA" },
    { key: "sessions", label: t("gymDashSessionsTab") },
    { key: "announce", label: t("gymDashAnnounceTab") },
  ];

  return (
    <div style={{ ...styles.tabs, flexWrap: "wrap" }}>
      {tabs.map(({ key, label, badge }) => (
        <button
          key={key}
          type="button"
          style={{ ...(activeTab === key ? styles.tabActive : styles.tab), position: "relative" }}
          onClick={() => setActiveTab(key)}
        >
          {label}
          {badge && (
            <span style={{
              position: "absolute", top: -4, right: -4,
              minWidth: 16, height: 16, borderRadius: 99,
              background: RED, color: "#fff",
              fontSize: 9, fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0 4px", lineHeight: 1,
              boxShadow: "0 0 0 2px #0a0a0a",
            }}>
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
