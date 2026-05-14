import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const sandbox = readFileSync(resolve(__dirname, "../src/sandbox-entry.ts"), "utf-8");

describe("Plugin definition", () => {
  it("has media:afterUpload hook", () => {
    expect(sandbox).toContain('"media:afterUpload"');
  });

  it("has plugin:install hook", () => {
    expect(sandbox).toContain('"plugin:install"');
  });

  it("has admin route", () => {
    expect(sandbox).toContain("form_submit");
    expect(sandbox).toContain("format_priority");
    expect(sandbox).toContain("breakpoints");
    expect(sandbox).toContain("quality");
  });

  it("has stats route", () => {
    expect(sandbox).toContain("stats");
    expect(sandbox).toContain("totalVariants");
  });

  it("imports sharp for image processing", () => {
    expect(sandbox).toContain("sharp");
    expect(sandbox).toContain("resize");
    expect(sandbox).toContain("toFormat");
  });

  it("fetches images via ctx.http", () => {
    expect(sandbox).toContain("ctx.http!.fetch");
    expect(sandbox).toContain("arrayBuffer");
  });

  it("uploads variants via ctx.media.upload", () => {
    expect(sandbox).toContain("ctx.media!.upload!");
  });
});
