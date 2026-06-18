"use client";

import EmptyState from "@/components/EmptyState";
import { feed } from "@/components/discover/discoverStyles";
import { FeedPostCard } from "@/components/discover/DiscoverCards";

export default function DiscoverFollowingFeed({
  feedLoading,
  feedLoaded,
  user,
  followingReels,
  followingUsers,
  t,
  router,
  locale,
  onExploreFighters,
}) {
  return (
    <div style={{ padding: "8px 16px 0" }}>
      {feedLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={feed.skeleton} />
          ))}
        </div>
      )}

      {!feedLoading && !user?.uid && (
        <EmptyState
          emoji="🔒"
          title={t("discoverSignInRequired")}
          hint={t("discoverSignInDesc")}
          action={
            <button type="button" style={feed.emptyBtn} onClick={() => router.push(`/${locale}/login`)}>
              {t("discoverSignIn")}
            </button>
          }
        />
      )}

      {!feedLoading && user?.uid && feedLoaded && followingReels.length === 0 && (
        <EmptyState
          emoji="👥"
          title={t("discoverNoFollowing")}
          hint={t("discoverNoFollowingDesc")}
          action={
            <button type="button" style={feed.emptyBtn} onClick={onExploreFighters}>
              {t("discoverExploreFighters")}
            </button>
          }
        />
      )}

      {!feedLoading && followingReels.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {followingReels.map((reel) => (
            <FeedPostCard
              key={reel.id}
              reel={reel}
              authorUser={followingUsers[reel.userId]}
              t={t}
              router={router}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
