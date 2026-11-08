import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FUNNEL_EVENT_NAMES } from "@/lib/funnelSteps";

const tracked = [];
vi.mock("@/lib/track", () => ({ track: (event, props) => { tracked.push({ event, props }); } }));
vi.mock("@/lib/firebaseApp", () => ({ auth: null }));

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("core-loop KPI events", () => {
  beforeEach(() => {
    tracked.length = 0;
    vi.resetModules();
    globalThis.window = {};
    globalThis.localStorage = memoryStorage();
    globalThis.sessionStorage = memoryStorage();
  });
  afterEach(() => {
    delete globalThis.window;
    delete globalThis.localStorage;
    delete globalThis.sessionStorage;
  });

  it("the API accepts the new events", () => {
    for (const e of ["retry_round", "timer_round_started", "signup_to_save"]) expect(FUNNEL_EVENT_NAMES).toContain(e);
  });

  it("first round is not a retry; a round after a shown result is", async () => {
    const { funnelRoundStarted, markResultSeen } = await import("@/lib/funnel");
    funnelRoundStarted({ camera: true });
    await flush();
    expect(tracked.map((t) => t.event)).toEqual([]);
    markResultSeen();
    funnelRoundStarted({ camera: true });
    await flush();
    expect(tracked.map((t) => t.event)).toEqual(["retry_round"]);
  });

  it("a camera-less round is counted on the timer path", async () => {
    const { funnelRoundStarted } = await import("@/lib/funnel");
    funnelRoundStarted({ camera: false });
    await flush();
    expect(tracked.map((t) => t.event)).toEqual(["timer_round_started"]);
    expect(tracked[0].props.first).toBe(true);
  });
});
