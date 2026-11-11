const CONTROL = /[\u0000-\u001f\u007f]/g;

const clean = (name: string) =>
  // \x5c is a backslash: strip both Windows and POSIX path prefixes.
  (name.split(/[\x5c/]/).pop() ?? "").replace(CONTROL, "").trim().slice(0, 200);

/** Display-only name. Never used as a storage path. */
export function safeDisplayName(name: string): string {
  return clean(name) || "upload";
}

/** Title fallback from the filename: no path, no extension, bounded length. */
export function titleFromFilename(name: string): string {
  const base = clean(name).replace(/\.[A-Za-z0-9]{1,5}$/, "");
  const title = base.replace(/\s+/g, " ").trim().slice(0, 100);
  return title || "Untitled strategy";
}
