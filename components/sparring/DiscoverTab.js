"use client";

import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";
import { RED, RED_DARK, redAlpha } from "@/lib/tokens";
import { loc } from "@/lib/loc";
import s from "@/components/sparring/sparringStyles";
import { FighterCard } from "@/components/sparring/SparringCards";
import SparringIntelligence from "@/components/sparring/SparringIntelligence";

const ARCHETYPE_KEYS = ["all", "pressure", "counter", "technical", "brawler"];
const WEIGHT_OPTS = ["all", "-54", "-60", "-67", "-75", "-81", "+91"];

// Demo fighters shown when no real users are available — not actionable
const DEMO_FIGHTERS = [
  { id: "demo-1", isDemo: true, userId: "demo-1", displayName: "Alex R.", archetype: "pressure", weightClass: "-67", rankKey: "rankAmateurBelt", rankColor: "#F87171", bio: "4 years boxing. Looking for technical sparring.", location: "Ulaanbaatar" },
  { id: "demo-2", isDemo: true, userId: "demo-2", displayName: "Kim S.", archetype: "counter",  weightClass: "-60", rankKey: "rankRookieGloves", rankColor: "#fff", bio: "Former national team member. Counter-punching style.", location: "Seoul" },
  { id: "demo-3", isDemo: true, userId: "demo-3", displayName: "M. Bat", archetype: "technical", weightClass: "-75", rankKey: "rankAmateurBelt", rankColor: "#F87171", bio: "Technical boxer, footwork focus. Weekend sessions only.", location: "Ulaanbaatar" },
];

/**
 * Props:
 *   user               – Firebase user
 *   locale             – locale string
 *   t                  – translate(locale, key) shorthand
 *   tab                – current active tab key (used as key for list re-mount)
 *   posts              – all sparring posts
 *   filtered           – posts after archetype/weight filter
 *   filterArchetype    – current archetype filter value
 *   setFilterArchetype – setter
 *   filterWeight       – current weight filter value
 *   setFilterWeight    – setter
 *   isOn               – whether current user's post is active
 *   toggling           – bool
 *   handleToggle       – fn
 *   handleRequest      – fn(post)
 *   sentRequestToIds   – Set of userIds already requested
 *   requesting         – userId currently being requested
 */
export default function DiscoverTab({
  user,
  locale,
  t,
  tab,
  posts,
  filtered,
  filterArchetype,
  setFilterArchetype,
  filterWeight,
  setFilterWeight,
  isOn,
  toggling,
  handleToggle,
  handleRequest,
  sentRequestToIds,
  requesting,
}) {
  return (
    <>
      {/* Sparring Intelligence (8B) */}
      <div style={{ padding: "0 16px", maxWidth: 640, margin: "0 auto" }}>
        <SparringIntelligence user={user} locale={locale} />
      </div>

      {/* Arena live banner */}
      <div style={s.arenaBanner}>
        <div style={s.arenaBannerLeft}>
          <p style={s.arenaKicker}>⚔️ LIVE ARENA</p>
          <h2 style={s.arenaTitle}>
            {t("sparringGymFloor")}
          </h2>
          <div style={s.arenaLiveRow}>
            <span style={s.arenaLiveDot} className="live-pulse" />
            <span style={s.arenaLiveCount}>{posts.length}</span>
            <span style={s.arenaLiveSub}>
              {t("sparringFightersActive")}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={toggling}
          style={{
            ...s.arenaToggleBtn,
            background: isOn
              ? "rgba(52,211,153,0.12)"
              : `linear-gradient(135deg, ${RED}, ${RED_DARK})`,
            border: isOn ? "1px solid rgba(52,211,153,0.3)" : "none",
            color: isOn ? "#34D399" : "#fff",
            boxShadow: isOn ? "none" : `0 6px 18px ${redAlpha(0.3)}`,
            opacity: toggling ? 0.6 : 1,
          }}
        >
          {toggling ? "…" : isOn ? t("sparringStatusActive") : t("sparringStatusJoin")}
        </button>
      </div>

      {/* Filters */}
      <div style={s.filterSection}>
        <div style={s.filterRow}>
          {ARCHETYPE_KEYS.map((key) => {
            const arch = ARCHETYPE_DISPLAY[key];
            const active = filterArchetype === key;
            return (
              <button key={key} type="button" onClick={() => setFilterArchetype(key)} style={{
                ...s.filterChip,
                ...(active ? { background: arch ? `${arch.color}18` : `${redAlpha(0.15)}`, border: `1px solid ${arch ? arch.color : RED}55`, color: arch ? arch.color : "#fff" } : {}),
              }}>
                {key === "all" ? loc(locale, "Бүгд", "전체", "All") : `${arch?.emoji} ${arch?.name.split(" ")[0]}`}
              </button>
            );
          })}
        </div>
        <select value={filterWeight} onChange={(e) => setFilterWeight(e.target.value)} style={s.weightSelect}>
          {WEIGHT_OPTS.map((w) => (
            <option key={w} value={w}>{w === "all" ? loc(locale, "Жингийн ангилал — Бүгд", "체급 — 전체", "Weight Class — All") : w}</option>
          ))}
        </select>
      </div>

      <div style={s.countBar}>
        <span style={s.countTxt}>
          {filtered.length === 0
            ? t("sparringNoFighters")
            : loc(locale, `${filtered.length} тулаанч sparring хайж байна`, `${filtered.length}명 스파링 중`, `${filtered.length} fighter${filtered.length > 1 ? "s" : ""} looking for sparring`)}
        </span>
      </div>

      <div key={tab} style={s.list} className="section-reveal stagger-list">
        {filtered.length === 0 ? (
          filterArchetype !== "all" || filterWeight !== "all" ? (
            // Filter active + no results
            <div style={s.empty}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 4 }}>🥊</div>
              <p style={s.emptyTitle}>{t("sparringFilterNoMatch")}</p>
            </div>
          ) : (
            // No real users — show demo fighters so the feature is understandable
            <>
              <div style={{ padding: "12px 16px 4px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, color: "rgba(255,255,255,0.28)", textTransform: "uppercase" }}>
                  {t("sparringDemoFighters")}
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", fontWeight: 700 }}>
                  {t("sparringDemoHint")}
                </span>
              </div>
              {DEMO_FIGHTERS.map((post) => (
                <div key={post.id} style={{ padding: "0 16px 8px", opacity: 0.72 }}>
                  <FighterCard
                    post={post}
                    isMe={false}
                    onRequest={() => {}} // no-op for demo
                    sent={false}
                    requesting={null}
                    locale={locale}
                    isDemo
                  />
                </div>
              ))}
              <p style={{ ...s.emptySub, textAlign: "center", padding: "4px 24px 8px" }}>
                {t("sparringAddMineHint")}
              </p>
            </>
          )
        ) : (
          filtered.map((post) => (
            <div key={post.id} style={{ padding: "0 16px 8px" }}>
              <FighterCard
                post={post}
                isMe={false}
                onRequest={handleRequest}
                sent={sentRequestToIds.has(post.userId)}
                requesting={requesting}
                locale={locale}
              />
            </div>
          ))
        )}
        <div style={{ height: "calc(24px + env(safe-area-inset-bottom))" }} />
      </div>
    </>
  );
}
