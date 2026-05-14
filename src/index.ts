import type { PluginDescriptor } from "emdash";

export function modernImagesPlugin(): PluginDescriptor {
  return {
    id: "modern-images",
    version: "0.1.0",
    format: "standard",
    entrypoint: "emdash-plugin-modern-images/sandbox",
    options: {},
    capabilities: [
      "media:read",
      "media:write",
      "network:request:unrestricted",
    ],
    adminPages: [
      { path: "/settings", label: "Modern Images", icon: "image" },
    ],
    storage: {
      cache: {
        indexes: ["originalId", "format", "width"],
      },
    },
  };
}
