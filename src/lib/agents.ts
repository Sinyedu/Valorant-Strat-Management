// Agents that have a portrait in public/agents/<id>.webp (128x128). Other agent ids
// (for example newly released ones) fall back to initials in the scene viewer.
export const AGENT_ICONS: ReadonlySet<string> = new Set([
  "astra", "breach", "brimstone", "chamber", "clove", "cypher", "deadlock", "fade", "gekko",
  "harbor", "iso", "jett", "kayo", "killjoy", "miks", "neon", "omen", "phoenix", "raze",
  "reyna", "sage", "skye", "sova", "tejo", "veto", "viper", "vyse", "waylay", "yoru",
]);

export const agentIconSrc = (id: string): string | null =>
  AGENT_ICONS.has(id) ? `/agents/${id}.webp` : null;
