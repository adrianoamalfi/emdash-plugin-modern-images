import type { SandboxedPlugin, PluginContext } from "emdash/plugin";
import {
  DEFAULT_SETTINGS,
  OUTPUT_FORMATS,
  SETTINGS_KEY,
  clampQuality,
  normalizeSettings,
  type ModernImagesSettings,
} from "./lib/settings";

async function getSettings(ctx: PluginContext): Promise<ModernImagesSettings> {
  return normalizeSettings(await ctx.kv.get<Record<string, unknown>>(SETTINGS_KEY));
}

export default {
  hooks: {
    "plugin:install": {
      handler: async (_event, ctx) => {
        await ctx.kv.set(SETTINGS_KEY, DEFAULT_SETTINGS);
        ctx.log.info("ModernImages plugin installed");
      },
    },
  },

  routes: {
    admin: {
      handler: async (routeCtx, ctx) => {
        const interaction = routeCtx.input as Record<string, any>;
        const type = interaction?.type ?? "";

        if (type === "form_submit" && interaction.action_id === "save_settings") {
          try {
            const v = interaction.values ?? {};
            const rawFormat = v.default_format || "webp";
            if (!OUTPUT_FORMATS.includes(rawFormat)) {
              throw new Error(`Unsupported format "${rawFormat}". Use one of: ${OUTPUT_FORMATS.join(", ")}`);
            }
            const updated: ModernImagesSettings = {
              defaultQuality: clampQuality(v.default_quality),
              defaultFormat: rawFormat,
            };
            await ctx.kv.set(SETTINGS_KEY, updated);
            return { blocks: dashboardBlocks(updated), toast: { message: "Settings saved", type: "success" } };
          } catch {
            return { blocks: dashboardBlocks(await getSettings(ctx)), toast: { message: "Failed to save settings", type: "error" } };
          }
        }

        return { blocks: dashboardBlocks(await getSettings(ctx)) };
      },
    },

  },
} satisfies SandboxedPlugin;

function dashboardBlocks(settings: ModernImagesSettings) {
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
