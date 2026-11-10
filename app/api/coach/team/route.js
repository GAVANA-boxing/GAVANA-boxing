// Coach side of "my students".
//   GET  ?tz=<getTimezoneOffset>          → { team | null, students: [{ uid, name, summary }] }
//   POST { action: "save", name?, roundsPerDay?, drill? }  → creates the team (with an invite code) or updates it
//   POST { action: "remove", studentUid }                  → takes a student off the team
// Students are on a team only because they typed its code (/api/coach/membership). A coach sees
// rounds today / this week, the last score and first → latest rounds — nothing else.
import { randomInt } from "node:crypto";
import { withAuth } from "@/lib/withAuth";
import { serviceAccountReady } from "@/lib/server/firestore";
import {
  findTeamByCode, getTeam, publicTeam, recentRounds, removeMember, saveTeam, teamMembers, tzFrom,
} from "@/lib/server/coachTeam";
import {
  DEFAULT_ROUNDS_PER_DAY, clampRounds, cleanDrill, cleanTeamName, makeTeamCode, sortStudents, summarizeStudent,
} from "@/lib/coach/team";

const unavailable = () => Response.json({ error: "unavailable" }, { status: 503 });

export const GET = withAuth(async (req, { uid }) => {
  if (!(await serviceAccountReady())) return unavailable();
  try {
    const team = await getTeam(uid);
    if (!team) return Response.json({ team: null, students: [] });
    const tzOffsetMin = tzFrom(req);
    const now = Date.now();
    const members = await teamMembers(uid);
    const students = await Promise.all(members.map(async (m) => {
      const rounds = await recentRounds(m.studentUid).catch(() => []);
      return {
        uid: m.studentUid,
        name: m.studentName || "—",
        summary: summarizeStudent(rounds, { now, tzOffsetMin, roundsPerDay: team.roundsPerDay }),
      };
    }));
    return Response.json({ team: publicTeam(team), students: sortStudents(students), now });
  } catch {
    return Response.json({ error: "failed" }, { status: 500 });
  }
});

async function uniqueCode() {
  for (let i = 0; i < 6; i++) {
    const code = makeTeamCode((n) => randomInt(n));
    if (!(await findTeamByCode(code))) return code;
  }
  throw new Error("no-unique-code");
}

export const POST = withAuth(async (req, { uid }) => {
  if (!(await serviceAccountReady())) return unavailable();
  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === "remove") {
      const studentUid = String(body.studentUid || "");
      if (!studentUid || studentUid.includes("/")) return Response.json({ error: "bad_request" }, { status: 400 });
      await removeMember(uid, studentUid);
      return Response.json({ ok: true });
    }
    if (body.action === "save") {
      const existing = await getTeam(uid);
      const now = new Date();
      const patch = existing
        ? { updatedAt: now }
        : { coachUid: uid, code: await uniqueCode(), roundsPerDay: DEFAULT_ROUNDS_PER_DAY, drill: null, name: null, createdAt: now, updatedAt: now };
      if ("name" in body) patch.name = cleanTeamName(body.name);
      if ("roundsPerDay" in body) patch.roundsPerDay = clampRounds(body.roundsPerDay);
      if ("drill" in body) patch.drill = cleanDrill(body.drill);
      await saveTeam(uid, patch);
      return Response.json({ team: publicTeam({ ...existing, ...patch }) });
    }
    return Response.json({ error: "bad_request" }, { status: 400 });
  } catch {
    return Response.json({ error: "failed" }, { status: 500 });
  }
});
