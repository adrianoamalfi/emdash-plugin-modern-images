# emdash-modern-images

[![CI](https://github.com/adrianoamalfi/emdash-modern-images/actions/workflows/ci.yml/badge.svg)](https://github.com/adrianoamalfi/emdash-modern-images/actions/workflows/ci.yml)
[![Security](https://github.com/adrianoamalfi/emdash-modern-images/actions/workflows/security.yml/badge.svg)](https://github.com/adrianoamalfi/emdash-modern-images/actions/workflows/security.yml)
[![npm version](https://img.shields.io/npm/v/emdash-modern-images)](https://www.npmjs.com/package/emdash-modern-images)

Automatic image optimization for [EmDash CMS](https://emdashcms.com). Converts uploaded images to WebP and AVIF with responsive breakpoints — all controlled from the admin panel.

## Features

- **Automatic conversion** — Every uploaded image is converted to WebP and AVIF
- **Responsive breakpoints** — Generate 480w, 768w, 1024w, 1600w variants per image
- **Admin controls** — Configure format priority, quality, and breakpoint sizes
- **On-upload processing** — Zero configuration needed after setup
- **Sharp-powered** — Uses the industry-standard `sharp` library for high-speed conversion
- **Cache tracking** — All variants tracked via KV for stats and future reprocessing

## Installation

```bash
npm install emdash-modern-images
```

## Usage

Register the plugin in `astro.config.mjs`:

```ts
import { modernImagesPlugin } from "emdash-modern-images";

export default defineConfig({
  integrations: [
    emdash({
      plugins: [modernImagesPlugin()],
    }),
  ],
});
```

Once installed, every image uploaded through the EmDash admin is automatically processed. No additional configuration needed.

## How It Works

1. **Image uploaded** → The `media:afterUpload` hook fires
2. **Fetch original** → The plugin reads the image data via HTTP
3. **Generate variants** → `sharp` creates WebP and AVIF copies at each breakpoint
4. **Upload variants** → Each variant is stored as a media item in EmDash
5. **Cache mapping** → Original-to-variant mapping saved in KV for stats and retrieval

## Admin Settings

Navigate to `/_emdash/admin` → **Modern Images**.

| Field | Default | Description |
|---|---|---|
| Format Priority | WebP > AVIF | Output format preference order |
| Quality | `80` | Output quality (1-100) |
| Breakpoints | `480, 768, 1024, 1600` | Comma-separated widths in pixels |

## API Routes

### Stats

`GET /_emdash/api/plugins/modern-images/stats`

Returns processing statistics:

```json
{
  "imagesProcessed": 42,
  "totalVariants": 168,
  "totalCacheKb": 12480
}
```

## Development

```bash
git clone https://github.com/adrianoamalfi/emdash-modern-images.git
cd emdash-modern-images
npm install
npm run typecheck
npm test
```

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Releases are automated via [semantic-release](https://github.com/semantic-release/semantic-release).

## License

MIT © Adriano Amalfi
