"use client";

import { GOLD, RED } from "@/lib/tokens";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { formatRelativeTime } from "@/lib/notificationHelpers";
import { getTimestampMs } from "@/lib/utils";

const TYPE_META = {
  pvp_challenge: { icon: "⚔️", color: RED },
  pvp_win:       { icon: "🏆", color: GOLD },
  rank_up:       { icon: "🥋", color: "#a78bfa" },
  new_reel:      { icon: "🎬", color: "#34D399" },
  follow:        { icon: "👤", color: "#60A5FA" },
};

function ActivityItem({ item }) {
  const meta = TYPE_META[item.type] || { icon: "🥊", color: RED };
  const ts   = getTimestampMs(item.createdAt);
  const time = ts ? formatRelativeTime(ts) : "";

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
        background: `${meta.color}18`,
        border: `1px solid ${meta.color}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 17,
      }}>
        {meta.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.35 }}>
          <span style={{ color: meta.color }}>{item.actorName || "Fighter"}</span>
          {" "}{item.message || "had recent activity"}
        </p>
        {time && (
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>{time}</span>
        )}
      </div>
    </div>
  );
}

export default function ActivityFeed({ user, t, maxItems = 10 }) {
  const { items, loading } = useActivityFeed({ user, maxItems });

  if (loading) {
    return (
      <div style={{ padding: "16px 0" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,0.06)", width: "70%" }} />
              <div style={{ height: 10, borderRadius: 6, background: "rgba(255,255,255,0.04)", width: "40%" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
        🥊 {t ? t("activityEmpty") : "No recent activity. Follow fighters to see their training!"}
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <ActivityItem key={item.id} item={item} />
      ))}
    </div>
  );
}
