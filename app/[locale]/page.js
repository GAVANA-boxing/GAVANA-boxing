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

const SOCIAL_PROOF = [
  { value: "10K+", labelKey: "landingSocialFighters" },
  { value: "50K+", labelKey: "landingSocialReels" },
  { value: "200K+", labelKey: "landingSocialChallenges" },
];

export default async function LocalizedHomePage({ params }) {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const t = (key) => translate(locale, key);

  return (
    <main className="grain-overlay vignette" style={s.page}>
      {/* Scanline sweep */}
      <div className="scanline" />

      {/* Ambient orbs for background depth */}
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
        <p className="landing-subtitle" style={s.subtitle}>
          {locale === "mn"
            ? "AI тренэр, бодит цохилт тоолох систем, Fighter Card болон шууд тулааны чалленге."
            : locale === "ko"
            ? "AI 코치, 실시간 펀치 감지, 파이터 카드, 실시간 배틀 쳌린지."
            : "AI punch scoring, Fighter Card, real-time challenges — the boxing app built for fighters."}
        </p>
        <div className="landing-cta-row" style={s.ctaRow}>
          <Link href={`/${locale}/login?mode=signup`} className="landing-primary-cta" style={s.primaryCta}>
            {t("loginSignUp")} →
          </Link>
          <Link href={`/${locale}/reels`} className="landing-secondary-cta" style={s.secondaryCta}>
            {t("reels")}
          </Link>
        </div>
      </section>

      {/* Social proof — glass blur panel */}
      <section className="glass-stats landing-social-proof" style={s.socialProof}>
        {SOCIAL_PROOF.map(({ value, labelKey }) => (
          <div key={labelKey} style={s.proofItem}>
            <span style={s.proofValue}>{value}</span>
            <span style={s.proofLabel}>{t(labelKey)}</span>
          </div>
        ))}
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

      {/* Bottom CTA */}
      <section style={s.bottomCta}>
        <p style={s.bottomKicker}>FIGHT STARTS NOW</p>
        <h2 style={s.bottomCtaTitle}>
          {locale === "mn" ? "Бэлэн үү?" : locale === "ko" ? "준비됩나요?" : "Ready to fight?"}
        </h2>
        <Link href={`/${locale}/login?mode=signup`} style={s.bottomCtaBtn}>
          {t("loginSignUp")} — {locale === "mn" ? "Үнэгүй" : locale === "ko" ? "무료" : "It's Free"}
        </Link>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <span>© 2026 GAVANA Boxing</span>
        <div style={{ display: "flex", gap: 20 }}>
          <Link href={`/${locale}/reels`} style={s.footerLink}>{t("reels")}</Link>
          <Link href={`/${locale}/login`} style={s.footerLink}>{t("login")}</Link>
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
  socialProof: {
    display: "flex",
    justifyContent: "center",
    gap: 48,
    padding: "36px 24px",
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
