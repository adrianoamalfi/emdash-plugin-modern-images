# emdash-plugin-modern-images

[![CI](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/ci.yml/badge.svg)](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/ci.yml)
[![Security](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/security.yml/badge.svg)](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/security.yml)
[![npm version](https://img.shields.io/npm/v/emdash-plugin-modern-images)](https://www.npmjs.com/package/emdash-plugin-modern-images)

Converts uploaded images to modern formats (WebP, AVIF) with responsive `<picture>`, disk caching, and LCP preload support for [EmDash CMS](https://emdashcms.com).

## Features

- **Automatic conversion** — Every uploaded image is converted to WebP and AVIF at 3 widths (640, 960, 1200)
- **Browser-native format negotiation** — `<picture>` renders AVIF → WebP → original, the browser picks the best supported format
- **Responsive srcset** — Multiple widths for every format, automatic selection via `sizes`
- **Format priority** — Choose AVIF-first or WebP-first from the admin panel
- **Quality control** — Adjust output quality (30–95) via admin settings
- **On-upload processing** — Zero configuration needed after setup
- **Disk cache** — Converted variants cached to disk by predictable path (`{storageKey}/{width}.{format}`)
- **LCP preload** — Optional `<link rel="preload">` for hero images

## Prerequisites

- EmDash CMS `^0.12.0`
- Your base layout must include `<EmDashHead />` and `<EmDashBodyEnd />` for hooks to function

## Installation

```bash
npm install emdash-plugin-modern-images
```

`sharp` is bundled automatically as a dependency.

## Usage

### 1. Register the plugin

```ts
import { modernImagesPlugin } from "emdash-plugin-modern-images";

export default defineConfig({
  integrations: [
    emdash({
      plugins: [modernImagesPlugin()],
    }),
  ],
});
```

### 2. Use `<ModernImage>` in your templates

Replace EmDash's `<Image>` with `<ModernImage>` for images you want to optimize:

```astro
---
import ModernImage from "emdash-plugin-modern-images/astro/ModernImage";
---

<ModernImage image={post.data.featured_image} />
```

The component renders a `<picture>` element with AVIF and WebP sources, plus the original image as fallback:

```html
<picture>
  <source srcset="...?format=avif&w=480 480w, ...?format=avif&w=960 960w" type="image/avif" />
  <source srcset="...?format=webp&w=480 480w, ...?format=webp&w=960 960w" type="image/webp" />
  <img src="/_emdash/api/media/file/ulid" alt="..." loading="lazy" />
</picture>
```

**At this point images still work but are served in their original format.** The `?format=` query params are silently ignored by EmDash's media endpoint. To enable WebP/AVIF delivery, set up the middleware (next step).

### 3. (Optional) Enable optimized delivery

Create `src/middleware.ts`:

```ts
export { onRequest } from "emdash-plugin-modern-images/astro/middleware";
```

The middleware intercepts requests to `/_emdash/api/media/file/...` that carry a `?format=` parameter and serves the cached converted version. If a variant isn't cached yet, it converts on-the-fly via sharp and caches the result.

If you already have existing middleware, compose them:

```ts
import { sequence } from "astro:middleware";
import { onRequest as modernImages } from "emdash-plugin-modern-images/astro/middleware";

export const onRequest = sequence(existingMiddleware, modernImages);
```

## Props

```astro
<ModernImage
  image={entry.data.featured_image}  // EmDash image object ({ src, alt })
  widths={[480, 640, 960, 1200]}     // Responsive widths for srcset
  sizes="100vw"                       // Sizes attribute
  loading="lazy"                      // "lazy" | "eager"
  decoding="async"                    // "async" | "sync" | "auto"
  class="my-class"                    // CSS class forwarded to <img>
  preload={false}                     // Emit <link rel="preload"> for LCP
/>
```

The `image` prop accepts an EmDash image field (object with `src` and `alt`). External URLs (`http://` / `https://`) are rendered as a plain `<img>` without optimization.

## How It Works

1. **Image uploaded** → The `media:afterUpload` hook fires
2. **Settings read** → Format priority and quality are read from the plugin's KV store
3. **Convert** → `sharp` creates AVIF and WebP variants at 640w, 960w, and 1200w
4. **Cache** → Each variant is written to a local disk cache (`./uploads/.cache/images/{storageKey}/{width}.{format}`)
5. **Serve** → The middleware checks the cache on every request and serves the matching variant. On cache miss, it converts on-the-fly and caches the result.

When the middleware is absent, `<ModernImage>` degrades gracefully: the browser requests the original file (EmDash ignores the `?format` param) and renders it as a regular image.

## Admin Settings

Navigate to `/_emdash/admin` → **Modern Images**.

| Field | Default | Description |
|---|---|---|
| Default format | `webp` | Preferred format (`webp` or `avif`). Both formats are always generated; this controls which is listed first in the `<picture>` element. |
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
