"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useUserProfile } from "@/context/UserProfileProvider";

const ADMIN_UIDS = (process.env.NEXT_PUBLIC_ADMIN_UIDS || "").split(",").map((s) => s.trim()).filter(Boolean);
const FLAG = "gavana_admin_session";

/**
 * proxy.js lets /admin through only with the signed admin_session cookie, but
 * that cookie used to be set only BY the /admin pages — so an admin could
 * never get in. Set it here, from any page, for users the client already
 * believes are admins (the server re-checks ADMIN_UIDS before signing).
 * Once per browser session. Renders nothing.
 */
export default function AdminSessionBootstrap() {
  const { user, loading } = useAuth();
  const { profile } = useUserProfile();
  const maybeAdmin = Boolean(user?.uid) && (ADMIN_UIDS.includes(user.uid) || profile?.isAdmin === true);

  useEffect(() => {
    if (loading || !maybeAdmin) return;
    try { if (sessionStorage.getItem(FLAG) === user.uid) return; } catch { /* ignore */ }
    user.getIdToken()
      .then((token) => fetch("/api/admin/session", { method: "POST", headers: { Authorization: `Bearer ${token}` } }))
      .then((res) => { if (res.ok) { try { sessionStorage.setItem(FLAG, user.uid); } catch { /* ignore */ } } })
      .catch(() => {});
  }, [loading, maybeAdmin, user]);

  return null;
}
