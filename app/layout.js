import { Geist, Geist_Mono, Anton, Barlow_Condensed } from "next/font/google";
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

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

export const metadata = {
  applicationName: "Gavana Boxing",
  title: {
    default: "Gavana Boxing",
    template: "%s | Gavana Boxing",
  },
  description: "Boxing reels, AI coach, and fighter community.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Gavana Boxing",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/gavana-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/gavana-icon.svg", type: "image/svg+xml" },
    ],
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
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${barlowCondensed.variable} h-full antialiased`}
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
