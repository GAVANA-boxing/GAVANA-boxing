"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const ARCHETYPE_DISPLAY = {
  pressure: { emoji: "🔴", name: "Pressure Fighter", color: "#C1121F" },
  counter:  { emoji: "⚡", name: "Counter Puncher",  color: "#D4AF37" },
  technical:{ emoji: "🧠", name: "Technical Boxer",  color: "#60A5FA" },
  brawler:  { emoji: "💪", name: "Power Brawler",    color: "#F97316" },
};

const ARCHETYPES = {
  pressure: {
    ...ARCHETYPE_DISPLAY.pressure,
    desc: "Дарамт, хурд, давшдаг тактик. Чи тулааны хурдаар эсрэгээ цуцааж ялдаг.",
    traits: ["High volume combinations", "Relentless forward pressure", "Iron stamina & heart"],
  },
  counter: {
    ...ARCHETYPE_DISPLAY.counter,
    desc: "Timing, тэвчээр, буцаан цохилт. Чи эсрэгийнхээ алдааг ашиглан ялдаг.",
    traits: ["Sharp timing & reflexes", "Patient & disciplined", "Punishes mistakes perfectly"],
  },
  technical: {
    ...ARCHETYPE_DISPLAY.technical,
    desc: "Footwork, позиц, angle. Хэзээ хайж, хэзээ буцах вэ гэдгийг чамаас илүү мэддэг хэн ч байхгүй.",
    traits: ["Superior footwork & angles", "Jab control & range management", "Smart defensive movement"],
  },
  brawler: {
    ...ARCHETYPE_DISPLAY.brawler,
    desc: "Хүч, нэг цохилт, knockout. Дарамт дор ч гэсэн KO хайж байдаг байлдагч.",
    traits: ["Devastating punching power", "Granite chin & grit", "Relentless aggression"],
  },
};

const QUESTIONS = [
  {
    q: "Тулааны үед аль тактик таалагддаг вэ?",
    opts: [
      { label: "🔴  Дарамт шахаж давшина",          val: "pressure"  },
      { label: "⚡  Буцаан цохих боломж хүлээнэ",    val: "counter"   },
      { label: "🧠  Хөдөлгөөн, позиц барина",        val: "technical" },
      { label: "💪  Хүчтэй нэг цохилт хайна",        val: "brawler"   },
    ],
  },
  {
    q: "Аль чадвар нь чиний хамгийн давуу тал вэ?",
    opts: [
      { label: "🔴  Сэтгэл санаа, stamina",          val: "pressure"  },
      { label: "⚡  Timing, reaction speed",          val: "counter"   },
      { label: "🧠  Footwork, defense",               val: "technical" },
      { label: "💪  Хүч, knockdown power",            val: "brawler"   },
    ],
  },
  {
    q: "Аль тулаанчийн style танд ойр вэ?",
    opts: [
      { label: "🔴  Manny Pacquiao",                 val: "pressure"  },
      { label: "⚡  Floyd Mayweather",                val: "counter"   },
      { label: "🧠  Muhammad Ali",                    val: "technical" },
      { label: "💪  Mike Tyson",                      val: "brawler"   },
    ],
  },
  {
    q: "Training хийхдээ юу хамгийн их анхаарах дуртай вэ?",
    opts: [
      { label: "🔴  Combination, давталт",            val: "pressure"  },
      { label: "⚡  Slip & counter drill",             val: "counter"   },
      { label: "🧠  Shadow boxing, movement",          val: "technical" },
      { label: "💪  Heavy bag, power work",            val: "brawler"   },
    ],
  },
];

export default function FighterStyleQuiz({ user, onComplete }) {
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [result, setResult]   = useState(null);

  const computeResult = (ans) => {
    const counts = { pressure: 0, counter: 0, technical: 0, brawler: 0 };
    ans.forEach((a) => counts[a]++);
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  };

  const handleNext = () => {
    if (!selected) return;
    const next = [...answers, selected];
    if (step < QUESTIONS.length - 1) {
      setAnswers(next);
      setSelected(null);
      setStep(step + 1);
    } else {
      setResult(computeResult(next));
      setStep(QUESTIONS.length);
    }
  };

  const handleSave = async () => {
    if (!user?.uid || !result) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        fighterArchetype: result,
        fighterArchetypeSetAt: new Date().toISOString(),
      }, { merge: true });
    } catch (e) {
      console.error("FighterStyleQuiz save error:", e);
    } finally {
      setSaving(false);
      onComplete?.(result);
    }
  };

  const isResult = step === QUESTIONS.length;
  const arch = ARCHETYPES[result];
  const progress = Math.round((step / QUESTIONS.length) * 100);

  return (
    <div style={Q.overlay}>
      <div style={Q.card}>
        {/* Ambient glow */}
        <div style={{
          ...Q.glow,
          background: isResult && arch
            ? `radial-gradient(circle, ${arch.color}28, transparent 65%)`
            : "radial-gradient(circle, rgba(193,18,31,0.22), transparent 65%)",
        }} />

        <div style={Q.brand}>GAVANA · FIGHTER IDENTITY</div>

        {!isResult ? (
          <>
            {/* Progress bar */}
            <div style={Q.track}><div style={{ ...Q.fill, width: `${progress}%` }} /></div>
            <div style={Q.stepCount}>{step + 1} / {QUESTIONS.length}</div>

            <h2 style={Q.question}>{QUESTIONS[step].q}</h2>

            <div style={Q.opts}>
              {QUESTIONS[step].opts.map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setSelected(opt.val)}
                  style={{ ...Q.optBtn, ...(selected === opt.val ? Q.optBtnActive : {}) }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              disabled={!selected}
              style={{ ...Q.nextBtn, opacity: selected ? 1 : 0.35 }}
            >
              {step === QUESTIONS.length - 1 ? "Дүн харах →" : "Дараах →"}
            </button>
          </>
        ) : (
          <>
            {/* Result screen */}
            <div style={Q.resultEmoji}>{arch?.emoji}</div>
            <div style={{ ...Q.archetypeName, color: arch?.color }}>{arch?.name}</div>
            <p style={Q.archetypeDesc}>{arch?.desc}</p>

            <div style={Q.traitList}>
              {arch?.traits.map((trait) => (
                <div key={trait} style={Q.traitRow}>
                  <div style={{ ...Q.traitDot, background: arch.color }} />
                  <span style={Q.traitTxt}>{trait}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                ...Q.nextBtn,
                marginTop: 24,
                background: arch?.color
                  ? `linear-gradient(135deg, ${arch.color}, ${arch.color}bb)`
                  : "linear-gradient(135deg, #C1121F, #8f0d17)",
              }}
            >
              {saving ? "Хадгалж байна..." : "Fighter identity хадгалах ✓"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const Q = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 1800,
    display: "grid", placeItems: "center", padding: 16,
    background: "rgba(0,0,0,0.84)",
    backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
  },
  card: {
    position: "relative", overflow: "hidden",
    width: "min(100%, 460px)", borderRadius: 28,
    padding: "32px 24px 28px",
    background: "linear-gradient(145deg, rgba(193,18,31,0.14), rgba(8,8,8,0.98) 45%, rgba(212,175,55,0.07))",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 32px 96px rgba(0,0,0,0.7)",
    color: "#fff", textAlign: "center",
  },
  glow: {
    position: "absolute", inset: "-60% -20% auto",
    height: 200, pointerEvents: "none",
    transition: "background 500ms ease",
  },
  brand: {
    fontSize: 10, fontWeight: 900, letterSpacing: 2.5,
    color: "#D4AF37", textTransform: "uppercase", marginBottom: 20,
    position: "relative",
  },
  track: {
    height: 3, borderRadius: 999, background: "rgba(255,255,255,0.08)",
    overflow: "hidden", marginBottom: 8, position: "relative",
  },
  fill: {
    height: "100%", borderRadius: 999,
    background: "linear-gradient(90deg, #C1121F, #D4AF37)",
    transition: "width 420ms cubic-bezier(0.4,0,0.2,1)",
  },
  stepCount: {
    fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.28)",
    marginBottom: 22, letterSpacing: 1, position: "relative",
  },
  question: {
    fontSize: 21, fontWeight: 900, lineHeight: 1.22,
    margin: "0 0 22px", letterSpacing: -0.3, position: "relative",
  },
  opts: { display: "flex", flexDirection: "column", gap: 9, position: "relative" },
  optBtn: {
    padding: "14px 18px", borderRadius: 13,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff", fontSize: 14, fontWeight: 700,
    cursor: "pointer", textAlign: "left",
    transition: "all 150ms ease",
  },
  optBtnActive: {
    background: "rgba(193,18,31,0.18)",
    border: "1px solid rgba(193,18,31,0.5)",
    transform: "translateX(4px)",
  },
  nextBtn: {
    marginTop: 20, width: "100%", padding: "15px",
    borderRadius: 14, border: "none",
    background: "linear-gradient(135deg, #C1121F, #8f0d17)",
    color: "#fff", fontSize: 15, fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 8px 28px rgba(193,18,31,0.3)",
    position: "relative",
  },
  // Result
  resultEmoji: { fontSize: 60, marginBottom: 10, position: "relative" },
  archetypeName: {
    fontSize: 25, fontWeight: 900, marginBottom: 10,
    letterSpacing: -0.4, position: "relative",
  },
  archetypeDesc: {
    fontSize: 14, color: "rgba(255,255,255,0.58)", lineHeight: 1.65,
    margin: "0 0 18px", position: "relative",
  },
  traitList: {
    display: "flex", flexDirection: "column", gap: 8,
    background: "rgba(255,255,255,0.04)", borderRadius: 14,
    padding: "14px 16px", textAlign: "left", position: "relative",
  },
  traitRow: { display: "flex", alignItems: "center", gap: 10 },
  traitDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  traitTxt: { fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.72)" },
};
