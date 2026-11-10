// Server side of coach teams (service account; bypasses rules — the client can't touch these
// collections at all, see firestore.rules). Used by /api/coach/team and /api/coach/membership.
import { firestoreDelete, firestoreGet, firestorePatch, firestoreRunQuery, whereEq } from "@/lib/server/firestore";
import { MAX_TEAM_SIZE } from "@/lib/coach/team";

export const memberPath = (coachUid, studentUid) => `coach_members/${coachUid}_${studentUid}`;

export async function getTeam(coachUid) {
  return firestoreGet(`coach_teams/${coachUid}`);
}

export async function findTeamByCode(code) {
  const rows = await firestoreRunQuery({ from: [{ collectionId: "coach_teams" }], where: whereEq("code", code), limit: 1 });
  return rows[0] || null;
}

export async function teamMembers(coachUid) {
  return firestoreRunQuery({ from: [{ collectionId: "coach_members" }], where: whereEq("coachUid", coachUid), limit: MAX_TEAM_SIZE });
}

export async function membershipsOf(studentUid) {
  return firestoreRunQuery({ from: [{ collectionId: "coach_members" }], where: whereEq("studentUid", studentUid), limit: 5 });
}

export async function leaveAll(studentUid) {
  const rows = await membershipsOf(studentUid);
  await Promise.all(rows.map((m) => firestoreDelete(memberPath(m.coachUid, studentUid))));
  return rows.length;
}

/** Latest training rounds of one user (newest first) — index training_sessions(userId, createdAt desc). */
export async function recentRounds(uid, limit = 60) {
  return firestoreRunQuery({
    from: [{ collectionId: "training_sessions" }],
    where: whereEq("userId", uid),
    orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
    limit,
  });
}

/** Public display name from users/{uid} (the public profile doc). */
export async function displayNameOf(uid) {
  const u = await firestoreGet(`users/${uid}`).catch(() => null);
  return String(u?.displayName || u?.username || "").slice(0, 40) || null;
}

export async function saveTeam(coachUid, data) {
  await firestorePatch(`coach_teams/${coachUid}`, data);
}

export async function addMember(coachUid, studentUid, studentName) {
  await firestorePatch(memberPath(coachUid, studentUid), { coachUid, studentUid, studentName: studentName || null, joinedAt: new Date() });
}

export async function removeMember(coachUid, studentUid) {
  await firestoreDelete(memberPath(coachUid, studentUid));
}

/** The team fields a student or coach may see. */
export function publicTeam(t) {
  return t ? { name: t.name || null, code: t.code, roundsPerDay: t.roundsPerDay, drill: t.drill || null } : null;
}

/** Date#getTimezoneOffset from the query string, clamped to real offsets (minutes). */
export function tzFrom(req) {
  const v = Number(new URL(req.url).searchParams.get("tz"));
  return Number.isFinite(v) ? Math.max(-840, Math.min(720, Math.round(v))) : 0;
}
