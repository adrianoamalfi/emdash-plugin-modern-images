import fs from "fs";
import path from "path";

const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";

export function resolveCacheDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.IMAGE_CACHE_DIR || path.join(env.UPLOADS_DIR || UPLOADS_DIR, ".cache", "images");
}

export const CACHE_DIR = resolveCacheDir();

export interface CacheKey {
  storageKey: string;
  width: number;
  format: string;
  quality: number;
  mtimeMs: number;
}

function isInsideDir(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function cachePath(key: Pick<CacheKey, "storageKey" | "width" | "format" | "quality">): string {
  const root = path.resolve(CACHE_DIR);
  const dest = path.resolve(root, key.storageKey, `${key.width}-q${key.quality}.${key.format}`);
  if (!isInsideDir(root, dest)) {
    throw new Error(`Invalid cache key: ${key.storageKey}`);
  }
  return dest;
}

export async function saveToCache(result: {
  buffer: Buffer;
  storageKey: string;
  width: number;
  format: string;
  quality: number;
  mtimeMs: number;
}): Promise<void> {
  const dest = cachePath(result);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, result.buffer);
}

export interface CachedResult {
  exists: boolean;
  buffer: Buffer;
  mime: string;
}

const MIME_MAP: Record<string, string> = {
  webp: "image/webp",
  avif: "image/avif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export function readFromCache(opts: Pick<CacheKey, "storageKey" | "width" | "format" | "quality">): CachedResult | null {
  try {
    const filePath = cachePath(opts);
    const buffer = fs.readFileSync(filePath);
    return { exists: true, buffer, mime: MIME_MAP[opts.format] || "image/webp" };
  } catch {
    return null;
  }
}
