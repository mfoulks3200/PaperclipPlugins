/**
 * chat.send action handler — accepts { agentId, message }, routes to
 * Paperclip agent API via ctx.http.fetch, persists the user message
 * and creates a conversation if needed.
 */

import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { Conversation } from "../types.js";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function registerChatSendAction(ctx: PluginContext): void {
  ctx.actions.register("chat.send", async (params) => {
    const agentId = params.agentId as string | undefined;
    const message = params.message as string | undefined;
    const existingConvId = params.conversationId as string | undefined;

    if (!agentId || !message) {
      throw new Error("agentId and message are required");
    }

    // TODO: derive companyId from host context when available
    const companyId = (params.companyId as string) ?? "default";
    const now = new Date().toISOString();
    const conversationId = existingConvId ?? generateId();
    const messageId = generateId();

    // Ensure conversation exists
    const existingIndex = ((await ctx.state.get({
      scopeKind: "company",
      scopeId: companyId,
      stateKey: "conversations",
    })) ?? { conversations: [] }) as ConversationIndex;

    const existingConv = existingIndex.conversations.find((c) => c.id === conversationId);

    if (!existingConv) {
      const conversation: Conversation = {
        id: conversationId,
        agentId,
        agentName: agentId,
        lastMessage: message,
        lastMessageAt: now,
        unreadCount: 0,
        createdAt: now,
      };
      existingIndex.conversations.unshift(conversation);
      await ctx.state.set(
        { scopeKind: "company", scopeId: companyId, stateKey: "conversations" },
        existingIndex,
      );
    }

    // Persist user message
    const messagesKey = `messages:${conversationId}`;
    const messages = ((await ctx.state.get({
      scopeKind: "company",
      scopeId: companyId,
      stateKey: messagesKey,
    })) ?? []) as StoredMessage[];

    const userMessage: StoredMessage = {
      id: messageId,
      conversationId,
      sender: "user",
      senderType: "user",
      content: message,
      status: "sending",
      timestamp: now,
    };
    messages.push(userMessage);
    await ctx.state.set(
      { scopeKind: "company", scopeId: companyId, stateKey: messagesKey },
      messages,
    );

    // Route to Paperclip agent API
    try {
      const response = await ctx.http.fetch(`/api/agents/${agentId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, messageId, content: message }),
      });

      if (!response.ok) {
        throw new Error(`Agent API returned ${response.status}`);
      }

      // Mark message as sent
      const msg = messages.find((m) => m.id === messageId);
      if (msg) {
        msg.status = "sent";
        await ctx.state.set(
          { scopeKind: "company", scopeId: companyId, stateKey: messagesKey },
          messages,
        );
      }

      ctx.logger.info("Message sent", { conversationId, messageId, agentId });
    } catch (err) {
      // Mark message as failed but don't throw — the message is persisted
      const msg = messages.find((m) => m.id === messageId);
      if (msg) {
        msg.status = "failed";
        await ctx.state.set(
          { scopeKind: "company", scopeId: companyId, stateKey: messagesKey },
          messages,
        );
      }
      ctx.logger.error("Failed to send message to agent", {
        conversationId,
        messageId,
        error: String(err),
      });
    }

    // Update conversation summary
    const latestIndex = ((await ctx.state.get({
      scopeKind: "company",
      scopeId: companyId,
      stateKey: "conversations",
    })) ?? { conversations: [] }) as ConversationIndex;

    const conv = latestIndex.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessage = message;
      conv.lastMessageAt = now;
      await ctx.state.set(
        { scopeKind: "company", scopeId: companyId, stateKey: "conversations" },
        latestIndex,
      );
    }

    return { conversationId, messageId };
  });
}

interface StoredMessage {
  id: string;
  conversationId: string;
  sender: string;
  senderType: "user" | "agent";
  content: string;
  status?: "sending" | "sent" | "delivered" | "failed";
  timestamp: string;
}

interface ConversationIndex {
  conversations: Conversation[];
}
