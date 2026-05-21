"use client";


import { useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/BottomSheet";
import EmptyState from "@/components/EmptyState";
import SkeletonBlock from "@/components/SkeletonBlock";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/coach/coachStyles";
import { CoachCard, MyRequestCard, SparringPostCard } from "@/components/coach/CoachCards";
import { useCoachPageData } from "@/hooks/useCoachPageData";
import Image from "next/image";
import { useCoachPageActions } from "@/hooks/useCoachPageActions";
import { SPECIALTIES, VIBE_FILTERS, LEVELS } from "@/lib/coachConstants";

const AICoach = dynamic(() => import("@/components/AICoach"), { ssr: false });

export default function CoachPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user } = useAuth();

  const [tab, setTab] = useState("ai");
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterVibe, setFilterVibe] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [showCoachFilterSheet, setShowCoachFilterSheet] = useState(false);

  const {
    coaches, sparringPosts, setSparringPosts,
    coachesLoading, sparringLoading,
    myRequests, myRequestsLoading, myRequestCoaches,
  } = useCoachPageData({ tab, userId: user?.uid });

  const {
    requestedIds,
    showSparringForm, setShowSparringForm,
    sparringForm, setSparringForm,
    sparringSaving, sparringSaved,
    handleCoachRequest, handleSparringRequest, handleCreateSparringPost,
  } = useCoachPageActions({ user, router, locale, setSparringPosts });

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

  return (
    <main style={styles.page} className="page-enter">
      {/* Tab strip */}
      <div style={styles.tabStrip}>
        {[
          { key: "ai", label: t("coachTabAI") },
          { key: "coaches", label: t("coachTabCoaches") },
          { key: "sparring", label: t("coachTabSparring") },
          { key: "mine", label: t("coachFilterMyRequests") },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            style={tab === key ? styles.tabActive : styles.tabInactive}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* AI Coach tab */}
      {tab === "ai" && (
        <div style={styles.aiWrap}>
          <div style={{ padding: "0 0 12px", textAlign: "center" }}>
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: `linear-gradient(145deg, ${RED}, #cc2820)`,
                color: "#fff",
                fontSize: 14,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: `0 8px 28px ${redAlpha(0.32)}, inset 0 1px 0 rgba(255,255,255,0.1)`,
              }}
              onClick={() => router.push(`/${locale}/coach/chat`)}
            >
              💬 {t("coachOpenFullChat")}
            </button>
          </div>
          <AICoach />
        </div>
      )}

      {/* Coaches tab */}
      {tab === "coaches" && (
        <div style={styles.content}>
          <header style={styles.pageHeader}>
            <p style={styles.kicker}>COMBAT · TRAINING</p>
            <h1 style={styles.pageTitle}>{t("coachMarketplace")}</h1>
            {user && (
              <button
                type="button"
                style={styles.becomeCoachBtn}
                onClick={() => router.push(`/${locale}/coach/apply`)}
              >
                {t("becomeCoach")}
              </button>
            )}
          </header>

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
              {filterVibe || filterLocation ? "● More" : "More ›"}
            </button>
          </div>

          {/* Full filter sheet */}
          <BottomSheet
            open={showCoachFilterSheet}
            onClose={() => setShowCoachFilterSheet(false)}
            zIndex={300}
            accent={GOLD}
          >
            <p style={styles.filterSheetSectionLabel}>SPECIALTY</p>
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
            <p style={{ ...styles.filterSheetSectionLabel, marginTop: 16 }}>VIBE</p>
            <div style={styles.specialtyScroll}>
              {VIBE_FILTERS.map((v) => (
                <button key={v} type="button" style={filterVibe === v ? styles.vibeChipActive : styles.vibeChip} onClick={() => setFilterVibe((prev) => (prev === v ? "" : v))}>
                  {v}
                </button>
              ))}
            </div>
            <p style={{ ...styles.filterSheetSectionLabel, marginTop: 16 }}>LOCATION</p>
            <input
              type="text"
              placeholder={t("coachLocation")}
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              style={{ ...styles.filterInput, marginBottom: 12 }}
            />
            <p style={styles.filterSheetSectionLabel}>SORT BY</p>
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
                <button type="button" onClick={() => router.push(`/${locale}/coach/apply`)} style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, #cc2820)`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
                  {t("becomeCoach")}
                </button>
              }
            />
          )}

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

          <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
        </div>
      )}

      {/* Sparring tab */}
      {tab === "sparring" && (
        <div style={styles.content}>
          <header style={styles.pageHeader}>
            <p style={styles.kicker}>COMBAT · TRAINING</p>
            <h1 style={styles.pageTitle}>{t("sparringFinder")}</h1>
          </header>

          <button
            type="button"
            style={styles.createPostBtn}
            onClick={() => { setShowSparringForm(true); setSpSaved(false); }}
          >
            + {t("createSparringPost")}
          </button>

          {sparringSaved && (
            <div style={styles.savedBanner}>✓ {t("requestSent")}</div>
          )}

          {sparringLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 12px" }}>
              {[1, 2, 3].map((i) => (
                <SkeletonBlock key={i} height={88} radius={16} />
              ))}
            </div>
          )}

          {!sparringLoading && sparringPosts.length === 0 && (
            <EmptyState emoji="🥊" title={t("sparringNoPosts")} />
          )}

          <div style={styles.cardList}>
            {sparringPosts.map((post) => (
              <SparringPostCard
                key={post.id}
                post={post}
                t={t}
                user={user}
                locale={locale}
                router={router}
                requested={requestedIds.has(post.id)}
                onRequest={handleSparringRequest}
              />
            ))}
          </div>

          <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
        </div>
      )}

      {/* My Requests tab */}
      {tab === "mine" && (
        <div style={styles.content}>
          <header style={styles.pageHeader}>
            <p style={styles.kicker}>COMBAT · TRAINING</p>
            <h1 style={styles.pageTitle}>{t("coachMyRequestsTitle")}</h1>
          </header>

          {!user?.uid ? (
            <EmptyState
              emoji="🔒"
              title={t("coachSignInRequired")}
              action={
                <button type="button" onClick={() => router.push(`/${locale}/login`)} style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, #cc2820)`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
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
                <button type="button" onClick={() => setTab("coaches")} style={{ padding: "12px 28px", borderRadius: 14, background: `linear-gradient(145deg, ${RED}, #cc2820)`, border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer", marginTop: 4, boxShadow: `0 8px 24px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
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

          <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />
        </div>
      )}

      {/* Sparring create form modal */}
      <BottomSheet
        open={showSparringForm}
        onClose={() => setShowSparringForm(false)}
        title={t("createSparringPost")}
        zIndex={300}
        accent={GOLD}
      >
        <label style={styles.fieldLabel}>{t("weightClass")}</label>
        <input
          type="text"
          placeholder={t("coachWeightPlaceholder")}
          value={sparringForm.weight}
          onChange={(e) => setSparringForm((f) => ({ ...f, weight: e.target.value }))}
          style={styles.fieldInput}
        />

        <label style={styles.fieldLabel}>{t("boxingLevel")}</label>
        <select
          value={sparringForm.level}
          onChange={(e) => setSparringForm((f) => ({ ...f, level: e.target.value }))}
          style={styles.fieldSelect}
        >
          <option value="">—</option>
          {LEVELS.map((lv) => (
            <option key={lv} value={lv}>{lv}</option>
          ))}
        </select>

        <label style={styles.fieldLabel}>{t("coachLocation")}</label>
        <input
          type="text"
          placeholder={t("coachLocationPlaceholder")}
          value={sparringForm.location}
          onChange={(e) => setSparringForm((f) => ({ ...f, location: e.target.value }))}
          style={styles.fieldInput}
        />

        <label style={styles.fieldLabel}>{t("availableTime")}</label>
        <input
          type="text"
          placeholder={t("coachAvailPlaceholder")}
          value={sparringForm.availableTime}
          onChange={(e) => setSparringForm((f) => ({ ...f, availableTime: e.target.value }))}
          style={styles.fieldInput}
        />

        <label style={styles.fieldLabel}>{t("sparringNote")}</label>
        <textarea
          placeholder={t("coachNotesPlaceholder")}
          value={sparringForm.note}
          onChange={(e) => setSparringForm((f) => ({ ...f, note: e.target.value }))}
          style={styles.fieldTextarea}
          rows={3}
        />

        <div style={styles.modalActions}>
          <button
            type="button"
            style={styles.cancelBtn}
            onClick={() => setShowSparringForm(false)}
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            style={styles.submitBtn}
            disabled={sparringSaving}
            onClick={handleCreateSparringPost}
          >
            {sparringSaving ? "…" : t("sendRequest")}
          </button>
        </div>
      </BottomSheet>
    </main>
  );
}

