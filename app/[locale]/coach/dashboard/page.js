"use client";

import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/BottomSheet";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, RED_DARK, GOLD, redAlpha } from "@/lib/tokens";
import styles from "@/components/coach/coachDashboardStyles";
import { RequesterAvatar, RequestCard } from "@/components/coach/DashboardCards";
import { useCoachDashboardData } from "@/hooks/useCoachDashboardData";
import { useCoachDashboardActions } from "@/hooks/useCoachDashboardActions";

export default function CoachDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user, loading: authLoading } = useAuth();

  const {
    requests, setRequests,
    requesterUsers,
    loadingRequests,
    accessDenied,
    completedSessions, setCompletedSessions,
    programs, setPrograms,
  } = useCoachDashboardData({ user, authLoading, router, locale });

  const {
    updating,
    showCreateForm, setShowCreateForm,
    progTitle, setProgTitle, progDesc, setProgDesc,
    progDuration, setProgDuration, progLevel, setProgLevel,
    progSaving,
    bookingRequest, setBookingRequest,
    bookingDate, setBookingDate, bookingTime, setBookingTime,
    bookingDuration, setBookingDuration,
    bookingSubmitting, bookingSuccess,
    completingId, activeFilter, setActiveFilter,
    profileModal, setProfileModal,
    handleAccept, handleDecline, openBookingModal, handleBookingSubmit, handleMarkComplete, handleCreateProgram,
  } = useCoachDashboardActions({ user, locale, t, requests, setRequests, setCompletedSessions, setPrograms });

  if (authLoading || accessDenied) return null;

  const total = requests.length;
  const pending = requests.filter((r) => r.status === "pending").length;
  const accepted = requests.filter((r) => r.status === "accepted").length;
  const declined = requests.filter((r) => r.status === "declined").length;
  const acceptRate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  const filteredRequests = activeFilter === "all"
    ? requests
    : requests.filter((r) => r.status === activeFilter);

  const FILTER_TABS = [
    { key: "all", label: t("coachFilterAll"), count: total },
    { key: "pending", label: t("requestPending"), count: pending },
    { key: "accepted", label: t("coachDashAccepted"), count: accepted },
    { key: "declined", label: t("coachDashDeclined"), count: declined },
  ];

  return (
    <main style={styles.page} className="page-enter">
      <div style={styles.content}>
        {/* Header */}
        <header style={styles.header}>
          <button
            type="button"
            style={styles.backBtn}
            onClick={() => router.push(`/${locale}/coach`)}
          >
            {"<"} {t("navCoach")}
          </button>
          <p style={styles.kicker}>{t("coachDashboardKicker")}</p>
          <h1 style={styles.title}>{t("coachDashboard")}</h1>
        </header>

        {/* Stats panel */}
        <div style={styles.statsPanel}>
          <div style={styles.statCell}>
            <span style={styles.statNum}>{total}</span>
            <span style={styles.statLbl}>{t("totalRequests")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <span style={{ ...styles.statNum, color: "#F59E0B" }}>{pending}</span>
            <span style={styles.statLbl}>{t("pendingRequests")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <span style={{ ...styles.statNum, color: "#34D399" }}>{completedSessions}</span>
            <span style={styles.statLbl}>{t("coachDashCompleted")}</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.statCell}>
            <span style={{ ...styles.statNum, color: "#60A5FA" }}>{acceptRate}%</span>
            <span style={styles.statLbl}>{t("coachWinRate")}</span>
          </div>
        </div>

        {/* Requests list */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ ...styles.sectionTitle, margin: 0 }}>{t("coachRequests")}</h2>
        </div>

        {/* Filter tabs */}
        <div style={styles.filterRow}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              style={{ ...styles.filterTab, ...(activeFilter === tab.key ? styles.filterTabActive : {}) }}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
              {tab.count > 0 && (
                <span style={{ ...styles.filterTabCount, ...(activeFilter === tab.key ? { background: "rgba(255,255,255,0.25)" } : {}) }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loadingRequests && (
          <div style={styles.skeletonWrap}>
            {[0, 1].map((i) => (
              <div key={i} style={styles.skeletonCard} className="skeleton-pulse" />
            ))}
          </div>
        )}

        {!loadingRequests && filteredRequests.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <div style={styles.emptyTitle}>
              {activeFilter === "all" ? t("noRequests") : t("coachDashNoRequests")}
            </div>
            <div style={styles.emptyDesc}>
              {activeFilter === "all"
                ? t("coachDashNoRequestsDesc")
                : (locale === "mn" ? `${FILTER_TABS.find(tab => tab.key === activeFilter)?.label} хүсэлт байхгүй.` : locale === "ko" ? "해당 카테고리에 요청이 없습니다." : `No ${activeFilter} requests.`)}
            </div>
          </div>
        )}

        <div style={styles.cardList}>
          {filteredRequests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              requesterUser={requesterUsers[req.userId]}
              t={t}
              locale={locale}
              updating={updating}
              completingId={completingId}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onSchedule={openBookingModal}
              onMarkComplete={handleMarkComplete}
              onViewProfile={(u, r) => setProfileModal({ user: u, request: r })}
            />
          ))}
        </div>

        {/* Training Programs section — inside same content wrapper */}
        <div style={{ marginTop: 32, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h2 style={{ ...styles.sectionTitle, margin: 0 }}>
              📋 {t("coachDashMyPrograms")}
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              style={{ padding: "7px 14px", borderRadius: 999, border: "none", background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`, color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", boxShadow: `0 4px 16px ${redAlpha(0.28)}, inset 0 1px 0 rgba(255,255,255,0.1)` }}
            >
              {showCreateForm ? "✕" : "+ " + t("coachDashNew")}
            </button>
          </div>

          {showCreateForm && (
            <div style={{ background: "#141416", border: "1px solid rgba(255,255,255,0.06)", borderLeft: "2.5px solid #FF3B30", borderRadius: "3px 14px 14px 3px", padding: "16px", marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                value={progTitle}
                onChange={(e) => setProgTitle(e.target.value)}
                placeholder={t("coachDashProgTitle")}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, outline: "none" }}
              />
              <textarea
                value={progDesc}
                onChange={(e) => setProgDesc(e.target.value)}
                placeholder={t("coachDashProgDesc")}
                rows={3}
                style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit" }}
              />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888", fontWeight: 700, flexShrink: 0 }}>
                  {t("coachDashDurationLabel")}
                </span>
                {[7, 14, 30].map((d) => (
                  <button key={d} type="button" onClick={() => setProgDuration(d)} style={{ padding: "5px 12px", borderRadius: 999, border: "none", background: progDuration === d ? RED : "rgba(255,255,255,0.08)", color: "#fff", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                    {d}{t("coachDashDayShort")}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  ["beginner", "#34D399", t("coachDashLevelBeginner")],
                  ["intermediate", GOLD, t("coachDashLevelIntermediate")],
                  ["advanced", RED, t("coachDashLevelAdvanced")],
                ].map(([lvl, col, lbl]) => (
                  <button key={lvl} type="button" onClick={() => setProgLevel(lvl)} style={{ flex: 1, padding: "6px 0", borderRadius: 999, border: `1px solid ${progLevel === lvl ? col : "rgba(255,255,255,0.1)"}`, background: progLevel === lvl ? `${col}18` : "transparent", color: progLevel === lvl ? col : "#888", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                    {lbl}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleCreateProgram}
                disabled={!progTitle.trim() || progSaving}
                style={{ padding: "11px 0", borderRadius: 10, border: "none", background: progTitle.trim() ? "linear-gradient(135deg, #FF3B30, ${RED_DARK})" : "rgba(255,255,255,0.06)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: progTitle.trim() ? "pointer" : "not-allowed", opacity: progSaving ? 0.6 : 1 }}
              >
                {progSaving ? "…" : t("coachDashSaveProgram")}
              </button>
            </div>
          )}

          {programs.length === 0 && !showCreateForm && (
            <div style={{ textAlign: "center", padding: "32px 20px", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.09)" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                {t("coachDashNoPrograms")}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#555" }}>
                {t("coachDashNoProgramsHint")}
              </p>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {programs.map((prog) => {
              const LEVEL_COLOR = { beginner: "#34D399", intermediate: GOLD, advanced: RED };
              const LEVEL_LBL = {
                beginner: locale === "mn" ? "Анхан" : locale === "ko" ? "입문" : "Beginner",
                intermediate: locale === "mn" ? "Дунд" : locale === "ko" ? "중급" : "Intermediate",
                advanced: locale === "mn" ? "Ахисан" : locale === "ko" ? "고급" : "Advanced",
              };
              const col = LEVEL_COLOR[prog.level] || "#888";
              return (
                <div key={prog.id} style={{ background: "linear-gradient(145deg, #111012, #0a0a0a)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `2.5px solid ${col}`, borderRadius: "3px 14px 14px 3px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", marginBottom: 3 }}>{prog.title}</div>
                    <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#555", fontWeight: 700 }}>
                      <span style={{ color: col }}>{LEVEL_LBL[prog.level] || prog.level}</span>
                      {prog.duration && <span>📅 {prog.duration}{t("coachDashDayShort")}</span>}
                      <span>👥 {prog.enrolledCount || 0} {t("coachDashEnrolled")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ height: "calc(16px + env(safe-area-inset-bottom))" }} />
      </div>

      <BottomNav router={router} user={user} currentLocale={locale} activeTab="profile" />

      {/* Booking modal */}
      <BottomSheet
        open={!!bookingRequest}
        onClose={() => setBookingRequest(null)}
        title={`📅 ${t("scheduleSession")}`}
      >
        <div style={styles.modalSubtitle}>
          {requesterUsers[bookingRequest?.userId]?.displayName || requesterUsers[bookingRequest?.userId]?.username || "Fighter"}
        </div>
        {bookingSuccess ? (
          <div style={styles.bookingSuccessMsg}>✓ {t("sessionScheduled")}</div>
        ) : (
          <>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>{t("bookingDate")}</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                style={styles.modalInput}
              />
            </div>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>{t("bookingTime")}</label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                style={styles.modalInput}
              />
            </div>
            <div style={styles.modalField}>
              <label style={styles.modalLabel}>{t("duration")}</label>
              <select
                value={bookingDuration}
                onChange={(e) => setBookingDuration(Number(e.target.value))}
                style={styles.modalSelect}
              >
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
            <button
              type="button"
              style={{
                ...styles.confirmBtn,
                opacity: (!bookingDate || !bookingTime || bookingSubmitting) ? 0.5 : 1,
              }}
              disabled={!bookingDate || !bookingTime || bookingSubmitting}
              onClick={handleBookingSubmit}
            >
              {bookingSubmitting ? "…" : t("scheduleSession")}
            </button>
          </>
        )}
      </BottomSheet>

      {/* Student profile quick-view modal */}
      <BottomSheet
        open={!!profileModal}
        onClose={() => setProfileModal(null)}
        title={t("coachDashFighterProfile")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <RequesterAvatar user={profileModal?.user} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 1000, color: "#fff" }}>
              {profileModal?.user?.displayName || profileModal?.user?.username || "Fighter"}
            </div>
            {profileModal?.user?.gym && (
              <div style={{ fontSize: 12, color: "#888", fontWeight: 700, marginTop: 2 }}>🏋️ {profileModal.user.gym}</div>
            )}
            {profileModal?.user?.bio && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4, lineHeight: 1.4 }}>
                {profileModal.user.bio}
              </div>
            )}
          </div>
        </div>
        {profileModal?.request?.message && (
          <div style={{ padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, fontStyle: "italic" }}>
            &ldquo;{profileModal.request.message}&rdquo;
          </div>
        )}
        <button
          type="button"
          style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}
          onClick={() => { setProfileModal(null); router.push(`/${locale}/profile/${profileModal?.request?.userId}`); }}
        >
          {t("coachDashViewFull")}
        </button>
      </BottomSheet>

    </main>
  );
}

