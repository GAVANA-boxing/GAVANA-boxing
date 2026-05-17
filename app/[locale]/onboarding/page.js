"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDocs,
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

export default function OnboardingPage() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState(0);
  const [role, setRole] = useState(null); // "fighter" | "coach" | "gym"
  const [archetype, setArchetype] = useState(null);
  const [weightClass, setWeightClass] = useState("");
  const [saving, setSaving] = useState(false);

  const [gyms, setGyms] = useState([]);
  const [gymsLoading, setGymsLoading] = useState(false);
  const [requestedGymId, setRequestedGymId] = useState(null);
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/${locale}/login`);
  }, [authLoading, user, router, locale]);

  const handleRoleNext = async (selectedRole) => {
    setRole(selectedRole);
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { role: selectedRole });
    } catch (e) { console.error("role save", e); }
    setSaving(false);
    if (selectedRole === "coach") {
      setStep(3);
    } else if (selectedRole === "gym") {
      setStep(3);
    } else {
      setStep(1);
    }
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
    setGymsLoading(true);
    try {
      const snap = await getDocs(collection(db, "gyms"));
      setGyms(snap.docs.map((d) => ({ id: d.id, ...d.data() })).slice(0, 12));
    } catch {}
    setGymsLoading(false);
    setStep(2);
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
      await updateDoc(doc(db, "users", user.uid), { onboardingComplete: true });
    } catch {}
    router.replace(dest || `/${locale}/reels`);
  };

  if (authLoading || !user) {
    return <div style={s.loading}>…</div>;
  }

  const archetypeArch = archetype ? ARCHETYPE_DISPLAY[archetype] : null;

  return (
    <div style={s.page}>
      {/* Step progress */}
      <div style={s.progressRow}>
        {[0, 1, 2, 3].map((n) => (
          <div
            key={n}
            style={{
              ...s.progressSeg,
              background: step >= n ? "#C1121F" : "rgba(255,255,255,0.1)",
              boxShadow: step === n ? "0 0 8px rgba(193,18,31,0.5)" : "none",
            }}
          />
        ))}
      </div>

      <div style={s.inner}>

        {/* ── STEP 0: Role Selection ── */}
        {step === 0 && (
          <div>
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
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 16px", borderRadius: 16, border: "2px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", cursor: saving ? "not-allowed" : "pointer", textAlign: "left", width: "100%", transition: "all 0.15s" }}
                >
                  <span style={{ fontSize: 36, flexShrink: 0 }}>{r.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{r.desc}</div>
                  </div>
                  <span style={{ fontSize: 18, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Fighter Identity ── */}
        {step === 1 && (
          <div>
            <div style={s.header}>
              <p style={s.kicker}>GAVANA</p>
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
                      boxShadow: isSelected ? `0 0 24px ${arch.color}28` : "none",
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
              </label>
              <select
                value={weightClass}
                onChange={(e) => setWeightClass(e.target.value)}
                style={s.select}
              >
                <option value="">
                  {locale === "mn" ? "Сонгоогүй (заавал биш)" : locale === "ko" ? "선택 안 함 (선택 사항)" : "Select — optional"}
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

        {/* ── STEP 2: Find Your Gym ── */}
        {step === 2 && (
          <div>
            <div style={s.header}>
              <p style={s.kicker}>GAVANA</p>
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
                          <p style={s.gymMeta}>
                            {[gym.gymType, gym.city].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!!requestedGymId || joining === gym.id}
                        onClick={() => handleJoinGym(gym)}
                        style={
                          isRequested ? s.joinedBtn
                          : requestedGymId ? s.joinBtnDisabled
                          : s.joinBtn
                        }
                      >
                        {isRequested ? "✓"
                          : joining === gym.id ? "…"
                          : (locale === "mn" ? "Элсэх" : locale === "ko" ? "신청" : "Join")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={s.actionRow}>
              <button type="button" style={s.skipBtn} onClick={() => setStep(3)}>
                {locale === "mn" ? "Алгасах" : locale === "ko" ? "건너뛰기" : "Skip"}
              </button>
              <button type="button" style={{ ...s.primaryBtn, flex: 2 }} onClick={() => setStep(3)}>
                {locale === "mn" ? "Дараах →" : locale === "ko" ? "다음 →" : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Welcome ── */}
        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <style>{`@keyframes welcomePop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}} @keyframes welcomeFade{0%{opacity:0;transform:translateY(16px)}100%{opacity:1;transform:translateY(0)}}`}</style>
            <div style={{ ...s.welcomeEmoji, animation: "welcomePop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
              {role === "coach" ? "🎓" : role === "gym" ? "🏋️" : archetypeArch?.emoji || "🥊"}
            </div>
            <div style={{ animation: "welcomeFade 0.5s ease 0.3s both" }}>
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
              <p style={{ ...s.subtitle, marginTop: 8 }}>
                {role === "coach"
                  ? (locale === "mn" ? "GAVANA-д тавтай морил. Шавь нарыг дасгалжуулж, хөтөлбөр бүтээгээрэй." : locale === "ko" ? "GAVANA에 오신 것을 환영합니다. 학생들을 코칭하세요." : "Welcome to GAVANA. Start coaching students and building programs.")
                  : role === "gym"
                  ? (locale === "mn" ? "Gym-ийн dashboard ашиглан гишүүдийг удирдаарай." : locale === "ko" ? "체육관 대시보드로 회원을 관리하세요." : "Use the gym dashboard to manage members and announcements.")
                  : (locale === "mn" ? "GAVANA-д тавтай морил. Эхний дасгалаа эхлүүлэхэд бэлэн." : locale === "ko" ? "GAVANA에 오신 것을 환영합니다. 첫 훈련을 시작하세요." : "Welcome to GAVANA. Start training and climb the ranks.")}
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
  loading: { minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "system-ui, sans-serif" },
  page: { minHeight: "100vh", background: "radial-gradient(ellipse at top, rgba(193,18,31,0.12) 0%, transparent 45%), #080808", color: "#fff", fontFamily: "system-ui, sans-serif", paddingBottom: 48 },
  progressRow: { display: "flex", gap: 6, justifyContent: "center", padding: "20px 16px 0" },
  progressSeg: { height: 4, flex: 1, maxWidth: 80, borderRadius: 2, transition: "background 0.3s, box-shadow 0.3s" },
  inner: { maxWidth: 440, margin: "0 auto", padding: "0 16px" },
  header: { textAlign: "center", padding: "28px 0 20px" },
  kicker: { margin: "0 0 6px", fontSize: 10, letterSpacing: 3, color: "#D4AF37", textTransform: "uppercase", fontWeight: 900 },
  title: { margin: "0 0 6px", fontSize: 28, fontWeight: 1000, lineHeight: 1.1 },
  subtitle: { margin: 0, fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.55 },
  archetypeGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 },
  archetypeCard: { padding: "18px 12px 14px", borderRadius: 16, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center", position: "relative", transition: "all 0.18s", minHeight: 120 },
  archetypeEmoji: { fontSize: 32, lineHeight: 1 },
  archetypeName: { fontSize: 12, fontWeight: 900, letterSpacing: 0.2, lineHeight: 1.2 },
  archetypeDesc: { fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.35 },
  selectedDot: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: "50%" },
  weightSection: { marginBottom: 20 },
  fieldLabel: { display: "block", fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 },
  select: { width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 14, outline: "none", colorScheme: "dark", boxSizing: "border-box" },
  primaryBtn: { width: "100%", padding: 15, borderRadius: 14, border: "none", background: "linear-gradient(135deg,#C1121F,#7d0812)", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer", boxShadow: "0 8px 28px rgba(193,18,31,0.32)", letterSpacing: 0.2 },
  primaryBtnDisabled: { width: "100%", padding: 15, borderRadius: 14, border: "none", background: "rgba(193,18,31,0.22)", color: "rgba(255,255,255,0.35)", fontSize: 15, fontWeight: 900, cursor: "not-allowed" },
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
  welcomeEmoji: { fontSize: 72, lineHeight: 1, marginTop: 32, marginBottom: 12, display: "block" },
  archetypeNameLarge: { margin: "8px 0 0", fontSize: 18, fontWeight: 900 },
  ctaGroup: { display: "flex", flexDirection: "column", gap: 10, marginTop: 32 },
  ghostBtn: { width: "100%", padding: 14, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 800, cursor: "pointer" },
};
