import type { SceneDto } from "@/types/scene";
import type { StrategySource } from "@/types/strategy";

// Adapter contract from AGENTS.md. `previewData` is set for tactical scenes only.
export type ImportedFrame = {
  name?: string;
  order: number;
  kind: "image" | "tactical-scene";
  previewData?: SceneDto;
};

export type ImportResult = {
  suggestedTitle?: string;
  mapId?: string;
  side?: "attack" | "defense";
  frames: ImportedFrame[];
};

export interface ImportAdapter {
  source: StrategySource;
  /** Must validate content itself; the selected source is not proof of validity. */
  parse(file: { name: string; bytes: Uint8Array }): Promise<ImportResult>;
}

/** A user-correctable import problem (bad file, too large, unsupported source). */
export class ImportError extends Error {}
