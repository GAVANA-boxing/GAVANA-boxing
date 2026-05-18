import Link from "next/link";
import { getLocale, translate } from "@/lib/i18n";
import { RED, GOLD } from "@/lib/tokens";

export default async function LocalizedHomePage({ params }) {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const t = (key) => translate(locale, key);

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.kicker}>GAVANA BOXING</p>
        <h1 style={styles.title}>Train. Fight. Evolve.</h1>
        <p style={styles.subtitle}>Boxing reels, AI coach, and fighter community</p>
        <div style={styles.links}>
          <Link style={styles.primary} href={`/${locale}/reels`}>{t("reels")}</Link>
          <Link style={styles.secondary} href={`/${locale}/upload`}>{t("upload")}</Link>
          <Link style={styles.secondary} href={`/${locale}/coach`}>{t("aiCoach")}</Link>
          <Link style={styles.secondary} href={`/${locale}/profile`}>{t("profile")}</Link>
        </div>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at 50% 20%, rgba(193,18,31,0.18), transparent 34%), linear-gradient(180deg, #070707, #0B0B0B)",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    padding: 24,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  hero: {
    width: "min(100%, 620px)",
    textAlign: "center",
    display: "grid",
    gap: 18,
  },
  kicker: {
    margin: 0,
    color: GOLD,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 2,
  },
  title: {
    margin: 0,
    fontSize: "clamp(46px, 10vw, 86px)",
    lineHeight: 0.92,
    fontWeight: 1000,
    letterSpacing: 0,
  },
  subtitle: {
    margin: "0 auto 8px",
    maxWidth: 440,
    color: "#AAAAAA",
    fontSize: 17,
    lineHeight: 1.45,
  },
  links: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  primary: {
    padding: "13px 18px",
    borderRadius: 999,
    background: RED,
    color: "#fff",
    textDecoration: "none",
    fontWeight: 900,
  },
  secondary: {
    padding: "13px 18px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
  },
};
