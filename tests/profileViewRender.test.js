// Profile v2: the best round is one dial (own profile only), not a "best" pill AND a number.
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProfileView from "@/components/profile/ProfileView";

const rank = { key: "rankBronze", color: "#CD7F32", minXP: 0 };
const base = {
  locale: "mn", t: () => "Хүрэл бүс", profileUser: { displayName: "Бат", username: "bat" },
  xp: 1240, rank, nextRank: { key: "rankSilver", minXP: 2000 }, rankPct: 62, go: () => {},
  sessions: [{ id: "a", score: 6.5 }, { id: "b", score: 8.2 }],
};
const html = (over = {}) => renderToStaticMarkup(<ProfileView {...base} {...over} />);

describe("ProfileView v2", () => {
  it("own profile: best round as a dial with the real best score", () => {
    const h = html({ isOwnProfile: true });
    expect(h).toContain('data-testid="profile-best"');
    expect(h).toContain("8.2");
  });
  it("someone else's profile: no best dial (rounds are private)", () => {
    expect(html({ isOwnProfile: false })).not.toContain('data-testid="profile-best"');
  });
  it("no rounds yet: no dial, no invented number", () => {
    expect(html({ isOwnProfile: true, sessions: [] })).not.toContain('data-testid="profile-best"');
  });
  it("rank is the headline", () => {
    expect(html({ isOwnProfile: true })).toContain('data-testid="profile-rank"');
  });
});
