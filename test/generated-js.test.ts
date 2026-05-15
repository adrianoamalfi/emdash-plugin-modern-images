import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { resolveCacheDir } from "../src/lib/cache";
import { DEFAULT_SETTINGS, normalizeSettings } from "../src/lib/settings";

const sandbox = readFileSync(resolve(__dirname, "../src/sandbox-entry.ts"), "utf-8");
const middleware = readFileSync(resolve(__dirname, "../src/astro/middleware.ts"), "utf-8");

describe("Plugin definition", () => {
  it("has plugin:install hook", () => {
    expect(sandbox).toContain('"plugin:install"');
  });

  it("has admin route with form_submit", () => {
    expect(sandbox).toContain("form_submit");
    expect(sandbox).toContain("default_format");
    expect(sandbox).toContain("default_quality");
  });

  it("reads settings from KV", () => {
    expect(sandbox).toContain("getSettings");
    expect(sandbox).toContain("SETTINGS_KEY");
  });

  it("does not import Node-only image conversion into the standard plugin runtime", () => {
    expect(sandbox).not.toContain("convertImage");
    expect(sandbox).not.toContain("saveToCache");
    expect(sandbox).not.toContain("sharp");
    expect(sandbox).not.toContain("fs");
  });

  it("validates admin format against output formats", () => {
    expect(sandbox).toContain("OUTPUT_FORMATS");
  });

  it("has middleware for on-the-fly image serving", () => {
    expect(middleware).toContain("onRequest");
    expect(middleware).toContain("readFromCache");
    expect(middleware).toContain("convertImage");
    expect(middleware).toContain("saveToCache");
  });
});

describe("Settings normalization", () => {
  it("falls back to defaults for invalid settings", () => {
    expect(normalizeSettings({ defaultFormat: "gif", defaultQuality: "bad" })).toEqual(DEFAULT_SETTINGS);
  });

  it("clamps quality and accepts supported output formats", () => {
    expect(normalizeSettings({ defaultFormat: "avif", defaultQuality: "120" })).toEqual({
      defaultFormat: "avif",
      defaultQuality: 95,
    });
  });
});

describe("Cache directory resolution", () => {
  it("uses IMAGE_CACHE_DIR when provided", () => {
    expect(resolveCacheDir({ IMAGE_CACHE_DIR: "/tmp/images", UPLOADS_DIR: "/tmp/uploads" } as NodeJS.ProcessEnv)).toBe("/tmp/images");
  });

  it("defaults to .cache/images inside UPLOADS_DIR", () => {
    expect(resolveCacheDir({ UPLOADS_DIR: "/tmp/uploads" } as NodeJS.ProcessEnv)).toBe("/tmp/uploads/.cache/images");
  });
});
