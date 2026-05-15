import { readFromCache, saveToCache } from "../lib/cache";
import { convertImage } from "../lib/convert";
import { SUPPORTED_FORMATS, QUALITY_RANGE, DEFAULT_QUALITY } from "../lib/constants";

const MEDIA_PREFIX = "/_emdash/api/media/file/";
const DEFAULT_WIDTH = 960;

function parseBoundedInt(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function decodePathSegment(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export const onRequest = async (context: { request: Request }, next: () => Promise<Response>): Promise<Response> => {
  const url = new URL(context.request.url);
  const format = url.searchParams.get("format");

  if (!url.pathname.startsWith(MEDIA_PREFIX) || !format) {
    return next();
  }

  const rawStorageKey = url.pathname.slice(MEDIA_PREFIX.length);
  const storageKey = decodePathSegment(rawStorageKey);
  if (!storageKey) return next();

  if (!(SUPPORTED_FORMATS as readonly string[]).includes(format)) {
    return next();
  }

  const width = parseBoundedInt(url.searchParams.get("w"), DEFAULT_WIDTH, 16, 2400);
  const quality = parseBoundedInt(url.searchParams.get("q"), DEFAULT_QUALITY, QUALITY_RANGE.min, QUALITY_RANGE.max);

  const cached = readFromCache({ storageKey, width, format, quality });
  if (cached) {
    return new Response(cached.buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": cached.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  try {
    const result = await convertImage({ storageKey, format, width, quality });
    await saveToCache(result);
    return new Response(result.buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": result.mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return next();
  }
};
