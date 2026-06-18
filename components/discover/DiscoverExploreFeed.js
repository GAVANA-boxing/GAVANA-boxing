"use client";

import Image from "next/image";
import { s } from "@/components/discover/discoverStyles";
import { RED, GOLD } from "@/lib/tokens";
import { ReelRow, HubCard } from "@/components/discover/DiscoverCards";
import { FIGHTER_STYLES, LEARN_CATS } from "@/lib/discoverConstants";
import DNABanner from "@/components/discover/DNABanner";

export default function DiscoverExploreFeed({
  locale,
  t,
  router,
  userArchetype,
  forYouReels,
  exploreLoading,
  exploreError,
  loadExplore,
  selectedStyle,
  setSelectedStyle,
  topCoaches,
  activityChips,
  sparringCount,
  learnOpen,
  setLearnOpen,
  learnCat,
  setLearnCat,
  filteredLearnReels,
}) {
  return (
    <>
      {/* DNA-aware For You Banner */}
      <DNABanner
        userArchetype={userArchetype}
        forYouReels={forYouReels}
        selectedStyle={selectedStyle}
        setSelectedStyle={setSelectedStyle}
        locale={locale}
        router={router}
      />

      {/* Activity pulse strip */}
      <div style={s.activityStrip}>
        {activityChips.map((chip) => (
          <span
            key={chip.key}
            style={{ ...s.activityChip, ...(chip.live ? s.activityChipLive : {}) }}
          >
            {chip.live && <span style={s.activityLiveDot} />}
            {chip.label}
          </span>
        ))}
      </div>

      {/* Sparring lobby banner */}
      <div
        style={s.lobbyBanner}
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/${locale}/sparring`)}
      >
        <span style={s.lobbyGreenDot} />
        <p style={s.lobbyText}>
          <span style={s.lobbyCountBadge}>{sparringCount} fighters</span>{" "}
          looking to spar right now
        </p>
        <span style={s.lobbyArrow}>›</span>
      </div>

      {/* Explore error */}
      {exploreError && !exploreLoading && (
        <div style={{ padding: "20px 16px", textAlign: "center" }}>
          <p style={{ margin: "0 0 10px", color: "#888", fontSize: 14 }}>
            {t("discoverLoadError")}
          </p>
          <button type="button" onClick={loadExplore} style={{ padding: "9px 20px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            {t("discoverRetry")}
          </button>
        </div>
      )}

      {/* Section: TRENDING */}
      <div style={{ padding: "0 16px", marginBottom: 32 }}>
        <div style={s.sectionHeader}>
          <div>
            <p style={{ ...s.sectionKicker, color: RED }}>🔥 TRENDING NOW</p>
            <h2 style={s.sectionTitle}>{t("discoverForYou")}</h2>
          </div>
          <button type="button" onClick={() => router.push(`/${locale}/reels`)} style={s.sectionSeeAll}>
            {t("discoverViewAll")} ›
          </button>
        </div>

        <div style={s.styleChips}>
          {FIGHTER_STYLES.map((style) => (
            <button
              key={style.key}
              type="button"
              onClick={() => setSelectedStyle(style.key)}
              style={{ ...s.styleChip, ...(selectedStyle === style.key ? s.styleChipActive : {}) }}
            >
              {style.emoji} {t(style.labelKey)}
            </button>
          ))}
        </div>

        <ReelRow reels={forYouReels} router={router} locale={locale} loading={exploreLoading} />
        {!exploreLoading && forYouReels.length === 0 && (
          <div style={s.hubEmpty}>
            <p style={s.hubEmptyText}>{t("discoverNoContent")}</p>
          </div>
        )}
      </div>

      {/* Section: CHAMPIONS */}
      {topCoaches.length > 0 && (
        <div style={{ padding: "0 16px", marginBottom: 32 }}>
          <div style={s.sectionHeader}>
            <div>
              <p style={{ ...s.sectionKicker, color: GOLD }}>🏆 TOP FIGHTERS</p>
              <h2 style={s.sectionTitle}>{t("discoverChampions") || "Champions"}</h2>
            </div>
          </div>
          <div style={s.championStrip}>
            {topCoaches.map((coach, i) => {
              const name = coach.displayName || coach.username || "Fighter";
              const photo = coach.photoURL || coach.profileImageUrl || "";
              const initial = name.charAt(0).toUpperCase();
              return (
                <button
                  key={coach.id}
                  type="button"
                  style={s.championCard}
                  onClick={() => router.push(`/${locale}/profile/${coach.id}`)}
                >
                  <div style={s.championAvatarWrap}>
                    <div style={s.championAvatar}>
                      {photo
                        ? <Image src={photo} alt={name} width={58} height={58} style={{ objectFit: "cover" }} />
                        : initial}
                    </div>
                    {i < 2 && <span style={s.championOnlineDot} />}
                  </div>
                  <span style={s.championName}>{name}</span>
                  <span style={s.championRole}>{coach.specialty || "Coach"}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Section: LEARN */}
      <div style={{ padding: "0 16px", marginBottom: 16 }}>
        <div style={s.sectionHeader}>
          <div>
            <p style={{ ...s.sectionKicker, color: GOLD }}>🧠 EDUCATION</p>
            <h2 style={s.sectionTitle}>{t("discoverLearnHub")}</h2>
          </div>
        </div>
      </div>

      <HubCard
        emoji="🧠"
        title={t("discoverLearnHub")}
        accent={GOLD}
        expanded={learnOpen}
        onToggle={() => setLearnOpen((v) => !v)}
      >
        <div style={s.learnChips}>
          {LEARN_CATS.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setLearnCat(cat.key)}
              style={{ ...s.learnChip, ...(learnCat === cat.key ? s.learnChipActive : {}) }}
            >
              {cat.emoji} {locale === "mn" ? cat.mn : locale === "ko" ? cat.ko : cat.label}
            </button>
          ))}
        </div>

        {filteredLearnReels.length > 0 ? (
          <ReelRow reels={filteredLearnReels} router={router} locale={locale} loading={false} />
        ) : (
          <div style={s.hubEmpty}>
            <p style={s.hubEmptyText}>{t("discoverNoCategoryContent")}</p>
          </div>
        )}

        <button type="button" style={s.hubFooterBtn} onClick={() => router.push(`/${locale}/reels`)}>
          {t("discoverBrowseReels")}
        </button>
      </HubCard>
    </>
  );
}
