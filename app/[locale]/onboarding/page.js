"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import { db } from "@/lib/firebase";
import { getLocaleFromPathname } from "@/lib/i18n";
import { ARCHETYPE_DISPLAY } from "@/components/FighterStyleQuiz";

const WEIGHT_CLASSES = [
  "Mini Flyweight (49kg)", "Light Flyweight (49kg)", "Flyweight (52kg)",
  "Super Flyweight (55kg)", "Bantamweight (56kg)", "Super Bantamweight (59kg)",
  "Featherweight (59kg)", "Super Featherweight (63kg)", "Lightweight (61kg)",
  "Super Lightweight (64kg)", "Welterweight (67kg)", "Super Welterweight (70kg)",
  "Middleweight (75kg)", "Super Middleweight (79kg)", "Light Heavyweight (81kg)",
  "Cruiserweight (91kg)", "Heavyweight (91+kg)",
];

const ARCHETYPE_DESCS = {
  pressure: { mn: "Дарамт, хурд, давшдаг тактик.", ko: "압박, 속도, 전진 전술.", en: "Pressure, speed, forward tactics." },
  counter:  { mn: "Timing, тэвчээр, буцаан цохилт.", ko: "타이밍, 인내, 카운터 펀치.", en: "Timing, patience, counter punching." },
  technical:{ mn: "Footwork, позиц, angle хянах.", ko: "풋워크, 포지셔닝, 앵글.", en: "Footwork, positioning, angles." },
  brawler:  { mn: "Хүч, нэг цохилт, knockout хайх.", ko: "파워, 한 방, KO를 노리는.", en: "Power, one shot, hunting the KO." },
};

// Steps: 0=role, 1=archetype, 2=weekly-goal, 3=gym, 4=welcome
// Coach/Gym: 0 → 4 directly
const TOTAL_STEPS = 5;

const WEEKLY_GOALS = [
  { value: 1, emoji: "🌱", labelMn: "1–2 удаа", labelKo: "주 1-2회", labelEn: "1–2×/week", descMn: "Эхлэгч — аажмаар дадлага хий", descKo: "초보자 — 천천히 시작", descEn: "Beginner — build the habit" },
  { value: 3, emoji: "🔥", labelMn: "3 удаа", labelKo: "주 3회", labelEn: "3×/week", descMn: "Тогтмол — хамгийн их үр дүнтэй", descKo: "꾸준히 — 가장 효과적", descEn: "Consistent — most effective" },
  { value: 5, emoji: "💪", labelMn: "4–5 удаа", labelKo: "주 4-5회", labelEn: "4–5×/week", descMn: "Идэвхтэй — rank хурдан өснө", descKo: "활발 — 빠른 랭크 상승", descEn: "Active — rank climbs fast" },
  { value: 7, emoji: "⚡", labelMn: "Өдөр бүр", labelKo: "매일", labelEn: "Daily", descMn: "Champion — зогсохгүй тулааны сэтгэлгээ", descKo: "챔피언 — 멈추지 않는 정신", descEn: "Champion — fighter's mindset" },
];

export default function OnboardingPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState(null);
  const [archetype, setArchetype] = useState(null);
  const [weightClass, setWeightClass] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [animDir, setAnimDir] = useState(1); // 1=forward, -1=back

  const [gyms, setGyms] = useState([]);
  const [gymsLoading, setGymsLoading] = useState(false);
  const [requestedGymId, setRequestedGymId] = useState(null);
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  const goTo = (nextStep) => {
    setAnimDir(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const handleRoleNext = async (selectedRole) => {
    setRole(selectedRole);
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { role: selectedRole });
    } catch (e) { console.error("role save", e); }
    setSaving(false);
    goTo(selectedRole === "fighter" ? 1 : 4);
  };

  const handleStep1Next = async () => {
    if (!archetype) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role: "fighter",
        archetype,
        fighterArchetype: archetype,
        weightClass: weightClass || null,
      });
    } catch (e) {
      console.error("onboarding step1", e);
    } finally {
      setSaving(false);
    }
    goTo(2);
  };

  const handleStep2Next = async () => {
    if (!weeklyGoal) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { weeklyGoal });
    } catch (e) {
      console.error("weeklyGoal save", e);
    } finally {
      setSaving(false);
    }
    setGymsLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "gyms"), limit(12)));
      setGyms(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {}
    setGymsLoading(false);
    goTo(3);
  };

  const handleJoinGym = async (gym) => {
    if (joining || requestedGymId) return;
    setJoining(gym.id);
    try {
      await addDoc(collection(db, "gym_join_requests"), {
        gymId: gym.id,
        gymName: gym.gymName || "",
        userId: user.uid,
        message: "",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setRequestedGymId(gym.id);
    } catch (e) {
      console.error("gym join error", e);
    } finally {
      setJoining(null);
    }
  };

  const finishOnboarding = async (dest) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        onboardingComplete: true,
        "onboarding.completed": true,
      });
    } catch {}
    router.replace(dest || `/${locale}/reels`);
  };

  if (authLoading || !user) {
    return <div style={s.loading}>…</div>;
  }

  const archetypeArch = archetype ? ARCHETYPE_DISPLAY[archetype] : null;
  const selectedGoal = WEEKLY_GOALS.find((g) => g.value === weeklyGoal);

  // Progress: step maps to visual segment
  const visualStep = role === "fighter" ? step : step === 4 ? 4 : 0;
  const progressFilled = role === "fighter"
    ? step
    : step >= 4 ? TOTAL_STEPS - 1 : 0;

  return (
    <div style={s.page}>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(${animDir > 0 ? "32px" : "-32px"}); } to { opacity: 1; transform: translateX(0); } }
        @keyframes welcomePop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .ob-step { animation: slideIn 0.28s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
      `}</style>

      {/* Background glow */}
      <div style={s.bgGlow} />

      {/* Progress bar */}
      <div style={s.progressWrap}>
        <div style={s.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, n) => (
            <div
              key={n}
              style={{
                ...s.progressSeg,
                background: n < (role === "fighter" ? step : step >= 4 ? TOTAL_STEPS : 0)
                  ? "#C1121F"
                  : "rgba(255,255,255,0.1)",
                boxShadow: n === (role === "fighter" ? step - 1 : step >= 4 ? TOTAL_STEPS - 1 : -1)
                  ? "0 0 10px rgba(193,18,31,0.6)"
                  : "none",
              }}
            />
          ))}
        </div>
      </div>

      <div style={s.inner}>

        {/* ── STEP 0: Role Selection ── */}
        {step === 0 && (
          <div className="ob-step">
            <div style={s.header}>
              <p style={s.kicker}>GAVANA</p>
              <h1 style={s.title}>
                {locale === "mn" ? "Та хэн бэ?" : locale === "ko" ? "당신은 누구인가요?" : "Who are you?"}
              </h1>
              <p style={s.subtitle}>
                {locale === "mn" ? "Нийгэмлэгт оролцох үүргээ сонго" : locale === "ko" ? "커뮤니티에서의 역할을 선택하세요" : "Choose your role in the community"}
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                { key: "fighter", emoji: "🥊", label: locale === "mn" ? "Боксчин / Fighter" : locale === "ko" ? "복서 / 파이터" : "Fighter / Boxer", desc: locale === "mn" ? "Дасгал хийж, rank ахиулж, тулааны шийдэл илгээ" : locale === "ko" ? "훈련하고 랭킹을 높이고 배틀을 신청하세요" : "Train, climb ranks, and challenge fighters" },
                { key: "coach", emoji: "🎓", label: locale === "mn" ? "Дасгалжуулагч / Coach" : locale === "ko" ? "코치" : "Coach / Trainer", desc: locale === "mn" ? "Шавь нарыг дасгалжуулж, хөтөлбөр боловсруул" : locale === "ko" ? "학생을 코칭하고 프로그램을 개발하세요" : "Coach students and develop training programs" },
                { key: "gym", emoji: "🏋️", label: locale === "mn" ? "Gym эзэмшигч" : locale === "ko" ? "체육관 운영자" : "Gym Owner", desc: locale === "mn" ? "Gym бүртгэж, гишүүд, мэдэгдэл удирдах" : locale === "ko" ? "체육관을 등록하고 회원과 공지를 관리하세요" : "Register your gym and manage members and announcements" },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  disabled={saving}
                  onClick={() => handleRoleNext(r.key)}
                  style={s.roleCard}
                >
                  <span style={{ fontSize: 36, flexShrink: 0 }}>{r.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{r.desc}</div>
                  </div>
                  <span style={{ fontSize: 20, color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Fighter Archetype ── */}
        {step === 1 && (
          <div className="ob-step">
            <div style={s.header}>
              <p style={s.kicker}>GAVANA · FIGHTER</p>
              <h1 style={s.title}>
                {locale === "mn" ? "Чиний Fighter Style" : locale === "ko" ? "파이터 스타일" : "Your Fighter Style"}
              </h1>
              <p style={s.subtitle}>
                {locale === "mn" ? "Байлдагчийн хэв маягаа сонго" : locale === "ko" ? "나만의 스타일을 선택하세요" : "Choose your fighting archetype"}
              </p>
            </div>

            <div style={s.archetypeGrid}>
              {Object.entries(ARCHETYPE_DISPLAY).map(([key, arch]) => {
                const desc = ARCHETYPE_DESCS[key];
                const isSelected = archetype === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setArchetype(key)}
                    style={{
                      ...s.archetypeCard,
                      border: isSelected ? `2px solid ${arch.color}` : "2px solid rgba(255,255,255,0.08)",
                      background: isSelected ? `${arch.color}14` : "rgba(255,255,255,0.03)",
                      boxShadow: isSelected ? `0 0 28px ${arch.color}28` : "none",
                    }}
                  >
                    <span style={s.archetypeEmoji}>{arch.emoji}</span>
                    <span style={{ ...s.archetypeName, color: isSelected ? arch.color : "#fff" }}>
                      {arch.name}
                    </span>
                    <span style={s.archetypeDesc}>{desc[locale] || desc.en}</span>
                    {isSelected && (
                      <div style={{ ...s.selectedDot, background: arch.color }} />
                    )}
                  </button>
                );
              })}
            </div>

            <div style={s.weightSection}>
              <label style={s.fieldLabel}>
                {locale === "mn" ? "Жингийн ангилал" : locale === "ko" ? "체급" : "Weight Class"}
                <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400, marginLeft: 6 }}>
                  {locale === "mn" ? "(заавал биш)" : locale === "ko" ? "(선택 사항)" : "(optional)"}
                </span>
              </label>
              <select value={weightClass} onChange={(e) => setWeightClass(e.target.value)} style={s.select}>
                <option value="">
                  {locale === "mn" ? "Сонгоогүй" : locale === "ko" ? "선택 안 함" : "Select…"}
                </option>
                {WEIGHT_CLASSES.map((wc) => <option key={wc} value={wc}>{wc}</option>)}
              </select>
            </div>

            <button
              type="button"
              style={archetype ? s.primaryBtn : s.primaryBtnDisabled}
              disabled={!archetype || saving}
              onClick={handleStep1Next}
            >
              {saving ? "…" : (locale === "mn" ? "Үргэлжлүүлэх →" : locale === "ko" ? "계속 →" : "Continue →")}
            </button>
          </div>
        )}

        {/* ── STEP 2: Weekly Training Goal ── */}
        {step === 2 && (
          <div className="ob-step">
            <div style={s.header}>
              <p style={s.kicker}>GAVANA · FIGHTER</p>
              <h1 style={s.title}>
                {locale === "mn" ? "7 хоногийн зорилго" : locale === "ko" ? "주간 목표" : "Weekly Training Goal"}
              </h1>
              <p style={s.subtitle}>
                {locale === "mn" ? "7 хоногт хэдэн удаа дасгал хийх вэ?" : locale === "ko" ? "일주일에 몇 번 훈련하시겠어요?" : "How many times will you train per week?"}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {WEEKLY_GOALS.map((g) => {
                const isSelected = weeklyGoal === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setWeeklyGoal(g.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 18px", borderRadius: 16,
                      border: isSelected ? "2px solid rgba(193,18,31,0.6)" : "2px solid rgba(255,255,255,0.08)",
                      background: isSelected ? "rgba(193,18,31,0.12)" : "rgba(255,255,255,0.03)",
                      boxShadow: isSelected ? "0 0 20px rgba(193,18,31,0.18)" : "none",
                      cursor: "pointer", textAlign: "left", width: "100%",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 28, flexShrink: 0, lineHeight: 1 }}>{g.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: isSelected ? "#fff" : "rgba(255,255,255,0.85)", marginBottom: 2 }}>
                        {locale === "mn" ? g.labelMn : locale === "ko" ? g.labelKo : g.labelEn}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.35 }}>
                        {locale === "mn" ? g.descMn : locale === "ko" ? g.descKo : g.descEn}
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#C1121F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              style={weeklyGoal ? s.primaryBtn : s.primaryBtnDisabled}
              disabled={!weeklyGoal || saving}
              onClick={handleStep2Next}
            >
              {saving ? "…" : (locale === "mn" ? "Үргэлжлүүлэх →" : locale === "ko" ? "계속 →" : "Continue →")}
            </button>
          </div>
        )}

        {/* ── STEP 3: Find Your Gym ── */}
        {step === 3 && (
          <div className="ob-step">
            <div style={s.header}>
              <p style={s.kicker}>GAVANA · FIGHTER</p>
              <h1 style={s.title}>
                {locale === "mn" ? "Gym олох" : locale === "ko" ? "체육관 찾기" : "Find Your Gym"}
              </h1>
              <p style={s.subtitle}>
                {locale === "mn" ? "Орон нутгийн gym-д элсэх хүсэлт илгээх" : locale === "ko" ? "가까운 체육관에 가입 신청하세요" : "Request to join a local gym (optional)"}
              </p>
            </div>

            {requestedGymId && (
              <div style={s.successBanner}>
                ✓ {locale === "mn" ? "Gym-д хүсэлт илгээгдлээ" : locale === "ko" ? "체육관 신청 완료" : "Join request sent!"}
              </div>
            )}

            {gymsLoading ? (
              <div style={s.gymList}>
                {[0, 1, 2].map((i) => <div key={i} style={s.gymSkeleton} />)}
              </div>
            ) : gyms.length === 0 ? (
              <div style={s.emptyState}>
                <span style={{ fontSize: 36, opacity: 0.4 }}>🏋️</span>
                <p style={s.emptyText}>
                  {locale === "mn" ? "Одоогоор gym бүртгэгдээгүй байна" : locale === "ko" ? "등록된 체육관이 없습니다" : "No gyms registered yet"}
                </p>
              </div>
            ) : (
              <div style={s.gymList}>
                {gyms.map((gym) => {
                  const isRequested = requestedGymId === gym.id;
                  return (
                    <div key={gym.id} style={s.gymCard}>
                      <div style={s.gymCardLeft}>
                        {gym.logo ? (
                          <img src={gym.logo} alt="" style={s.gymLogo} />
                        ) : (
                          <div style={s.gymLogoFallback}>🥊</div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <p style={s.gymName}>{gym.gymName}</p>
                          <p style={s.gymMeta}>{[gym.gymType, gym.city].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!!requestedGymId || joining === gym.id}
                        onClick={() => handleJoinGym(gym)}
                        style={isRequested ? s.joinedBtn : requestedGymId ? s.joinBtnDisabled : s.joinBtn}
                      >
                        {isRequested ? "✓" : joining === gym.id ? "…" : (locale === "mn" ? "Элсэх" : locale === "ko" ? "신청" : "Join")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={s.actionRow}>
              <button type="button" style={s.skipBtn} onClick={() => goTo(4)}>
                {locale === "mn" ? "Алгасах" : locale === "ko" ? "건너뛰기" : "Skip"}
              </button>
              <button type="button" style={{ ...s.primaryBtn, flex: 2 }} onClick={() => goTo(4)}>
                {locale === "mn" ? "Дараах →" : locale === "ko" ? "다음 →" : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Welcome ── */}
        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ ...s.welcomeEmoji, animation: "welcomePop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
              {role === "coach" ? "🎓" : role === "gym" ? "🏋️" : archetypeArch?.emoji || "🥊"}
            </div>
            <div style={{ animation: "fadeUp 0.5s ease 0.3s both" }}>
              <p style={s.kicker}>GAVANA</p>
              <h1 style={s.title}>
                {locale === "mn" ? "Тавтай морил!" : locale === "ko" ? "환영합니다!" : "Welcome!"}
              </h1>
              {role === "coach" && (
                <p style={{ ...s.archetypeNameLarge, color: "#D4AF37" }}>🎓 {locale === "mn" ? "Coach" : locale === "ko" ? "코치" : "Coach"}</p>
              )}
              {role === "gym" && (
                <p style={{ ...s.archetypeNameLarge, color: "#34D399" }}>🏋️ {locale === "mn" ? "Gym эзэмшигч" : locale === "ko" ? "체육관 운영자" : "Gym Owner"}</p>
              )}
              {role === "fighter" && archetypeArch && (
                <p style={{ ...s.archetypeNameLarge, color: archetypeArch.color }}>
                  {archetypeArch.emoji} {archetypeArch.name}
                </p>
              )}

              {/* Weekly goal confirmation */}
              {role === "fighter" && selectedGoal && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 10, padding: "8px 16px", borderRadius: 999, background: "rgba(193,18,31,0.1)", border: "1px solid rgba(193,18,31,0.25)" }}>
                  <span>{selectedGoal.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
                    {locale === "mn" ? `${selectedGoal.labelMn} дасгал` : locale === "ko" ? `${selectedGoal.labelKo} 훈련` : `${selectedGoal.labelEn} training`}
                  </span>
                </div>
              )}

              <p style={{ ...s.subtitle, marginTop: 12 }}>
                {role === "coach"
                  ? (locale === "mn" ? "GAVANA-д тавтай морил. Шавь нарыг дасгалжуулж, хөтөлбөр бүтээгээрэй." : locale === "ko" ? "GAVANA에 오신 것을 환영합니다. 학생들을 코칭하세요." : "Welcome to GAVANA. Start coaching students and building programs.")
                  : role === "gym"
                  ? (locale === "mn" ? "Gym-ийн dashboard ашиглан гишүүдийг удирдаарай." : locale === "ko" ? "체육관 대시보드로 회원을 관리하세요." : "Use the gym dashboard to manage members and announcements.")
                  : (locale === "mn" ? "GAVANA-д тавтай морил. Эхний дасгалаа эхлүүлэхэд бэлэн." : locale === "ko" ? "GAVANA에 오신 것을 환영합니다. 첫 훈련을 시작하세요." : "Welcome to GAVANA. Ready to start training and climb the ranks.")}
              </p>

              <div style={s.ctaGroup}>
                {role === "coach" ? (
                  <>
                    <button type="button" style={s.primaryBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/coach/dashboard`)}>
                      🎓 {locale === "mn" ? "Coach dashboard руу →" : locale === "ko" ? "코치 대시보드 →" : "Go to Coach Dashboard →"}
                    </button>
                    <button type="button" style={s.ghostBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/reels`)}>
                      {locale === "mn" ? "Reels үзэх →" : locale === "ko" ? "릴 보기 →" : "Browse Reels →"}
                    </button>
                  </>
                ) : role === "gym" ? (
                  <>
                    <button type="button" style={s.primaryBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/gyms/dashboard`)}>
                      🏋️ {locale === "mn" ? "Gym бүртгэх →" : locale === "ko" ? "체육관 등록 →" : "Register Your Gym →"}
                    </button>
                    <button type="button" style={s.ghostBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/reels`)}>
                      {locale === "mn" ? "Reels үзэх →" : locale === "ko" ? "릴 보기 →" : "Browse Reels →"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" style={s.primaryBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/train`)}>
                      🥊 {locale === "mn" ? "Эхний дасгал хийх" : locale === "ko" ? "첫 훈련 시작" : "Start First Training"}
                    </button>
                    <button type="button" style={s.ghostBtn} disabled={saving} onClick={() => finishOnboarding(`/${locale}/reels`)}>
                      {locale === "mn" ? "Reels үзэх →" : locale === "ko" ? "릴 보기 →" : "Browse Reels →"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const s = {
  loading: { minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" },
  page: { minHeight: "100vh", background: "#080808", color: "#fff", fontFamily: "system-ui, sans-serif", paddingBottom: 56, position: "relative", overflow: "hidden" },
  bgGlow: { position: "fixed", top: "-20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(193,18,31,0.14) 0%, transparent 65%)", pointerEvents: "none", zIndex: 0 },
  progressWrap: { position: "sticky", top: 0, zIndex: 10, paddingTop: "calc(12px + env(safe-area-inset-top))", paddingBottom: 12, background: "rgba(8,8,8,0.85)", backdropFilter: "blur(12px)" },
  progressRow: { display: "flex", gap: 5, justifyContent: "center", padding: "0 20px" },
  progressSeg: { height: 3, flex: 1, maxWidth: 70, borderRadius: 2, transition: "background 0.35s, box-shadow 0.35s" },
  inner: { maxWidth: 440, margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 1 },
  header: { textAlign: "center", padding: "28px 0 20px" },
  kicker: { margin: "0 0 8px", fontSize: 10, letterSpacing: 3, color: "#D4AF37", textTransform: "uppercase", fontWeight: 900 },
  title: { margin: "0 0 8px", fontSize: 30, fontWeight: 1000, lineHeight: 1.08, letterSpacing: -0.3 },
  subtitle: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 },
  roleCard: { display: "flex", alignItems: "center", gap: 14, padding: "18px 16px", borderRadius: 16, border: "2px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s", color: "#fff" },
  archetypeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 },
  archetypeCard: { padding: "18px 12px 14px", borderRadius: 16, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", position: "relative", transition: "all 0.18s", minHeight: 120 },
  archetypeEmoji: { fontSize: 32, lineHeight: 1 },
  archetypeName: { fontSize: 12, fontWeight: 900, letterSpacing: 0.2, lineHeight: 1.2 },
  archetypeDesc: { fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.35 },
  selectedDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%" },
  weightSection: { marginBottom: 20 },
  fieldLabel: { display: "block", fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 },
  select: { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark", boxSizing: "border-box" },
  primaryBtn: { width: "100%", padding: 15, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#C1121F,#8d0e17)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 28px rgba(193,18,31,0.3)", letterSpacing: 0.2 },
  primaryBtnDisabled: { width: "100%", padding: 15, borderRadius: 14, border: "none", background: "rgba(193,18,31,0.18)", color: "rgba(255,255,255,0.3)", fontSize: 15, fontWeight: 900, cursor: "not-allowed" },
  successBanner: { background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: 12, padding: "10px 14px", fontSize: 13, fontWeight: 800, color: "#34D399", marginBottom: 14 },
  gymList: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 },
  gymSkeleton: { height: 64, borderRadius: 14, background: "rgba(255,255,255,0.04)" },
  emptyState: { textAlign: "center", padding: "36px 0 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  emptyText: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.38)" },
  gymCard: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 14px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" },
  gymCardLeft: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
  gymLogo: { width: 40, height: 40, borderRadius: 10, objectFit: "cover", flexShrink: 0 },
  gymLogoFallback: { width: 40, height: 40, borderRadius: 10, background: "rgba(193,18,31,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },
  gymName: { margin: 0, fontSize: 13, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  gymMeta: { margin: "1px 0 0", fontSize: 11, color: "rgba(255,255,255,0.42)" },
  joinBtn: { padding: "8px 16px", borderRadius: 999, border: "none", background: "rgba(193,18,31,0.8)", color: "#fff", fontSize: 12, fontWeight: 900, cursor: "pointer", flexShrink: 0 },
  joinBtnDisabled: { padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 900, cursor: "not-allowed", flexShrink: 0 },
  joinedBtn: { padding: "8px 16px", borderRadius: 999, border: "1px solid rgba(52,211,153,0.3)", background: "rgba(52,211,153,0.1)", color: "#34D399", fontSize: 12, fontWeight: 900, cursor: "default", flexShrink: 0 },
  actionRow: { display: "flex", gap: 10 },
  skipBtn: { flex: 1, padding: 14, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 800, cursor: "pointer" },
  welcomeEmoji: { fontSize: 72, lineHeight: 1, marginTop: 40, marginBottom: 16, display: "block" },
  archetypeNameLarge: { margin: "8px 0 0", fontSize: 18, fontWeight: 900 },
  ctaGroup: { display: "flex", flexDirection: "column", gap: 10, marginTop: 32 },
  ghostBtn: { width: "100%", padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 800, cursor: "pointer" },
};
