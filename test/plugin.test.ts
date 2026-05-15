import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { modernImagesPlugin } from "../src";

const source = readFileSync(resolve(__dirname, "../src/index.ts"), "utf-8");
const pkg = readFileSync(resolve(__dirname, "../package.json"), "utf-8");
const packageJson = JSON.parse(pkg);

describe("Plugin descriptor", () => {
  it("exports modernImagesPlugin function", () => {
    expect(source).toContain("export function modernImagesPlugin");
  });

  it("describes a standard plugin without runtime media capabilities", () => {
    expect(modernImagesPlugin()).toMatchObject({
      id: "modern-images",
      version: packageJson.version,
      format: "standard",
      entrypoint: "emdash-plugin-modern-images/sandbox",
      capabilities: [],
    });
  });

  it("has admin settings page", () => {
    expect(modernImagesPlugin().adminPages).toContainEqual({
      path: "/settings",
      label: "Modern Images",
      icon: "image",
    });
  });
});

describe("Package exports", () => {
  it("exports ModernImage component", () => {
    expect(pkg).toContain('"./astro/ModernImage"');
  });

  it("exports middleware", () => {
    expect(pkg).toContain('"./astro/middleware"');
  });
});
