"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { translate } from "@/lib/i18n";
import ScrollRow from "@/components/ScrollRow";
import { RED, GOLD, redAlpha, goldAlpha, blackAlpha, whiteAlpha } from "@/lib/tokens";
import {
  getStyles, getTechniques, getCountryStyles, getCommonMistakes, getWeeklyFocus, getMovement,
  QUICK_PROMPTS,
} from "@/lib/knowledgeData";
import {
  SectionHeader, StyleCard, TechCard, FighterCard, CountryCard, MovementCard, MistakeRow,
} from "@/components/knowledge/KnowledgeCards";
import TechniqueSheet from "@/components/knowledge/TechniqueSheet";
import AcademyLessonCard from "@/components/knowledge/AcademyLessonCard";
import AcademyPathCard from "@/components/academy/AcademyPathCard";
import { FIGHTERS } from "@/lib/fighters";
import { ACADEMY_LESSONS } from "@/lib/academyLessons";
import { getLessonStatus } from "@/lib/academyPaths";
import { useAcademyProgress } from "@/hooks/useAcademyProgress";
import { useAuth } from "@/lib/AuthContext";

export default function KnowledgeLibrary({ locale, onAsk }) {
  const t = (key) => translate(locale, key);
  const router = useRouter();
  const [activeFighter, setActiveFighter] = useState(null);
  const { user } = useAuth();
  const { lessonProgress, currentPathId, guestPrompt, setGuestPrompt, setCurrentPath } = useAcademyProgress({ user });

  const todayFocus = useMemo(() => getWeeklyFocus(locale)[new Date().getDay()], [locale]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, paddingBottom: 32 }}>

      {/* ── Page identity ─────────────────────────────────────────────────── */}
      <div style={{ padding: "0 0 4px" }}>
        <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 900, letterSpacing: 3, color: RED, textTransform: "uppercase" }}>
          GAVANA ACADEMY
        </p>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 1000, color: "#fff", lineHeight: 1, letterSpacing: "-0.02em", fontFamily: "var(--font-display, 'Anton', sans-serif)", textTransform: "uppercase" }}>
          {locale === "mn" ? "Тулааны Мэдлэг" : locale === "ko" ? "컴뱃 지식" : "Combat Knowledge"}
        </h2>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
          {locale === "mn" ? "Аварга тулаанчдаас суралц" : locale === "ko" ? "챔피언에게서 배우세요" : "Learn from champions. Train smarter every session."}
        </p>
      </div>

      {/* ── Quick prompts ──────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${redAlpha(0.08)} 0%, ${goldAlpha(0.05)} 100%)`,
        border: `1px solid ${goldAlpha(0.12)}`,
        borderRadius: 14,
        padding: "14px 14px 12px",
      }}>
        <p style={{ margin: "0 0 10px", fontSize: 9, fontWeight: 900, letterSpacing: 2, color: GOLD, textTransform: "uppercase" }}>
          {locale === "mn" ? "Хурдан асуулт" : "Quick questions"}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.key}
              onClick={() => onAsk(t(p.key))}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", borderRadius: 20,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              <span>{p.emoji}</span>
              {t(p.key)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Today's Lesson — full-width hero ──────────────────────────────── */}
      <div>
        <SectionHeader emoji="🔥" title={t("librarySectionToday")} />
        <div style={{
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#0d0b0e",
        }}>
          {/* Hero visual */}
          <div style={{
            height: 160,
            position: "relative",
            background: `linear-gradient(135deg, ${goldAlpha(0.22)} 0%, ${redAlpha(0.12)} 60%, transparent 100%), #0d0b0e`,
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: `repeating-linear-gradient(55deg, rgba(245,196,81,0.06) 0, rgba(245,196,81,0.06) 1px, transparent 0, transparent 22px)`,
            }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, #0d0b0e, transparent)" }} />
            {/* Day badge */}
            <div style={{
              position: "absolute", top: 14, left: 14,
              fontSize: 9, fontWeight: 900, letterSpacing: 1.5, color: GOLD,
              background: `${goldAlpha(0.15)}`, border: `1px solid ${goldAlpha(0.3)}`,
              borderRadius: 20, padding: "4px 10px", textTransform: "uppercase",
            }}>
              {todayFocus.day}
            </div>
            <span style={{
              position: "absolute", bottom: 18, left: 16,
              fontSize: 40, filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.9))",
            }}>
              {todayFocus.emoji}
            </span>
          </div>
          {/* Content */}
          <div style={{ padding: "14px 16px 16px" }}>
            <p style={{ margin: "0 0 5px", fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>
              {todayFocus.focus}
            </p>
            <p style={{ margin: "0 0 12px", fontSize: 12.5, color: "rgba(255,255,255,0.52)", lineHeight: 1.5 }}>
              {todayFocus.desc}
            </p>
            <div style={{ background: blackAlpha(0.35), border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px", marginBottom: 12 }}>
              <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 900, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5 }}>
                {locale === "mn" ? "Дасгал" : "Drill"}
              </p>
              <p style={{ margin: 0, fontSize: 12.5, color: "#fde68a", lineHeight: 1.5 }}>{todayFocus.drill}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onAsk(t("libPromptToday"))}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  background: `${goldAlpha(0.12)}`, border: `1px solid ${goldAlpha(0.28)}`,
                  color: GOLD, fontSize: 12, fontWeight: 800, cursor: "pointer",
                }}
              >
                {locale === "mn" ? "Асуух →" : "Ask Coach →"}
              </button>
              <button
                onClick={() => router.push(`/${locale}/train`)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  background: `${redAlpha(0.14)}`, border: `1px solid ${redAlpha(0.3)}`,
                  color: "#ff6b6b", fontSize: 12, fontWeight: 800, cursor: "pointer",
                }}
              >
                {locale === "mn" ? "⚡ Дасгалдах" : "⚡ Train Now"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Your Path ────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader emoji="🎯" title={locale === "mn" ? "Таны Зам" : locale === "ko" ? "내 경로" : "Your Path"} />
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

      {/* ── Foundation Skills ────────────────────────────────────────────── */}
      <div>
        <SectionHeader emoji="📚" title={locale === "mn" ? "Суурь Техникүүд" : locale === "ko" ? "기초 기술" : "Foundation Skills"} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {ACADEMY_LESSONS.map((lesson) => (
            <AcademyLessonCard
              key={lesson.id}
              lesson={lesson}
              locale={locale}
              lessonStatus={getLessonStatus(lesson.id, lessonProgress)}
              bestScore={lessonProgress[lesson.id]?.bestScore}
              onStudyFighter={(fighterId) => router.push(`/${locale}/fighters/${fighterId}`)}
              router={router}
            />
          ))}
        </div>
      </div>

      {/* ── Fighter Profiles ──────────────────────────────────────────────── */}
      <div>
        <SectionHeader emoji="⚡" title={locale === "mn" ? "Тулаанчдын Техник" : locale === "ko" ? "파이터 프로필" : "Fighter Profiles"} />
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
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {getCommonMistakes(locale).map((item, i) => (
            <MistakeRow key={i} item={item} />
          ))}
        </div>
        <button
          onClick={() => onAsk("What are the most common boxing mistakes beginners make and how do I fix them?")}
          style={{
            marginTop: 10, width: "100%", padding: "10px 0", borderRadius: 10,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          {locale === "mn" ? "Алдаагаа засах зөвлөгөө авах →" : "Ask coach about my mistakes →"}
        </button>
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
