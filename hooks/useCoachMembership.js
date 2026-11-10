"use client";

// The signed-in student's coach team (if any): { team: { name, coachName, roundsPerDay, drill } | null }.
// join(code) / leave() update it. Errors are codes the UI translates (not_found, own_team, …).
import { useCallback, useEffect, useState } from "react";
import { coachApi } from "@/lib/coach/api";

export function useCoachMembership(user) {
  const [state, setState] = useState({ loading: !!user, team: null, error: null });

  useEffect(() => {
    if (!user) { setState({ loading: false, team: null, error: null }); return undefined; }
    let alive = true;
    coachApi(user, "/api/coach/membership").then((r) => {
      if (!alive) return;
      setState({ loading: false, team: r.ok ? r.data.team || null : null, error: r.ok ? null : r.data.error || "failed" });
    });
    return () => { alive = false; };
  }, [user]);

  const join = useCallback(async (code) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const r = await coachApi(user, "/api/coach/membership", { method: "POST", body: { action: "join", code } });
    setState((s) => ({ loading: false, team: r.ok ? r.data.team : s.team, error: r.ok ? null : r.data.error || "failed" }));
    return r.ok;
  }, [user]);

  const leave = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const r = await coachApi(user, "/api/coach/membership", { method: "POST", body: { action: "leave" } });
    setState((s) => ({ loading: false, team: r.ok ? null : s.team, error: r.ok ? null : r.data.error || "failed" }));
  }, [user]);

  return { ...state, join, leave };
}
