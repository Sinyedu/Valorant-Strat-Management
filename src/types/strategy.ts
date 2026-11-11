export const STRATEGY_SOURCES = [
  "wingman",
  "tactival",
  "valoplant",
  "generic",
] as const;

export type StrategySource = (typeof STRATEGY_SOURCES)[number];
