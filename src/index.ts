import type { PluginDescriptor } from "emdash";

export function modernImagesPlugin(): PluginDescriptor {
  return {
    id: "modern-images",
    version: "1.4.0",
    format: "standard",
    entrypoint: "emdash-plugin-modern-images/sandbox",
    capabilities: [],
    adminPages: [
      {
        path: "/settings",
        label: "Modern Images",
        icon: "image",
      },
    ],
  };
}
