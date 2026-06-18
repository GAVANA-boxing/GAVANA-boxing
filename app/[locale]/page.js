import Link from "next/link";
import { getLocale, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";

export async function generateMetadata({ params }) {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const title = "GAVANA Boxing — Train. Fight. Evolve.";
  const description = locale === "mn"
    ? "Боксын нийгэмлэл апп. AI тренэр, Fighter Card, тулааны чалленге."
    : locale === "ko"
    ? "복싱 커뮤니티 앱. AI 코치, 파이터 카드, 배틀 쳌린지."
    : "The boxing community app. AI coach, Fighter Card, real punch scoring, and live challenges.";
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "GAVANA Boxing" },
    twitter: { card: "summary", title, description },
  };
}

const FEATURES = [
  { emoji: "🥊", titleKey: "landingFeature1Title", textKey: "landingFeature1Text" },
  { emoji: "🤖", titleKey: "landingFeature2Title", textKey: "landingFeature2Text" },
  { emoji: "⚔️", titleKey: "landingFeature3Title", textKey: "landingFeature3Text" },
  { emoji: "🏆", titleKey: "landingFeature4Title", textKey: "landingFeature4Text" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    en: { title: "Train with your camera", body: "Shadow box for 60 seconds. Our AI scores your punches, tracks your stance, and detects your style — no wearables needed." },
    mn: { title: "Камераар бэлтгэл хий", body: "60 секунд сүүдрийн бокс хий. AI таны цохилт, байрлал, хэв маягийг шинжилнэ — ямар ч төхөөрөмжгүйгээр." },
    ko: { title: "카메라로 훈련하기", body: "60초 섀도우 복싱. AI가 펀치, 자세, 스타일을 분석합니다 — 웨어러블 불필요." },
  },
  {
    step: "02",
    en: { title: "Get your Fighter DNA", body: "After 3 sessions you unlock your Fighter Card — a personal archetype (Pressure, Outboxer, Counter, etc.) built from your real movement data." },
    mn: { title: "Fighter DNA авах", body: "3 хичээлийн дараа Fighter Card нээгдэнэ — таны хөдөлгөөний өгөгдлөөс бүтсэн хувийн архетип." },
    ko: { title: "파이터 DNA 확인", body: "3회 세션 후 파이터 카드 공개 — 실제 움직임 데이터 기반 개인 아키타입." },
  },
  {
    step: "03",
    en: { title: "Train smarter, fight better", body: "Your AI coach prescribes drills based on your weaknesses. Challenge other fighters. Track your evolution week by week." },
    mn: { title: "Ухаалаг бэлтгэл, илүү сайн тулаан", body: "AI тренэр таны сул талуудад суурилсан дасгал зааж өгнө. Бусад тулаанчдыг сорь. Долоо хоног бүр хөгжлөө хяна." },
    ko: { title: "더 스마트한 훈련, 더 나은 파이팅", body: "AI 코치가 약점 기반 드릴 처방. 다른 파이터에게 도전. 주별 성장 추적." },
  },
];

const AI_USECASES = [
  {
    icon: "🧬",
    en: { title: "\"Am I a pressure fighter or outboxer?\"", body: "After 3 sessions, GAVANA builds your Fighter DNA — a movement archetype based on punch patterns, footwork, and guard positioning. No guessing." },
    mn: { title: "\"Би pressure эсвэл outboxer уу?\"", body: "3 хичээлийн дараа GAVANA таны Fighter DNA-г бүрдүүлнэ — цохилтын хэв маяг, хөл хөдөлгөөн дээр суурилсан архетип." },
    ko: { title: "\"나는 압박형인가 아웃복서인가?\"", body: "3회 세션 후 GAVANA가 Fighter DNA 생성 — 펀치 패턴·풋워크 기반 아키타입." },
  },
  {
    icon: "📈",
    en: { title: "\"Why does my guard keep dropping?\"", body: "The AI tracks guard position frame by frame. After your session, it shows exactly when and why your defense breaks — with drill prescriptions to fix it." },
    mn: { title: "\"Яагаад миний хамгаалалт буурдаг вэ?\"", body: "AI хамгаалтын байрлалыг фрейм бүрт хянана. Хичээлийн дараа яг хэдийд, яагаад алдаа гарсныг харуулаад засах дасгал өгнө." },
    ko: { title: "\"왜 가드가 계속 내려가나요?\"", body: "AI가 프레임별 가드 위치 추적. 세션 후 정확한 원인과 교정 드릴 제공." },
  },
  {
    icon: "⚔️",
    en: { title: "\"I want to fight like Lomachenko\"", body: "Study any fighter's movement profile, then train against their style. Your AI sparring partner adapts to the opponent you're studying." },
    mn: { title: "\"Ломаченко шиг тулалдахыг хүсч байна\"", body: "Дурын тулаанчийн хөдөлгөөний профайлыг судлаад тэдний хэв маягт бэлтгэл хий. AI sparring partner чинь судалж буй өрсөлдөгчид тохируулна." },
    ko: { title: "\"로마첸코처럼 싸우고 싶어요\"", body: "파이터 무브먼트 프로필 학습 후 해당 스타일로 훈련. AI 스파링 파트너가 대상 선수에 맞게 적응." },
  },
];

export default async function LocalizedHomePage({ params }) {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const t = (key) => translate(locale, key);

  const hw = HOW_IT_WORKS.map(({ step, ...rest }) => ({ step, ...(rest[locale] || rest.en) }));
  const uc = AI_USECASES.map(({ icon, ...rest }) => ({ icon, ...(rest[locale] || rest.en) }));

  return (
    <main className="grain-overlay vignette" style={s.page}>
      <div className="scanline" />
      <div className="ambient-orb" style={s.orb1} />
      <div className="ambient-orb" style={s.orb2} />
      <div className="ambient-orb" style={s.orb3} />

      {/* Nav */}
      <nav style={s.nav}>
        <span style={s.navLogo}>🥊 GAVANA</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingRight: 52 }}>
          <Link href={`/${locale}/login`} style={s.navLink}>{t("login")}</Link>
          <Link href={`/${locale}/login?mode=signup`} style={s.navCta}>{t("loginSignUp")}</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero" style={s.hero}>
        <p style={s.kicker}>COMBAT · BOXING</p>
        <h1 className="landing-title" style={s.title}>
          Train.<br />Fight.<br />
          <span style={s.titleAccent}>Evolve.</span>
        </h1>
        <p style={s.valueFor}>
          {locale === "mn"
            ? "Аматур тулаанчид, залуу боксчид, дасгалжуулагчдад зориулсан — AI тренэр, Fighter Card, нийгэмлэг нэг дор."
            : locale === "ko"
            ? "아마추어 파이터·복싱 팬·코치를 위한 — AI 코치·파이터 카드·커뮤니티 올인원."
            : "For amateur fighters, gym athletes & coaches — AI coach, Fighter Card, and live community in one app."}
        </p>
        <p className="landing-subtitle" style={s.subtitle}>
          {locale === "mn"
            ? "Хэдэн цохилт хий — GAVANA таны боксын хэв маягийг AI-р бодит цаг хугацаанд шинжилнэ. Бүртгэл шаардахгүй."
            : locale === "ko"
            ? "몇 번 펀치해보세요 — GAVANA가 AI로 복싱 스타일을 실시간 분석합니다. 가입 불필요."
            : "Throw a few punches. GAVANA reads your boxing style in real time — no signup needed."}
        </p>
        <div className="landing-cta-row" style={s.ctaRow}>
          <Link href={`/${locale}/train?autostart=1`} className="landing-primary-cta" style={s.primaryCta}>
            {locale === "mn" ? "AI Боксын үнэлгээ →" : locale === "ko" ? "AI 복싱 분석 시작 →" : "Start Free AI Assessment →"}
          </Link>
          <Link href={`/${locale}/reels`} className="landing-secondary-cta" style={s.secondaryCta}>
            {locale === "mn" ? "Reels харах" : locale === "ko" ? "릴스 보기" : "Watch Fighter Reels"}
          </Link>
        </div>
      </section>

      {/* Traction metrics */}
      <section style={s.socialProof}>
        {[
          { value: "2,400+", en: "Fighters trained", mn: "Бэлтгэсэн тулаанч", ko: "훈련한 파이터" },
          { value: "18k+",   en: "Training sessions", mn: "Бэлтгэлийн хичээл", ko: "훈련 세션" },
          { value: "47",     en: "Gyms onboarded", mn: "Нэгдсэн заал", ko: "온보딩 체육관" },
          { value: "3",      en: "Countries", mn: "Улс орон", ko: "국가" },
        ].map(({ value, en, mn, ko }) => (
          <div key={value} style={s.proofItem}>
            <span style={s.proofValue}>{value}</span>
            <span style={s.proofLabel}>{locale === "mn" ? mn : locale === "ko" ? ko : en}</span>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section style={s.howSection}>
        <p style={s.sectionKicker}>
          {locale === "mn" ? "ХЭРХЭН АЖИЛЛАДАГ" : locale === "ko" ? "작동 방식" : "HOW IT WORKS"}
        </p>
        <h2 style={s.sectionTitle}>
          {locale === "mn" ? "3 алхамд тулаанч болох" : locale === "ko" ? "3단계로 파이터 되기" : "From first punch to Fighter Card in 3 steps"}
        </h2>
        <div style={s.howGrid}>
          {hw.map(({ step, title, body }) => (
            <div key={step} style={s.howCard}>
              <span style={s.howStep}>{step}</span>
              <h3 style={s.howTitle}>{title}</h3>
              <p style={s.howBody}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Coach use cases */}
      <section style={s.aiSection}>
        <p style={s.sectionKicker}>AI COACH</p>
        <h2 style={s.sectionTitle}>
          {locale === "mn" ? "Бодит асуудалд бодит хариулт" : locale === "ko" ? "실제 질문, 실제 답변" : "Real questions. Real answers."}
        </h2>
        <p style={{ ...s.sectionSub, marginBottom: 40 }}>
          {locale === "mn"
            ? "AI тренэр таны хөдөлгөөний өгөгдлийг уншаад хувийн зөвлөгөө өгнө — ерөнхий биш."
            : locale === "ko"
            ? "AI 코치가 당신의 움직임 데이터를 읽고 개인화된 조언 제공 — 일반론이 아닌."
            : "Your AI coach reads your actual movement data and gives personalized advice — not generic tips."}
        </p>
        <div style={s.ucGrid}>
          {uc.map(({ icon, title, body }) => (
            <div key={title} style={s.ucCard}>
              <span style={s.ucIcon}>{icon}</span>
              <h3 style={s.ucTitle}>{title}</h3>
              <p style={s.ucBody}>{body}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Link href={`/${locale}/train?autostart=1`} style={s.primaryCta}>
            {locale === "mn" ? "Одоо туршиж үзэх →" : locale === "ko" ? "지금 체험하기 →" : "Try it free →"}
          </Link>
        </div>
      </section>

      {/* Fighter Card preview */}
      <section style={s.cardPreviewSection}>
        <p style={s.sectionKicker}>FIGHTER CARD</p>
        <h2 style={s.sectionTitle}>{t("landingCardTitle")}</h2>
        <p style={s.sectionSub}>{t("landingCardSub")}</p>
        <div style={{ ...s.mockCard, position: "relative", overflow: "hidden" }}>
          <div className="fighter-card-foil" />
          <div style={s.mockCardHeader}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 3, color: RED }}>GAVANA</span>
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>AI COACH</span>
            <div style={s.verifiedBadge}>✦ VERIFIED FIGHTER</div>
          </div>
          <div style={s.mockAvatar}>🥊</div>
          <div style={s.mockName}>Your Fighter Name</div>
          <div style={s.mockStats}>
            {["SPD", "ACC", "STA", "STR"].map((stat) => (
              <div key={stat} style={s.mockStat}>
                <span style={{ fontSize: 18, fontWeight: 900, color: RED }}>
                  {({ SPD: 78, ACC: 85, STA: 64, STR: 72 })[stat]}
                </span>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>{stat}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>🔗 Scan to Challenge Me</div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" style={s.features}>
        <p style={s.sectionKicker}>WHY GAVANA</p>
        <h2 style={s.sectionTitle}>{t("landingFeaturesTitle")}</h2>
        <div style={s.featureGrid}>
          {FEATURES.map(({ emoji, titleKey, textKey }) => (
            <div key={titleKey} className="feature-card-glow" style={s.featureCard}>
              <span style={{ fontSize: 32, marginBottom: 12, display: "block" }}>{emoji}</span>
              <h3 style={s.featureTitle}>{t(titleKey)}</h3>
              <p style={s.featureText}>{t(textKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof strip */}
      <section style={s.proofStrip}>
        {[
          { icon: "🥊", en: "Train with your camera", mn: "Камераар бэлтгэл хий", ko: "카메라로 훈련" },
          { icon: "🧬", en: "Get your Fighter DNA", mn: "Fighter DNA авах", ko: "파이터 DNA 확인" },
          { icon: "🤖", en: "AI coach, not a chatbot", mn: "AI тренэр, чатбот биш", ko: "AI 코치, 챗봇 아님" },
          { icon: "⚔️", en: "Challenge real fighters", mn: "Бодит тулаанчдыг сорих", ko: "실제 파이터에게 도전" },
          { icon: "📈", en: "Track your evolution", mn: "Хөгжлөө хянах", ko: "성장 추적" },
        ].map(({ icon, en, mn, ko }) => (
          <span key={en} style={s.proofChip}>
            <span style={{ marginRight: 7 }}>{icon}</span>
            {locale === "mn" ? mn : locale === "ko" ? ko : en}
          </span>
        ))}
      </section>

      {/* Bottom CTA */}
      <section style={s.bottomCta}>
        <p style={s.bottomKicker}>FIGHT STARTS NOW</p>
        <h2 style={s.bottomCtaTitle}>
          {locale === "mn"
            ? "Камер асаагаад эхлэ"
            : locale === "ko"
            ? "카메라 켜고 시작하세요"
            : "Turn on your camera. Start training."}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>
          {locale === "mn"
            ? "60 секунд. Бүртгэл шаардахгүй. Таны Fighter DNA эхлэнэ."
            : locale === "ko"
            ? "60초. 가입 불필요. 파이터 DNA 시작."
            : "60 seconds. No signup. Your Fighter DNA starts building now."}
        </p>
        <Link href={`/${locale}/train?autostart=1`} style={s.bottomCtaBtn}>
          {locale === "mn" ? "Үнэгүй эхлэх →" : locale === "ko" ? "무료로 시작 →" : "Start Free Assessment →"}
        </Link>
        <p style={{ marginTop: 16, color: "rgba(255,255,255,0.22)", fontSize: 11, letterSpacing: "0.06em" }}>
          {locale === "mn" ? "БҮРТГЭЛ · КРЕДИТ КАРТ ШААРДАХГҮЙ" : locale === "ko" ? "가입 · 신용카드 불필요" : "NO SIGNUP · NO CREDIT CARD"}
        </p>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <span>© 2025 GAVANA Boxing</span>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link href={`/${locale}/reels`} style={s.footerLink}>{t("reels")}</Link>
          <Link href={`/${locale}/login`} style={s.footerLink}>{t("login")}</Link>
          <Link href={`/${locale}/terms`} style={s.footerLink}>
            {locale === "mn" ? "Нөхцөл" : locale === "ko" ? "약관" : "Terms"}
          </Link>
          <Link href={`/${locale}/privacy`} style={s.footerLink}>
            {locale === "mn" ? "Нууцлал" : locale === "ko" ? "개인정보" : "Privacy"}
          </Link>
        </div>
      </footer>
    </main>
  );
}

const s = {
  page: {
    minHeight: "100dvh",
    background: `
      radial-gradient(ellipse 70% 40% at 50% -5%, ${redAlpha(0.28)} 0%, transparent 55%),
      radial-gradient(ellipse 50% 30% at 10% 60%, ${redAlpha(0.10)} 0%, transparent 50%),
      radial-gradient(ellipse 60% 40% at 90% 80%, ${goldAlpha(0.06)} 0%, transparent 50%),
      linear-gradient(180deg, #060608 0%, #09090B 60%, #070709 100%)
    `,
    color: "#fff",
    overflowX: "hidden",
    position: "relative",
  },
  orb1: {
    width: 600,
    height: 600,
    top: "-120px",
    left: "50%",
    transform: "translateX(-50%)",
    background: redAlpha(0.13),
    animationDelay: "0s",
    animationDuration: "8s",
    pointerEvents: "none",
  },
  orb2: {
    width: 400,
    height: 400,
    bottom: "15%",
    right: "-80px",
    background: redAlpha(0.08),
    animationDelay: "3s",
    animationDuration: "11s",
    pointerEvents: "none",
  },
  orb3: {
    width: 300,
    height: 300,
    top: "40%",
    left: "-60px",
    background: goldAlpha(0.05),
    animationDelay: "6s",
    animationDuration: "14s",
    pointerEvents: "none",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    position: "sticky",
    top: 0,
    background: "rgba(6,6,8,0.85)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    zIndex: 100,
  },
  navLogo: { fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: 1 },
  navLink: { padding: "7px 12px", borderRadius: 8, color: "rgba(255,255,255,0.55)", textDecoration: "none", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 },
  navCta:  { padding: "7px 14px", borderRadius: 999, background: RED, color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 900, whiteSpace: "nowrap", flexShrink: 0, letterSpacing: "0.02em" },
  hero: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "120px 24px 90px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  kicker: {
    margin: "0 0 20px",
    color: RED,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 28px",
    fontSize: "clamp(56px, 13vw, 100px)",
    lineHeight: 0.88,
    fontWeight: 1000,
    letterSpacing: "-1px",
  },
  titleAccent: {
    color: RED,
    textShadow: `0 0 40px ${redAlpha(0.5)}, 0 0 80px ${redAlpha(0.2)}`,
  },
  subtitle: {
    margin: "0 auto 40px",
    maxWidth: 460,
    color: "rgba(200,200,200,0.65)",
    fontSize: 16,
    lineHeight: 1.65,
  },
  ctaRow: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 14 },
  primaryCta: {
    padding: "11px 28px",
    borderRadius: 12,
    background: `linear-gradient(135deg, #d4192a 0%, ${RED} 40%, #a01020 100%)`,
    color: "#fff",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    boxShadow: `0 0 20px ${redAlpha(0.4)}, 0 8px 24px ${redAlpha(0.25)}`,
  },
  secondaryCta: {
    padding: "11px 24px",
    borderRadius: 12,
    background: "rgba(18,18,20,0.5)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.45)",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  valueFor: {
    margin: "0 auto 16px",
    maxWidth: 500,
    color: GOLD,
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.04em",
    textAlign: "center",
    opacity: 0.85,
  },
  howSection: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "80px 24px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  howGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 20,
    marginTop: 44,
    textAlign: "left",
  },
  howCard: {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: "28px 24px",
  },
  howStep: {
    display: "block",
    fontSize: 11,
    fontWeight: 900,
    color: RED,
    letterSpacing: 2,
    marginBottom: 12,
    opacity: 0.8,
  },
  howTitle: { margin: "0 0 10px", fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.2 },
  howBody: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.65 },
  aiSection: {
    maxWidth: 980,
    margin: "0 auto",
    padding: "80px 24px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
    background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${redAlpha(0.06)} 0%, transparent 70%)`,
  },
  ucGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
    textAlign: "left",
  },
  ucCard: {
    background: `linear-gradient(145deg, ${redAlpha(0.06)}, rgba(255,255,255,0.02))`,
    border: `1px solid ${redAlpha(0.18)}`,
    borderRadius: 20,
    padding: "28px 24px",
  },
  ucIcon: { fontSize: 28, display: "block", marginBottom: 14 },
  ucTitle: { margin: "0 0 10px", fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.3 },
  ucBody: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.65 },
  socialProof: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "24px 48px",
    padding: "40px 24px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    position: "relative",
    zIndex: 1,
  },
  proofItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  proofValue: {
    fontSize: 30,
    fontWeight: 1000,
    color: "#fff",
    textShadow: `0 0 20px ${redAlpha(0.3)}`,
  },
  proofLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  cardPreviewSection: {
    maxWidth: 480,
    margin: "0 auto",
    padding: "90px 24px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  sectionKicker: {
    margin: "0 0 12px",
    color: GOLD,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 4,
    textTransform: "uppercase",
    fontFamily: "var(--font-condensed)",
  },
  sectionTitle: { margin: "0 0 12px", fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 1000, lineHeight: 1.1 },
  sectionSub: { margin: "0 auto 36px", maxWidth: 380, color: "rgba(150,150,150,0.7)", fontSize: 14, lineHeight: 1.6 },
  mockCard: {
    background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${redAlpha(0.18)} 0%, transparent 60%), linear-gradient(180deg, #161014 0%, #0d0b0d 100%)`,
    border: `1px solid ${redAlpha(0.25)}`,
    borderRadius: 22,
    padding: "28px 28px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    maxWidth: 280,
    margin: "0 auto",
    boxShadow: `0 0 60px ${redAlpha(0.12)}, 0 32px 80px rgba(0,0,0,0.7)`,
  },
  mockCardHeader: { display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 2 },
  verifiedBadge: {
    padding: "3px 8px",
    borderRadius: 999,
    background: redAlpha(0.15),
    border: `1px solid ${redAlpha(0.35)}`,
    color: RED,
    fontSize: 7.5,
    fontWeight: 900,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  mockAvatar: {
    width: 76,
    height: 76,
    borderRadius: "50%",
    background: redAlpha(0.2),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 34,
    border: `2px solid ${redAlpha(0.45)}`,
    boxShadow: `0 0 20px ${redAlpha(0.3)}`,
  },
  mockName: { fontSize: 16, fontWeight: 900, color: "#fff" },
  mockStats: { display: "flex", gap: 16, marginTop: 4 },
  mockStat: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  features: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "90px 24px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
    marginTop: 44,
    textAlign: "left",
  },
  featureCard: {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: "28px 22px",
    transition: "border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
  },
  featureTitle: { margin: "0 0 8px", fontSize: 16, fontWeight: 900, color: "#fff" },
  featureText: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.6 },
  proofStrip: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    padding: "32px 24px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    position: "relative",
    zIndex: 1,
  },
  proofChip: {
    display: "inline-flex",
    alignItems: "center",
    padding: "8px 16px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.03em",
    whiteSpace: "nowrap",
  },
  bottomCta: {
    padding: "100px 24px",
    textAlign: "center",
    position: "relative",
    zIndex: 1,
    background: `radial-gradient(ellipse 60% 70% at 50% 100%, ${redAlpha(0.18)} 0%, transparent 65%)`,
  },
  bottomKicker: {
    margin: "0 0 16px",
    color: RED,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 5,
    textTransform: "uppercase",
    textShadow: `0 0 16px ${redAlpha(0.6)}`,
  },
  bottomCtaTitle: {
    margin: "0 0 32px",
    fontSize: "clamp(36px, 7vw, 56px)",
    fontWeight: 1000,
    lineHeight: 1.1,
  },
  bottomCtaBtn: {
    display: "inline-block",
    padding: "18px 44px",
    borderRadius: 16,
    background: `linear-gradient(135deg, ${RED}, #c0392b)`,
    color: "#fff",
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: 0.5,
    boxShadow: `0 0 32px ${redAlpha(0.5)}, 0 16px 40px ${redAlpha(0.35)}`,
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    position: "relative",
    zIndex: 1,
  },
  footerLink: { color: "rgba(255,255,255,0.25)", textDecoration: "none", fontSize: 12 },
};
