// Agent accent colors, keyed by Wingman `characterId`. Values are the per-agent `color` field
// observed in Wingman's agent table (wingmn.vercel.app). Unknown ids return null.
const AGENT_COLORS: Readonly<Record<string, string>> = {
  astra: "#aa45d1", breach: "#ec9a43", brimstone: "#aa5350", chamber: "#47729c",
  clove: "#ffb6c1", cypher: "#bca18e", deadlock: "#2aa4e6", fade: "#646464",
  gekko: "#c4da4b", harbor: "#3e6ab1", hush: "#ed0ca5", iso: "#9e6cff",
  jett: "#79bec8", kayo: "#0030b4", killjoy: "#f7df31", miks: "#70d6bd",
  neon: "#36e1fa", omen: "#6e54c2", phoenix: "#eb6b60", raze: "#ffcc71",
  reyna: "#e743e0", sage: "#51cbb4", skye: "#00dd60", sova: "#3b6df8",
  tejo: "#f4ba26", veto: "#5bc5ec", viper: "#8cd953", vyse: "#c82b6d",
  waylay: "#c6f191", yoru: "#7a9cff",
};

export const agentColor = (characterId: string): string | null =>
  AGENT_COLORS[characterId] ?? null;
