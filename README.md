# emdash-plugin-modern-images

[![CI](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/ci.yml/badge.svg)](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/ci.yml)
[![Security](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/security.yml/badge.svg)](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/security.yml)
[![npm version](https://img.shields.io/npm/v/emdash-plugin-modern-images)](https://www.npmjs.com/package/emdash-plugin-modern-images)

Converts uploaded images to modern formats (WebP, AVIF) with responsive `srcset`, disk caching, and LCP preload support for [EmDash CMS](https://emdashcms.com).

## Features

- **Automatic conversion** — Every uploaded image is converted to WebP and AVIF at 3 widths (640, 960, 1200)
- **Format priority** — Choose WebP-first or AVIF-first from the admin panel
- **Quality control** — Adjust output quality (30–95) via admin settings
- **On-upload processing** — Zero configuration needed after setup
- **Disk cache** — Converted variants cached to disk, keyed by content hash

## Prerequisites

- EmDash CMS `^0.12.0`
- Your base layout must include `<EmDashHead />` and `<EmDashBodyEnd />` for hooks to function

## Installation

```bash
npm install emdash-plugin-modern-images
```

You also need the `sharp` native dependency (bundled automatically):

```bash
npm install sharp
```

## Usage

Register the plugin in `astro.config.mjs`:

```ts
import { modernImagesPlugin } from "emdash-plugin-modern-images";
import emdash from "emdash/astro";
import { defineConfig } from "astro/config";

export default defineConfig({
  integrations: [
    emdash({
      plugins: [modernImagesPlugin()],
      // database and storage remain unchanged
    }),
  ],
});
```

Once installed, every image uploaded through the EmDash admin is automatically processed.

## How It Works

1. **Image uploaded** → The `media:afterUpload` hook fires
2. **Settings read** → Format priority and quality are read from the plugin's KV store
3. **Convert** → `sharp` creates WebP and AVIF variants at 640w, 960w, and 1200w
4. **Cache** → Each variant is written to a local disk cache (`./uploads/.cache/images/`)
5. **Track** → Conversion metadata (format, width, size, mtime) stored in the `conversions` storage collection

## Admin Settings

Navigate to `/_emdash/admin` → **Modern Images**.

| Field | Default | Description |
|---|---|---|
| Default format | `webp` | Preferred format (`webp` or `avif`). Both formats are always generated; this controls which is listed first. |
| Quality | `78` | Output quality (30–95). Lower = smaller file. |

## Development

```bash
git clone https://github.com/adrianoamalfi/emdash-plugin-modern-images.git
cd emdash-plugin-modern-images
npm install
npm run typecheck
npm test
```

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Releases are automated via [semantic-release](https://github.com/semantic-release/semantic-release) — pushing `fix:`, `feat:`, or `BREAKING CHANGE:` commits to `main` triggers a release to npm and GitHub.

## License

MIT © Adriano Amalfi
