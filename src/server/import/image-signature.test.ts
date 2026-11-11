import { describe, expect, it } from "vitest";
import { sniffImage } from "./image-signature";
import { safeDisplayName, titleFromFilename } from "./filename";

const bytes = (...n: number[]) => new Uint8Array(n);
const ascii = (s: string) => Array.from(s).map((c) => c.charCodeAt(0));

describe("sniffImage", () => {
  it("detects PNG, JPEG, and WebP by signature", () => {
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0))?.mime).toBe("image/png");
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))?.mime).toBe("image/jpeg");
    const webp = bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WEBP"), 0);
    expect(sniffImage(webp)?.mime).toBe("image/webp");
  });

  it("rejects other content, including images renamed or disguised", () => {
    expect(sniffImage(bytes(...ascii("<svg xmlns=...")))).toBeNull();
    expect(sniffImage(bytes(...ascii("GIF89a")))).toBeNull();
    expect(sniffImage(bytes(...ascii("%PDF-1.7")))).toBeNull();
    expect(sniffImage(bytes(...ascii("RIFF"), 1, 2, 3, 4, ...ascii("WAVE")))).toBeNull();
  });

  it("rejects empty and truncated input", () => {
    expect(sniffImage(new Uint8Array())).toBeNull();
    expect(sniffImage(bytes(0x89, 0x50))).toBeNull();
    expect(sniffImage(bytes(...ascii("RIFF"), 1, 2))).toBeNull();
  });
});

describe("filename helpers", () => {
  it("derives a title without path or extension", () => {
    expect(titleFromFilename("Ascent A site  execute.PNG")).toBe("Ascent A site execute");
    const winPath = ["C:", "Users", "me", "strat_1.webp"].join(String.fromCharCode(92));
    expect(titleFromFilename(winPath)).toBe("strat_1");
    expect(titleFromFilename("../../etc/passwd.png")).toBe("passwd");
  });

  it("falls back when nothing usable remains", () => {
    expect(titleFromFilename(".png")).toBe("Untitled strategy");
    expect(titleFromFilename("")).toBe("Untitled strategy");
  });

  it("strips control characters and bounds length", () => {
    expect(safeDisplayName("a\u0000b\nc.png")).toBe("abc.png");
    expect(titleFromFilename("x".repeat(500) + ".png").length).toBe(100);
  });
});
