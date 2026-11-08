"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
// Firestore loads only for a signed-in user (dynamic imports below), so guests on the
// landing / legal pages don't download the Firestore SDK.
import type { UserProfile } from "@/lib/repositories/userRepo";

interface UserProfileState {
  profile: UserProfile | null;
  loading: boolean;
}

const UserProfileContext = createContext<UserProfileState>({ profile: null, loading: true });

/**
 * Subscribes ONCE to the signed-in user's profile document and shares it with
 * the whole tree. Replaces the ~40 ad-hoc `doc(db,"users",uid)` reads scattered
 * across pages/hooks (the root cause of the streak/XP divergence the audit found).
 * The latest value is also pushed into the React Query cache so query-based
 * consumers can read it without a second fetch.
 */
export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [state, setState] = useState<UserProfileState>({ profile: null, loading: true });

  useEffect(() => {
    if (authLoading) return;
    const uid = user?.uid;
    if (!uid) {
      setState({ profile: null, loading: false });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    let unsub: (() => void) | null = null;
    let cancelled = false;
    import("@/lib/repositories/userRepo")
      .then(({ watchUserProfile }) => {
        if (cancelled) return;
        unsub = watchUserProfile(
          uid,
          (profile) => {
            setState({ profile, loading: false });
            queryClient.setQueryData(["userProfile", uid], profile);
          },
          () => setState({ profile: null, loading: false }),
        );
      })
      .catch(() => { if (!cancelled) setState({ profile: null, loading: false }); });
    return () => { cancelled = true; unsub?.(); };
  }, [user?.uid, authLoading, queryClient]);

  // Older accounts still carry their email on the public doc — move it to
  // users_private the first time the owner opens the app.
  const leakedEmail = state.profile && "email" in state.profile;
  useEffect(() => {
    if (!user?.uid || !leakedEmail) return;
    import("@/lib/privateProfile")
      .then(({ scrubPublicProfile }) => scrubPublicProfile(user.uid, state.profile))
      .catch(() => { /* retried next load */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, leakedEmail]);

  return <UserProfileContext.Provider value={state}>{children}</UserProfileContext.Provider>;
}

/** The signed-in user's live profile + loading flag. */
export function useUserProfile(): UserProfileState {
  return useContext(UserProfileContext);
}
