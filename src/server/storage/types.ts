// Storage provider is not selected yet. Implementations (local disk, S3-compatible, ...)
// will live beside this file. Keys are opaque and server-generated, never client paths.
export interface FileStorage {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}
