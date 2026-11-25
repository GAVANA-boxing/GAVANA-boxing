import { withAdmin } from "@/lib/withAuth";
import { DOC_ROOT, firestoreCreate, firestorePatch, firestoreRunQueryDocs } from "@/lib/server/firestore";
import { grantFields, parseReference } from "@/lib/manualPay";

// The owner grants Pro after a bank transfer (lib/manualPay.js). Admin only (ADMIN_UIDS); the write
// goes through the service account, the one path allowed to set subscription fields. Every grant is
// logged in pro_grants (server-only collection) so it can be checked against the bank statement.
export const POST = withAdmin(async (req, { uid: adminUid }) => {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }
  const prefix = parseReference(body?.reference);
  if (!prefix) return Response.json({ error: "bad_reference" }, { status: 400 });
  const months = Number(body?.months);
  if (!grantFields(months)) return Response.json({ error: "bad_months" }, { status: 400 });

  let found;
  try {
    found = await firestoreRunQueryDocs({
      from: [{ collectionId: "users" }],
      where: { compositeFilter: { op: "AND", filters: [
        { fieldFilter: { field: { fieldPath: "__name__" }, op: "GREATER_THAN_OR_EQUAL", value: { referenceValue: `${DOC_ROOT}/users/${prefix}` } } },
        { fieldFilter: { field: { fieldPath: "__name__" }, op: "LESS_THAN", value: { referenceValue: `${DOC_ROOT}/users/${prefix}￿` } } },
      ] } },
      limit: 3,
    });
  } catch {
    return Response.json({ error: "server_not_configured" }, { status: 503 });
  }
  if (found.length === 0) return Response.json({ error: "not_found" }, { status: 404 });
  if (found.length > 1) return Response.json({ error: "ambiguous" }, { status: 409 });

  const { id, data } = found[0];
  const fields = grantFields(months, { currentProUntil: data?.subscription === "manual" ? data?.proUntil : null });
  try {
    await firestorePatch(`users/${id}`, fields);
    await firestoreCreate("pro_grants", { targetUid: id, adminUid, months, proUntil: fields.proUntil, createdAt: new Date().toISOString() }).catch(() => {});
  } catch {
    return Response.json({ error: "write_failed" }, { status: 502 });
  }
  // Only what the owner needs to confirm it was the right person — never the uid or contact data.
  return Response.json({ ok: true, name: data?.displayName || data?.username || "", proUntil: fields.proUntil });
});
