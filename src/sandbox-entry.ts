import { definePlugin } from "emdash";
import type { PluginContext } from "emdash";
import sharp from "sharp";

const SETTINGS_KEY = "settings:all";

interface Settings {
  formatPriority: string[];
  quality: number;
  breakpoints: number[];
}

const DEFAULTS: Settings = {
  formatPriority: ["webp", "avif"],
  quality: 80,
  breakpoints: [480, 768, 1024, 1600],
};

interface Variant {
  format: string;
  width: number;
  mediaId: string;
  url: string;
  size: number;
}

interface CacheEntry {
  originalId: string;
  originalUrl: string;
  originalMime: string;
  variants: Variant[];
  createdAt: string;
}

async function getSettings(ctx: PluginContext): Promise<Settings> {
  const stored = await ctx.kv.get<Partial<Settings>>(SETTINGS_KEY);
  return { ...DEFAULTS, ...(stored || {}) };
}

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/tiff"];

function isRasterImage(mime: string): boolean {
  return IMAGE_MIME.includes(mime) || mime.startsWith("image/");
}

async function fetchImageBuffer(url: string, ctx: PluginContext): Promise<Buffer> {
  const resp = await ctx.http!.fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status} ${resp.statusText}`);
  const ab = await resp.arrayBuffer();
  return Buffer.from(ab);
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return new Uint8Array(buf).buffer as ArrayBuffer;
}

async function uploadVariant(
  buffer: Buffer,
  filename: string,
  mime: string,
  ctx: PluginContext,
): Promise<{ url: string; mediaId: string }> {
  const result = await ctx.media!.upload!(filename, mime, toArrayBuffer(buffer));
  return { url: result.url, mediaId: result.mediaId };
}

function formatMime(fmt: string): string {
  return fmt === "avif" ? "image/avif" : `image/${fmt}`;
}

export default definePlugin({
  hooks: {
    "plugin:install": async (_event: unknown, ctx: PluginContext) => {
      await ctx.kv.set(SETTINGS_KEY, { ...DEFAULTS });
      ctx.log.info("Modern Images plugin installed with default settings");
    },

    "media:afterUpload": async (event: any, ctx: PluginContext) => {
      const { media } = event;
      if (!media?.mimeType || !isRasterImage(media.mimeType)) return;
      if (!media?.url) {
        ctx.log.warn(`No URL for media ${media.id}, skipping`);
        return;
      }

      ctx.log.info(`Processing image: ${media.id} (${media.mimeType})`);
      const settings = await getSettings(ctx);

      try {
        const originalBuffer = await fetchImageBuffer(media.url, ctx);
        const variants: Variant[] = [];

        for (const format of settings.formatPriority) {
          for (const width of settings.breakpoints) {
            try {
              const output = await sharp(originalBuffer)
                .resize({ width, withoutEnlargement: true, fit: "inside" })
                .toFormat(format as any, { quality: settings.quality })
                .toBuffer();

              const filename = `${media.id}-${width}w.${format}`;
              const mime = formatMime(format);
              const { url, mediaId } = await uploadVariant(output, filename, mime, ctx);

              variants.push({ format, width, mediaId, url, size: output.length });
              ctx.log.info(`  Generated ${filename} (${format} ${width}w — ${(output.length / 1024).toFixed(0)}KB)`);
            } catch (err) {
              ctx.log.warn(`  Failed to generate ${format} ${width}w: ${(err as Error).message}`);
            }
          }
        }

        const entry: CacheEntry = {
          originalId: media.id,
          originalUrl: media.url,
          originalMime: media.mimeType,
          variants,
          createdAt: new Date().toISOString(),
        };
        await ctx.kv.set(`cache:image:${media.id}`, entry);
        ctx.log.info(`Finished processing ${media.id}: ${variants.length} variants`);
      } catch (err) {
        ctx.log.error(`Failed to process image ${media.id}: ${(err as Error).message}`);
      }
    },
  },

  routes: {
    admin: {
      handler: async (routeCtx: any, ctx: PluginContext) => {
        const interaction = routeCtx.input as Record<string, any>;

        if (interaction.type === "page_load") {
          return { blocks: buildForm(await getSettings(ctx)) };
        }

        if (interaction.type === "form_submit" && interaction.action_id === "save") {
          try {
            const values = interaction.values ?? {};
            const s: Partial<Settings> = {};
            if (values.format_priority) {
              s.formatPriority = values.format_priority === "avif_first"
                ? ["avif", "webp"]
                : ["webp", "avif"];
            }
            if (values.quality !== undefined) s.quality = Math.max(1, Math.min(100, Number(values.quality)));
            if (values.breakpoints) {
              s.breakpoints = String(values.breakpoints)
                .split(",")
                .map((v: string) => parseInt(v.trim(), 10))
                .filter((n: number) => !isNaN(n) && n > 0);
            }
            await ctx.kv.set(SETTINGS_KEY, { ...DEFAULTS, ...s });
            return {
              blocks: [
                { type: "banner", title: "Settings saved.", variant: "default" },
                ...buildForm(await getSettings(ctx)),
              ],
            };
          } catch (e) {
            return {
              blocks: [
                { type: "banner", title: `Failed to save: ${(e as Error).message}`, variant: "error" },
                ...buildForm(await getSettings(ctx)),
              ],
            };
          }
        }

        return { blocks: [{ type: "header", text: "Modern Images Settings" }] };
      },
    },

    stats: {
      handler: async (_routeCtx: any, ctx: PluginContext) => {
        const all = await ctx.kv.list("cache:image:");
        let totalVariants = 0;
        let totalSize = 0;
        for (const entry of all) {
          const cache = entry.value as CacheEntry;
          if (cache?.variants) {
            totalVariants += cache.variants.length;
            totalSize += cache.variants.reduce((sum: number, v: Variant) => sum + (v.size || 0), 0);
          }
        }
        return {
          imagesProcessed: all.length,
          totalVariants,
          totalCacheKb: Math.round(totalSize / 1024),
        };
      },
    },
  },
});

function buildForm(s: Settings) {
  return [
    { type: "header", text: "Modern Images Settings" },
    { type: "context", text: "Configure how uploaded images are optimized. Changes apply to new uploads only." },
    {
      type: "form",
      block_id: "settings",
      fields: [
        {
          type: "select",
          action_id: "format_priority",
          label: "Output Format Priority",
          initial_value: s.formatPriority[0] === "avif" ? "avif_first" : "webp_first",
          options: [
            { value: "webp_first", label: "WebP preferred (fallback AVIF)" },
            { value: "avif_first", label: "AVIF preferred (fallback WebP)" },
          ],
        },
        {
          type: "text_input",
          action_id: "quality",
          label: "Quality (1-100)",
          initial_value: String(s.quality),
        },
        {
          type: "text_input",
          action_id: "breakpoints",
          label: "Breakpoints (comma-separated widths in px)",
          initial_value: s.breakpoints.join(", "),
        },
      ],
      submit: { label: "Save", action_id: "save" },
    },
  ];
}
