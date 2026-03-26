import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { StreamEvent } from "../types.js";

/**
 * Manages the chat.stream SSE channel.
 *
 * The stream pushes three event types to connected UI clients:
 * - "message"  — new agent response arrived
 * - "status"   — agent online/busy/idle status changed
 * - "typing"   — agent started/stopped typing (stretch goal)
 *
 * Workers push events via `chatStream.emit(event)`.
 * UI subscribes via `usePluginStream("chat.stream")`.
 */
export interface ChatStream {
  emit(event: StreamEvent): void;
  open(companyId: string): void;
  close(): void;
}

const CHANNEL = "chat.stream";

export function registerChatStream(ctx: PluginContext): ChatStream {
  return {
    open(companyId: string) {
      ctx.streams.open(CHANNEL, companyId);
      ctx.logger.info("chat.stream opened", { companyId });
    },

    emit(event: StreamEvent) {
      ctx.logger.debug("chat.stream emit", { eventType: event.type });
      ctx.streams.emit(CHANNEL, event);
    },

    close() {
      ctx.streams.close(CHANNEL);
      ctx.logger.info("chat.stream closed");
    },
  };
}
