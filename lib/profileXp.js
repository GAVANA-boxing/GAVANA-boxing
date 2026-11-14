// Which XP a profile page shows. Own profile: the account XP computed from your own rounds.
// Someone else's: the server-written users.publicXp (their rounds are private); if the server
// hasn't written it yet, the fallback (stored XP + streak, no round XP) — never NaN.
export function profileXp({ isOwnProfile, ownXp, publicXp }) {
  const own = Number.isFinite(Number(ownXp)) ? Number(ownXp) : 0;
  if (isOwnProfile) return own;
  return publicXp != null && Number.isFinite(Number(publicXp)) ? Math.max(0, Number(publicXp)) : own;
}
