"use client";

import { useState } from "react";
import { RED, GOLD } from "@/lib/tokens";
import styles from "@/components/creator/creatorDashboardStyles";
import { formatCompact } from "@/lib/utils";
import { cleanCaption } from "@/lib/reelHelpers";

const TYPE_CONFIG = {
  educational: { emoji: "📚", color: GOLD },
  lifestyle:   { emoji: "🎬", color: "#60A5FA" },
  training:    { emoji: "🥊", color: RED },
};

/**
 * @param {{
 *   reel: object,
 *   stats: object,
 *   rank: number,
 *   maxViews: number,
 *   t: (key: string) => string,
 *   locale: string,
 *   router: import("next/navigation").AppRouterInstance,
 * }} props
 */
export default function ReelRow({ reel, stats, rank, maxViews, t, locale, router }) {
  const [mediaErr, setMediaErr] = useState(false);

  const cfg = TYPE_CONFIG[reel.contentType] ?? TYPE_CONFIG.training;
  const src = reel.thumbnailUrl || reel.thumbnail || reel.videoUrl || "";
  const views = stats?.views || reel.views || 0;
  const likes = stats?.likes || reel.likes || 0;
  const attempts = stats?.challengeAttempts || 0;
  const engRate = views > 0 ? ((likes + attempts) / views * 100).toFixed(1) : "0.0";
  const barPct = maxViews > 0 ? Math.min(100, Math.max(4, Math.round((views / maxViews) * 100))) : 4;
  const dateStr = reel.createdAt?.toDate ? reel.createdAt.toDate().toLocaleDateString() : "";

  return (
    <div
      style={styles.reelRow}
      onClick={() => router.push(`/${locale}/reels?reelId=${reel.id}`)}
    >
      <div style={styles.reelThumb}>
        {src && !mediaErr ? (
          <video
            src={src}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, display: "block" }}
            preload="none"
            muted
            playsInline
            onError={() => setMediaErr(true)}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", borderRadius: 8, background: cfg.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            {cfg.emoji}
          </div>
        )}
      </div>

      <div style={styles.reelRank}>#{rank}</div>

      <div style={styles.reelInfo}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: cfg.color, fontWeight: 900 }}>{cfg.emoji}</span>
          <span style={styles.reelCaption} title={reel.description || reel.caption || ""}>
            {cleanCaption(reel.description || reel.caption || "").slice(0, 46) || t("trainingReel")}
          </span>
        </div>

        <div style={styles.reelBar}>
          <div style={{ ...styles.reelBarFill, width: `${barPct}%` }} />
        </div>

        <div style={styles.reelMeta}>
          <span>👁 {formatCompact(views)}</span>
          <span>❤ {formatCompact(likes)}</span>
          {attempts > 0 && <span>🥊 {formatCompact(attempts)}</span>}
          <span style={{ marginLeft: "auto", color: Number(engRate) >= 5 ? "#34D399" : Number(engRate) >= 2 ? GOLD : "#888" }}>
            {engRate}%
          </span>
        </div>

        {dateStr && <div style={{ fontSize: 10, color: "#444" }}>{dateStr}</div>}
      </div>
    </div>
  );
}
