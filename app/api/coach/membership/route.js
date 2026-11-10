// Student side of "my coach".
//   GET                              → { team: { name, coachName, roundsPerDay, drill } | null }
//   POST { action: "join", code }    → joins the team with that code (leaves any other team first)
//   POST { action: "leave" }         → leaves
// Typing the code is the consent: from then on that coach sees this student's rounds today /
// this week, last score and first → latest rounds (privacy policy, "Coaches").
import { withAuth } from "@/lib/withAuth";
import { serviceAccountReady } from "@/lib/server/firestore";
import {
  addMember, displayNameOf, findTeamByCode, getTeam, leaveAll, membershipsOf, teamMembers,
} from "@/lib/server/coachTeam";
import { MAX_TEAM_SIZE, normalizeCode } from "@/lib/coach/team";

const unavailable = () => Response.json({ error: "unavailable" }, { status: 503 });

// Best-effort per-instance limit on wrong codes (codes are 31^6 ≈ 900M, this just blunts guessing).
const _tries = new Map(); // uid -> timestamps
function tooManyTries(uid) {
  const now = Date.now();
  const recent = (_tries.get(uid) || []).filter((t) => now - t < 10 * 60_000);
  _tries.set(uid, recent);
  return recent.length >= 10;
}
function countTry(uid) {
  _tries.set(uid, [...(_tries.get(uid) || []), Date.now()]);
}

async function teamView(coachUid) {
  const team = await getTeam(coachUid);
  if (!team) return null;
  return { name: team.name || null, coachName: await displayNameOf(coachUid), roundsPerDay: team.roundsPerDay, drill: team.drill || null };
}

export const GET = withAuth(async (_req, { uid }) => {
  if (!(await serviceAccountReady())) return unavailable();
  try {
    const [m] = await membershipsOf(uid);
    return Response.json({ team: m ? await teamView(m.coachUid) : null });
  } catch {
    return Response.json({ error: "failed" }, { status: 500 });
  }
});

export const POST = withAuth(async (req, { uid }) => {
  if (!(await serviceAccountReady())) return unavailable();
  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === "leave") {
      await leaveAll(uid);
      return Response.json({ team: null });
    }
    if (body.action === "join") {
      if (tooManyTries(uid)) return Response.json({ error: "too_many_tries" }, { status: 429 });
      const code = normalizeCode(body.code);
      const team = code ? await findTeamByCode(code) : null;
      if (!team) { countTry(uid); return Response.json({ error: "not_found" }, { status: 404 }); }
      if (team.coachUid === uid) return Response.json({ error: "own_team" }, { status: 400 });
      const members = await teamMembers(team.coachUid);
      const already = members.some((m) => m.studentUid === uid);
      if (!already && members.length >= MAX_TEAM_SIZE) return Response.json({ error: "team_full" }, { status: 409 });
      await leaveAll(uid);
      await addMember(team.coachUid, uid, await displayNameOf(uid));
      return Response.json({ team: await teamView(team.coachUid) });
    }
    return Response.json({ error: "bad_request" }, { status: 400 });
  } catch {
    return Response.json({ error: "failed" }, { status: 500 });
  }
});
