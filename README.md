# emdash-plugin-modern-images

[![CI](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/ci.yml/badge.svg)](https://github.com/adrianoamalfi/emdash-plugin-modern-images/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/emdash-plugin-modern-images)](https://www.npmjs.com/package/emdash-plugin-modern-images)

Adds responsive WebP/AVIF delivery for EmDash media images with a `<picture>` component, on-demand Sharp conversion, disk caching, and LCP preload support.

## Quick start

```bash
npm install emdash-plugin-modern-images
npx emdash-plugin-modern-images
```

The CLI creates `src/middleware.ts` and prints the config snippet for registering the plugin.

## Manual setup

### 1. Register the plugin

Add to `astro.config.mjs`:

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

The plugin registration adds the admin settings page. Optimized image delivery is handled by the Astro middleware in step 3.

### 2. Use `<ModernImage>` in your templates

```astro
---
import ModernImage from "emdash-plugin-modern-images/astro/ModernImage";
---

<ModernImage image={post.data.featured_image} />

<!-- With custom sizes and LCP preload -->
<ModernImage image={post.data.featured_image} sizes="(min-width: 768px) 50vw, 100vw" preload />
```

The component renders a `<picture>` with AVIF and WebP sources. The browser picks the best format. The original image is the fallback. Widths are clamped to `16`-`2400`, quality is clamped to `30`-`95`, and media storage keys are URL-encoded before being used in generated URLs.

### 3. Enable optimized delivery

Create `src/middleware.ts`:

```ts
export { onRequest } from "emdash-plugin-modern-images/astro/middleware";
```

This intercepts `/_emdash/api/media/file/...?format=...&w=...&q=...` requests and serves cached WebP/AVIF/JPEG variants. On cache miss, it converts the original image with Sharp and stores the result under `.cache/images` inside `UPLOADS_DIR` by default.

If you already have middleware, compose:

```ts
import { sequence } from "astro:middleware";
import { onRequest as modernImages } from "emdash-plugin-modern-images/astro/middleware";

export const onRequest = sequence(yourMiddleware, modernImages);
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `image` | `{ id?, src?, alt?, meta? }` | required | EmDash image field. Uses `meta.storageKey` or `id` for the URL, falls back to extracting from `src`. |
| `widths` | `number[]` | `[480, 640, 960, 1200]` | Responsive widths for srcset |
| `sizes` | `string` | `"100vw"` | HTML `sizes` attribute |
| `loading` | `"lazy" \| "eager"` | `"lazy"` | Native lazy loading |
| `decoding` | `"async" \| "sync" \| "auto"` | `"async"` | Image decoding hint |
| `class` | `string` | — | CSS class forwarded to `<img>` |
| `preload` | `boolean` | `false` | Emit `<link rel="preload">` for LCP optimization |
| `formatQuality` | `number` | `78` | Output quality for generated URLs, clamped to 30–95 |

External URLs (`http://` / `https://`) are rendered as a plain `<img>` without optimization.

## Runtime model

`modernImagesPlugin()` is a standard EmDash plugin. Its sandbox/runtime entrypoint only stores admin settings in plugin KV and does not read media files or run Sharp.

Image conversion happens in the exported Astro middleware, which runs in the host Astro app and uses Node APIs. This keeps the plugin descriptor compatible with EmDash standard plugin boundaries while still allowing local filesystem caching for optimized media delivery.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `UPLOADS_DIR` | `./uploads` | Directory where EmDash media files are stored |
| `IMAGE_CACHE_DIR` | `${UPLOADS_DIR}/.cache/images` | Directory for generated image variants |

## Admin Settings

Navigate to `/_emdash/admin` → **Modern Images**.

The admin page stores plugin settings in EmDash plugin KV. In the current implementation, generated image URLs are controlled by `<ModernImage>` props and the middleware request parameters; the middleware does not read plugin KV.

| Field | Default | Description |
|---|---|---|
| Default format | `webp` | Stored preference. `<ModernImage>` currently emits AVIF first, then WebP. |
| Quality | `78` | Stored preference. Use the `formatQuality` prop to control generated URLs. |

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
