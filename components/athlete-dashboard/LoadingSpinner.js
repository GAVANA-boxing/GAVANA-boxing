"use client";

import { RED } from "@/lib/tokens";
import LoadingState from "@/components/ui/LoadingState";

// Thin wrapper kept for existing imports — the full-screen red spinner now
// comes from the shared tokenized LoadingState.
export default function LoadingSpinner() {
  return <LoadingState color={RED} size={28} />;
}
