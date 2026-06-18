"use client";

import { useMemo, useState } from "react";
import { loc } from "@/lib/loc";
import { useRouter } from "next/navigation";
import { translate } from "@/lib/i18n";
import ScrollRow from "@/components/ScrollRow";
import { RED } from "@/lib/tokens";
import {
  getStyles, getTechniques, getCountryStyles, getCommonMistakes, getWeeklyFocus, getMovement,
  QUICK_PROMPTS,
} from "@/lib/knowledgeData";
import {
  SectionHeader, StyleCard, TechCard, FighterCard, CountryCard, MovementCard,
} from "@/components/knowledge/KnowledgeCards";
import TechniqueSheet from "@/components/knowledge/TechniqueSheet";
import AcademyLessonCard from "@/components/knowledge/AcademyLessonCard";
import AcademyPathCard from "@/components/academy/AcademyPathCard";
import AcademySearchBar, { matchesSearch, FILTER_CHIPS } from "@/components/knowledge/AcademySearchBar";
import AcademyRecommendations from "@/components/knowledge/AcademyRecommendations";
import TodayLessonHero from "@/components/knowledge/TodayLessonHero";
import QuickPrompts from "@/components/knowledge/QuickPrompts";
import CommonMistakesSection from "@/components/knowledge/CommonMistakesSection";
import { FIGHTERS } from "@/lib/fighters";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import { getLessonStatus } from "@/lib/academyPaths";
import { useAcademyProgress } from "@/hooks/useAcademyProgress";
import { useAuth } from "@/lib/AuthContext";

export default function KnowledgeLibrary({ locale, onAsk }) {
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const [activeFighter, setActiveFighter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(null);
  const { user } = useAuth();
  const { lessonProgress, currentPathId, guestPrompt, setGuestPrompt, setCurrentPath } = useAcademyProgress({ user });

  const todayFocus = useMemo(() => getWeeklyFocus(locale)[new Date().getDay()], [locale]);

  const isSearchActive = searchQuery.trim() !== "" || activeFilter !== null;

  const filteredLessons = useMemo(
    () => ACADEMY_LESSONS.filter(l => matchesSearch(l, searchQuery, activeFilter)),
    [searchQuery, activeFilter],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingBottom: 32 }}>

      {/* ── Page identity ─────────────────────────────────────────────────── */}
      <div style={{ padding: "0 0 4px" }}>
        <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 900, letterSpacing: 2, color: RED, textTransform: "uppercase" }}>
          GAVANA ACADEMY
        </p>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 1000, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em", fontFamily: "var(--font-display, 'Anton', sans-serif)", textTransform: "uppercase" }}>
          {loc(locale, "Тулааны Мэдлэг", "컴뱃 지식", "Combat Knowledge")}
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
          {loc(locale, "Аварга тулаанчдаас суралц", "챔피언에게서 배우세요", "Learn from champions. Train smarter every session.")}
        </p>
      </div>

      {/* ── Quick prompts ──────────────────────────────────────────────────── */}
      <QuickPrompts locale={locale} onAsk={onAsk} prompts={QUICK_PROMPTS} />

      {/* ── Today's Lesson — full-width hero ──────────────────────────────── */}
      <div>
        <SectionHeader emoji="🔥" title={t("librarySectionToday")} />
        <TodayLessonHero todayFocus={todayFocus} locale={locale} onAsk={onAsk} />
      </div>

      {/* ── Your Path ────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader emoji="🎯" title={loc(locale, "Таны Зам", "내 경로", "Your Path")} />
        <AcademyPathCard
          currentPathId={currentPathId}
          lessonProgress={lessonProgress}
          locale={locale}
          onSelectPath={setCurrentPath}
          onContinue={(lessonId) => router.push(`/${locale}/train?academyLesson=${lessonId}`)}
        />
        {/* Guest save prompt */}
        {guestPrompt && !user && (
          <div style={{
            marginTop: 10, padding: "10px 14px", borderRadius: 10,
            background: "rgba(245,196,81,0.06)", border: "1px solid rgba(245,196,81,0.18)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
          }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
              {locale === "mn" ? "Дэвшлийг хадгалахын тулд бүртгүүл." : "Sign up to save progress across devices."}
            </span>
            <button
              type="button"
              onClick={() => { setGuestPrompt(false); router.push(`/${locale}/login?mode=signup`); }}
              style={{
                flexShrink: 0, padding: "5px 12px", borderRadius: 7,
                background: "rgba(245,196,81,0.16)", border: "1px solid rgba(245,196,81,0.3)",
                color: "#F5C451", fontSize: 10, fontWeight: 900, cursor: "pointer",
              }}
            >
              {locale === "mn" ? "Бүртгүүлэх →" : "Sign up →"}
            </button>
          </div>
        )}
      </div>

      {/* ── Recommended for you (hidden when search active) ──────────────── */}
      {!isSearchActive && (
        <AcademyRecommendations
          lessonProgress={lessonProgress}
          currentPathId={currentPathId}
          locale={locale}
          router={router}
        />
      )}

      {/* ── Foundation Skills ────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          emoji="📚"
          title={loc(locale, "Суурь Техникүүд", "기초 기술", "Foundation Skills")}
        />

        {/* Search bar + filter chips — always visible */}
        <div style={{ marginBottom: 12 }}>
          <AcademySearchBar
            query={searchQuery}
            onQuery={setSearchQuery}
            activeFilter={activeFilter}
            onFilter={setActiveFilter}
            locale={locale}
          />
        </div>

        {/* Search active: filtered results or empty state */}
        {isSearchActive ? (
          filteredLessons.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredLessons.map(lesson => (
                <AcademyLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  locale={locale}
                  lessonStatus={getLessonStatus(lesson.id, lessonProgress)}
                  bestScore={lessonProgress[lesson.id]?.bestScore}
                  onStudyFighter={fid => router.push(`/${locale}/fighters/${fid}`)}
                  router={router}
                />
              ))}
            </div>
          ) : (
            /* Empty search state */
            <div style={{
              padding: "28px 16px 24px", borderRadius: 14,
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.52)" }}>
                {loc(locale, "Үр дүн олдсонгүй", "결과 없음", "No lessons found")}
              </p>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                {locale === "mn"
                  ? "Коучоос асуугаарай:"
                  : "Ask Coach about this topic:"}
                {" "}
                <strong style={{ color: "rgba(255,255,255,0.5)" }}>
                  &ldquo;{searchQuery || (FILTER_CHIPS.find(c => c.key === activeFilter)?.[locale] || FILTER_CHIPS.find(c => c.key === activeFilter)?.en || activeFilter)}&rdquo;
                </strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  const chip = FILTER_CHIPS.find(c => c.key === activeFilter);
                  const topic = searchQuery || chip?.en || activeFilter || "boxing technique";
                  const q = locale === "mn"
                    ? `"${topic}" техникийн талаар тайлбарлана уу?`
                    : `Explain ${topic} and how to improve it in boxing`;
                  router.push(`/${locale}/coach/chat?q=${encodeURIComponent(q)}`);
                }}
                style={{
                  padding: "10px 22px", borderRadius: 22,
                  background: "rgba(245,196,81,0.1)", border: "1px solid rgba(245,196,81,0.28)",
                  color: "#F5C451", fontSize: 12, fontWeight: 900, cursor: "pointer",
                }}
              >
                💬 {loc(locale, "Коучоос асуух →", "코치에게 묻기 →", "Ask Coach →")}
              </button>
            </div>
          )
        ) : (
          /* Normal: all lessons */
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ACADEMY_LESSONS.map(lesson => (
              <AcademyLessonCard
                key={lesson.id}
                lesson={lesson}
                locale={locale}
                lessonStatus={getLessonStatus(lesson.id, lessonProgress)}
                bestScore={lessonProgress[lesson.id]?.bestScore}
                onStudyFighter={fid => router.push(`/${locale}/fighters/${fid}`)}
                router={router}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Fighter Profiles ──────────────────────────────────────────────── */}
      <div>
        <SectionHeader emoji="⚡" title={loc(locale, "Тулаанчдын Техник", "파이터 프로필", "Fighter Profiles")} />
        <ScrollRow cardWidth={200}>
          {FIGHTERS.map((fighter) => (
            <FighterCard
              key={fighter.id}
              fighter={fighter}
              locale={locale}
              onStudy={(f) => setActiveFighter(f)}
            />
          ))}
        </ScrollRow>
      </div>

      {/* ── Fighter Styles ────────────────────────────────────────────────── */}
      <div>
        <SectionHeader emoji="🥊" title={t("librarySectionStyles")} />
        <ScrollRow cardWidth={260}>
          {getStyles(locale).map((s) => (
            <StyleCard key={s.key} style={s} onAsk={onAsk} t={t} />
          ))}
        </ScrollRow>
      </div>

      {/* ── Techniques ───────────────────────────────────────────────────── */}
      <div>
        <SectionHeader emoji="🎯" title={t("librarySectionTechniques")} />
        <ScrollRow cardWidth={240}>
          {getTechniques(locale).map((tech) => (
            <TechCard key={tech.key} tech={tech} onAsk={onAsk} t={t} />
          ))}
        </ScrollRow>
      </div>

      {/* ── Combat Movement Origins ───────────────────────────────────────── */}
      <div>
        <SectionHeader emoji="🐆" title={t("librarySectionMovement")} />
        <ScrollRow cardWidth={220}>
          {getMovement(locale).map((card) => (
            <MovementCard key={card.key} card={card} t={t} />
          ))}
        </ScrollRow>
      </div>

      {/* ── Country / Legacy Styles ───────────────────────────────────────── */}
      <div>
        <SectionHeader emoji="🌍" title={t("librarySectionCountries")} />
        <ScrollRow cardWidth={190}>
          {getCountryStyles(locale).map((cs) => (
            <CountryCard key={cs.name} cs={cs} />
          ))}
        </ScrollRow>
      </div>

      {/* ── Common Mistakes ───────────────────────────────────────────────── */}
      <div>
        <SectionHeader emoji="⚠️" title={t("librarySectionMistakes")} />
        <CommonMistakesSection
          locale={locale}
          mistakes={getCommonMistakes(locale)}
          onAsk={onAsk}
        />
      </div>

      {/* ── Technique sheet ───────────────────────────────────────────────── */}
      {activeFighter && (
        <TechniqueSheet
          fighter={activeFighter}
          locale={locale}
          router={router}
          onClose={() => setActiveFighter(null)}
        />
      )}

    </div>
  );
}
