import { describe, it, expect } from "vitest";
import { getActiveTab } from "@/lib/navTabs";
import { showRoute } from "@/lib/coreRoutes";

describe("bottom nav: one tab bar, the URL decides the active tab", () => {
  it.each([
    ["/mn/home", "home"],
    ["/mn/rank", "progress"], ["/en/history", "progress"], ["/ko/dashboard", "progress"], ["/mn/fighter-profile", "progress"],
    ["/mn/train", "train"], ["/mn/ghost", "train"],
    ["/mn/coach", "coach"], ["/mn/coach/chat", "coach"], ["/mn/drills", "coach"],
    ["/mn/profile/abc", "profile"], ["/mn/notifications", "profile"],
    ["/mn/terms", ""],
  ])("%s → %s", (path, tab) => {
    expect(getActiveTab(path)).toBe(tab);
  });
});

describe("core mode keeps every core page and hides the social ones", () => {
  it("core pages are reachable", () => {
    for (const p of ["/mn/home", "/mn/train", "/mn/ghost", "/mn/rank", "/mn/history", "/mn/coach", "/mn/profile/x", "/mn/notifications"]) {
      expect(showRoute(p), p).toBe(true);
    }
  });
  it("social pages are hidden (links to them must not be shown)", () => {
    for (const p of ["/mn/feed", "/mn/reels", "/mn/fighters", "/mn/challenges", "/mn/leaderboard", "/mn/inbox", "/mn/gyms"]) {
      expect(showRoute(p), p).toBe(false);
    }
  });
});

import { coreRedirect } from "@/lib/coreRoutes";

describe("core-mode redirects (what proxy.js does) never hide a page the UI links to", () => {
  // Every route a user can reach from the visible UI. If you add a page and link it, add it here.
  const VISIBLE = [
    "", "/home", "/train", "/progress", "/history", "/fighter-profile", "/coach", "/coach/chat",
    "/coach/team", "/pro", "/login", "/onboarding", "/profile/abc123", "/profile/edit", "/tour",
    "/ghost", "/mitts", "/bag", "/workout", "/drills", "/notifications", "/privacy", "/terms",
    "/fighter-dashboard",
  ];
  for (const locale of ["mn", "ko", "en"]) {
    for (const path of VISIBLE) {
      it(`/${locale}${path} is let through`, () => {
        expect(coreRedirect(`/${locale}${path}`, true)).toBeNull();
        if (path) expect(coreRedirect(`/${locale}${path}/`, true)).toBeNull();
      });
    }
  }

  it("the human-coach marketplace under /coach stays hidden", () => {
    for (const sub of ["apply", "dashboard", "someCoachUid"]) {
      expect(coreRedirect(`/mn/coach/${sub}`, true)).toBe("/mn/coach");
    }
    expect(coreRedirect("/ko/coach/someCoachUid/book", true)).toBe("/ko/coach");
  });

  it("non-core sections go Home; nothing is redirected when core mode is off", () => {
    expect(coreRedirect("/mn/feed", true)).toBe("/mn/home");
    expect(coreRedirect("/en/reels/abc", true)).toBe("/en/home");
    expect(coreRedirect("/en/leaderboard", true)).toBe("/en/home");
    expect(coreRedirect("/mn/feed", false)).toBeNull();
    expect(coreRedirect("/mn/coach/apply", false)).toBeNull();
    expect(coreRedirect("/api/health", true)).toBeNull();
  });
});
