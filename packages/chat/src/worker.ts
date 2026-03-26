import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";

const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info("Chat plugin starting");

    // TODO: Register action handlers (chat.send, conversations.list)
    // TODO: Register data providers (chat.history)
    // TODO: Register event handlers (agent.response, agent.status)
    // TODO: Register stream channels (chat.stream)
  },

  async onConfigChanged(ctx, newConfig) {
    ctx.logger.info("Chat plugin config updated", { newConfig });
  },

  async onShutdown(ctx) {
    ctx.logger.info("Chat plugin shutting down");
  },
});

export default plugin;

runWorker(plugin);
