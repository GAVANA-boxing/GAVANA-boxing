"use client";

import { useMemo, useState } from "react";
import { translate } from "@/lib/i18n";
import ScrollRow from "@/components/ScrollRow";
import { GOLD, redAlpha, goldAlpha } from "@/lib/tokens";
import {
  getStyles, getTechniques, getCountryStyles, getCommonMistakes, getWeeklyFocus, getMovement,
  QUICK_PROMPTS,
} from "@/lib/knowledgeData";
import {
  SectionHeader, StyleCard, TechCard, CountryCard, MovementCard, MistakeRow,
} from "@/components/knowledge/KnowledgeCards";

export default function KnowledgeLibrary({ locale, onAsk }) {
  const t = (key) => translate(locale, key);
  const [hoveredPrompt, setHoveredPrompt] = useState(null);
  const [todayHover, setTodayHover] = useState(false);
  const [mistakesHover, setMistakesHover] = useState(false);

  const todayFocus = useMemo(() => {
    return getWeeklyFocus(locale)[new Date().getDay()];
  }, [locale]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 32 }}>

      {/* Hero Header */}
      <div style={{
        background: `linear-gradient(135deg, ${redAlpha(0.1)} 0%, ${goldAlpha(0.07)} 100%)`,
        border: `1px solid ${goldAlpha(0.14)}`,
        borderRadius: 16,
        padding: "18px 16px 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>📚</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.01em" }}>
              GAVANA Library
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              AI Coach Knowledge Base
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.key}
              onClick={() => onAsk(t(p.key))}
              onMouseEnter={() => setHoveredPrompt(p.key)}
              onMouseLeave={() => setHoveredPrompt(null)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 12px", borderRadius: 999,
                background: hoveredPrompt === p.key ? `${goldAlpha(0.12)}` : "rgba(255,255,255,0.05)",
                border: `1px solid ${hoveredPrompt === p.key ? `${goldAlpha(0.4)}` : "rgba(255,255,255,0.1)"}`,
                color: hoveredPrompt === p.key ? GOLD : "#ddd",
                fontSize: 11, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap",
                backdropFilter: "blur(6px)",
                transition: "background 130ms ease, border-color 130ms ease, color 130ms ease",
              }}
            >
              <span>{p.emoji}</span>
              {t(p.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Train Today */}
      <div>
        <SectionHeader emoji="🔥" title={t("librarySectionToday")} />
        <div style={{
          background: `${goldAlpha(0.07)}`,
          border: `1px solid ${goldAlpha(0.2)}`,
          borderLeft: "3px solid #F5C451",
          borderRadius: 14,
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <span style={{ fontSize: 22 }}>{todayFocus.emoji}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: "#fff" }}>{todayFocus.focus}</p>
              <p style={{ margin: 0, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: "0.04em" }}>{todayFocus.day}</p>
            </div>
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>{todayFocus.desc}</p>
          <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "9px 11px" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#fde68a", lineHeight: 1.5 }}>
              <strong style={{ color: GOLD }}>Drill: </strong>{todayFocus.drill}
            </p>
          </div>
          <button
            onClick={() => onAsk(t("libPromptToday"))}
            onMouseEnter={() => setTodayHover(true)}
            onMouseLeave={() => setTodayHover(false)}
            style={{
              marginTop: 10, width: "100%", padding: "9px 0", borderRadius: 9,
              background: todayHover ? `${goldAlpha(0.16)}` : `${goldAlpha(0.08)}`,
              border: `1px solid rgba(245,196,81,${todayHover ? "0.5" : "0.2"})`,
              color: GOLD, fontSize: 12, fontWeight: 800, cursor: "pointer",
              transition: "background 130ms ease, border-color 130ms ease",
              transform: todayHover ? "translateY(-1px)" : "none",
            }}
          >
            {t("libraryAskCoach")} →
          </button>
        </div>
      </div>

      {/* Fighter Styles */}
      <div>
        <SectionHeader emoji="🥊" title={t("librarySectionStyles")} />
        <ScrollRow cardWidth={224}>
          {getStyles(locale).map((s) => (
            <StyleCard key={s.key} style={s} onAsk={onAsk} t={t} />
          ))}
        </ScrollRow>
      </div>

      {/* Techniques */}
      <div>
        <SectionHeader emoji="🎯" title={t("librarySectionTechniques")} />
        <ScrollRow cardWidth={204}>
          {getTechniques(locale).map((tech) => (
            <TechCard key={tech.key} tech={tech} onAsk={onAsk} t={t} />
          ))}
        </ScrollRow>
      </div>

      {/* Combat Movement Origins */}
      <div>
        <SectionHeader emoji="🐆" title={t("librarySectionMovement")} />
        <ScrollRow cardWidth={214}>
          {getMovement(locale).map((card) => (
            <MovementCard key={card.key} card={card} t={t} />
          ))}
        </ScrollRow>
      </div>

      {/* Country / Legacy Styles */}
      <div>
        <SectionHeader emoji="🌍" title={t("librarySectionCountries")} />
        <ScrollRow cardWidth={184}>
          {getCountryStyles(locale).map((cs) => (
            <CountryCard key={cs.name} cs={cs} />
          ))}
        </ScrollRow>
      </div>

      {/* Common Mistakes */}
      <div>
        <SectionHeader emoji="⚠️" title={t("librarySectionMistakes")} />
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {getCommonMistakes(locale).map((item, i) => (
            <MistakeRow key={i} item={item} />
          ))}
        </div>
        <button
          onClick={() => onAsk("What are the most common boxing mistakes beginners make and how do I fix them?")}
          onMouseEnter={() => setMistakesHover(true)}
          onMouseLeave={() => setMistakesHover(false)}
          style={{
            marginTop: 12, width: "100%", padding: "9px 0", borderRadius: 9,
            background: mistakesHover ? `${redAlpha(0.1)}` : "rgba(255,255,255,0.03)",
            border: `1px solid ${mistakesHover ? `${redAlpha(0.35)}` : "rgba(255,255,255,0.08)"}`,
            color: mistakesHover ? "#f87171" : "rgba(255,255,255,0.45)",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            transition: "background 130ms ease, border-color 130ms ease, color 130ms ease",
          }}
        >
          Ask coach about my mistakes →
        </button>
      </div>

    </div>
  );
}
