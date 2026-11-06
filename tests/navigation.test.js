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
