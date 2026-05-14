import { readFromCache, saveToCache } from "../lib/cache";
import { convertImage } from "../lib/convert";
import { SUPPORTED_FORMATS, QUALITY_RANGE } from "../lib/constants";

export const onRequest = async (context: { request: Request }, next: () => Promise<Response>): Promise<Response> => {
  const url = new URL(context.request.url);
  const format = url.searchParams.get("format");

  if (!url.pathname.startsWith("/_emdash/api/media/file/") || !format) {
    return next();
  }

  const storageKey = url.pathname.replace("/_emdash/api/media/file/", "");
  if (!storageKey) return next();

  if (!(SUPPORTED_FORMATS as readonly string[]).includes(format)) {
    return next();
  }

  const rawWidth = url.searchParams.get("w") || "960";
  const rawQuality = url.searchParams.get("q") || "78";
  const width = Math.max(16, Math.min(2400, parseInt(rawWidth, 10) || 960));
  const quality = Math.max(QUALITY_RANGE.min, Math.min(QUALITY_RANGE.max, parseInt(rawQuality, 10) || 78));

  const cached = readFromCache({ storageKey, width, format });
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
