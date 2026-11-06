"use client";

import { useState, Component } from "react";
import dynamic from "next/dynamic";

class CoachSectionBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      const { redAlpha, whiteAlpha } = require("@/lib/tokens");
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "22px 16px", textAlign: "center" }}>
          <span style={{ fontSize: 28 }}>⚠️</span>
          <p style={{ margin: 0, color: whiteAlpha(0.35), fontSize: 12, lineHeight: 1.5, maxWidth: 240 }}>
            {this.props.fallbackText || "Section unavailable"}
          </p>
          <button
            onClick={() => this.setState({ failed: false })}
            style={{ padding: "7px 18px", borderRadius: 10, border: `1px solid ${redAlpha(0.35)}`, background: redAlpha(0.08), color: "rgba(248,113,113,0.9)", fontSize: 11, fontWeight: 900, cursor: "pointer", letterSpacing: 0.5 }}
          >
            RETRY →
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/BottomSheet";
import EmptyState from "@/components/EmptyState";
import SkeletonBlock from "@/components/SkeletonBlock";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile } from "@/context/UserProfileProvider";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, RED_DARK, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/coach/coachStyles";
import BrandHeader from "@/components/ui/BrandHeader";
import { BRAND, btnPrimary, glass, glassCard, pageBackground, sectionLabel } from "@/components/ui/brand";
import { CoachCard, MyRequestCard } from "@/components/coach/CoachCards";
import { useCoachPageData } from "@/hooks/useCoachPageData";
import Image from "next/image";
import { useCoachPageActions } from "@/hooks/useCoachPageActions";
import { SPECIALTIES, VIBE_FILTERS } from "@/lib/coachConstants";
import TechniqueQuickAsk from "@/components/coach/TechniqueQuickAsk";
import DNACoachingCTA from "@/components/coach/DNACoachingCTA";
import AISparringPartner from "@/components/coach/AISparringPartner";
import ProPriorityMatchingBanner from "@/components/coach/ProPriorityMatchingBanner";

export default function CoachPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const [tab, setTab] = useState("ai");
  const userArchetype = profile?.fighterDNA?.archetypeKey || null;
  const userTier = profile?.subscriptionTier || profile?.tier || null;

  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterVibe, setFilterVibe] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [showCoachFilterSheet, setShowCoachFilterSheet] = useState(false);

  const {
    coaches,
    coachesLoading,
    myRequests, myRequestsLoading, myRequestCoaches,
  } = useCoachPageData({ tab, userId: user?.uid });

  const {
    requestedIds,
    handleCoachRequest,
  } = useCoachPageActions({ user, router, locale });

  const filteredCoaches = coaches
    .filter((c) => !filterSpecialty || (c.coachSpecialties || []).includes(filterSpecialty))
    .filter((c) => !filterVibe || (c.coachVibes || []).includes(filterVibe))
    .filter((c) => !filterLocation || (c.coachLocation || "").toLowerCase().includes(filterLocation.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "rating") return (b.coachRating || 0) - (a.coachRating || 0);
      if (sortBy === "students") return (b.coachStudentsCount || 0) - (a.coachStudentsCount || 0);
      if (sortBy === "verified") return (b.coachVerified ? 1 : 0) - (a.coachVerified ? 1 : 0);
      return 0;
    });

  const L = (mn, ko, en) => (locale === "mn" ? mn : locale === "ko" ? ko : en);
  const TABS = [
    { key: "ai", label: t("coachTabAI") },
    { key: "coaches", label: t("coachTabCoaches") },
    { key: "mine", label: t("coachFilterMyRequests") },
  ];

  return (
    <main style={{ minHeight: "100dvh", background: pageBackground, color: "#fff" }} className="page-enter">
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 16px" }}>
        <BrandHeader
          kicker={L("Дасгалжуулагч", "코치", "Coach")}
          title={tab === "ai" ? L("Чиний булан", "나의 코너", "Your corner") : tab === "coaches" ? t("coachMarketplace") : t("coachMyRequestsTitle")}
        />

        {/* Segmented control */}
        <div role="tablist" style={{ ...glass, display: "flex", gap: 4, padding: 4, borderRadius: 999, marginBottom: 18 }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, minHeight: 38, border: "none", borderRadius: 999, cursor: "pointer",
                fontFamily: "inherit", fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap",
                background: tab === key ? "#fff" : "transparent",
                color: tab === key ? "#0b0b0d" : BRAND.muted,
                transition: "background 0.2s ease, color 0.2s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Coach tab */}
      {tab === "ai" && (
        <div style={{ maxWidth: 540, margin: "0 auto", padding: "0 16px calc(110px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Corner coach chat — the main thing on this page */}
          <button type="button" onClick={() => router.push(`/${locale}/coach/chat`)} style={{ ...glassCard, position: "relative", overflow: "hidden", padding: 20, textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
            <span aria-hidden="true" style={{ position: "absolute", width: 220, height: 220, right: -70, top: -90, borderRadius: "50%", background: BRAND.red, opacity: 0.3, filter: "blur(50px)" }} />
            <span style={{ position: "relative", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 52, height: 52, borderRadius: 18, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 26, background: "linear-gradient(145deg, #ff4d42, #c81e14)", boxShadow: "0 10px 28px rgba(255,59,48,0.35)" }} aria-hidden="true">🥊</span>
              <span style={{ minWidth: 0 }}>
                <span style={{ ...sectionLabel, display: "block" }}>AI {L("дасгалжуулагч", "코치", "coach")}</span>
                <span style={{ display: "block", marginTop: 4, fontSize: 18, fontWeight: 700, color: "#fff" }}>{L("Юу ч асуу — техник, тактик, бэлтгэл", "기술·전술·훈련, 뭐든 물어보세요", "Ask anything — technique, tactics, training")}</span>
              </span>
            </span>
            <span style={{ ...btnPrimary, position: "relative", marginTop: 16, minHeight: 46 }}>{L("Чат эхлүүлэх", "채팅 시작", "Start chatting")} →</span>
          </button>

          {/* Drill builder (was its own tab) */}
          <button type="button" onClick={() => router.push(`/${locale}/drills`)} style={{ ...glassCard, display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
            <span style={{ width: 44, height: 44, borderRadius: 15, flexShrink: 0, display: "grid", placeItems: "center", fontSize: 22, background: "rgba(245,196,81,0.14)" }} aria-hidden="true">⚡</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 16, fontWeight: 700, color: "#fff" }}>{L("AI дасгал үүсгэгч", "AI 드릴 생성", "AI drill builder")}</span>
              <span style={{ display: "block", marginTop: 3, fontSize: 13, color: BRAND.muted }}>{L("Чиглэлээ сонго — 5 дасгал бэлэн", "목표를 고르면 드릴 5개", "Pick a focus — get 5 drills")}</span>
            </span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={BRAND.faint} strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>

          <CoachSectionBoundary fallbackText="Sparring partner unavailable">
            <AISparringPartner userArchetype={userArchetype} locale={locale} router={router} />
          </CoachSectionBoundary>

          <CoachSectionBoundary fallbackText="DNA coaching unavailable">
            <DNACoachingCTA userArchetype={userArchetype} locale={locale} router={router} />
          </CoachSectionBoundary>

          <div style={{ margin: "0 -16px" }}>
            <CoachSectionBoundary fallbackText="Technique cards unavailable">
              <TechniqueQuickAsk locale={locale} router={router} />
            </CoachSectionBoundary>
          </div>
        </div>
      )}

      {/* Coaches tab */}
      {tab === "coaches" && (
        <div style={styles.content}>
          {user && (
            <button type="button" style={{ ...styles.becomeCoachBtn, marginBottom: 16 }} onClick={() => router.push(`/${locale}/coach/apply`)}>
              {t("becomeCoach")}
            </button>
          )}

          {/* Featured coaches row */}
          {coaches.filter((c) => c.coachVerified || c.coachFeatured).length > 0 && (
            <div style={styles.featuredSection}>
              <p style={styles.featuredLabel}>{t("marketplaceFeatured")}</p>
              <div style={styles.featuredScroll}>
                {coaches.filter((c) => c.coachVerified || c.coachFeatured).slice(0, 6).map((coach) => {
                  const initials = (coach.displayName || coach.username || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <button
                      key={coach.id}
                      type="button"
                      style={styles.featuredChip}
                      onClick={() => router.push(`/${locale}/coach/${coach.id}`)}
                    >
                      {coach.photoURL ? (
                        <Image src={coach.photoURL} alt="" width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={styles.featuredAvatarInitials}>{initials}</div>
                      )}
                      <span style={styles.featuredName}>{coach.displayName || coach.username || "Coach"}</span>
                      {coach.coachVerified && <span style={styles.featuredVerified}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Specialty filter chips — full horizontal scroll */}
          <div style={styles.specialtyChipsRow}>
            <button
              type="button"
              style={filterSpecialty === "" ? styles.specChipActive : styles.specChip}
              onClick={() => setFilterSpecialty("")}
            >
              🥊 {t("coachFilterAll")}
            </button>
            {SPECIALTIES.map((s) => (
              <button
                key={s}
                type="button"
                style={filterSpecialty === s ? styles.specChipActive : styles.specChip}
                onClick={() => setFilterSpecialty((prev) => prev === s ? "" : s)}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Sort + advanced filter row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
            {[
              { key: "rating", label: t("coachSortRating") },
              { key: "students", label: t("coachSortStudents") },
              { key: "verified", label: t("coachSortVerified") },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                style={{
                  padding: "6px 12px",
                  borderRadius: 999,
                  border: sortBy === key ? `1px solid ${goldAlpha(0.6)}` : "1px solid rgba(255,255,255,0.1)",
                  background: sortBy === key ? `${goldAlpha(0.15)}` : "rgba(255,255,255,0.03)",
                  color: sortBy === key ? GOLD : "rgba(255,255,255,0.4)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                onClick={() => setSortBy(key)}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              style={{ marginLeft: "auto", padding: "6px 12px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
              onClick={() => setShowCoachFilterSheet(true)}
            >
              {filterVibe || filterLocation ? t("coachFilterMoreActive") : t("coachFilterMore")}
            </button>
          </div>

          {/* Full filter sheet */}
          <BottomSheet
            open={showCoachFilterSheet}
            onClose={() => setShowCoachFilterSheet(false)}
            zIndex={300}
            accent={GOLD}
          >
            <p style={styles.filterSheetSectionLabel}>{t("coachFilterSpecialty")}</p>
            <div style={styles.specialtyScroll}>
              <button type="button" style={filterSpecialty === "" ? styles.chipActive : styles.chip} onClick={() => setFilterSpecialty("")}>
                {t("coachFilterAll")}
              </button>
              {SPECIALTIES.map((s) => (
                <button key={s} type="button" style={filterSpecialty === s ? styles.chipActive : styles.chip} onClick={() => setFilterSpecialty((prev) => prev === s ? "" : s)}>
                  {s}
                </button>
              ))}
            </div>
            <p style={{ ...styles.filterSheetSectionLabel, marginTop: 16 }}>{t("coachFilterVibe")}</p>
            <div style={styles.specialtyScroll}>
              {VIBE_FILTERS.map((v) => (
                <button key={v} type="button" style={filterVibe === v ? styles.vibeChipActive : styles.vibeChip} onClick={() => setFilterVibe((prev) => (prev === v ? "" : v))}>
                  {v}
                </button>
              ))}
            </div>
            <p style={{ ...styles.filterSheetSectionLabel, marginTop: 16 }}>{t("coachLocation")}</p>
            <input
              type="text"
              placeholder={t("coachLocation")}
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              style={{ ...styles.filterInput, marginBottom: 12 }}
            />
            <p style={styles.filterSheetSectionLabel}>{t("coachFilterSortBy")}</p>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={styles.filterSelect}>
              <option value="rating">{t("coachSortRating")}</option>
              <option value="students">{t("coachSortStudents")}</option>
              <option value="verified">{t("coachSortVerified")}</option>
            </select>
            <button type="button" style={styles.filterSheetDone} onClick={() => setShowCoachFilterSheet(false)}>{t("coachFilterDone")}</button>
          </BottomSheet>

          {coachesLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 12px" }}>
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} height={88} radius={16} />
              ))}
            </div>
          )}

          {!coachesLoading && filteredCoaches.length === 0 && (
            <EmptyState
              emoji="🥊"
              title={t("coachNoCoaches")}
              hint={t("coachNoCoachesSub")}
              action={
                <button type="button" onClick={() => router.push(`/${locale}/coach/apply`)} style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
                  {t("becomeCoach")}
                </button>
              }
            />
          )}

          <ProPriorityMatchingBanner
            userArchetype={userArchetype}
            userTier={userTier}
            locale={locale}
            router={router}
          />

          <div style={styles.cardList}>
            {filteredCoaches.map((coach) => (
              <CoachCard
                key={coach.id}
                coach={coach}
                t={t}
                locale={locale}
                router={router}
                requested={requestedIds.has(coach.id)}
                onRequest={handleCoachRequest}
              />
            ))}
          </div>

        </div>
      )}

      {/* My Requests tab */}
      {tab === "mine" && (
        <div style={styles.content}>
          {!user?.uid ? (
            <EmptyState
              emoji="🔒"
              title={t("coachSignInRequired")}
              action={
                <button type="button" onClick={() => router.push(`/${locale}/login`)} style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
                  {t("coachSignInBtn")}
                </button>
              }
            />
          ) : myRequestsLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 12px" }}>
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} height={88} radius={16} />
              ))}
            </div>
          ) : myRequests.length === 0 ? (
            <EmptyState
              emoji="📋"
              title={t("coachNoRequests")}
              hint={t("coachNoRequestsHint")}
              action={
                <button type="button" onClick={() => setTab("coaches")} style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", marginTop: 4, boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
                  {t("coachFindCoach")}
                </button>
              }
            />
          ) : (
            <div style={styles.cardList}>
              {myRequests.map((req) => (
                <MyRequestCard
                  key={req.id}
                  req={req}
                  coachProfile={myRequestCoaches[req.coachId]}
                  t={t}
                  locale={locale}
                  router={router}
                />
              ))}
            </div>
          )}

        </div>
      )}

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
    </main>
  );
}
