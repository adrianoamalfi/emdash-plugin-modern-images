# emdash-plugin-modern-images

[![CI](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/ci.yml/badge.svg)](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/emdash-plugin-modern-images)](https://www.npmjs.com/package/emdash-plugin-modern-images)

Converts uploaded images to WebP/AVIF with responsive `<picture>`, disk caching, and LCP preload support for [EmDash CMS](https://emdashcms.com).

## Install

```bash
npm install emdash-plugin-modern-images
```

`sharp` is bundled as a dependency — no extra install needed.

## Setup

### 1. Register the plugin

```ts
// astro.config.mjs
import { modernImagesPlugin } from "emdash-plugin-modern-images";

export default defineConfig({
  integrations: [
    emdash({
      plugins: [modernImagesPlugin()],
      // database and storage remain unchanged
    }),
  ],
});
```

Once registered, every uploaded image is automatically converted to WebP and AVIF at 640w, 960w, and 1200w.

### 2. Use `<ModernImage>` in your templates

Replace EmDash's `<Image>` with `<ModernImage>` for the images you want to optimize:

```astro
---
import ModernImage from "emdash-plugin-modern-images/astro/ModernImage";
---

<!-- Basic usage -->
<ModernImage image={post.data.featured_image} />

<!-- With responsive sizes and LCP preload -->
<ModernImage image={post.data.featured_image} sizes="(min-width: 768px) 50vw, 100vw" preload />
```

The component renders a `<picture>` element with AVIF and WebP sources. The browser picks the best supported format. The original image is used as fallback.

**Without the next step, images display in their original format.** The `?format=` query params are ignored by EmDash's built-in media endpoint.

### 3. (Optional) Enable optimized delivery

Create `src/middleware.ts`:

```ts
export { onRequest } from "emdash-plugin-modern-images/astro/middleware";
```

Done. The middleware intercepts requests to `/_emdash/api/media/file/...?format=...` and serves cached WebP/AVIF. On cache miss, it converts on-the-fly.

If you already have middleware, compose them:

```ts
import { sequence } from "astro:middleware";
import { onRequest as modernImages } from "emdash-plugin-modern-images/astro/middleware";

export const onRequest = sequence(yourMiddleware, modernImages);
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `image` | `{ src, alt }` | required | EmDash image field object |
| `widths` | `number[]` | `[480, 640, 960, 1200]` | Responsive widths for srcset |
| `sizes` | `string` | `"100vw"` | HTML `sizes` attribute |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | Native lazy loading |
| `decoding` | `"async" \| "sync" \| "auto"` | `"async"` | Image decoding hint |
| `class` | `string` | — | CSS class forwarded to `<img>` |
| `preload` | `boolean` | `false` | Emit `<link rel="preload">` for LCP optimization |

External URLs (`http://` / `https://`) are rendered as a plain `<img>` without optimization.

## Admin Settings

Navigate to `/_emdash/admin` → **Modern Images**.

| Field | Default | Description |
|---|---|---|
| Default format | `webp` | Preferred format. Both formats are always generated; this controls `<picture>` source order. |
| Quality | `78` | Output quality (30–95). |

## Development

```bash
git clone https://github.com/adrianoamalfi/emdash-plugin-modern-images.git
cd emdash-plugin-modern-images
npm install
npm run typecheck
npm test
```

## License

MIT © Adriano Amalfi
