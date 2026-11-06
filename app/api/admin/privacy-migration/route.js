import { withAdmin } from "@/lib/withAuth";
import { firestoreDeleteFields, firestoreListPage, firestorePatch } from "@/lib/server/firestore";
import { planPrivacyMigration } from "@/lib/privacyMigration";

// Admin-only, one-off: move email addresses off the world-readable users/{uid}
// docs into owner-only users_private/{uid}. Signed-in owners are also cleaned
// up client-side on their next visit (UserProfileProvider); this catches
// everyone else.
//
//   POST /api/admin/privacy-migration            → dry run: counts only
//   POST /api/admin/privacy-migration?apply=1    → does it
//
// Idempotent: a dry run that reports `found: 0` means nothing is left.

const MAX_PAGES = 20; // ≤ 6,000 users per call — call again for more

export const POST = withAdmin(async (req) => {
  const apply = new URL(req.url).searchParams.get("apply") === "1";
  let pageToken = null, scanned = 0, found = 0, moved = 0, failed = 0, pages = 0;

  try {
    do {
      const page = await firestoreListPage("users", { pageSize: 300, pageToken, fields: ["email"] });
      pages += 1;
      scanned += page.docs.length;
      const plan = planPrivacyMigration(page.docs);
      found += plan.length;
      if (apply) {
        for (const item of plan) {
          try {
            if (item.email) await firestorePatch(`users_private/${item.id}`, { email: item.email, updatedAt: new Date().toISOString() });
            await firestoreDeleteFields(`users/${item.id}`, item.deleteFields);
            moved += 1;
          } catch {
            failed += 1;
          }
        }
      }
      pageToken = page.nextPageToken;
    } while (pageToken && pages < MAX_PAGES);
  } catch (err) {
    console.error("[admin/privacy-migration]", err);
    return Response.json({ error: String(err?.message || err) }, { status: 500 });
  }

  return Response.json({
    apply,
    scanned,
    found,
    moved,
    failed,
    more: Boolean(pageToken), // true → call again
  });
});
