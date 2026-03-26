import { createPluginBundlerPresets } from "@paperclipai/plugin-sdk/bundlers";
import { build } from "esbuild";

const presets = createPluginBundlerPresets({
  manifest: "src/manifest.ts",
  worker: "src/worker.ts",
  ui: "src/ui/index.tsx",
});

const configs = Object.values(presets.esbuild).filter(Boolean);
await Promise.all(configs.map((config) => build(config)));
