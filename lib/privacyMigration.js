// Pure planning for the one-off "move emails off the public users docs"
// migration (app/api/admin/privacy-migration). Kept separate so it is tested.

import { PRIVATE_USER_FIELDS } from "@/lib/privateProfileFields";

/**
 * From a page of users docs ({ id, data }) work out what to move: every doc
 * that still has a private field. `email` is copied to users_private only when
 * it is a non-empty string; the field is deleted from the public doc either way.
 */
export function planPrivacyMigration(docs = []) {
  const plan = [];
  for (const { id, data } of docs) {
    const present = PRIVATE_USER_FIELDS.filter((k) => data && k in data);
    if (!present.length) continue;
    const email = typeof data.email === "string" && data.email.trim() ? data.email.trim() : null;
    plan.push({ id, email, deleteFields: present });
  }
  return plan;
}
