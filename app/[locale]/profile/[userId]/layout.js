// Server Component — generates OG meta for profile pages
// Fetches user data via Firestore REST API (no firebase-admin needed)

const PROJECT = "gavana-boxing-89a22";
const API_KEY = "AIzaSyDwVdR5oVYSXQbWL4jqNSNx9cqKuKxqt6c";
const BASE_URL = "https://gavana-boxing.web.app"; // update with your actual domain

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
  const { locale, userId } = await params;
  const fields = await fetchUserDoc(userId);

  if (!fields) {
    return {
      title: "Fighter Profile — GAVANA Boxing",
      description: "Boxing reels, AI coach, and fighter community.",
    };
  }

  const name        = str(fields.displayName) || str(fields.username) || "Fighter";
  const username    = str(fields.username) || userId;
  const photo       = str(fields.photoURL) || str(fields.profileImageUrl);
  const xp          = num(fields.xp);
  const archetype   = str(fields.fighterArchetype);
  const weightClass = str(fields.weightClass);

  const archetypeLabel = {
    pressure:  "Pressure Fighter",
    counter:   "Counter Puncher",
    technical: "Technical Boxer",
    brawler:   "Power Brawler",
  }[archetype] || "";

  const desc = [
    archetypeLabel,
    weightClass,
    xp ? `${xp.toLocaleString()} XP` : "",
    "Challenge me on GAVANA Boxing",
  ].filter(Boolean).join(" · ");

  const profileUrl = `${BASE_URL}/${locale}/profile/${username}`;
  const title = `${name} — GAVANA Boxing`;

  return {
    title,
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
