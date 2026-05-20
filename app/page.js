"use client";

import { useRouter } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import DailyMission from "@/components/DailyMission";
import { useAuth } from "@/lib/AuthContext";
import { translate } from "@/lib/i18n";

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const locale = "en";
  const t = (key) => translate(locale, key);
  const isLoggedIn = Boolean(user?.uid);

  const features = [
    {
      kicker: t("landingFeature1Kicker"),
      title: t("landingFeature1Title"),
      text: t("landingFeature1Text"),
    },
    {
      kicker: t("landingFeature2Kicker"),
      title: t("landingFeature2Title"),
      text: t("landingFeature2Text"),
    },
    {
      kicker: t("landingFeature3Kicker"),
      title: t("landingFeature3Title"),
      text: t("landingFeature3Text"),
    },
  ];

  const goTo = (route, protectedRoute = true) => {
    if (!protectedRoute || isLoggedIn) {
      router.push(route);
      return;
    }

    router.push(`/${locale}/login?redirect=${encodeURIComponent(route)}`);
  };

  return (
    <main className="landing">
      <LanguageSwitcher currentLocale={locale} />

      <section className="hero">
        <nav className="nav" aria-label="Main navigation">
          <button type="button" className="brand" onClick={() => router.push("/")}>
            GAVANA
          </button>
          <div className="navLinks">
            <button type="button" onClick={() => goTo(`/${locale}/reels`, false)}>{t("landingWatchReels")}</button>
            <button type="button" onClick={() => goTo(`/${locale}/upload`)}>{t("landingStartTraining")}</button>
          </div>
        </nav>

        <DailyMission locale={locale} />

        <div className="heroGrid">
          <div className="heroCopy">
            <p className="eyebrow">{t("landingEyebrow")}</p>
            <h1>{t("landingHeroTitle")}</h1>
            <p className="subtitle">{t("landingSubtitle")}</p>
            <div className="ctaRow">
              <button type="button" className="primaryCta" onClick={() => goTo(`/${locale}/reels`, false)}>
                {t("landingWatchReels")}
              </button>
              <button type="button" className="secondaryCta" onClick={() => goTo(`/${locale}/upload`)}>
                {t("landingStartTraining")}
              </button>
            </div>
          </div>

          <div className="heroVisual" aria-hidden="true">
            <div className="ringLine ringTop" />
            <div className="ringLine ringMid" />
            <div className="ringLine ringLow" />
            <div className="bag" />
            <div className="fighterMark" />
            <div className="floorGlow" />
          </div>
        </div>
      </section>

      <section className="features" aria-label="GAVANA features">
        {features.map((feature) => (
          <article className="featureCard" key={feature.kicker}>
            <p>{feature.kicker}</p>
            <h2>{feature.title}</h2>
            <span>{feature.text}</span>
          </article>
        ))}
      </section>

      <section className="finalBand">
        <div>
          <p className="eyebrow">{t("landingJoinEyebrow")}</p>
          <h2>{t("landingJoinTitle")}</h2>
        </div>
        <button type="button" onClick={() => goTo(`/${locale}/upload`)}>
          {t("landingStartTraining")}
        </button>
      </section>

      <style>{`
        .landing {
          min-height: 100vh;
          background: #070707;
          color: #fff;
          overflow-x: hidden;
        }

        .hero {
          min-height: 100vh;
          padding: 18px clamp(18px, 5vw, 72px) 42px;
          background:
            linear-gradient(90deg, rgba(7,7,7,0.98), rgba(7,7,7,0.78)),
            radial-gradient(circle at 78% 12%, rgba(193,18,31,0.28), transparent 28%),
            radial-gradient(circle at 74% 78%, rgba(212,175,55,0.14), transparent 26%),
            #070707;
        }

        .nav {
          width: min(1180px, 100%);
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        button {
          font: inherit;
        }

        .brand {
          min-width: 112px;
          min-height: 42px;
          border: 1px solid rgba(212,175,55,0.48);
          border-radius: 8px;
          background: rgba(11,11,11,0.78);
          color: #D4AF37;
          font-weight: 950;
          letter-spacing: 2px;
          cursor: pointer;
        }

        .navLinks {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .navLinks button,
        .secondaryCta {
          border: 1px solid #333;
          background: transparent;
          color: #fff;
        }

        .navLinks button {
          min-height: 38px;
          border-radius: 999px;
          padding: 0 14px;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
        }

        .heroGrid {
          width: min(1180px, 100%);
          min-height: calc(100vh - 78px);
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 0.68fr);
          align-items: center;
          gap: 34px;
        }

        .heroCopy {
          padding: 72px 0;
        }

        .eyebrow {
          margin: 0 0 16px;
          color: #D4AF37;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 2.2px;
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          max-width: 820px;
          font-size: clamp(56px, 13vw, 128px);
          line-height: 0.9;
          font-weight: 1000;
          letter-spacing: 0;
        }

        .subtitle {
          max-width: 570px;
          margin: 24px 0 0;
          color: #AAAAAA;
          font-size: clamp(17px, 3vw, 24px);
          line-height: 1.45;
          font-weight: 600;
        }

        .ctaRow {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 190px));
          gap: 12px;
          margin-top: 34px;
        }

        .primaryCta,
        .secondaryCta,
        .finalBand button {
          min-height: 54px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 950;
          cursor: pointer;
        }

        .primaryCta,
        .finalBand button {
          border: 1px solid rgba(255,255,255,0.1);
          background: #C1121F;
          color: #fff;
          box-shadow: 0 20px 48px rgba(193,18,31,0.24);
        }

        .heroVisual {
          position: relative;
          min-height: 560px;
          border-left: 1px solid rgba(212,175,55,0.22);
          border-bottom: 1px solid rgba(212,175,55,0.18);
          transform: skewX(-7deg);
          overflow: hidden;
        }

        .ringLine {
          position: absolute;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.72), transparent);
        }

        .ringTop { top: 24%; }
        .ringMid { top: 42%; }
        .ringLow { top: 60%; }

        .bag {
          position: absolute;
          right: 16%;
          top: 4%;
          width: 92px;
          height: 360px;
          border-radius: 999px;
          background: linear-gradient(90deg, #100607, #5f1018 48%, #130607);
          border: 1px solid rgba(212,175,55,0.18);
          box-shadow: 0 34px 90px rgba(0,0,0,0.46);
        }

        .fighterMark {
          position: absolute;
          right: 42%;
          top: 26%;
          width: 210px;
          height: 300px;
          border-radius: 48% 52% 34% 40%;
          background: linear-gradient(165deg, rgba(193,18,31,0.72), rgba(212,175,55,0.16), transparent 62%);
          filter: blur(0.5px);
        }

        .floorGlow {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 26%;
          background: radial-gradient(ellipse at 55% 50%, rgba(212,175,55,0.18), transparent 62%);
        }

        .features {
          width: min(1180px, calc(100% - 36px));
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          padding: 44px 0 30px;
        }

        .featureCard {
          min-height: 190px;
          border-radius: 8px;
          border: 1px solid #1a1a1a;
          border-top: 2px solid #D4AF37;
          background: #0B0B0B;
          padding: 22px;
          box-shadow: 0 18px 44px rgba(0,0,0,0.22);
        }

        .featureCard p {
          margin: 0;
          color: #D4AF37;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 1.6px;
          text-transform: uppercase;
        }

        .featureCard h2 {
          margin: 18px 0 0;
          font-size: 25px;
          line-height: 1.04;
          font-weight: 1000;
        }

        .featureCard span {
          display: block;
          margin-top: 14px;
          color: #AAAAAA;
          font-size: 15px;
          line-height: 1.55;
        }

        .finalBand {
          width: min(1180px, calc(100% - 36px));
          margin: 0 auto;
          padding: 42px 0 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .finalBand h2 {
          margin: 0;
          font-size: clamp(32px, 7vw, 58px);
          line-height: 1;
          font-weight: 1000;
        }

        .finalBand button {
          min-width: 190px;
        }

        @media (max-width: 820px) {
          .hero {
            padding: 16px 18px 38px;
          }

          .heroGrid {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .heroCopy {
            padding: 70px 0 20px;
          }

          .heroVisual {
            min-height: 300px;
            opacity: 0.72;
          }

          .features {
            grid-template-columns: 1fr;
          }

          .finalBand {
            display: grid;
          }

          .finalBand button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
