import { defineManifest } from "@paperclipai/plugin-sdk";

export default defineManifest({
  id: "paperclip-chat",
  name: "Chat",
  version: "0.1.0",
  description: "Direct agent messaging sidebar for Paperclip",
  category: "ui",
  slots: ["sidebar"],
  capabilities: [
    "events.subscribe",
    "events.emit",
    "http.outbound",
    "plugin.state.read",
    "plugin.state.write",
  ],
  config: {
    schema: {
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
});
