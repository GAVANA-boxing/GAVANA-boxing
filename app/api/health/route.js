// Public health check — no secrets, no user data. Used by .github/workflows/firebase-deploy.yml to
// wait until (1) this commit is live on Vercel and (2) the server can write XP (service account set),
// before deploying Firestore rules that lock those fields away from the client.
import { serviceAccountReady } from "@/lib/server/firestore";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      ok: true,
      version: process.env.VERCEL_GIT_COMMIT_SHA || null,
      serverWrites: await serviceAccountReady(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
