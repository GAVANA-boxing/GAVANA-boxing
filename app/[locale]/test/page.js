"use client";

import { usePathname, useRouter } from "next/navigation";
import { getLocaleFromPathname } from "@/lib/i18n";
import { RED, redAlpha, whiteAlpha, GOLD, goldAlpha, PURPLE, purpleAlpha } from "@/lib/tokens";

const ROUTE_GROUPS = [
  {
    label: "CORE NAV",
    color: RED,
    routes: [
      { path: "/feed",        label: "Feed",        note: "Main video feed" },
      { path: "/coach",       label: "Coach",       note: "AI Coach + Coaches marketplace" },
      { path: "/train",       label: "Train",       note: "AI training camera" },
      { path: "/explore",     label: "Explore",     note: "Discover tab" },
      { path: "/profile",     label: "Profile",     note: "Own profile (redirects to /profile/uid)" },
    ],
  },
  {
    label: "COMBAT OS SHEET",
    color: GOLD,
    routes: [
      { path: "/fighters",        label: "Fighters",        note: "Fighter directory" },
      { path: "/challenges",      label: "Challenges",      note: "Challenge list" },
      { path: "/notifications",   label: "Notifications",   note: "Notification center" },
      { path: "/inbox",           label: "Inbox",           note: "DM list" },
      { path: "/fighter-profile", label: "Fighter DNA",     note: "Own archetype profile" },
      { path: "/programs",        label: "Academy",         note: "Training programs" },
      { path: "/gyms",            label: "Gyms",            note: "Gym directory" },
      { path: "/history",         label: "History",         note: "Workout history" },
    ],
  },
  {
    label: "AI & COACH",
    color: PURPLE,
    routes: [
      { path: "/coach/chat",      label: "AI Coach Chat",   note: "Full-screen AI chat" },
      { path: "/coach/apply",     label: "Become a Coach",  note: "Coach application form" },
      { path: "/sparring",        label: "AI Sparring",     note: "AI sparring partner" },
      { path: "/drills",          label: "Drills",          note: "Drill library" },
      { path: "/discover",        label: "Discover",        note: "Alternative explore view" },
    ],
  },
  {
    label: "TRAINING",
    color: "#3B82F6",
    routes: [
      { path: "/upload",          label: "Upload",          note: "Upload a reel" },
      { path: "/reels",           label: "Reels",           note: "Reels page" },
      { path: "/workout/builder", label: "Workout Builder", note: "Build custom workout" },
      { path: "/first-mission",   label: "First Mission",   note: "Onboarding first mission" },
      { path: "/story/upload",    label: "Story Upload",    note: "Upload a story" },
    ],
  },
  {
    label: "SOCIAL & COMMUNITY",
    color: "#10B981",
    routes: [
      { path: "/leaderboard",  label: "Leaderboard",   note: "Global rankings" },
      { path: "/rank",         label: "Rank",           note: "Belt/rank page" },
      { path: "/events",       label: "Events",         note: "Events list" },
    ],
  },
  {
    label: "PROFILE & SETTINGS",
    color: "#F59E0B",
    routes: [
      { path: "/profile/edit",  label: "Edit Profile",   note: "Edit own profile" },
      { path: "/onboarding",    label: "Onboarding",     note: "Onboarding flow" },
      { path: "/login",         label: "Login",          note: "Auth page" },
      { path: "/privacy",       label: "Privacy",        note: "Privacy policy" },
      { path: "/terms",         label: "Terms",          note: "Terms of service" },
    ],
  },
  {
    label: "ADMIN / CREATOR",
    color: "#EF4444",
    routes: [
      { path: "/admin",                     label: "Admin",              note: "Admin dashboard" },
      { path: "/admin/featured-creators",   label: "Featured Creators",  note: "Admin: manage featured" },
      { path: "/admin/moderation",          label: "Moderation",         note: "Admin: content moderation" },
      { path: "/creator/dashboard",         label: "Creator Dashboard",  note: "Creator tools" },
      { path: "/coach/dashboard",           label: "Coach Dashboard",    note: "Coach tools" },
      { path: "/gyms/dashboard",            label: "Gym Dashboard",      note: "Gym management" },
      { path: "/dashboard",                 label: "Dashboard",          note: "Generic dashboard" },
    ],
  },
];

export default function TestPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = getLocaleFromPathname(pathname);

  return (
    <div style={{ minHeight: "100dvh", background: "#090909", color: "#fff", padding: "24px 16px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: "0 0 4px", fontSize: 9, fontWeight: 900, letterSpacing: 3, color: redAlpha(0.9), textTransform: "uppercase" }}>
          GAVANA · DEV
        </p>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em" }}>
          Route Index
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: whiteAlpha(0.35) }}>
          {ROUTE_GROUPS.reduce((a, g) => a + g.routes.length, 0)} routes · tap any to navigate
        </p>
      </div>

      {ROUTE_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 24 }}>
          <p style={{
            margin: "0 0 8px",
            fontSize: 8, fontWeight: 900, letterSpacing: 2.5, textTransform: "uppercase",
            color: group.color,
          }}>
            {group.label}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {group.routes.map((route) => (
              <button
                key={route.path}
                type="button"
                onClick={() => router.push(`/${locale}${route.path}`)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 14px",
                  background: "rgba(255,255,255,0.03)",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                  textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <div>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", display: "block" }}>
                    {route.label}
                  </span>
                  <span style={{ fontSize: 10, color: whiteAlpha(0.3) }}>
                    {route.note}
                  </span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: whiteAlpha(0.2), fontFamily: "monospace", flexShrink: 0, marginLeft: 8 }}>
                  {route.path} →
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Dynamic routes note */}
      <div style={{ marginTop: 8, padding: "14px", borderRadius: 12, background: goldAlpha(0.06), border: `1px solid ${goldAlpha(0.15)}` }}>
        <p style={{ margin: "0 0 6px", fontSize: 9, fontWeight: 900, letterSpacing: 2, color: GOLD, textTransform: "uppercase" }}>
          Dynamic Routes (need IDs)
        </p>
        <div style={{ fontSize: 11, color: whiteAlpha(0.4), lineHeight: 1.8, fontFamily: "monospace" }}>
          /[id]<br />
          /ai-analysis/[reelId]<br />
          /coach/[coachId]<br />
          /events/[eventId]<br />
          /fighters/[fighterId]<br />
          /gyms/[gymId]<br />
          /inbox/[conversationId]<br />
          /profile/[userId]<br />
          /workout/[id]
        </div>
      </div>
    </div>
  );
}
