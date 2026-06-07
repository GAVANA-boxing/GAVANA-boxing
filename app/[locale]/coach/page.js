"use client";


import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import BottomSheet from "@/components/BottomSheet";
import EmptyState from "@/components/EmptyState";
import SkeletonBlock from "@/components/SkeletonBlock";
import { useAuth } from "@/lib/AuthContext";
import { getLocaleFromPathname, translate } from "@/lib/i18n";
import { RED, RED_DARK, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import styles from "@/components/coach/coachStyles";
import { CoachCard, MyRequestCard } from "@/components/coach/CoachCards";
import { useCoachPageData } from "@/hooks/useCoachPageData";
import Image from "next/image";
import { useCoachPageActions } from "@/hooks/useCoachPageActions";
import { SPECIALTIES, VIBE_FILTERS } from "@/lib/coachConstants";
import { FIGHTERS } from "@/lib/fighters";
import { FIGHTER_TECHNIQUES } from "@/lib/fighterTechniques";

const AICoach = dynamic(() => import("@/components/AICoach"), { ssr: false });

export default function CoachPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const t = (key) => translate(locale, key);
  const { user } = useAuth();

  const [tab, setTab] = useState("ai");
  const [userArchetype, setUserArchetype] = useState(null);
  const [userTier, setUserTier] = useState(null);

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;
    (async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDoc(doc(db, "users", user.uid));
        if (active && snap.exists()) {
          const arch = snap.data()?.fighterDNA?.archetypeKey;
          if (arch) setUserArchetype(arch);
          setUserTier(snap.data()?.subscriptionTier || snap.data()?.tier || null);
        }
      } catch { /* silent */ }
    })();
    return () => { active = false; };
  }, [user?.uid]);

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

  return (
    <main style={styles.page} className="page-enter">
      {/* Tab strip */}
      <div style={styles.tabStrip}>
        {[
          { key: "ai", label: t("coachTabAI") },
          { key: "coaches", label: t("coachTabCoaches") },
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
          {/* Technique quick-ask cards — fighter HD photo background */}
          {(() => {
            const TECH_Q = {
              en: (fighter, tech) => `Coach, teach me ${fighter.name}'s "${tech.title}" technique. What are the key points I must focus on?`,
              mn: (fighter, tech) => `Coach, ${fighter.name}-ийн "${tech.title}" техникийг заагаарай. Яг юунд анхаарах ёстой вэ?`,
              ko: (fighter, tech) => `코치님, ${fighter.name}의 "${tech.title}" 기술을 가르쳐주세요. 핵심 포인트는 무엇인가요?`,
            };
            const qFn = TECH_Q[locale] || TECH_Q.en;
            const cards = FIGHTERS.flatMap((f) =>
              (FIGHTER_TECHNIQUES[f.id] || []).slice(0, 2).map((tech) => ({ fighter: f, tech }))
            );
            return (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 2, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", marginBottom: 10 }}>
                  {locale === "mn" ? "Техник асуух" : locale === "ko" ? "기술 질문하기" : "Ask About a Technique"}
                </div>
                <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
                  {cards.map(({ fighter, tech }) => (
                    <button
                      key={`${fighter.id}-${tech.title}`}
                      type="button"
                      onClick={() => router.push(`/${locale}/coach/chat?q=${encodeURIComponent(qFn(fighter, tech))}`)}
                      style={{
                        flexShrink: 0, scrollSnapAlign: "start",
                        width: 150, height: 110,
                        borderRadius: 14, overflow: "hidden",
                        position: "relative", cursor: "pointer",
                        border: `1px solid ${fighter.accent}30`,
                        background: "#0a0a0c",
                      }}
                    >
                      {/* Fighter HD photo */}
                      {fighter.imageUrl && (
                        <img
                          src={fighter.imageUrl}
                          alt={fighter.name}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%" }}
                        />
                      )}
                      {/* Dark gradient overlay */}
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)" }} />
                      {/* Accent tint */}
                      <div style={{ position: "absolute", inset: 0, background: `${fighter.accent}20` }} />
                      {/* Text */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px" }}>
                        <div style={{ fontSize: 7.5, fontWeight: 900, color: fighter.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3, opacity: 0.9 }}>
                          {fighter.name}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: "#fff", lineHeight: 1.2, textAlign: "left" }}>
                          {tech.title}
                        </div>
                      </div>
                      {/* Ask badge */}
                      <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: `1px solid ${fighter.accent}55`, borderRadius: 10, padding: "2px 7px", backdropFilter: "blur(4px)" }}>
                        <span style={{ fontSize: 7.5, fontWeight: 900, color: fighter.accent }}>ASK →</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          {/* DNA-aware coaching CTA */}
          {userArchetype && (() => {
            const ARCH_COLORS_C = { pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981" };
            const ARCH_LABELS_C = {
              pressure:   { en: "Pressure Fighter", mn: "Дарамтын тулаанч", ko: "프레셔 파이터" },
              outboxer:   { en: "Outboxer", mn: "Аутбоксер", ko: "아웃복서" },
              counter:    { en: "Counter Fighter", mn: "Контр тулаанч", ko: "카운터 파이터" },
              explosive:  { en: "Explosive Fighter", mn: "Тэсрэлтийн тулаанч", ko: "폭발적 파이터" },
              technician: { en: "Technician", mn: "Техникч", ko: "테크니션" },
            };
            const acc = ARCH_COLORS_C[userArchetype] || GOLD;
            const archLabel = ARCH_LABELS_C[userArchetype]?.[locale] || userArchetype;
            const dnaQ = locale === "mn"
              ? `Би ${archLabel} архетиптэй. Энэ хэв маягаа хөгжүүлэхийн тулд өнөөдөр юу хийх вэ?`
              : locale === "ko"
              ? `저는 ${archLabel} 아키타입입니다. 이 스타일을 발전시키기 위해 오늘 무엇을 해야 할까요?`
              : `I'm a ${archLabel}. What should I focus on today to develop this style?`;
            return (
              <div style={{ marginBottom: 12, padding: "12px 14px", borderRadius: 14, background: `${acc}0c`, border: `1px solid ${acc}25` }}>
                <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: acc, textTransform: "uppercase", marginBottom: 6 }}>
                  🧬 {locale === "mn" ? "ТАНЫ ДНХ ДЭЭР ҮНДЭСЛЭН" : locale === "ko" ? "내 DNA 기반" : "BASED ON YOUR DNA"}
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 10 }}>
                  {locale === "mn" ? `${archLabel} гэж хэрхэн бэлтгэх вэ?` : locale === "ko" ? `${archLabel}로 훈련하는 방법은?` : `How to train as a ${archLabel}?`}
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/coach/chat?q=${encodeURIComponent(dnaQ)}`)}
                  style={{ padding: "8px 16px", borderRadius: 10, background: `${acc}18`, border: `1px solid ${acc}40`, color: acc, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
                >
                  {locale === "mn" ? "Асуух →" : locale === "ko" ? "질문하기 →" : "Ask Coach →"}
                </button>
              </div>
            );
          })()}

          {/* AI Sparring Partner */}
          {(() => {
            const SP_L = {
              en: { kicker: "AI SPARRING", title: "Spar Your Opposite", sub: "Train against your counter-style", btn: "Get Counter-Combos →" },
              mn: { kicker: "AI СПАРРИНГ", title: "Эсрэг архетиптэй спарринг", sub: "Эсрэг хэв маяг дээр бэлтгэл хий", btn: "Эсрэг комбо авах →" },
              ko: { kicker: "AI 스파링", title: "반대 스타일과 스파링", sub: "카운터 스타일로 훈련하기", btn: "카운터 콤보 받기 →" },
            };
            const OPPONENT_CYCLE = ["pressure", "outboxer", "counter", "explosive", "technician"];
            const OPPONENT_COLORS = { pressure: "#EF4444", outboxer: "#3B82F6", counter: "#8B5CF6", explosive: "#F59E0B", technician: "#10B981" };
            const OPPONENT_LABELS = {
              pressure:   { en: "Pressure Fighter", mn: "Дарамтын тулаанч", ko: "프레셔 파이터" },
              outboxer:   { en: "Outboxer", mn: "Аутбоксер", ko: "아웃복서" },
              counter:    { en: "Counter Fighter", mn: "Контр тулаанч", ko: "카운터 파이터" },
              explosive:  { en: "Explosive Fighter", mn: "Тэсрэлтийн тулаанч", ko: "폭발적 파이터" },
              technician: { en: "Technician", mn: "Техникч", ko: "테크니션" },
            };
            const opponent = OPPONENT_CYCLE[new Date().getDay() % 5];
            const oppColor = OPPONENT_COLORS[opponent];
            const oppLabel = OPPONENT_LABELS[opponent]?.[locale] || opponent;
            const SL = SP_L[locale] || SP_L.en;
            const sparQ = locale === "mn"
              ? `Намайг ${userArchetype ? (OPPONENT_LABELS[userArchetype]?.[locale] || userArchetype) : "тулаанч"} гэж үз. Би ${oppLabel}-тай тулаад байна. Ямар комбо болон контр хөдөлгөөн ашиглах вэ?`
              : locale === "ko"
              ? `저는 ${userArchetype ? (OPPONENT_LABELS[userArchetype]?.[locale] || userArchetype) : "파이터"}입니다. ${oppLabel}와 스파링 중입니다. 어떤 콤보와 카운터 동작을 사용해야 할까요?`
              : `I'm a ${userArchetype ? (OPPONENT_LABELS[userArchetype]?.en || userArchetype) : "fighter"}. I'm sparring against a ${oppLabel}. What combos and counter moves should I use?`;
            return (
              <div style={{ marginBottom: 12, borderRadius: 14, overflow: "hidden", border: `1px solid ${oppColor}22`, background: `${oppColor}06` }}>
                <div style={{ height: 2, background: `linear-gradient(90deg, ${oppColor}66, transparent)` }} />
                <div style={{ padding: "12px 14px" }}>
                  <div style={{ fontSize: 8, fontWeight: 900, letterSpacing: 2, color: oppColor, textTransform: "uppercase", marginBottom: 6 }}>
                    ⚔️ {SL.kicker}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#fff", marginBottom: 2 }}>{SL.title}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>{SL.sub}</div>
                    </div>
                    <div style={{ padding: "6px 10px", borderRadius: 10, background: `${oppColor}15`, border: `1px solid ${oppColor}30`, textAlign: "center" }}>
                      <div style={{ fontSize: 9, fontWeight: 900, color: oppColor, textTransform: "uppercase", letterSpacing: 0.5 }}>VS</div>
                      <div style={{ fontSize: 10, fontWeight: 900, color: "#fff", marginTop: 1, whiteSpace: "nowrap" }}>{oppLabel}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/coach/chat?q=${encodeURIComponent(sparQ)}`)}
                    style={{ width: "100%", padding: "9px 0", borderRadius: 10, background: `${oppColor}18`, border: `1px solid ${oppColor}38`, color: oppColor, fontSize: 11, fontWeight: 900, cursor: "pointer" }}
                  >
                    {SL.btn}
                  </button>
                </div>
              </div>
            );
          })()}

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
                background: `linear-gradient(145deg, ${RED}, ${RED_DARK})`,
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

          {/* Pro Priority Matching Banner */}
          {userArchetype && !coachesLoading && (() => {
            const isPro = userTier === "pro" || userTier === "champion";
            if (isPro) return null;
            return (
              <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 14, background: "rgba(245,196,81,0.05)", border: "1px solid rgba(245,196,81,0.2)", display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🔒</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 8.5, fontWeight: 900, letterSpacing: 1.5, color: "rgba(245,196,81,0.7)", textTransform: "uppercase", marginBottom: 3 }}>
                    {locale === "mn" ? "ПРО ДАВУУ ЭРХ" : locale === "ko" ? "프로 특혜" : "PRO BENEFIT"}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
                    {locale === "mn" ? "ДНХ-д суурилсан тренерийн тохирол" : locale === "ko" ? "DNA 기반 코치 매칭" : "DNA-matched coach recommendations"}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                    {locale === "mn" ? "Про болоход таны архетиптэй тохирох тренерийг шууд харна" : locale === "ko" ? "프로 업그레이드 시 아키타입에 맞는 코치를 바로 확인" : "Pro members see coaches matched to their archetype first"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/${locale}/fighter-profile?tab=dna`)}
                  style={{ padding: "8px 12px", borderRadius: 10, background: "linear-gradient(135deg,#F5C451,#D4A017)", border: "none", color: "#000", fontSize: 10, fontWeight: 900, cursor: "pointer", flexShrink: 0 }}
                >
                  Pro →
                </button>
              </div>
            );
          })()}

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

          <BottomNav router={router} user={user} currentLocale={locale} activeTab="coach" />
        </div>
      )}

    </main>
  );
}

