import { IMAGE_SOURCES, type StrategySource } from "@/types/strategy";
import { titleFromFilename, safeDisplayName } from "./filename";
import { sniffImage, type ImageType } from "./image-signature";
import { ImportError, type ImportAdapter, type ImportResult } from "./types";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export type ParsedImage = {
  result: ImportResult;
  type: ImageType;
  originalName: string;
  bytes: Uint8Array;
};

/** Validates one uploaded image (size and signature) and derives a title from its filename. */
export function parseImage(file: { name: string; bytes: Uint8Array }): ParsedImage {
  const name = safeDisplayName(file.name);
  if (file.bytes.length === 0) throw new ImportError(`${name}: file is empty`);
  if (file.bytes.length > MAX_IMAGE_BYTES) {
    throw new ImportError(`${name}: larger than ${MAX_IMAGE_BYTES / 1024 / 1024} MB`);
  }
  const type = sniffImage(file.bytes);
  if (!type) throw new ImportError(`${name}: not a PNG, JPEG, or WebP image`);
  return {
    type,
    originalName: name,
    bytes: file.bytes,
    result: {
      suggestedTitle: titleFromFilename(name),
      frames: [{ order: 0, kind: "image", name: titleFromFilename(name) }],
    },
  };
}

export function isImageSource(source: string): source is (typeof IMAGE_SOURCES)[number] {
  return (IMAGE_SOURCES as readonly string[]).includes(source);
}

/** Image-based providers have no verified structured format; the image itself is the preview. */
export function createImageAdapter(source: StrategySource): ImportAdapter {
  return { source, parse: async (file) => parseImage(file).result };
}
