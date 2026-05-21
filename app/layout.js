import { Geist, Geist_Mono, Bebas_Neue, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import InAppBrowserWarning from "@/components/InAppBrowserWarning";
import WebVitals from "@/components/WebVitals";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import ClientShell from "@/components/ClientShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gavana-boxing.vercel.app"),
  applicationName: "GAVANA Boxing",
  title: {
    default: "GAVANA Boxing — AI Punch Scoring for Fighters",
    template: "%s | GAVANA Boxing",
  },
  description: "AI-powered punch scoring, fighter reels, rank system, sparring matchmaking, and coach connections. The boxing app built for serious fighters.",
  keywords: ["boxing", "AI coach", "punch scoring", "fighter training", "sparring", "boxing reels", "combat sports"],
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
    description: "AI-powered punch scoring, fighter reels, rank system, sparring matchmaking, and coach connections.",
    images: [{ url: "/icons/gavana-icon.svg", width: 512, height: 512, alt: "GAVANA Boxing" }],
  },
  twitter: {
    card: "summary",
    title: "GAVANA Boxing",
    description: "AI-powered punch scoring, fighter reels, rank system, sparring matchmaking, and coach connections.",
  },
  icons: {
    icon: [{ url: "/icons/gavana-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/gavana-icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#070707",
  colorScheme: "dark",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://fcm.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ServiceWorkerRegistrar />
          <WebVitals />
          <InAppBrowserWarning />
          <ClientShell />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
