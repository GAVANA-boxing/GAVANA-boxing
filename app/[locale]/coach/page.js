"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import AICoach from "@/components/AICoach";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname, translate } from "@/lib/i18n";

const SPECIALTIES = [
  "Jab", "Footwork", "Defense", "Conditioning",
  "Technique", "Sparring", "Amateur", "Pro",
];

const LEVELS = ["Amateur", "Fighter", "Pro", "Elite", "Champion"];

function CoachCard({ coach, t, locale, onRequest, requested, router }) {
  const initials = (coach.displayName || coach.username || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <div style={styles.avatarWrap}>
          {coach.photoURL ? (
            <img src={coach.photoURL} alt="" style={styles.avatar} />
          ) : (
            <div style={styles.avatarInitials}>{initials}</div>
          )}
          {coach.coachVerified && (
            <span style={styles.verifiedDot} title={t("verifiedCoach")}>✓</span>
          )}
        </div>

        <div style={styles.cardInfo}>
          <div style={styles.cardNameRow}>
            <span style={styles.cardName}>
              {coach.displayName || coach.username || "Coach"}
            </span>
            {coach.coachVerified && (
              <span style={styles.verifiedBadge}>{t("verifiedCoach")}</span>
            )}
          </div>
          {coach.coachLocation && (
            <div style={styles.cardLocation}>📍 {coach.coachLocation}</div>
          )}
          {Number.isFinite(coach.coachExperienceYears) && coach.coachExperienceYears > 0 && (
            <div style={styles.cardExp}>
              {t("coachExperience").replace("{n}", coach.coachExperienceYears)}
            </div>
          )}
        </div>
      </div>

      {coach.coachSpecialties?.length > 0 && (
        <div style={styles.specialtyRow}>
          {coach.coachSpecialties.slice(0, 4).map((s) => (
            <span key={s} style={styles.specialtyChip}>{s}</span>
          ))}
        </div>
      )}

      {coach.coachBio && (
        <p style={styles.cardBio}>{coach.coachBio}</p>
      )}

      <div style={styles.cardStats}>
        {Number.isFinite(coach.coachRating) && (
          <div style={styles.cardStat}>
            <span style={styles.cardStatNum}>⭐ {coach.coachRating.toFixed(1)}</span>
            <span style={styles.cardStatLbl}>{t("coachRating")}</span>
          </div>
        )}
        {Number.isFinite(coach.coachTotalReviews) && coach.coachTotalReviews > 0 && (
          <div style={styles.cardStat}>
            <span style={styles.cardStatNum}>{coach.coachTotalReviews}</span>
            <span style={styles.cardStatLbl}>{t("coachTotalReviews")}</span>
          </div>
        )}
        {Number.isFinite(coach.completedSessions) && coach.completedSessions > 0 && (
          <div style={styles.cardStat}>
            <span style={styles.cardStatNum}>{coach.completedSessions}</span>
            <span style={styles.cardStatLbl}>{t("coachCompletedSessions")}</span>
          </div>
        )}
        {Number.isFinite(coach.coachStudentsCount) && (
          <div style={styles.cardStat}>
            <span style={styles.cardStatNum}>{coach.coachStudentsCount}</span>
            <span style={styles.cardStatLbl}>{t("coachStudents")}</span>
          </div>
        )}
        {Number.isFinite(coach.coachPricePerSession) && (
          <div style={styles.cardStat}>
            <span style={styles.cardStatNum}>${coach.coachPricePerSession}</span>
            <span style={styles.cardStatLbl}>{t("coachPrice")}</span>
          </div>
        )}
      </div>

      <div style={styles.cardActions}>
        <button
          type="button"
          style={styles.viewProfileBtn}
          onClick={() => router.push(`/${locale}/coach/${coach.id}`)}
        >
          {t("viewProfile")}
        </button>
        <button
          type="button"
          style={requested ? styles.requestedBtn : styles.requestBtn}
          disabled={requested}
          onClick={() => onRequest(coach.id)}
        >
          {requested ? t("requestSent") : t("requestCoach")}
        </button>
      </div>
    </div>
  );
}

function SparringPostCard({ post, t, onRequest, requested, user, router, locale }) {
  return (
    <div style={styles.card}>
      <div style={styles.sparringCardHead}>
        <span style={styles.sparringLevel}>{post.level || "—"}</span>
        {post.weight && <span style={styles.sparringWeight}>{post.weight}</span>}
        {post.location && <span style={styles.sparringLocation}>📍 {post.location}</span>}
      </div>
      {post.availableTime && (
        <div style={styles.sparringTime}>🕐 {post.availableTime}</div>
      )}
      {post.note && <p style={styles.cardBio}>{post.note}</p>}
      <button
        type="button"
        style={requested ? styles.requestedBtn : styles.requestBtn}
        disabled={requested || post.userId === user?.uid}
        onClick={() => {
          if (!user?.uid) { router.push(`/${locale}/login`); return; }
          onRequest(post.id);
        }}
      >
        {post.userId === user?.uid
          ? "Your post"
          : requested
            ? t("requestSent")
            : t("sendRequest")}
      </button>
    </div>
  );
}

export default function CoachPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user } = useAuth();

  const [tab, setTab] = useState("ai");
  const [coaches, setCoaches] = useState([]);
  const [sparringPosts, setSparringPosts] = useState([]);
  const [coachesLoading, setCoachesLoading] = useState(false);
  const [sparringLoading, setSparringLoading] = useState(false);
  const [filterSpecialty, setFilterSpecialty] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [requestedIds, setRequestedIds] = useState(new Set());
  const [showSparringForm, setShowSparringForm] = useState(false);
  const [sparringForm, setSparringForm] = useState({
    weight: "", level: "", location: "", availableTime: "", note: "",
  });
  const [sparringSaving, setSpSaving] = useState(false);
  const [sparringSaved, setSpSaved] = useState(false);
  const coachesLoadedRef = useRef(false);
  const sparringLoadedRef = useRef(false);

  useEffect(() => {
    if (tab !== "coaches" || coachesLoadedRef.current) return;
    coachesLoadedRef.current = true;
    let active = true;
    setCoachesLoading(true);
    getDocs(query(collection(db, "users"), where("isCoach", "==", true)))
      .then((snap) => {
        if (!active) return;
        setCoaches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch(() => {})
      .finally(() => { if (active) setCoachesLoading(false); });
    return () => { active = false; };
  }, [tab]);

  useEffect(() => {
    if (tab !== "sparring" || sparringLoadedRef.current) return;
    sparringLoadedRef.current = true;
    let active = true;
    setSparringLoading(true);
    getDocs(query(collection(db, "sparring_posts"), where("active", "==", true)))
      .then((snap) => {
        if (!active) return;
        setSparringPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch(() => {})
      .finally(() => { if (active) setSparringLoading(false); });
    return () => { active = false; };
  }, [tab]);

  const handleCoachRequest = async (coachId) => {
    if (!user?.uid) { router.push(`/${locale}/login`); return; }
    try {
      await addDoc(collection(db, "coach_requests"), {
        coachId,
        userId: user.uid,
        status: "pending",
        createdAt: serverTimestamp(),
        message: "",
        locale,
      });
      setRequestedIds((prev) => new Set(prev).add(coachId));
    } catch (e) {
      console.error("Failed to send coach request:", e);
    }
  };

  const handleSparringRequest = async (postId) => {
    if (!user?.uid) { router.push(`/${locale}/login`); return; }
    try {
      await addDoc(collection(db, "coach_requests"), {
        sparringPostId: postId,
        userId: user.uid,
        type: "sparring",
        status: "pending",
        createdAt: serverTimestamp(),
        locale,
      });
      setRequestedIds((prev) => new Set(prev).add(postId));
    } catch (e) {
      console.error("Failed to send sparring request:", e);
    }
  };

  const handleCreateSparringPost = async () => {
    if (!user?.uid) { router.push(`/${locale}/login`); return; }
    setSpSaving(true);
    try {
      const docRef = await addDoc(collection(db, "sparring_posts"), {
        userId: user.uid,
        weight: sparringForm.weight,
        level: sparringForm.level,
        location: sparringForm.location,
        availableTime: sparringForm.availableTime,
        note: sparringForm.note,
        active: true,
        createdAt: serverTimestamp(),
        locale,
      });
      setSparringPosts((prev) => [{
        id: docRef.id,
        userId: user.uid,
        ...sparringForm,
        active: true,
      }, ...prev]);
      setSpSaved(true);
      setSparringForm({ weight: "", level: "", location: "", availableTime: "", note: "" });
      setShowSparringForm(false);
    } catch (e) {
      console.error("Failed to create sparring post:", e);
    } finally {
      setSpSaving(false);
    }
  };

  const filteredCoaches = coaches
    .filter((c) => !filterSpecialty || (c.coachSpecialties || []).includes(filterSpecialty))
    .filter((c) => !filterLocation || (c.coachLocation || "").toLowerCase().includes(filterLocation.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "rating") return (b.coachRating || 0) - (a.coachRating || 0);
      if (sortBy === "students") return (b.coachStudentsCount || 0) - (a.coachStudentsCount || 0);
      if (sortBy === "verified") return (b.coachVerified ? 1 : 0) - (a.coachVerified ? 1 : 0);
      return 0;
    });

  return (
    <main style={styles.page}>
      {/* Tab strip */}
      <div style={styles.tabStrip}>
        {[
          { key: "ai", label: t("coachTabAI") },
          { key: "coaches", label: t("coachTabCoaches") },
          { key: "sparring", label: t("coachTabSparring") },
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
          <AICoach />
        </div>
      )}

      {/* Coaches tab */}
      {tab === "coaches" && (
        <div style={styles.content}>
          <header style={styles.pageHeader}>
            <p style={styles.kicker}>GAVANA BOXING</p>
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

          {/* Filters */}
          <div style={styles.filterBar}>
            <div style={styles.specialtyScroll}>
              <button
                type="button"
                style={filterSpecialty === "" ? styles.chipActive : styles.chip}
                onClick={() => setFilterSpecialty("")}
              >
                {t("coachFilterAll")}
              </button>
              {SPECIALTIES.map((s) => (
                <button
                  key={s}
                  type="button"
                  style={filterSpecialty === s ? styles.chipActive : styles.chip}
                  onClick={() => setFilterSpecialty((prev) => prev === s ? "" : s)}
                >
                  {s}
                </button>
              ))}
            </div>

            <div style={styles.filterRow}>
              <input
                type="text"
                placeholder={t("coachLocation")}
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                style={styles.filterInput}
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="rating">{t("coachSortRating")}</option>
                <option value="students">{t("coachSortStudents")}</option>
                <option value="verified">{t("coachSortVerified")}</option>
              </select>
            </div>
          </div>

          {coachesLoading && <div style={styles.loadingText}>Loading…</div>}

          {!coachesLoading && filteredCoaches.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🥊</div>
              <div style={styles.emptyText}>{t("coachNoCoaches")}</div>
              <p style={{ margin: "4px 0 16px", color: "rgba(255,255,255,0.35)", fontSize: 13, textAlign: "center", maxWidth: 260 }}>
                {t("coachNoCoachesSub")}
              </p>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/coach/apply`)}
                style={{ padding: "12px 28px", borderRadius: 14, background: "#C1121F", border: "none", color: "#fff", fontSize: 14, fontWeight: 900, cursor: "pointer" }}
              >
                {t("becomeCoach")}
              </button>
            </div>
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

          <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
        </div>
      )}

      {/* Sparring tab */}
      {tab === "sparring" && (
        <div style={styles.content}>
          <header style={styles.pageHeader}>
            <p style={styles.kicker}>GAVANA BOXING</p>
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

          {sparringLoading && <div style={styles.loadingText}>Loading…</div>}

          {!sparringLoading && sparringPosts.length === 0 && (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🥊</div>
              <div style={styles.emptyText}>{t("sparringNoPosts")}</div>
            </div>
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

          <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
        </div>
      )}

      {/* Sparring create form modal */}
      {showSparringForm && (
        <div style={styles.modalWrap}>
          <div
            style={styles.modalOverlay}
            onClick={() => setShowSparringForm(false)}
          />
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>{t("createSparringPost")}</h2>

            <label style={styles.fieldLabel}>{t("weightClass")}</label>
            <input
              type="text"
              placeholder="e.g. Lightweight, 135 lbs"
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
              placeholder="City / Gym name"
              value={sparringForm.location}
              onChange={(e) => setSparringForm((f) => ({ ...f, location: e.target.value }))}
              style={styles.fieldInput}
            />

            <label style={styles.fieldLabel}>{t("availableTime")}</label>
            <input
              type="text"
              placeholder="e.g. Weekends, evenings"
              value={sparringForm.availableTime}
              onChange={(e) => setSparringForm((f) => ({ ...f, availableTime: e.target.value }))}
              style={styles.fieldInput}
            />

            <label style={styles.fieldLabel}>{t("sparringNote")}</label>
            <textarea
              placeholder="Any additional details…"
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
                Cancel
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
          </div>
        </div>
      )}
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 0%, rgba(193,18,31,0.18), transparent 30%), linear-gradient(180deg, #080808 0%, #0B0B0B 100%)",
    color: "#fff",
    fontFamily: "sans-serif",
  },
  tabStrip: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    background: "rgba(8,8,8,0.92)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    padding: "0 4px",
    paddingTop: "env(safe-area-inset-top)",
  },
  tabActive: {
    flex: 1,
    minHeight: 46,
    border: "none",
    borderBottom: "2px solid #C1121F",
    background: "transparent",
    color: "#fff",
    fontSize: 13,
    fontWeight: 1000,
    letterSpacing: 0.5,
    cursor: "pointer",
  },
  tabInactive: {
    flex: 1,
    minHeight: 46,
    border: "none",
    borderBottom: "2px solid transparent",
    background: "transparent",
    color: "rgba(255,255,255,0.45)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  },
  aiWrap: {
    minHeight: "calc(100vh - 46px)",
  },
  content: {
    maxWidth: 520,
    margin: "0 auto",
    padding: "0 16px calc(104px + env(safe-area-inset-bottom))",
  },
  pageHeader: {
    padding: "22px 0 12px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  becomeCoachBtn: {
    alignSelf: "flex-start",
    background: "rgba(212,175,55,0.12)",
    border: "1px solid rgba(212,175,55,0.4)",
    borderRadius: 20,
    padding: "7px 16px",
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  kicker: {
    margin: 0,
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: 950,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  pageTitle: {
    margin: "4px 0 0",
    fontSize: 28,
    fontWeight: 1000,
    lineHeight: 1.1,
    fontFamily: "var(--font-display, 'Anton', sans-serif)",
  },
  filterBar: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
  },
  specialtyScroll: {
    display: "flex",
    gap: 6,
    overflowX: "auto",
    paddingBottom: 4,
    scrollbarWidth: "none",
  },
  chip: {
    flexShrink: 0,
    padding: "5px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  chipActive: {
    flexShrink: 0,
    padding: "5px 12px",
    borderRadius: 999,
    border: "1px solid rgba(193,18,31,0.6)",
    background: "rgba(193,18,31,0.18)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  filterRow: {
    display: "flex",
    gap: 8,
  },
  filterInput: {
    flex: 1,
    minHeight: 38,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    fontSize: 13,
    outline: "none",
  },
  filterSelect: {
    minHeight: 38,
    padding: "0 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 700,
    outline: "none",
    cursor: "pointer",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    borderRadius: 18,
    padding: "16px",
    background: "linear-gradient(145deg, #131313, #0a0a0a)",
    border: "1px solid rgba(255,255,255,0.09)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  cardTop: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  avatarWrap: {
    position: "relative",
    flexShrink: 0,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid rgba(212,175,55,0.4)",
  },
  avatarInitials: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #C1121F, #7d0812)",
    border: "2px solid rgba(212,175,55,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    fontWeight: 1000,
    color: "#fff",
  },
  verifiedDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#D4AF37",
    color: "#000",
    fontSize: 10,
    fontWeight: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #0a0a0a",
  },
  cardInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 3,
    minWidth: 0,
  },
  cardNameRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  cardName: {
    fontSize: 16,
    fontWeight: 1000,
    color: "#fff",
  },
  verifiedBadge: {
    fontSize: 10,
    fontWeight: 900,
    color: "#D4AF37",
    background: "rgba(212,175,55,0.12)",
    border: "1px solid rgba(212,175,55,0.3)",
    borderRadius: 999,
    padding: "1px 7px",
    letterSpacing: 0.5,
  },
  cardLocation: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    fontWeight: 600,
  },
  cardExp: {
    fontSize: 12,
    color: "#D4AF37",
    fontWeight: 700,
  },
  specialtyRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 5,
  },
  specialtyChip: {
    fontSize: 11,
    fontWeight: 800,
    color: "rgba(255,255,255,0.75)",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.13)",
    borderRadius: 999,
    padding: "3px 9px",
  },
  cardBio: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.62)",
    lineHeight: 1.5,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardStats: {
    display: "flex",
    gap: 16,
  },
  cardStat: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  cardStatNum: {
    fontSize: 14,
    fontWeight: 1000,
    color: "#fff",
  },
  cardStatLbl: {
    fontSize: 10,
    color: "rgba(255,255,255,0.45)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardActions: {
    display: "flex",
    gap: 8,
    marginTop: 2,
  },
  viewProfileBtn: {
    flex: 1,
    minHeight: 38,
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 10,
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  requestBtn: {
    flex: 1,
    minHeight: 38,
    border: "none",
    borderRadius: 10,
    background: "linear-gradient(135deg, #C1121F, #7d0812)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 8px 24px rgba(193,18,31,0.28)",
  },
  requestedBtn: {
    flex: 1,
    minHeight: 38,
    border: "1px solid rgba(52,211,153,0.3)",
    borderRadius: 10,
    background: "rgba(52,211,153,0.1)",
    color: "#34D399",
    fontSize: 13,
    fontWeight: 900,
    cursor: "default",
  },
  createPostBtn: {
    width: "100%",
    minHeight: 48,
    border: "1px solid rgba(212,175,55,0.35)",
    borderRadius: 14,
    background: "linear-gradient(135deg, rgba(193,18,31,0.9), rgba(212,175,55,0.2))",
    color: "#fff",
    fontSize: 14,
    fontWeight: 1000,
    cursor: "pointer",
    marginBottom: 16,
    boxShadow: "0 12px 30px rgba(193,18,31,0.22)",
  },
  savedBanner: {
    padding: "10px 14px",
    borderRadius: 12,
    background: "rgba(52,211,153,0.12)",
    border: "1px solid rgba(52,211,153,0.28)",
    color: "#A7F3D0",
    fontSize: 13,
    fontWeight: 800,
    marginBottom: 12,
  },
  sparringCardHead: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  sparringLevel: {
    fontSize: 13,
    fontWeight: 1000,
    color: "#D4AF37",
    background: "rgba(212,175,55,0.12)",
    border: "1px solid rgba(212,175,55,0.25)",
    borderRadius: 999,
    padding: "3px 10px",
  },
  sparringWeight: {
    fontSize: 13,
    fontWeight: 800,
    color: "#fff",
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 999,
    padding: "3px 10px",
  },
  sparringLocation: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    fontWeight: 600,
  },
  sparringTime: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    fontWeight: 600,
  },
  loadingText: {
    textAlign: "center",
    padding: "40px 0",
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
  },
  emptyState: {
    textAlign: "center",
    padding: "48px 0",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 40,
    opacity: 0.4,
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
    fontWeight: 700,
  },
  modalWrap: {
    position: "fixed",
    inset: 0,
    zIndex: 300,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: "0 0 env(safe-area-inset-bottom)",
  },
  modalOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(6px)",
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: 520,
    maxHeight: "85vh",
    overflowY: "auto",
    borderRadius: "22px 22px 0 0",
    padding: "20px 20px calc(20px + env(safe-area-inset-bottom))",
    background: "linear-gradient(180deg, #161212, #0a0a0a)",
    border: "1px solid rgba(212,175,55,0.18)",
    boxShadow: "0 -24px 60px rgba(0,0,0,0.6)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 1000,
    color: "#fff",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 900,
    color: "#D4AF37",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  fieldInput: {
    width: "100%",
    minHeight: 42,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  fieldSelect: {
    width: "100%",
    minHeight: 42,
    padding: "0 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  },
  fieldTextarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.07)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
    fontFamily: "sans-serif",
    lineHeight: 1.5,
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
  },
  submitBtn: {
    flex: 2,
    minHeight: 46,
    border: "none",
    borderRadius: 12,
    background: "linear-gradient(135deg, #C1121F, #7d0812 60%, #9a6a18)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "0 12px 30px rgba(193,18,31,0.28)",
  },
};
