import { DEFAULT_QUALITY } from "./constants";

export const OUTPUT_FORMATS = ["webp", "avif"] as const;

export interface ModernImagesSettings {
  defaultQuality: number;
  defaultFormat: (typeof OUTPUT_FORMATS)[number];
}

export const SETTINGS_KEY = "settings:all";

export const DEFAULT_SETTINGS: ModernImagesSettings = {
  defaultQuality: DEFAULT_QUALITY,
  defaultFormat: "webp",
};

export function clampQuality(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_SETTINGS.defaultQuality;
  return Math.max(30, Math.min(95, parsed));
}

export function normalizeFormat(value: unknown): ModernImagesSettings["defaultFormat"] {
  return (OUTPUT_FORMATS as readonly string[]).includes(String(value))
    ? (String(value) as ModernImagesSettings["defaultFormat"])
    : DEFAULT_SETTINGS.defaultFormat;
}

export function normalizeSettings(raw: unknown): ModernImagesSettings {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    defaultQuality: clampQuality(value.defaultQuality),
    defaultFormat: normalizeFormat(value.defaultFormat),
  };
}
