import { definePlugin } from "emdash";
import type { PluginContext } from "emdash";
import { convertImage, SUPPORTED_FORMATS } from "./lib/convert";
import { saveToCache } from "./lib/cache";

interface Settings {
  defaultQuality: number;
  defaultFormat: string;
}

const DEFAULT_SETTINGS: Settings = {
  defaultQuality: 78,
  defaultFormat: "webp",
};

async function getSettings(ctx: PluginContext): Promise<Settings> {
  const raw = await ctx.kv.get<Record<string, unknown>>("settings:all");
  return {
    defaultQuality: typeof raw?.defaultQuality === "number" ? raw.defaultQuality : DEFAULT_SETTINGS.defaultQuality,
    defaultFormat: typeof raw?.defaultFormat === "string" ? raw.defaultFormat : DEFAULT_SETTINGS.defaultFormat,
  };
}

interface ConversionRecord {
  storageKey: string;
  format: string;
  width: number;
  size: number;
  mtimeMs: number;
}

export default definePlugin({
  hooks: {
    "media:afterUpload": {
      handler: async (event: any, ctx: PluginContext) => {
        const { media } = event;
        if (!media?.mimeType?.startsWith("image/")) return;

        const settings = await getSettings(ctx);
        const storageKey = media.id;
        ctx.log.info(`ModernImages: converting ${media.filename}`);

        const widths = [640, 960, 1200];
        const formats = settings.defaultFormat === "avif" ? ["avif", "webp"] as const : ["webp", "avif"] as const;
        for (const format of formats) {
          for (const width of widths) {
            try {
              const result = await convertImage({ storageKey, format, width, quality: settings.defaultQuality });
              await saveToCache(result);
              await ctx.storage.conversions.put(`${storageKey}:${format}:${width}`, {
                storageKey,
                format,
                width,
                size: result.size,
                mtimeMs: result.mtimeMs,
              } satisfies ConversionRecord);
            } catch (err) {
              ctx.log.warn(`  Failed ${format} ${width}w for ${media.filename}: ${(err as Error).message}`);
            }
          }
        }
      },
    },

    "plugin:install": {
      handler: async (_event: unknown, ctx: PluginContext) => {
        await ctx.kv.set("settings:all", DEFAULT_SETTINGS);
        ctx.log.info("ModernImages plugin installed");
      },
    },
  },

  routes: {
    admin: {
      handler: async (routeCtx: { input: Record<string, unknown>; request: Request }, ctx: PluginContext) => {
        const interaction = routeCtx.input as Record<string, any>;
        const type = interaction?.type ?? "";

        if (type === "form_submit" && interaction.action_id === "save_settings") {
          try {
            const v = interaction.values ?? {};
            const rawFormat = v.default_format || "webp";
            if (!SUPPORTED_FORMATS.includes(rawFormat)) {
              throw new Error(`Unsupported format "${rawFormat}". Use one of: ${SUPPORTED_FORMATS.join(", ")}`);
            }
            const updated: Settings = {
              defaultQuality: Math.max(30, Math.min(95, parseInt(v.default_quality) || 78)),
              defaultFormat: rawFormat,
            };
            await ctx.kv.set("settings:all", updated);
            return { blocks: dashboardBlocks(updated), toast: { message: "Settings saved", type: "success" } };
          } catch {
            return { blocks: dashboardBlocks(await getSettings(ctx)), toast: { message: "Failed to save settings", type: "error" } };
          }
        }

        return { blocks: dashboardBlocks(await getSettings(ctx)) };
      },
    },

  },
});

function dashboardBlocks(settings: Settings) {
  return [
    { type: "header", text: "Modern Images" },
    { type: "context", text: "Converts uploaded images to WebP/AVIF." },
    { type: "divider" },
    {
      type: "form",
      block_id: "settings",
      fields: [
        {
          type: "select", action_id: "default_format", label: "Default format",
          initial_value: settings.defaultFormat,
          options: [
            { value: "webp", label: "WebP" },
            { value: "avif", label: "AVIF" },
          ],
        },
        {
          type: "number_input", action_id: "default_quality", label: "Quality (30-95)",
          initial_value: settings.defaultQuality, min: 30, max: 95,
        },
      ],
      submit: { label: "Save", action_id: "save_settings" },
    },
  ];
}
