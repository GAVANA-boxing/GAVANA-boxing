import { verifyIdToken } from "@/lib/verifyAuth";

const PROJECT = "gavana-boxing-89a22";
const API_KEY = "AIzaSyDwVdR5oVYSXQbWL4jqNSNx9cqKuKxqt6c";
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

export async function POST(req) {
  const reporterId = await verifyIdToken(req);
  if (!reporterId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { targetId, targetType = "reel", reason, note = "" } = await req.json();
  if (!targetId || !reason) {
    return Response.json({ error: "Missing targetId or reason" }, { status: 400 });
  }

  const VALID_REASONS = ["spam", "violence", "harassment", "misinform", "other"];
  if (!VALID_REASONS.includes(reason)) {
    return Response.json({ error: "Invalid reason" }, { status: 400 });
  }

  const body = {
    fields: {
      reporterId: { stringValue: reporterId },
      targetId:   { stringValue: targetId },
      targetType: { stringValue: targetType },
      reason:     { stringValue: reason },
      note:       { stringValue: note.slice(0, 500) },
      status:     { stringValue: "pending" },
      createdAt:  { timestampValue: new Date().toISOString() },
    },
  };

  const res = await fetch(`${FS_BASE}/reports?key=${API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return Response.json({ error: "Failed to write report" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
