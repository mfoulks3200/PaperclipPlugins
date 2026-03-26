import { createPluginBundlerPresets } from "@paperclipai/plugin-sdk/bundlers";
import { build } from "esbuild";

const presets = createPluginBundlerPresets({
  manifest: "src/manifest.ts",
  worker: "src/worker.ts",
  ui: "src/ui/index.tsx",
});

await Promise.all(presets.map((preset) => build(preset)));
