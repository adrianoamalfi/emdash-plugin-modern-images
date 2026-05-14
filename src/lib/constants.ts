export const SUPPORTED_FORMATS = ["webp", "avif", "jpg", "jpeg"] as const;
export const QUALITY_RANGE = { min: 30, max: 95 };
export const WIDTH_RANGE = { min: 16, max: 2400 };

export const WIDTH_CANDIDATES = [320, 480, 640, 800, 960, 1080, 1200, 1280, 1600] as const;
export const DEFAULT_QUALITY = 78;

export const FORMAT_MAP: Record<string, { sharpFormat: string; mime: string }> = {
  webp: { sharpFormat: "webp", mime: "image/webp" },
  avif: { sharpFormat: "avif", mime: "image/avif" },
  jpg: { sharpFormat: "jpeg", mime: "image/jpeg" },
  jpeg: { sharpFormat: "jpeg", mime: "image/jpeg" },
};
