import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const whyItems = [
  {
    title: "AI Boxing Coach",
    text: "Get focused training ideas, technique cues, and round-by-round guidance when you need it.",
  },
  {
    title: "Reel-based training",
    text: "Post your rounds, bag work, footwork, and drills in a feed built around boxing progress.",
  },
  {
    title: "Community & competition",
    text: "Follow fighters, react to clips, and stay connected to the athletes sharpening their craft.",
  },
];

const steps = [
  "Upload your training",
  "Get feedback",
  "Improve and grow",
];

const stats = [
  { value: "10,000+", label: "punches tracked" },
  { value: "2,000+", label: "fighters" },
  { value: "50,000+", label: "views" },
];

export default function HomePage() {
  return (
    <main className="landing">
      <LanguageSwitcher currentLocale="en" />
      <section className="hero">
        <nav className="nav" aria-label="Main navigation">
          <Link href="/" className="brand">GAVANA</Link>
          <div className="navLinks">
            <Link href="/reels">Reels</Link>
            <Link href="/en/coach">Coach</Link>
            <Link href="/en/profile">Profile</Link>
          </div>
        </nav>

        <div className="heroContent reveal">
          <p className="eyebrow">AI powered boxing community</p>
          <h1>Train. Fight. Evolve.</h1>
          <p className="subtitle">
            Join the next generation of boxing with AI coaching and reels
          </p>
          <div className="ctaRow">
            <Link href="/reels" className="ctaPrimary">Start Training</Link>
            <Link href="/en/coach" className="ctaSecondary">Try AI Coach</Link>
          </div>
        </div>

        <div className="heroVisual" aria-hidden="true">
          <div className="ringFrame">
            <div className="rope ropeTop" />
            <div className="rope ropeMid" />
            <div className="rope ropeBottom" />
            <div className="fighterGlow" />
            <div className="bag" />
            <div className="floorLight" />
          </div>
        </div>
      </section>

      <section className="stats reveal" aria-label="Gavana stats">
        {stats.map((stat) => (
          <div className="stat" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="section reveal">
        <div className="sectionHeader">
          <p className="eyebrow">Why Gavana?</p>
          <h2>Built for fighters who study the work.</h2>
        </div>
        <div className="cards">
          {whyItems.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section how reveal">
        <div className="sectionHeader">
          <p className="eyebrow">How it works</p>
          <h2>Train in public. Improve with intention.</h2>
        </div>
        <div className="steps">
          {steps.map((step, index) => (
            <div className="step" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step}</h3>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        html {
          scroll-behavior: smooth;
        }

        .landing {
          min-height: 100vh;
          background: #070707;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          overflow-x: hidden;
        }

        .hero {
          min-height: 100vh;
          position: relative;
          display: grid;
          grid-template-rows: auto 1fr;
          padding: 18px clamp(18px, 5vw, 72px) 54px;
          isolation: isolate;
          background:
            linear-gradient(90deg, rgba(4,4,4,0.92) 0%, rgba(4,4,4,0.78) 42%, rgba(4,4,4,0.38) 100%),
            radial-gradient(circle at 72% 20%, rgba(193,18,31,0.28), transparent 28%),
            radial-gradient(circle at 78% 82%, rgba(212,175,55,0.18), transparent 24%),
            linear-gradient(135deg, #070707 0%, #120608 52%, #0b0b0b 100%);
        }

        .hero:before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -2;
          background:
            repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 96px),
            linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.82) 100%);
          opacity: 0.72;
        }

        .hero:after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 34vh;
          z-index: -1;
          background: linear-gradient(180deg, transparent, #070707 86%);
        }

        .nav {
          width: min(1180px, 100%);
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .brand {
          width: 112px;
          min-height: 42px;
          border: 1px solid rgba(212,175,55,0.5);
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #d4af37;
          text-decoration: none;
          font-weight: 950;
          letter-spacing: 2px;
          background: rgba(0,0,0,0.34);
        }

        .navLinks {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .navLinks a {
          color: rgba(255,255,255,0.72);
          text-decoration: none;
          font-size: 14px;
          font-weight: 800;
        }

        .heroContent {
          width: min(1180px, 100%);
          margin: 0 auto;
          align-self: center;
          padding: 72px 0 108px;
        }

        .eyebrow {
          margin: 0 0 14px;
          color: #d4af37;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 12px;
          font-weight: 950;
        }

        h1 {
          max-width: 900px;
          margin: 0;
          font-size: clamp(54px, 14vw, 132px);
          line-height: 0.9;
          letter-spacing: 0;
          font-weight: 950;
        }

        .subtitle {
          max-width: 620px;
          margin: 24px 0 0;
          color: rgba(255,255,255,0.76);
          font-size: clamp(18px, 4.4vw, 27px);
          line-height: 1.42;
        }

        .ctaRow {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 180px), 1fr));
          gap: 12px;
          width: min(100%, 410px);
          margin-top: 36px;
        }

        .ctaPrimary,
        .ctaSecondary {
          min-height: 52px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 15px;
          font-weight: 950;
        }

        .ctaPrimary {
          color: #fff;
          background: #c1121f;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 18px 42px rgba(193,18,31,0.24);
        }

        .ctaSecondary {
          color: #d4af37;
          background: rgba(255,255,255,0.055);
          border: 1px solid rgba(212,175,55,0.38);
        }

        .heroVisual {
          position: absolute;
          right: clamp(-110px, -4vw, -32px);
          bottom: 0;
          width: min(58vw, 760px);
          height: min(72vh, 720px);
          z-index: -1;
          opacity: 0.9;
        }

        .ringFrame {
          position: absolute;
          inset: 6% 0 0;
          border-left: 2px solid rgba(212,175,55,0.38);
          border-bottom: 2px solid rgba(212,175,55,0.22);
          transform: skewX(-8deg);
        }

        .rope {
          position: absolute;
          left: 0;
          right: 8%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.7), transparent);
        }

        .ropeTop { top: 22%; }
        .ropeMid { top: 38%; }
        .ropeBottom { top: 54%; }

        .fighterGlow {
          position: absolute;
          right: 26%;
          top: 13%;
          width: 220px;
          height: 360px;
          border-radius: 48% 52% 36% 40%;
          background:
            radial-gradient(circle at 50% 12%, rgba(255,255,255,0.32), transparent 12%),
            linear-gradient(165deg, rgba(193,18,31,0.78), rgba(36,6,10,0.22) 58%, transparent);
          filter: blur(1px);
          opacity: 0.62;
        }

        .bag {
          position: absolute;
          right: 12%;
          top: 2%;
          width: 92px;
          height: 360px;
          border-radius: 42px;
          background: linear-gradient(90deg, #12090a, #5f111e 45%, #160608);
          border: 1px solid rgba(212,175,55,0.2);
          box-shadow: 0 30px 90px rgba(0,0,0,0.38);
        }

        .floorLight {
          position: absolute;
          right: 8%;
          bottom: 4%;
          width: 74%;
          height: 22%;
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(212,175,55,0.2), transparent 68%);
        }

        .stats,
        .section {
          width: min(1180px, calc(100% - 36px));
          margin: 0 auto;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr));
          gap: 14px;
          padding: 28px 0 20px;
        }

        .stat {
          border-top: 1px solid rgba(212,175,55,0.45);
          padding: 18px 0 8px;
        }

        .stat strong {
          display: block;
          color: #fff;
          font-size: clamp(30px, 8vw, 48px);
          line-height: 1;
          font-weight: 950;
        }

        .stat span {
          display: block;
          margin-top: 8px;
          color: rgba(255,255,255,0.62);
          font-size: 14px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .section {
          padding: 58px 0;
        }

        .sectionHeader {
          max-width: 680px;
          margin-bottom: 24px;
        }

        h2 {
          margin: 0;
          font-size: clamp(32px, 8vw, 64px);
          line-height: 1;
          font-weight: 950;
        }

        .cards,
        .steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
          gap: 14px;
        }

        .card,
        .step {
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.1);
          background: linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.025));
          padding: 22px;
        }

        .card h3,
        .step h3 {
          margin: 0;
          color: #fff;
          font-size: 20px;
          font-weight: 950;
        }

        .card p {
          margin: 12px 0 0;
          color: rgba(255,255,255,0.64);
          font-size: 15px;
          line-height: 1.6;
        }

        .how {
          padding-bottom: 84px;
        }

        .step span {
          display: block;
          margin-bottom: 48px;
          color: #d4af37;
          font-size: 13px;
          font-weight: 950;
          letter-spacing: 2px;
        }

        .reveal {
          animation: fadeUp 780ms ease both;
        }

        .stats.reveal {
          animation-delay: 100ms;
        }

        .section.reveal {
          animation-delay: 180ms;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 760px) {
          .hero {
            padding: 16px 18px 42px;
          }

          .nav {
            align-items: flex-start;
          }

          .navLinks {
            gap: 10px;
          }

          .navLinks a {
            font-size: 13px;
          }

          .heroContent {
            padding: 74px 0 92px;
          }

          .heroVisual {
            right: -220px;
            width: 560px;
            height: 58vh;
            opacity: 0.45;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .reveal {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
