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

function isInsideDir(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function resolveUploadPath(...parts: string[]): string | null {
  const root = path.resolve(UPLOADS_DIR);
  const resolved = path.resolve(root, ...parts);
  return isInsideDir(root, resolved) ? resolved : null;
}

function findSourceFile(storageKey: string): string | null {
  const resolved = resolveUploadPath(storageKey);
  if (!resolved) return null;
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return resolved;
  if (!fs.existsSync(UPLOADS_DIR)) return null;
  const entries = fs.readdirSync(UPLOADS_DIR);
  for (const entry of entries) {
    if (entry.startsWith(storageKey + ".")) {
      const candidate = resolveUploadPath(entry);
      if (candidate && fs.statSync(candidate).isFile()) return candidate;
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
  const target = FORMAT_MAP[format];
  if (!target) {
    throw new Error(`Unsupported image format: ${format}`);
  }

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

