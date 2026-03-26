import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

const manifest: PaperclipPluginManifestV1 = {
  id: "paperclip-chat",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Chat",
  description: "Direct agent messaging sidebar for Paperclip",
  author: "PaperclipPlugins",
  categories: ["ui"],
  capabilities: [
    "events.subscribe",
    "events.emit",
    "http.outbound",
    "plugin.state.read",
    "plugin.state.write",
    "ui.sidebar.register",
  ],
  entrypoints: {
    worker: "dist/worker.js",
    ui: "dist/ui.js",
  },
  ui: {
    slots: [
      {
        type: "sidebar",
        id: "chat-sidebar",
        displayName: "Chat",
        exportName: "default",
      },
    ],
  },
  instanceConfigSchema: {
    type: "object",
    properties: {
      defaultAgentId: {
        type: "string",
        description: "Default agent to start conversations with",
      },
      historyRetentionDays: {
        type: "number",
        description: "Number of days to retain conversation history",
        default: 30,
      },
    },
  },
};

export default manifest;
