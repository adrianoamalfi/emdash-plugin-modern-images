import sharp from "sharp";
import fs from "fs";
import path from "path";
import { FORMAT_MAP } from "./constants";

export { SUPPORTED_FORMATS, QUALITY_RANGE, WIDTH_RANGE, WIDTH_CANDIDATES, DEFAULT_QUALITY } from "./constants";

const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";

export interface ConvertResult {
  buffer: Buffer;
  mime: string;
  size: number;
  mtimeMs: number;
  width: number;
  format: string;
  quality: number;
  storageKey: string;
}

function findSourceFile(storageKey: string): string | null {
  const resolved = path.resolve(UPLOADS_DIR, storageKey);
  if (!resolved.startsWith(path.resolve(UPLOADS_DIR))) {
    return null;
  }
  if (fs.existsSync(resolved)) return resolved;
  if (!fs.existsSync(UPLOADS_DIR)) return null;
  const entries = fs.readdirSync(UPLOADS_DIR);
  for (const entry of entries) {
    if (entry.startsWith(storageKey + ".")) {
      return path.resolve(UPLOADS_DIR, entry);
    }
  }
  return null;
}

export async function convertImage(opts: {
  storageKey: string;
  format: string;
  width: number;
  quality: number;
}): Promise<ConvertResult> {
  const { storageKey, format, width, quality } = opts;

  const sourcePath = findSourceFile(storageKey);
  if (!sourcePath) {
    throw new Error(`Source file not found for storageKey: ${storageKey}`);
  }

  const stat = fs.statSync(sourcePath);
  const target = FORMAT_MAP[format] || FORMAT_MAP.webp;

  const buffer = await sharp(sourcePath)
    .rotate()
    .resize(width, undefined, { withoutEnlargement: true })
    .toFormat(target.sharpFormat as any, { quality })
    .toBuffer();

  return {
    buffer,
    mime: target.mime,
    size: buffer.length,
    mtimeMs: stat.mtimeMs,
    width,
    format,
    quality,
    storageKey,
  };
}


