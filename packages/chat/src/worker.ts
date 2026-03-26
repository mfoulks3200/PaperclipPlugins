import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import { registerChatSendAction } from "./handlers/chat-send.js";
import { registerChatHistoryProvider } from "./handlers/chat-history.js";
import { registerConversationsListProvider } from "./handlers/conversations-list.js";
import { registerChatStream } from "./handlers/stream.js";
import { registerEventHandlers } from "./handlers/events.js";

const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info("Chat plugin starting");

    // Action handlers
    registerChatSendAction(ctx);

    // Data providers
    registerChatHistoryProvider(ctx);
    registerConversationsListProvider(ctx);

    // Set up the real-time SSE stream channel (before event handlers that push to it)
    const chatStream = registerChatStream(ctx);

    // Register event handlers that bridge domain events to the stream
    registerEventHandlers(ctx, chatStream);

    ctx.logger.info("Chat plugin ready");
  },

  async onConfigChanged(_newConfig) {
    // Config updates handled without worker restart
  },

  async onShutdown() {
    // Cleanup handled by host process teardown
  },
});

export default plugin;

runWorker(plugin, import.meta.url);
