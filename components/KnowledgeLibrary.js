"use client";

import { useMemo } from "react";
import { translate } from "@/lib/i18n";

// ─── Static knowledge data ────────────────────────────────────────────────────

const FIGHTER_STYLES = [
  {
    key: "pressure",
    emoji: "💥",
    name: "Pressure Fighter",
    tag: "Aggressive",
    tagColor: "#ef4444",
    desc: "Walks opponents down, controls range with volume. Conditioning is the weapon.",
    strengths: ["High punch output", "Wears opponents down", "Dictates the pace"],
    weaknesses: ["Exposed to counters", "Predictable forward path", "Tires if unconditioned"],
    practice: "Heavy bag: 3×3min all-out pressure. Stay tight, no wasted motion.",
  },
  {
    key: "counter",
    emoji: "🎯",
    name: "Counter Puncher",
    tag: "Patient",
    tagColor: "#60a5fa",
    desc: "Waits for openings, punishes mistakes. Economy of movement is the art.",
    strengths: ["Efficient shot selection", "Sharp reaction timing", "Stays composed"],
    weaknesses: ["Passive early rounds", "Risky against high-volume fighters", "Can look inactive"],
    practice: "Slip-and-counter drill: slip the jab, return the cross — 3×2min.",
  },
  {
    key: "technical",
    emoji: "📐",
    name: "Technical Boxer",
    tag: "Precise",
    tagColor: "#a78bfa",
    desc: "Clean guard, precise fundamentals, disciplined output. Quality over quantity.",
    strengths: ["Clean technique", "Disciplined guard", "Hard to hit cleanly"],
    weaknesses: ["Lower output volume", "Slower to adapt in scrambles", "Predictable patterns"],
    practice: "Jab-cross-hook: 100 reps clean form, guard up every rep.",
  },
  {
    key: "footwork",
    emoji: "👟",
    name: "Footwork Fighter",
    tag: "Elusive",
    tagColor: "#34d399",
    desc: "Movement IS the offense. Creates angles, makes opponents miss, controls space.",
    strengths: ["Elusive target", "Great angle creation", "Forces opponent to overcommit"],
    weaknesses: ["Less power from movement", "Can look too defensive", "Flat feet when planting"],
    practice: "Lateral step-and-jab: punch out of every pivot — 3×90s.",
  },
  {
    key: "southpaw",
    emoji: "🔄",
    name: "Southpaw",
    tag: "Unorthodox",
    tagColor: "#f59e0b",
    desc: "Left-hand dominant stance creates confusion. The left cross is the power weapon.",
    strengths: ["Awkward angles for orthodox fighters", "Left cross is the money shot", "Unique stance"],
    weaknesses: ["Right jab often underused", "Vulnerable on the outside", "Gets caught stepping same side"],
    practice: "Step right, pivot, left cross — 3×2min. Get off the center line.",
  },
  {
    key: "longrange",
    emoji: "📏",
    name: "Long Range Striker",
    tag: "Rangey",
    tagColor: "#fb923c",
    desc: "Uses reach and distance to control. Jab is the weapon, movement is the defense.",
    strengths: ["Controls fight with jab", "Difficult to get inside on", "Uses footwork to stay safe"],
    weaknesses: ["Less effective in close", "Struggles when backed to the ropes", "Jab must be sharp"],
    practice: "Double jab, step back, reset — 3×2min. Never let them close the gap.",
  },
  {
    key: "inside",
    emoji: "🤛",
    name: "Inside Fighter",
    tag: "Close Range",
    tagColor: "#f87171",
    desc: "Works best in the pocket. Short punches, hooks, uppercuts, body work.",
    strengths: ["Dangerous in close range", "Good body work", "Neutralizes reach advantage"],
    weaknesses: ["Vulnerable outside", "Must get past the jab", "Can get held/tied up"],
    practice: "Body-head uppercut: get in tight, dig to body, come upstairs — 50 reps.",
  },
];

const TECHNIQUES = [
  {
    key: "jab",
    emoji: "👊",
    name: "Jab",
    color: "#f59e0b",
    what: "Lead-hand straight punch. Your range tool, setup shot, and distance checker.",
    mistake: "Pushing instead of snapping — slow, telegraphed, easy to catch.",
    drill: "50 jabs at mirror: snap and return to guard. Don't push.",
  },
  {
    key: "cross",
    emoji: "✋",
    name: "Cross",
    color: "#ef4444",
    what: "Rear-hand straight punch. Your power shot — rotate the hip all the way through.",
    mistake: "Arm punching — no hip rotation, no real power.",
    drill: "Cross with hip rotation: slow × 30 (feel it), then speed × 30.",
  },
  {
    key: "hook",
    emoji: "↩️",
    name: "Hook",
    color: "#a78bfa",
    what: "Short arc punch, lead or rear. Pivot the foot, elbow at shoulder height.",
    mistake: "Looping wide and high — telegraphed and loses power.",
    drill: "Pivot-hook drill: step lead foot 45°, throw hook, reset — × 20 each side.",
  },
  {
    key: "uppercut",
    emoji: "⬆️",
    name: "Uppercut",
    color: "#60a5fa",
    what: "Upward punch that travels under the guard. Drive from the legs, not just arms.",
    mistake: "Dropping hand too low to set it — gives away the shot.",
    drill: "Body-head uppercut combo: dig body, come upstairs — 50 reps, keep it tight.",
  },
  {
    key: "slip",
    emoji: "🛡️",
    name: "Slip",
    color: "#34d399",
    what: "Move head offline to avoid a punch. Slip outside the jab, slip inside the cross.",
    mistake: "Slipping backwards (leaning back) instead of offline — still in the way.",
    drill: "Slip-and-counter: slip outside the jab, return with your cross — 3×2min.",
  },
  {
    key: "pivot",
    emoji: "🔄",
    name: "Pivot",
    color: "#fb923c",
    what: "Rotate on the lead foot to change angle. Gets you offline and creates new attack angles.",
    mistake: "Hopping instead of pivoting — loses balance and takes longer.",
    drill: "Step-pivot-jab: lead foot 45°, pivot, jab — × 20 each direction.",
  },
  {
    key: "guard",
    emoji: "🛡️",
    name: "Guard",
    color: "#9ca3af",
    what: "High hands protecting head and chin. Active guard moves with the opponent — not frozen.",
    mistake: "Dropping hands between punches, or after throwing combos.",
    drill: "After every combo in any drill: freeze and check both hands are up before moving.",
  },
  {
    key: "footwork",
    emoji: "👟",
    name: "Footwork",
    color: "#34d399",
    what: "How you move inside the ring. Controls distance, creates angles, enables defense.",
    mistake: "Flat feet and big steps — slow, heavy, easy to time.",
    drill: "Lateral shadow box: step-punch-step, stay on toes — 5min continuous.",
  },
  {
    key: "timing",
    emoji: "⏱️",
    name: "Timing",
    color: "#fbbf24",
    what: "The rhythm between you and the opponent. Slow is smooth, smooth is fast.",
    mistake: "Rushing — throwing before the opening fully appears.",
    drill: "Timing bag: wait for second swing, counter — 3×2min. Don't rush it.",
  },
  {
    key: "combo",
    emoji: "💥",
    name: "Combo Setup",
    color: "#f87171",
    what: "Using one punch to set up the next. The jab creates the opening; the power shot scores.",
    mistake: "Throwing the same combo every time — opponents adjust fast.",
    drill: "Pick 3 combos. Alternate between them randomly. 3×2min, no pattern.",
  },
];

const COUNTRY_STYLES = [
  {
    flag: "🇲🇽",
    name: "Mexican Style",
    tagline: "Heart over everything",
    color: "#ef4444",
    desc: "Pressure-first, heavy body work, high chin warrior mentality. Built to take a punch and keep coming forward.",
  },
  {
    flag: "🇨🇺",
    name: "Cuban / Soviet Style",
    tagline: "Technical perfection",
    color: "#60a5fa",
    desc: "Disciplined fundamentals, clean stance, sharp jab. Built on footwork and angles — counterpunching at its finest.",
  },
  {
    flag: "🇺🇸",
    name: "American Style",
    tagline: "Slick counter boxing",
    color: "#a78bfa",
    desc: "Defense-first, elusive movement, explosive counters. The sweet science as entertainment — always a way out.",
  },
  {
    flag: "🇯🇵",
    name: "Japanese Style",
    tagline: "Discipline and speed",
    color: "#f97316",
    desc: "High training volume, sharp hand speed, relentless dedication. Speed and discipline over brute power.",
  },
  {
    flag: "🇹🇭",
    name: "Muay Thai Style",
    tagline: "8-limb pressure",
    color: "#10b981",
    desc: "Full-body weapons — fists, elbows, knees, kicks. Clinch control and forward pressure are core identity.",
  },
  {
    flag: "🇲🇳",
    name: "Mongolian Style",
    tagline: "Iron will, wrestler's base",
    color: "#fbbf24",
    desc: "Wrestling influence creates a physical, relentless approach. Exceptional toughness and conditioning — built for the long fight.",
  },
];

const COMMON_MISTAKES = [
  { emoji: "⚠️", mistake: "Guard drops after combos", fix: "Reset hands before your feet move. Make it a habit." },
  { emoji: "⚠️", mistake: "Flat-footed stance", fix: "Stay on the balls of your feet. Weight forward, ready to move." },
  { emoji: "⚠️", mistake: "Arm punching (no hip rotation)", fix: "Power comes from the floor — legs → hips → shoulder → fist." },
  { emoji: "⚠️", mistake: "Looking down during exchanges", fix: "Eyes forward always. You can't defend what you don't see." },
  { emoji: "⚠️", mistake: "Rushing combos when tense", fix: "Breathe. Slow down. Clean combos score more than rushed flurries." },
  { emoji: "⚠️", mistake: "Leaning back instead of slipping", fix: "Go offline — not backwards. Slipping keeps you in range to counter." },
  { emoji: "⚠️", mistake: "Telegraphing shots (big windup)", fix: "Short setup. The less they see it coming, the more it lands." },
];

const WEEKLY_FOCUS = [
  { day: "Sunday",    emoji: "🛡️", focus: "Defense day", desc: "Slipping, rolling, guard work. Active rest with intent.", drill: "10min shadow: every third combo, slip twice before resetting." },
  { day: "Monday",    emoji: "👊", focus: "Jab & Cross", desc: "Build your foundation. The 1-2 is the base of everything.", drill: "100 jab-cross with guard reset. Clean, not fast." },
  { day: "Tuesday",   emoji: "👟", focus: "Footwork & Angles", desc: "Move to score. Punch out of every pivot today.", drill: "Step-pivot-jab × 20 each direction. Stay on toes." },
  { day: "Wednesday", emoji: "💥", focus: "Power Combos", desc: "Hook and uppercut day. Drive from the legs.", drill: "Body-head-uppercut: 3×3min on heavy bag. Full hip rotation." },
  { day: "Thursday",  emoji: "⏱️", focus: "Timing & Rhythm", desc: "Slow down to speed up. Find the tempo.", drill: "Timing bag: wait for second swing, counter — 3×2min." },
  { day: "Friday",    emoji: "🔥", focus: "Full Combo Drills", desc: "Put it all together. Varied combos, no patterns.", drill: "3 combos, alternate randomly: 3×2min. Finish with guard every time." },
  { day: "Saturday",  emoji: "🧠", focus: "Technique Review", desc: "Film yourself or work with a mirror. What needs fixing?", drill: "Pick your weakest technique. 10min focused work on it only." },
];

const QUICK_PROMPTS = [
  { key: "libPromptStyle",    emoji: "🎯" },
  { key: "libPromptJab",      emoji: "👊" },
  { key: "libPromptFootwork", emoji: "👟" },
  { key: "libPromptGuard",    emoji: "🛡️" },
  { key: "libPromptToday",    emoji: "🔥" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ emoji, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {title}
      </h3>
    </div>
  );
}

function StyleCard({ style, onAsk, t }) {
  return (
    <div style={{
      flexShrink: 0,
      width: 220,
      background: "#181818",
      border: `1px solid ${style.tagColor}33`,
      borderTop: `3px solid ${style.tagColor}`,
      borderRadius: 12,
      padding: "14px 14px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 18 }}>{style.emoji}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{style.name}</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: style.tagColor,
          background: `${style.tagColor}18`, border: `1px solid ${style.tagColor}44`,
          borderRadius: 20, padding: "2px 7px",
        }}>{style.tag}</span>
      </div>
      <p style={{ fontSize: 12, color: "#aaa", margin: 0, lineHeight: 1.5 }}>{style.desc}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {style.strengths.slice(0, 2).map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
            <span style={{ color: "#4ade80", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 11, color: "#bbb" }}>{s}</span>
          </div>
        ))}
        {style.weaknesses.slice(0, 1).map((w, i) => (
          <div key={i} style={{ display: "flex", gap: 5, alignItems: "flex-start" }}>
            <span style={{ color: "#f87171", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>✗</span>
            <span style={{ fontSize: 11, color: "#bbb" }}>{w}</span>
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #222", paddingTop: 8, marginTop: 2 }}>
        <p style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {t("libraryPractice")}
        </p>
        <p style={{ fontSize: 11, color: "#fca5a5", margin: 0, lineHeight: 1.4 }}>{style.practice}</p>
      </div>
      <button
        onClick={() => onAsk(`Tell me more about the ${style.name} style and what I should work on`)}
        style={{
          marginTop: 2, padding: "7px 0", borderRadius: 8,
          background: "#222", border: `1px solid ${style.tagColor}44`,
          color: style.tagColor, fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}
      >
        {t("libraryAskCoach")} →
      </button>
    </div>
  );
}

function TechCard({ tech, onAsk, t }) {
  return (
    <div style={{
      flexShrink: 0,
      width: 200,
      background: "#181818",
      border: `1px solid ${tech.color}33`,
      borderTop: `3px solid ${tech.color}`,
      borderRadius: 12,
      padding: "13px 13px 11px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 18 }}>{tech.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{tech.name}</span>
      </div>
      <p style={{ fontSize: 11, color: "#bbb", margin: 0, lineHeight: 1.45 }}>{tech.what}</p>
      <div style={{ background: "#1f0a0a", border: "1px solid #7f1d1d", borderRadius: 7, padding: "7px 9px" }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("libraryMistake")}
        </p>
        <p style={{ fontSize: 11, color: "#fca5a5", margin: 0, lineHeight: 1.4 }}>{tech.mistake}</p>
      </div>
      <div style={{ background: "#1c1400", border: "1px solid #78350f", borderRadius: 7, padding: "7px 9px" }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("libraryDrill")}
        </p>
        <p style={{ fontSize: 11, color: "#fde68a", margin: 0, lineHeight: 1.4 }}>{tech.drill}</p>
      </div>
      <button
        onClick={() => onAsk(`How do I improve my ${tech.name}?`)}
        style={{
          padding: "7px 0", borderRadius: 8,
          background: "#222", border: `1px solid ${tech.color}44`,
          color: tech.color, fontSize: 11, fontWeight: 700, cursor: "pointer",
        }}
      >
        {t("libraryAskCoach")} →
      </button>
    </div>
  );
}

function CountryCard({ cs }) {
  return (
    <div style={{
      flexShrink: 0,
      width: 180,
      background: "#181818",
      border: `1px solid ${cs.color}33`,
      borderTop: `3px solid ${cs.color}`,
      borderRadius: 12,
      padding: "13px 13px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 20 }}>{cs.flag}</span>
        <div>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#fff" }}>{cs.name}</p>
          <p style={{ margin: 0, fontSize: 10, color: cs.color, fontWeight: 700 }}>{cs.tagline}</p>
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#aaa", margin: 0, lineHeight: 1.5 }}>{cs.desc}</p>
    </div>
  );
}

function MistakeRow({ item }) {
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      padding: "10px 0", borderBottom: "1px solid #1f1f1f",
    }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>{item.emoji}</span>
      <div>
        <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 700, color: "#f87171" }}>{item.mistake}</p>
        <p style={{ margin: 0, fontSize: 12, color: "#aaa", lineHeight: 1.4 }}>Fix: {item.fix}</p>
      </div>
    </div>
  );
}

function HScrollRow({ children }) {
  return (
    <div style={{
      display: "flex",
      gap: 10,
      overflowX: "auto",
      paddingBottom: 8,
      WebkitOverflowScrolling: "touch",
      scrollbarWidth: "none",
      msOverflowStyle: "none",
    }}>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function KnowledgeLibrary({ locale, onAsk }) {
  const t = (key) => translate(locale, key);

  const todayFocus = useMemo(() => {
    return WEEKLY_FOCUS[new Date().getDay()];
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 32 }}>

      {/* Quick Prompts */}
      <div>
        <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {t("libraryQuickPromptsLabel")}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p.key}
              onClick={() => onAsk(t(p.key))}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "8px 13px", borderRadius: 999,
                background: "#1a1a1a", border: "1px solid #333",
                color: "#fff", fontSize: 12, fontWeight: 700,
                cursor: "pointer", whiteSpace: "nowrap",
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
          background: "#1c1400",
          border: "1px solid #78350f",
          borderLeft: "4px solid #f59e0b",
          borderRadius: 12,
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 20 }}>{todayFocus.emoji}</span>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#fff" }}>{todayFocus.focus}</p>
              <p style={{ margin: 0, fontSize: 11, color: "#f59e0b" }}>{todayFocus.day}</p>
            </div>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 12, color: "#d4a", lineHeight: 1.5 }}>{todayFocus.desc}</p>
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: 8, padding: "8px 10px" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#fde68a", lineHeight: 1.5 }}>
              <strong style={{ color: "#f59e0b" }}>Drill: </strong>{todayFocus.drill}
            </p>
          </div>
          <button
            onClick={() => onAsk(t("libPromptToday"))}
            style={{
              marginTop: 10, width: "100%", padding: "9px 0", borderRadius: 8,
              background: "#2a1800", border: "1px solid #78350f",
              color: "#f59e0b", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            {t("libraryAskCoach")} →
          </button>
        </div>
      </div>

      {/* Fighter Styles */}
      <div>
        <SectionHeader emoji="🥊" title={t("librarySectionStyles")} />
        <HScrollRow>
          {FIGHTER_STYLES.map((s) => (
            <StyleCard key={s.key} style={s} onAsk={onAsk} t={t} />
          ))}
        </HScrollRow>
      </div>

      {/* Techniques */}
      <div>
        <SectionHeader emoji="🎯" title={t("librarySectionTechniques")} />
        <HScrollRow>
          {TECHNIQUES.map((tech) => (
            <TechCard key={tech.key} tech={tech} onAsk={onAsk} t={t} />
          ))}
        </HScrollRow>
      </div>

      {/* Country / Legacy Styles */}
      <div>
        <SectionHeader emoji="🌍" title={t("librarySectionCountries")} />
        <HScrollRow>
          {COUNTRY_STYLES.map((cs) => (
            <CountryCard key={cs.name} cs={cs} />
          ))}
        </HScrollRow>
      </div>

      {/* Common Mistakes */}
      <div>
        <SectionHeader emoji="⚠️" title={t("librarySectionMistakes")} />
        <div style={{ borderTop: "1px solid #1f1f1f" }}>
          {COMMON_MISTAKES.map((item, i) => (
            <MistakeRow key={i} item={item} />
          ))}
        </div>
        <button
          onClick={() => onAsk("What are the most common boxing mistakes beginners make and how do I fix them?")}
          style={{
            marginTop: 12, width: "100%", padding: "9px 0", borderRadius: 8,
            background: "#1a1a1a", border: "1px solid #333",
            color: "#aaa", fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}
        >
          Ask coach about my mistakes →
        </button>
      </div>

    </div>
  );
}
