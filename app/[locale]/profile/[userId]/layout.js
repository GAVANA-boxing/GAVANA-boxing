// Server Component — generates OG meta for profile pages
// Fetches user data via Firestore REST API (no firebase-admin needed)

import { getLocale } from "@/lib/i18n";
import { loc } from "@/lib/loc";
import { archetypeName } from "@/lib/archetypes";

const PROJECT = "gavana-boxing-89a22";
const API_KEY = "AIzaSyDwVdR5oVYSXQbWL4jqNSNx9cqKuKxqt6c";
// Profiles need sign-in to view, so search engines get noindex; link previews
// (OG/Twitter) still show the fighter's name and photo — the users doc is public.
const ROBOTS = { index: false, follow: false };

async function fetchUserDoc(userId) {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${userId}?key=${API_KEY}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.fields || null;
  } catch {
    return null;
  }
}

function str(field) { return field?.stringValue || ""; }
function num(field) { return Number(field?.integerValue || field?.doubleValue || 0); }

export async function generateMetadata({ params }) {
  const { locale: rawLocale, userId } = await params;
  const locale = getLocale(rawLocale);
  const fields = await fetchUserDoc(userId);

  if (!fields) {
    return {
      title: { absolute: `${loc(locale, "Боксчны профайл", "파이터 프로필", "Fighter profile")} | GAVANA Boxing` },
      description: loc(locale, "GAVANA — AI бокс дасгалжуулагч.", "GAVANA — AI 복싱 코치.", "GAVANA — AI boxing coach."),
      robots: ROBOTS,
    };
  }

  const name        = str(fields.displayName) || str(fields.username) || "Fighter";
  const photo       = str(fields.photoURL) || str(fields.profileImageUrl);
  const xp          = num(fields.xp);
  const archetype   = str(fields.fighterArchetype);
  const weightClass = str(fields.weightClass);

  const archetypeLabel = archetypeName(archetype, "en") || "";

  const desc = [
    archetypeLabel,
    weightClass,
    xp ? `${xp.toLocaleString()} XP` : "",
    "Challenge me on GAVANA Boxing",
  ].filter(Boolean).join(" · ");

  // Relative URL: resolved against metadataBase in app/layout.js. The route is
  // keyed by uid, not username, so a username link would 404.
  const profileUrl = `/${locale}/profile/${userId}`;
  const title = `${name} — GAVANA Boxing`;

  return {
    // absolute: the root template would otherwise append "| GAVANA Boxing" again.
    title: { absolute: title },
    robots: ROBOTS,
    alternates: { canonical: profileUrl },
    description: desc,
    openGraph: {
      title,
      description: desc,
      url: profileUrl,
      siteName: "GAVANA Boxing",
      type: "profile",
      ...(photo ? { images: [{ url: photo, width: 400, height: 400, alt: name }] } : {}),
    },
    twitter: {
      card: photo ? "summary_large_image" : "summary",
      title,
      description: desc,
      ...(photo ? { images: [photo] } : {}),
    },
  };
}

export default function ProfileLayout({ children }) {
  return children;
}
