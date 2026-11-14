import { describe, it, expect } from "vitest";
import { normalizeStructured, repairSavedMessages, structuredToText } from "@/lib/coach/reply";

describe("normalizeStructured — the model's JSON can't crash the chat", () => {
  it("keeps a well-formed card", () => {
    const s = normalizeStructured({ variant: "full", title: "Jab", keyCues: ["Snap", "Return"], commonMistake: "Low guard", drill: "3×1 min", nextAction: "Do it" });
    expect(s).toEqual({ variant: "full", title: "Jab", keyCues: ["Snap", "Return"], commonMistake: "Low guard", drill: "3×1 min", nextAction: "Do it", message: "" });
  });
  it("a reply with only `message` is conversational", () => {
    expect(normalizeStructured({ message: "Сайн уу!" })).toMatchObject({ variant: "conversational", message: "Сайн уу!" });
    expect(normalizeStructured({ variant: "full", message: "hi" }).variant).toBe("conversational");
  });
  it("wrong types are flattened or dropped, never passed on", () => {
    const s = normalizeStructured({ title: { en: "T" }, keyCues: "one cue", drill: { name: "Jab", reps: 3 }, commonMistake: null, nextAction: 5, variant: "weird" });
    expect(s.variant).toBe("full");
    expect(s.title).toBe("T");
    expect(s.keyCues).toEqual(["one cue"]);
    expect(s.drill).toBe("Jab · 3");
    expect(s.commonMistake).toBe("");
    expect(s.nextAction).toBe("5");
    for (const v of [s.title, s.drill, s.commonMistake, s.nextAction, s.message, ...s.keyCues]) expect(typeof v).toBe("string");
    expect(normalizeStructured({ keyCues: [{ a: "x" }, null, "", "ok", "3", "4", "5"] }).keyCues).toEqual(["x", "ok", "3", "4"]);
  });
  it("nothing usable → null", () => {
    for (const bad of [null, undefined, "text", 5, [], {}, { keyCues: null }, { title: "  " }]) expect(normalizeStructured(bad)).toBeNull();
  });
});

describe("structuredToText", () => {
  it("a conversational reply is its message (it used to become an empty string → shown as an error)", () => {
    expect(structuredToText(normalizeStructured({ variant: "conversational", message: "Hello" }))).toBe("Hello");
  });
  it("a card lists title, cues, mistake, drill, next step", () => {
    const t = structuredToText(normalizeStructured({ title: "Jab", keyCues: ["Snap"], commonMistake: "Low", drill: "D", nextAction: "N" }));
    expect(t).toBe("Jab\n• Snap\n\n⚠️ Low\n\n🎯 D\n\n✅ N");
    expect(structuredToText(null)).toBe("");
  });
});

describe("repairSavedMessages — what is already in localStorage", () => {
  const ERR = ["Алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.", "Sorry, something went wrong. Try again in a moment."];
  it("replaces a stored error sentence with the real reply", () => {
    const out = repairSavedMessages([
      { role: "user", content: "Сайн уу" },
      { role: "assistant", content: ERR[0], structured: { variant: "conversational", message: "Сайн уу! Юу асуух вэ?" } },
    ], ERR);
    expect(out[1].content).toBe("Сайн уу! Юу асуух вэ?");
  });
  it("a real error message (no reply attached) stays", () => {
    expect(repairSavedMessages([{ role: "assistant", content: ERR[1], structured: null }], ERR)[0].content).toBe(ERR[1]);
  });
  it("bad saved data can't crash the page", () => {
    const out = repairSavedMessages([
      null, "x", { role: "system", content: "no" },
      { role: "assistant", content: "ok", structured: { keyCues: null, drill: { a: 1 } } },
      { role: "assistant", content: { not: "a string" }, structured: "junk" },
    ], ERR);
    expect(out).toHaveLength(2);
    expect(out[0].structured.keyCues).toEqual([]);
    expect(out[0].structured.drill).toBe("1");
    expect(typeof out[1].content).toBe("string");
    expect(out[1].structured).toBeNull();
    expect(repairSavedMessages("not an array")).toEqual([]);
  });
});

describe("the variant follows the content (the model can break the schema)", () => {
  it("cues tagged conversational → shown as a card, and the text is not empty", () => {
    const s = normalizeStructured({ variant: "conversational", keyCues: ["Chin down", "Snap back"] });
    expect(s.variant).toBe("full");
    expect(structuredToText(s)).toContain("Chin down");
  });
  it("a title with the real answer in `message` → conversational, the answer is kept", () => {
    const s = normalizeStructured({ variant: "short", title: "Stay consistent", message: "Train three times a week." });
    expect(s.variant).toBe("conversational");
    expect(structuredToText(s)).toBe("Train three times a week.");
  });
  it("a short card with a drill → full card (the short one shows only title and cues)", () => {
    expect(normalizeStructured({ variant: "short", drill: "3x1 min jab" }).variant).toBe("full");
    expect(normalizeStructured({ variant: "short", title: "Jab", keyCues: ["Snap"], commonMistake: "Dropping the hand" }).variant).toBe("full");
  });
  it("well-formed replies keep their variant", () => {
    expect(normalizeStructured({ variant: "short", title: "Jab", keyCues: ["Snap"] }).variant).toBe("short");
    expect(normalizeStructured({ variant: "full", title: "Jab", keyCues: ["Snap"], drill: "3x1" }).variant).toBe("full");
    expect(normalizeStructured({ variant: "conversational", message: "Hi" }).variant).toBe("conversational");
  });
  it("no reply shape gives an empty text", () => {
    const shapes = [
      { variant: "conversational", keyCues: ["a"] }, { variant: "conversational", drill: "d" }, { variant: "short", nextAction: "n" },
      { variant: "full", message: "m" }, { variant: "short", title: "t" }, { variant: "nope", commonMistake: "c" },
    ];
    for (const raw of shapes) expect(structuredToText(normalizeStructured(raw)).length).toBeGreaterThan(0);
  });
});

