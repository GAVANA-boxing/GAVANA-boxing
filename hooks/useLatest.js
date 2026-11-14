"use client";
import { useEffect, useRef } from "react";

/**
 * A ref that always holds the latest value. For interval / rAF loops that must call the current
 * function without restarting when its identity changes (usePoseDetection's getDebugInfo gets a
 * new identity when the model finishes loading — a round clock that depended on it restarted
 * mid-round).
 */
export function useLatest(value) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; });
  return ref;
}
