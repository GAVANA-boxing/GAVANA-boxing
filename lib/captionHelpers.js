function cleanCaptionLine(line) {
  return line.replace(/\*\*/g, "").replace(/__/g, "").replace(/^\s*[-*•]\s*/, "").replace(/^\s*\d+[\).:-]\s*/, "").trim();
}
function stripCaptionLabel(line) {
  return cleanCaptionLine(line).replace(/^(hook|caption|hashtags?)\s*[:\-–—]\s*/i, "").trim();
}
function extractHashtags(text) {
  return (text.match(/#[\p{L}\p{N}_]+/gu) || []).join(" ");
}
function removeHashtags(text) {
  return text.replace(/#[\p{L}\p{N}_]+/gu, "").replace(/\s{2,}/g, " ").trim();
}

export function parseAiCaptionResult(text = "") {
  const sections = { hook: "", caption: "", hashtags: "" };
  let currentSection = null;
  text.split(/\r?\n/).map(cleanCaptionLine).filter(Boolean).forEach((line) => {
    const match = line.match(/^(hook|caption|hashtags?)\s*[:\-–—]\s*(.*)$/i);
    if (match) {
      const key = match[1].toLowerCase().startsWith("hashtag") ? "hashtags" : match[1].toLowerCase();
      const value = match[2].trim();
      if (key === "hashtags") {
        sections.hashtags = [sections.hashtags, extractHashtags(value) || stripCaptionLabel(value)].filter(Boolean).join(" ");
      } else {
        sections[key] = [sections[key], removeHashtags(value)].filter(Boolean).join(" ");
        const ht = extractHashtags(value);
        if (ht) sections.hashtags = [sections.hashtags, ht].filter(Boolean).join(" ");
      }
      currentSection = key;
      return;
    }
    if (line.includes("#")) { sections.hashtags = [sections.hashtags, extractHashtags(line) || stripCaptionLabel(line)].filter(Boolean).join(" "); return; }
    if (currentSection) { sections[currentSection] = [sections[currentSection], removeHashtags(stripCaptionLabel(line))].filter(Boolean).join(" "); return; }
    if (!sections.caption) sections.caption = stripCaptionLabel(line);
  });
  const fallback = text.split(/\r?\n/).map(stripCaptionLabel).filter(Boolean).join("\n").trim();
  const description = [removeHashtags(sections.caption).trim(), (extractHashtags(sections.hashtags) || sections.hashtags).trim()].filter(Boolean).join("\n").trim();
  return {
    hook: removeHashtags(sections.hook).trim(),
    caption: removeHashtags(sections.caption).trim(),
    hashtags: (extractHashtags(sections.hashtags) || sections.hashtags).trim(),
    description: description || fallback,
  };
}
