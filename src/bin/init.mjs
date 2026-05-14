#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { createInterface } from "readline";

const root = process.cwd();
const srcDir = resolve(root, "src");
const middlewarePath = resolve(srcDir, "middleware.ts");
const configPath = resolve(root, "astro.config.mjs");

const PLUGIN_IMPORT = 'import { modernImagesPlugin } from "emdash-plugin-modern-images";';
const PLUGIN_ENTRY = "modernImagesPlugin()";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

async function main() {
  console.log("\n  \x1b[1m📸 emdash-plugin-modern-images — setup\x1b[0m\n");

  // 1. Middleware
  const needsMiddleware = !existsSync(middlewarePath);
  if (needsMiddleware) {
    const ans = await ask("  Create src/middleware.ts? (Y/n) ");
    if (ans.toLowerCase() !== "n") {
      mkdirSync(srcDir, { recursive: true });
      writeFileSync(middlewarePath, `export { onRequest } from "emdash-plugin-modern-images/astro/middleware";\n`);
      console.log("  \x1b[32m✔\x1b[0m Created src/middleware.ts");
    }
  } else {
    console.log("  \x1b[32m✔\x1b[0m src/middleware.ts already exists");
  }

  // 2. Config check
  if (existsSync(configPath)) {
    const config = readFileSync(configPath, "utf-8");
    const hasPlugin = config.includes(PLUGIN_IMPORT) || config.includes(PLUGIN_ENTRY);

    if (!hasPlugin) {
      console.log("\n  \x1b[33m⚠\x1b[0m Add the plugin to astro.config.mjs:\n");
      console.log(
        [
          '  import { modernImagesPlugin } from "emdash-plugin-modern-images";',
          "",
          "  export default defineConfig({",
          "    integrations: [",
          "      emdash({",
          "        plugins: [",
          "          modernImagesPlugin(),",
          "          // ...",
          "        ],",
          "      }),",
          "    ],",
          "  });",
        ]
          .map((l) => "    " + l)
          .join("\n"),
      );
      console.log();
    } else {
      console.log("  \x1b[32m✔\x1b[0m Plugin already registered in astro.config.mjs");
    }
  } else {
    console.log("\n  \x1b[33m⚠\x1b[0m No astro.config.mjs found. Add the plugin to your EmDash config:\n");
    console.log('    import { modernImagesPlugin } from "emdash-plugin-modern-images";');
    console.log("    plugins: [modernImagesPlugin()],\n");
  }

  // 3. Summary
  console.log("  \x1b[1mNext steps\x1b[0m");
  console.log("  • Import ModernImage in your templates:");
  console.log('    import ModernImage from "emdash-plugin-modern-images/astro/ModernImage";');
  console.log('    <ModernImage image={entry.data.featured_image} />');
  console.log("  • Manage settings at /_emdash/admin → Modern Images");
  console.log("  • See README for all props and options\n");

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
