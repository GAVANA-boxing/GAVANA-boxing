import { describe, it, expect } from "vitest";
import { cameraPermissionHelp } from "@/lib/cameraHelp";

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1";
const IPAD_DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36";
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36";

describe("cameraPermissionHelp", () => {
  it("gives iOS steps for iPhone and iPadOS desktop-mode", () => {
    expect(cameraPermissionHelp(IPHONE, "en")).toMatch(/^iPhone/);
    expect(cameraPermissionHelp(IPAD_DESKTOP, "en")).toMatch(/^iPhone/);
  });
  it("gives Android steps for Android", () => {
    expect(cameraPermissionHelp(ANDROID, "en")).toMatch(/^Android/);
  });
  it("falls back to generic steps", () => {
    expect(cameraPermissionHelp(DESKTOP, "en")).toMatch(/lock icon/);
    expect(cameraPermissionHelp(undefined, "en")).toMatch(/lock icon/);
  });
  it("is localized in mn / ko / en", () => {
    const texts = ["mn", "ko", "en"].map((l) => cameraPermissionHelp(ANDROID, l));
    expect(new Set(texts).size).toBe(3);
    expect(texts[0]).toMatch(/Зөвшөөрөх/);
    expect(texts[1]).toMatch(/허용/);
  });
});
