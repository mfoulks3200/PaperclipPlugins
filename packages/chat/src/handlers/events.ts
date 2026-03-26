import type { PluginContext, PluginEvent } from "@paperclipai/plugin-sdk";
import type { ChatStream } from "./stream.js";
import type {
  AgentResponseEvent,
  AgentStatusEvent,
  StreamMessage,
  StreamStatusChange,
  StreamTypingIndicator,
} from "../types.js";

/**
 * Registers event handlers that bridge Paperclip domain events
 * into the chat.stream SSE channel.
 */
export function registerEventHandlers(ctx: PluginContext, chatStream: ChatStream): void {
  // --- agent.response: an agent sent a reply to a conversation ---
  // Uses plugin-namespaced event since agent.response is not a core event type.
  // The host (or another plugin) emits this when an agent produces a chat reply.
  ctx.events.on("plugin.paperclip-chat.agent-response", async (event: PluginEvent) => {
    const { agentId, conversationId, messageId, content } =
      event.payload as AgentResponseEvent;

    ctx.logger.info("Received agent.response", { agentId, conversationId });

    const now = new Date().toISOString();

    // Persist the message to state so chat.history can serve it later
    const existing = (await ctx.state.get({
      scopeKind: "company",
      scopeId: event.companyId,
      stateKey: `messages:${conversationId}`,
    })) as StoredMessage[] | null;

    const messages = existing ?? [];
    const newMessage: StoredMessage = {
      id: messageId,
      conversationId,
      sender: agentId,
      senderType: "agent",
      content,
      timestamp: now,
    };
    messages.push(newMessage);

    await ctx.state.set(
      {
        scopeKind: "company",
        scopeId: event.companyId,
        stateKey: `messages:${conversationId}`,
      },
      messages,
    );

    // Push message to live stream
    const streamEvent: StreamMessage = {
      type: "message",
      conversationId,
      messageId,
      agentId,
      content,
      timestamp: now,
    };
    chatStream.emit(streamEvent);

    // Clear typing indicator for this agent
    const typingEvent: StreamTypingIndicator = {
      type: "typing",
      conversationId,
      agentId,
      isTyping: false,
      timestamp: new Date().toISOString(),
    };
    chatStream.emit(typingEvent);
  });

  // --- agent.status: an agent's availability changed ---
  // agent.status_changed is a core event; we listen for it directly.
  ctx.events.on("agent.status_changed", async (event: PluginEvent) => {
    const { agentId, status } = event.payload as AgentStatusEvent;

    ctx.logger.info("Received agent.status", { agentId, status });

    // Update cached agent status
    await ctx.state.set(
      {
        scopeKind: "company",
        scopeId: event.companyId,
        stateKey: `agent-status:${agentId}`,
      },
      { status, updatedAt: new Date().toISOString() },
    );

    // Push to live stream
    const streamEvent: StreamStatusChange = {
      type: "status",
      agentId,
      status,
      timestamp: new Date().toISOString(),
    };
    chatStream.emit(streamEvent);
  });
}

/** Shape of a persisted message in the state store. */
interface StoredMessage {
  id: string;
  conversationId: string;
  sender: string;
  senderType: "user" | "agent";
  content: string;
  timestamp: string;
}
