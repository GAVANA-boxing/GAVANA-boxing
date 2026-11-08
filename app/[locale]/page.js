import Link from "next/link";
import FunnelBeacon from "@/components/FunnelBeacon";
import HeroPreview from "@/components/landing/HeroPreview";
import CinematicIntro from "@/components/landing/CinematicIntro";
import { localeMetadata } from "@/lib/seo";
import { getLocale, translate } from "@/lib/i18n";
import css from "@/components/landing/landing.module.css";

// Landing: one promise (your camera is your boxing coach), one action (start a
// free 20-second first round). Only real, shipped features; no invented numbers.

const pick = (locale, mn, ko, en) => (locale === "mn" ? mn : locale === "ko" ? ko : en);

export async function generateMetadata({ params }) {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const title = pick(locale,
    "GAVANA Boxing — Камер чинь дасгалжуулагч чинь",
    "GAVANA Boxing — 카메라가 당신의 복싱 코치",
    "GAVANA Boxing — Your camera is your boxing coach");
  const description = pick(locale,
    "Утсаа тавиад 20 секунд бокс хий. AI цохилт бүрийг тоолж, хамгаалалт, хэмнэлийг чинь шинжлээд засах нэг зүйлийг хэлнэ. Бүртгэл шаардахгүй.",
    "휴대폰을 세우고 20초 섀도복싱. AI가 펀치를 세고 가드와 리듬을 분석해 고칠 한 가지를 알려줍니다. 가입 불필요.",
    "Prop up your phone and shadow box for 20 seconds. AI counts every punch, reads your guard and rhythm, and tells you the one thing to fix. No signup.");
  // Absolute title: the root template would append "| GAVANA Boxing" a second time.
  return localeMetadata(locale, "", { mn: title, ko: title, en: title }, { mn: description, ko: description, en: description }, { absoluteTitle: true });
}

// ── Icons (24×24, stroke = currentColor) ─────────────────────────────────────
const Icon = ({ children }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IconPhone = () => <Icon><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></Icon>;
const IconPunch = () => <Icon><path d="M4 12h9" /><path d="M10 8l4 4-4 4" /><path d="M17 7.5a4.5 4.5 0 0 1 0 9" /></Icon>;
const IconTarget = () => <Icon><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" /></Icon>;
const IconCount = () => <Icon><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M21 19H3" /></Icon>;
const IconShield = () => <Icon><path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6L12 3z" /><path d="M9 12l2 2 4-4" /></Icon>;
const IconRhythm = () => <Icon><path d="M3 12h3l2-5 4 10 2-5h7" /></Icon>;
const IconGhost = () => <Icon><circle cx="9" cy="5" r="2" /><path d="M9 7v6l-3 7" /><path d="M9 13l3 7" /><path d="M9 9l5-2" /><circle cx="17" cy="6.5" r="1.6" strokeDasharray="2 2" /><path d="M17 8.5v5l-2 6.5M17 13.5l2.5 6" strokeDasharray="2 2" /></Icon>;
const Arrow = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export default async function LocalizedHomePage({ params }) {
  const { locale: rawLocale } = await params;
  const locale = getLocale(rawLocale);
  const t = (key) => translate(locale, key);
  const L = (mn, ko, en) => pick(locale, mn, ko, en);
  const startHref = `/${locale}/train?autostart=1`;
  const startLabel = L("Үнэгүй раунд эхлүүлэх", "무료 라운드 시작", "Start a free round");
  const micro = L("Бүртгэл шаардахгүй · Зөвхөн утасны камер", "가입 불필요 · 휴대폰 카메라만", "No signup · Just your phone camera");

  const facts = [
    { v: L("20 сек", "20초", "20 sec"), l: L("эхний раунд", "첫 라운드", "first round") },
    { v: "33", l: L("биеийн цэгийг хянана", "신체 포인트 추적", "body points tracked") },
    { v: "0", l: L("бээлий, мэдрэгч хэрэггүй", "웨어러블 불필요", "wearables needed") },
    { v: "MN · EN · KO", l: L("гурван хэлээр", "3개 언어", "three languages") },
  ];

  const steps = [
    { icon: <IconPhone />, title: L("Утсаа тавь", "휴대폰을 세우세요", "Prop up your phone"), body: L("Бүтэн биеэ кадрт багтаа — 2–3 алхам ухраад зогс.", "전신이 보이도록 2–3걸음 뒤로 서세요.", "Step back 2–3 paces so your whole body is in frame.") },
    { icon: <IconPunch />, title: L("20 секунд цохи", "20초 동안 펀치", "Box for 20 seconds"), body: L("AI цохилт, хамгаалалт, хөдөлгөөнийг чинь бодит цагт хянана.", "AI가 펀치·가드·움직임을 실시간으로 추적합니다.", "AI tracks your punches, guard and movement live.") },
    { icon: <IconTarget />, title: L("Засах нэг зүйлээ ав", "고칠 한 가지", "Get the one thing to fix"), body: L("Раундын дараа оноо + яг нэг зөвлөгөө. Дараагийн раундад түүнийгээ сайжруул.", "라운드 후 점수와 딱 한 가지 조언. 다음 라운드에서 개선하세요.", "A score and exactly one tip after each round. Fix it next round.") },
  ];

  const learn = [
    { icon: <IconCount />, title: L("Цохилт бүр", "모든 펀치", "Every punch"), body: L("Jab, cross, hook — гар тус бүрээр тоолно.", "잽·크로스·훅을 손별로 셉니다.", "Jab, cross and hook — counted per hand.") },
    { icon: <IconShield />, title: L("Хамгаалалт", "가드", "Your guard"), body: L("Хойд гар чинь хэдийд эрүүнээсээ буусныг яг мөчөөр нь харуулна.", "뒷손이 턱에서 떨어진 순간을 정확히 보여줍니다.", "The exact moments your rear hand left your chin.") },
    { icon: <IconRhythm />, title: L("Хэмнэл, комбо", "리듬과 콤비네이션", "Rhythm and combos"), body: L("1-2 комбо чинь нэг хэмнэлтэй, мөр чинь эргэж байна уу.", "원-투가 한 리듬인지, 어깨가 회전하는지.", "Whether your one-two flows and your shoulders turn.") },
    { icon: <IconGhost />, title: L("Ghost Round", "고스트 라운드", "Ghost Round"), body: L("Бодит motion capture-аас бүтээсэн ghost-той зэрэгцэн jab-cross цохиод харьцуул.", "실제 모션 캡처로 만든 고스트와 나란히 잽-크로스를 치고 비교하세요.", "Throw jab–cross side by side with a ghost built from real motion capture, then compare."), highlight: true },
  ];

  return (
    <main className={css.page}>
      <FunnelBeacon step="landing_viewed" locale={locale} />

      <nav className={css.nav} aria-label="GAVANA">
        <Link href={`/${locale}`} className={css.logo}>
          <span className={css.logoMark} aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff"><path d="M5 12l7-9 7 9-7 9z" /></svg>
          </span>
          GAVANA
        </Link>
        <div className={css.navLinks}>
          <details className={css.lang}>
            <summary aria-label={L("Хэл сонгох", "언어 선택", "Choose language")}>{locale.toUpperCase()}</summary>
            <div className={css.langMenu}>
              {[["mn", "Монгол"], ["en", "English"], ["ko", "한국어"]].map(([code, name]) => (
                <Link key={code} href={`/${code}`} hrefLang={code} aria-current={code === locale ? "true" : undefined}>{name}</Link>
              ))}
            </div>
          </details>
          <Link href={`/${locale}/login`} className={css.navLink}>{t("login")}</Link>
          <Link href={startHref} className={css.navCta}>{L("Эхлэх", "시작", "Start")}</Link>
        </div>
      </nav>

      <CinematicIntro labels={{
        region: L("GAVANA танилцуулга", "GAVANA 인트로", "GAVANA intro"),
        video: L("GAVANA BOXING — 3D танилцуулга", "GAVANA BOXING — 3D 인트로", "GAVANA BOXING — 3D intro"),
        tagline: L("AI БОКС БЭЛТГЭЛИЙН ПЛАТФОРМ", "AI 복싱 트레이닝 플랫폼", "AI-POWERED TRAINING PLATFORM"),
        withSound: L("Дуутай үзэх", "소리와 함께 보기", "Play with sound"),
        replay: L("Дахин үзэх", "다시 보기", "Replay"),
        play: L("Тоглуулах", "재생", "Play"), pause: L("Түр зогсоох", "일시정지", "Pause"),
        mute: L("Дууг хаах", "음소거", "Mute"), unmute: L("Дуу нээх", "음소거 해제", "Unmute"),
      }} />

      <section className={css.hero}>
        <div className={css.heroText}>
          <p className={css.kicker}><span className={css.kickerDot} />{L("AI боксын дасгалжуулагч", "AI 복싱 코치", "AI boxing coach")}</p>
          <h1 className={css.title}>
            {L("Камер чинь —", "카메라가", "Your camera is")}<br />
            <span className={css.accent}>{L("дасгалжуулагч чинь", "당신의 코치", "your coach")}</span>
          </h1>
          <p className={css.sub}>
            {L(
              "Утсаа тавиад 20 секунд сүүдрийн бокс хий. GAVANA цохилт бүрийг тоолж, хамгаалалт, хэмнэлийг чинь шинжлээд дараагийн раундад юуг засахыг хэлнэ.",
              "휴대폰을 세우고 20초 섀도복싱. GAVANA가 모든 펀치를 세고 가드와 리듬을 분석해 다음 라운드에서 고칠 점을 알려줍니다.",
              "Prop up your phone and shadow box for 20 seconds. GAVANA counts every punch, reads your guard and rhythm, and tells you what to fix next round."
            )}
          </p>
          <div className={css.ctaRow}>
            <Link href={startHref} className={css.cta}>{startLabel}<Arrow /></Link>
            <a href="#how" className={css.ghostLink}>{L("Хэрхэн ажилладаг", "작동 방식", "How it works")}</a>
          </div>
          <p className={css.micro}>{micro}</p>
        </div>
        <div className={css.heroVisual}>
          <HeroPreview labels={{ round: L("РАУНД 1", "라운드 1", "ROUND 1"), combo: L("1-2 КОМБО ✓", "원-투 ✓", "1-2 COMBO ✓"), score: L("ОНОО", "점수", "SCORE"), punches: L("цохилт", "펀치", "punches") }} />
        </div>
      </section>

      <section className={css.facts} aria-label={L("Товч мэдээлэл", "요약", "At a glance")}>
        {facts.map((f) => (
          <div key={f.l} className={css.fact}>
            <span className={css.factValue}>{f.v}</span>
            <span className={css.factLabel}>{f.l}</span>
          </div>
        ))}
      </section>

      <section id="how" className={css.section}>
        <p className={css.sectionKicker}>{L("Хэрхэн ажилладаг", "작동 방식", "How it works")}</p>
        <h2 className={css.sectionTitle}>{L("Гурван алхам. Нэг минут.", "세 단계. 1분.", "Three steps. One minute.")}</h2>
        <div className={css.steps}>
          {steps.map((s, i) => (
            <div key={s.title} className={css.step}>
              <div className={css.stepTop}>
                <span className={css.icon}>{s.icon}</span>
                <span className={css.stepNum}>0{i + 1}</span>
              </div>
              <h3 className={css.cardTitle}>{s.title}</h3>
              <p className={css.cardBody}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={css.section}>
        <p className={css.sectionKicker}>{L("Нэг раундын дараа", "한 라운드 후", "After one round")}</p>
        <h2 className={css.sectionTitle}>{L("Дасгалжуулагч чинь юу харсныг мэд", "코치가 본 것을 확인하세요", "See what a coach would see")}</h2>
        <div className={css.learnGrid}>
          {learn.map((c) => (
            <div key={c.title} className={`${css.learn} ${c.highlight ? css.learnHighlight : ""}`}>
              <span className={css.icon}>{c.icon}</span>
              <div>
                <h3 className={css.cardTitle}>
                  {c.title}
                  {c.highlight && <span className={css.badge}>{L("Шинэ", "NEW", "New")}</span>}
                </h3>
                <p className={css.cardBody}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={css.final}>
        <div className={css.finalCard}>
          <h2 className={css.finalTitle}>{L("Эхний раунд чинь 20 секунд", "첫 라운드는 20초", "Your first round is 20 seconds")}</h2>
          <p className={css.finalSub}>{L("Одоо утсаа тавиад үз — бүртгэлгүйгээр.", "지금 휴대폰을 세우고 시작하세요 — 가입 없이.", "Prop up your phone and try it now — no account needed.")}</p>
          <Link href={startHref} className={css.cta}>{startLabel}<Arrow /></Link>
        </div>
      </section>

      <footer className={css.footer}>
        <span>© {new Date().getFullYear()} GAVANA Boxing</span>
        <div className={css.footerLinks}>
          <Link href={`/${locale}/login`}>{t("login")}</Link>
          <Link href={`/${locale}/terms`}>{L("Нөхцөл", "약관", "Terms")}</Link>
          <Link href={`/${locale}/privacy`}>{L("Нууцлал", "개인정보", "Privacy")}</Link>
        </div>
      </footer>
    </main>
  );
}
