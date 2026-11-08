import { Inter, Geist_Mono, Bebas_Neue, Oswald, Barlow_Condensed, Roboto_Condensed } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import QueryProvider from "@/components/providers/QueryProvider";
import { UserProfileProvider } from "@/context/UserProfileProvider";
import InAppBrowserWarning from "@/components/InAppBrowserWarning";
import WebVitals from "@/components/WebVitals";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import ClientShell from "@/components/ClientShell";
import FunnelBeacon from "@/components/FunnelBeacon";
import GuestSessionClaimer from "@/components/GuestSessionClaimer";

// Fonts. Mongolian needs Cyrillic *and* Cyrillic-ext (Ө ө Ү ү live in cyrillic-ext).
// The brand display faces (Bebas Neue, Barlow Condensed) are Latin-only, so each is
// paired with a Cyrillic face of the same shape; the browser picks per glyph, so a
// Latin word stays Bebas and a Mongolian word renders in Oswald — never a system serif.
// Stacks are built below from each face's real (build-hashed) family name — NOT from
// next/font's "<Font> Fallback" face, which is a resized local Arial and would grab the
// Cyrillic glyphs before the Cyrillic face (tiny Arial on iPhone). globals.css holds
// generic defaults for the same --stack-* variables.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["cyrillic", "cyrillic-ext"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["cyrillic", "cyrillic-ext"],
});

const FONT_VARS = [inter, geistMono, bebasNeue, oswald, barlowCondensed, robotoCondensed].map((f) => f.variable).join(" ");

/** The loaded face's own family name, without next/font's metric-adjusted Arial fallback. */
const face = (f) => f.style.fontFamily.split(",")[0].trim();
const FONT_STACKS = {
  "--stack-sans": `${inter.style.fontFamily}, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`,
  "--stack-display": `${face(bebasNeue)}, ${face(oswald)}, "Arial Narrow", Impact, sans-serif`,
  "--stack-condensed": `${face(barlowCondensed)}, ${face(robotoCondensed)}, "Arial Narrow", sans-serif`,
  "--stack-mono": `${face(geistMono)}, ui-monospace, SFMono-Regular, Menlo, monospace`,
};

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gavana-boxing.vercel.app"),
  applicationName: "GAVANA Boxing",
  title: {
    default: "GAVANA Boxing — AI Punch Scoring for Fighters",
    template: "%s | GAVANA Boxing",
  },
  description: "Prop up your phone and shadow box for 20 seconds. The camera watches your punches and guard, scores the round and gives you one thing to fix — in Mongolian, Korean or English.",
  keywords: ["boxing", "AI boxing coach", "punch counter", "shadow boxing", "бокс", "дасгалжуулагч", "복싱"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "GAVANA Boxing",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "GAVANA Boxing",
    title: "GAVANA Boxing — AI Punch Scoring for Fighters",
    description: "20-second shadow-boxing rounds: camera punch tracking, a round score and one thing to fix.",
    // PNG: most link previews (Facebook, Telegram, KakaoTalk, iMessage) don't show SVG.
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "GAVANA — AI boxing coach" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
    title: "GAVANA Boxing",
    description: "20-second shadow-boxing rounds: camera punch tracking, a round score and one thing to fix.",
  },
  icons: {
    icon: [
      { url: "/icons/gavana-icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    // iOS ignores SVG touch icons (the home-screen icon came out as a page screenshot).
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  // No maximumScale: people must be able to pinch-zoom (WCAG 1.4.4).
  viewportFit: "cover",
  themeColor: "#0B0B0C",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${FONT_VARS} h-full antialiased`}
      style={FONT_STACKS}
    >
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://fcm.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <QueryProvider>
            <UserProfileProvider>
              <FunnelBeacon appOpened />
              <GuestSessionClaimer />
              <ServiceWorkerRegistrar />
              <WebVitals />
              <InAppBrowserWarning />
              <ClientShell />
              {children}
            </UserProfileProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
