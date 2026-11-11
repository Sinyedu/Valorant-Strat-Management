export const STRATEGY_SOURCES = [
  "wingman",
  "tactival",
  "valoplant",
  "generic",
] as const;

export type StrategySource = (typeof STRATEGY_SOURCES)[number];

/** Sources that can be imported as plain images today (Wingman .map is Phase 4). */
export const IMAGE_SOURCES = ["tactival", "valoplant", "generic"] as const;

export type StrategySide = "attack" | "defense";

export type StrategyDto = {
  id: string;
  title: string;
  source: StrategySource;
  folderId: string | null;
  mapId: string | null;
  side: StrategySide | null;
  tags: string[];
  createdAt: string;
};

export type FrameDto = {
  id: string;
  order: number;
  name: string | null;
  attachmentId: string;
};

export type AttachmentDto = {
  id: string;
  originalName: string;
  contentType: string;
  size: number;
};

export type StrategyDetailDto = {
  strategy: StrategyDto;
  frames: FrameDto[];
  attachments: AttachmentDto[];
};
