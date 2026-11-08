import { describe, it, expect, vi, beforeEach } from "vitest";

describe("reportClientError", () => {
  beforeEach(() => { vi.resetModules(); });
  it("sends a short meta, skips duplicates and stops after 5", async () => {
    const calls = [];
    globalThis.window = { location: { pathname: "/mn/train" } };
    globalThis.fetch = vi.fn((url, init) => { calls.push(JSON.parse(init.body)); return Promise.resolve({}); });
    const { reportClientError } = await import("@/lib/track");
    reportClientError(new Error("Cannot read properties of undefined (reading 'score') in a very long message"), "window");
    reportClientError(new Error("Cannot read properties of undefined (reading 'score') in a very long message"), "window");
    for (let i = 0; i < 10; i++) reportClientError(new Error(`e${i}`), "promise");
    expect(calls.length).toBe(5);
    expect(calls[0].event).toBe("client_error");
    expect(calls[0].props.meta.length).toBeLessThanOrEqual(64);
    expect(calls[0].props.meta.startsWith("window:Cannot read")).toBe(true);
    delete globalThis.window;
  });
});
