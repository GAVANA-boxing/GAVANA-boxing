"use client";

import { s } from "@/components/discover/discoverStyles";

export default function DiscoverFeedTabs({ feedTab, setFeedTab, t }) {
  return (
    <div style={s.feedTabs}>
      <button
        type="button"
        style={feedTab === "explore" ? s.feedTabActive : s.feedTabBtn}
        onClick={() => setFeedTab("explore")}
      >
        {t("discoverExploreTab")}
      </button>
      <button
        type="button"
        style={feedTab === "following" ? s.feedTabActive : s.feedTabBtn}
        onClick={() => setFeedTab("following")}
      >
        {t("discoverFollowingTab")}
      </button>
    </div>
  );
}
