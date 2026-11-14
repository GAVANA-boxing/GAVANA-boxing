// The AI coach's JSON reply → something the chat can always render. The model's JSON is not
// schema-checked upstream, so everything here is defensive: wrong types are dropped or flattened,
// never passed on (a raw object / null in a text slot crashed the chat, and the bad message was
// saved in localStorage so it kept crashing). Pure; tested in tests/coachReply.test.js.

const VARIANTS = new Set(["full", "short", "conversational"]);

function text(v, max = 600) {
  if (v == null) return "";
  if (typeof v === "string") return v.trim().slice(0, max);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map((x) => text(x, max)).filter(Boolean).join(" · ").slice(0, max);
  if (typeof v === "object") return Object.values(v).map((x) => text(x, max)).filter(Boolean).join(" · ").slice(0, max);
  return "";
}

/** → { variant, title, keyCues: string[], commonMistake, drill, nextAction, message } or null. */
export function normalizeStructured(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const cuesIn = Array.isArray(raw.keyCues) ? raw.keyCues : raw.keyCues != null ? [raw.keyCues] : [];
  const out = {
    variant: VARIANTS.has(raw.variant) ? raw.variant : "full",
    title: text(raw.title, 200),
    keyCues: cuesIn.map((c) => text(c, 240)).filter(Boolean).slice(0, 4),
    commonMistake: text(raw.commonMistake),
    drill: text(raw.drill),
    nextAction: text(raw.nextAction),
    message: text(raw.message, 1500),
  };
  const hasCard = out.title || out.keyCues.length || out.commonMistake || out.drill || out.nextAction;
  if (!hasCard && !out.message) return null;
  // The variant decides what is rendered, so it must follow the content, whatever the model
  // claimed — otherwise the real answer is hidden (an empty bubble, or a title with no text).
  const onlyTitle = !out.keyCues.length && !out.commonMistake && !out.drill && !out.nextAction;
  if (!hasCard || (out.message && onlyTitle)) {
    // Only `message` (maybe under a title): a conversational reply.
    out.variant = "conversational";
  } else if (out.variant === "conversational" && !out.message) {
    // Card content tagged conversational with no message: show the card.
    out.variant = "full";
  } else if (out.variant === "short" && (out.commonMistake || out.drill || out.nextAction)) {
    // The short card shows only title + cues; anything more needs the full one.
    out.variant = "full";
  }
  return out;
}

/** The plain-text form of a reply (what is stored as the message and sent back as history). */
export function structuredToText(s) {
  if (!s) return "";
  if (s.variant === "conversational") return s.message || s.title || "";
  return [
    s.title,
    s.keyCues.map((c) => `• ${c}`).join("\n"),
    s.commonMistake ? `\n⚠️ ${s.commonMistake}` : "",
    s.drill ? `\n🎯 ${s.drill}` : "",
    s.nextAction ? `\n✅ ${s.nextAction}` : "",
    !s.title && !s.keyCues.length ? s.message : "",
  ].filter(Boolean).join("\n");
}

/**
 * Saved chat messages (localStorage) → safe to render. Drops anything that isn't a message,
 * normalizes `structured`, and repairs old assistant turns whose text was stored as the error
 * sentence although the reply was fine (`errorTexts` = the coachError string in every locale).
 */
export function repairSavedMessages(saved, errorTexts = []) {
  if (!Array.isArray(saved)) return [];
  const errors = new Set(errorTexts);
  return saved
    .filter((m) => m && typeof m === "object" && (m.role === "user" || m.role === "assistant"))
    .map((m) => {
      const structured = m.role === "assistant" ? normalizeStructured(m.structured) : null;
      let content = typeof m.content === "string" ? m.content : text(m.content, 4000);
      if (structured && (!content || errors.has(content))) content = structuredToText(structured);
      return { ...m, content, structured };
    })
    .filter((m) => m.content || m.structured);
}
