"use client";

import Image from "next/image";
import EmptyState from "@/components/EmptyState";
import { s } from "@/components/discover/discoverStyles";
import { GOLD, goldAlpha } from "@/lib/tokens";
import { formatCompact } from "@/lib/utils";

export default function DiscoverSearchResults({
  searching,
  searchError,
  userResults,
  reelResults,
  t,
  router,
  locale,
  onRetry,
}) {
  return (
    <div style={s.content}>
      {searching && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 16px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer" style={{ height: 60, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {searchError && !searching && (
        <EmptyState
          emoji="⚠️"
          title={t("discoverSearchFailed")}
          action={
            <button
              type="button"
              onClick={onRetry}
              style={{ marginTop: 4, padding: "8px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            >
              {t("discoverRetry")}
            </button>
          }
        />
      )}

      {!searching && !searchError && userResults.length > 0 && (
        <div style={{ padding: "0 16px", marginBottom: 28 }}>
          <p style={s.sectionLabel}>{t("discoverFighters")}</p>
          <div style={s.listStack}>
            {userResults.map((u) => {
              const photo = u.photoURL || u.profileImageUrl || "";
              const initial = (u.displayName || u.username || "U").charAt(0).toUpperCase();
              return (
                <button key={u.id} type="button" onClick={() => router.push(`/${locale}/profile/${u.id}`)} style={s.listCard}>
                  <div style={s.listAvatar}>
                    {photo ? <Image src={photo} alt="" width={40} height={40} style={{ objectFit: "cover" }} /> : initial}
                  </div>
                  <div style={s.listCardText}>
                    <span style={s.listCardName}>{u.displayName || u.username || t("fallbackUnnamed")}</span>
                    {u.username && <span style={s.listCardSub}>@{u.username}</span>}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#444", flexShrink: 0 }} aria-hidden="true"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!searching && !searchError && reelResults.length > 0 && (
        <div style={{ padding: "0 16px", marginBottom: 28 }}>
          <p style={s.sectionLabel}>{t("discoverReels")}</p>
          <div style={s.listStack}>
            {reelResults.map((r) => (
              <button key={r.id} type="button" onClick={() => router.push(`/${locale}/reels?reelId=${r.id}`)} style={s.listCard}>
                <div style={{ ...s.listAvatar, background: `${goldAlpha(0.15)}`, color: GOLD, fontSize: 18 }}>🎬</div>
                <div style={s.listCardText}>
                  <span style={s.listCardName}>{r.caption || r.description || t("fallbackReel")}</span>
                  <span style={s.listCardSub}>{formatCompact(r.views || 0)} {t("views")}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: "#444", flexShrink: 0 }} aria-hidden="true"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {!searching && !searchError && userResults.length === 0 && reelResults.length === 0 && (
        <EmptyState
          emoji="🔍"
          title={t("discoverNoResults")}
          hint={t("discoverNoResultsSub")}
        />
      )}
    </div>
  );
}
