import Link from "next/link";
import { getLocale, translate } from "@/lib/i18n";
import { RED, GOLD, redAlpha, goldAlpha } from "@/lib/tokens";

export async function generateMetadata({ params }) {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const title = "GAVANA Boxing — Train. Fight. Evolve.";
  const description = locale === "mn"
    ? "Боксын нийгэмлэг апп. AI тренер, Fighter Card, тулааны challenge."
    : locale === "ko"
    ? "복싱 커뮤니티 앱. AI 코치, 파이터 카드, 배틀 챌린지."
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
    <main style={s.page}>
      {/* Nav */}
      <nav style={s.nav}>
        <span style={s.navLogo}>🥊 GAVANA</span>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href={`/${locale}/login`} style={s.navLink}>{t("login")}</Link>
          <Link href={`/${locale}/login?mode=signup`} style={s.navCta}>{t("loginSignUp")}</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={s.hero}>
        <p style={s.kicker}>GAVANA BOXING</p>
        <h1 style={s.title}>
          Train.<br />Fight.<br />
          <span style={{ color: RED }}>Evolve.</span>
        </h1>
        <p style={s.subtitle}>
          {locale === "mn"
            ? "AI тренер, бодит цохилт тоолох систем, Fighter Card болон шууд тулааны challenge."
            : locale === "ko"
            ? "AI 코치, 실시간 펀치 감지, 파이터 카드, 실시간 배틀 챌린지."
            : "AI punch scoring, Fighter Card, real-time challenges — the boxing app built for fighters."}
        </p>
        <div style={s.ctaRow}>
          <Link href={`/${locale}/login?mode=signup`} style={s.primaryCta}>
            {t("loginSignUp")} →
          </Link>
          <Link href={`/${locale}/reels`} style={s.secondaryCta}>
            {t("reels")}
          </Link>
        </div>
      </section>

      {/* Social proof */}
      <section style={s.socialProof}>
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
        <div style={s.mockCard}>
          <div style={s.mockCardHeader}>
            <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: 3, color: RED }}>GAVANA</span>
            <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)", letterSpacing: 2 }}>AI COACH</span>
            <div style={s.verifiedBadge}>✦ VERIFIED FIGHTER</div>
          </div>
          <div style={s.mockAvatar}>🥊</div>
          <div style={s.mockName}>Your Fighter Name</div>
          <div style={s.mockStats}>
            {["SPD", "ACC", "STA", "STR"].map((s_) => (
              <div key={s_} style={s.mockStat}>
                <span style={{ fontSize: 18, fontWeight: 900, color: RED }}>
                  {({ SPD: 78, ACC: 85, STA: 64, STR: 72 })[s_]}
                </span>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>{s_}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 8 }}>🔗 Scan to Challenge Me</div>
        </div>
      </section>

      {/* Features */}
      <section style={s.features}>
        <p style={s.sectionKicker}>WHY GAVANA</p>
        <h2 style={s.sectionTitle}>{t("landingFeaturesTitle")}</h2>
        <div style={s.featureGrid}>
          {FEATURES.map(({ emoji, titleKey, textKey }) => (
            <div key={titleKey} style={s.featureCard}>
              <span style={{ fontSize: 32, marginBottom: 12, display: "block" }}>{emoji}</span>
              <h3 style={s.featureTitle}>{t(titleKey)}</h3>
              <p style={s.featureText}>{t(textKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={s.bottomCta}>
        <h2 style={s.bottomCtaTitle}>
          {locale === "mn" ? "Бэлэн үү?" : locale === "ko" ? "준비됐나요?" : "Ready to fight?"}
        </h2>
        <Link href={`/${locale}/login?mode=signup`} style={{ ...s.primaryCta, fontSize: 16, padding: "16px 40px" }}>
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
    minHeight: "100vh",
    background: `radial-gradient(circle at 50% 0%, ${redAlpha(0.2)}, transparent 40%), linear-gradient(180deg, #070707, #0B0B0B)`,
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflowX: "hidden",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    position: "sticky",
    top: 0,
    background: "rgba(7,7,7,0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    zIndex: 100,
  },
  navLogo: { fontSize: 16, fontWeight: 900, color: "#fff", letterSpacing: 1 },
  navLink: { padding: "8px 14px", borderRadius: 10, color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13, fontWeight: 700 },
  navCta:  { padding: "8px 16px", borderRadius: 10, background: RED, color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 900 },
  hero: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "80px 24px 60px",
    textAlign: "center",
  },
  kicker: { margin: "0 0 18px", color: GOLD, fontSize: 11, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" },
  title: { margin: "0 0 22px", fontSize: "clamp(52px, 12vw, 96px)", lineHeight: 0.9, fontWeight: 1000 },
  subtitle: { margin: "0 auto 32px", maxWidth: 460, color: "#AAAAAA", fontSize: 16, lineHeight: 1.55 },
  ctaRow: { display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 },
  primaryCta: { padding: "14px 28px", borderRadius: 14, background: RED, color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 14, boxShadow: `0 12px 32px ${redAlpha(0.35)}` },
  secondaryCta: { padding: "14px 28px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", textDecoration: "none", fontWeight: 800, fontSize: 14 },
  socialProof: {
    display: "flex",
    justifyContent: "center",
    gap: 48,
    padding: "32px 24px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  proofItem: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  proofValue: { fontSize: 28, fontWeight: 1000, color: "#fff" },
  proofLabel: { fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 },
  cardPreviewSection: { maxWidth: 480, margin: "0 auto", padding: "72px 24px", textAlign: "center" },
  sectionKicker: { margin: "0 0 10px", color: GOLD, fontSize: 10, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase" },
  sectionTitle: { margin: "0 0 10px", fontSize: "clamp(28px, 6vw, 40px)", fontWeight: 1000 },
  sectionSub: { margin: "0 auto 32px", maxWidth: 380, color: "#888", fontSize: 14, lineHeight: 1.55 },
  mockCard: {
    background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${redAlpha(0.15)} 0%, transparent 60%), linear-gradient(180deg, #141014 0%, #0c0a0c 100%)`,
    border: `1px solid ${redAlpha(0.2)}`,
    borderRadius: 20,
    padding: "24px 24px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    maxWidth: 280,
    margin: "0 auto",
    boxShadow: `0 32px 80px rgba(0,0,0,0.6)`,
  },
  mockCardHeader: { display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 2 },
  verifiedBadge: { padding: "3px 8px", borderRadius: 999, background: `${redAlpha(0.15)}`, border: `1px solid ${redAlpha(0.3)}`, color: RED, fontSize: 7.5, fontWeight: 900, letterSpacing: 1.5, marginTop: 4 },
  mockAvatar: { width: 72, height: 72, borderRadius: "50%", background: `${redAlpha(0.2)}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, border: `2px solid ${redAlpha(0.4)}` },
  mockName: { fontSize: 16, fontWeight: 900, color: "#fff" },
  mockStats: { display: "flex", gap: 16, marginTop: 4 },
  mockStat: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 },
  features: { maxWidth: 900, margin: "0 auto", padding: "72px 24px", textAlign: "center" },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 40, textAlign: "left" },
  featureCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "24px 20px" },
  featureTitle: { margin: "0 0 8px", fontSize: 16, fontWeight: 900, color: "#fff" },
  featureText: { margin: 0, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 },
  bottomCta: { padding: "80px 24px", textAlign: "center", background: `radial-gradient(circle at 50% 0%, ${redAlpha(0.12)}, transparent 60%)` },
  bottomCtaTitle: { margin: "0 0 28px", fontSize: "clamp(32px, 7vw, 52px)", fontWeight: 1000 },
  footer: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)", fontSize: 12 },
  footerLink: { color: "rgba(255,255,255,0.3)", textDecoration: "none", fontSize: 12 },
};
