/**
 * chat.history data provider — returns paginated message history
 * for a given conversation from company-scoped state.
 */

import type { PluginContext } from "@paperclipai/plugin-sdk";

export function registerChatHistoryProvider(ctx: PluginContext): void {
  ctx.data.register("chat.history", async (params) => {
    const conversationId = params.conversationId as string | undefined;
    const limit = (params.limit as number) ?? 50;
    const before = params.before as string | undefined;
    const companyId = (params.companyId as string) ?? "default";

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    const all = ((await ctx.state.get({
      scopeKind: "company",
      scopeId: companyId,
      stateKey: `messages:${conversationId}`,
    })) ?? []) as StoredMessage[];

    let sliceEnd = all.length;
    if (before) {
      const idx = all.findIndex((m) => m.id === before);
      if (idx >= 0) sliceEnd = idx;
    }

    const sliceStart = Math.max(0, sliceEnd - limit);
    const page = all.slice(sliceStart, sliceEnd);

    return {
      messages: page.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        sender: m.senderType,
        content: m.content,
        status: m.status ?? "delivered",
        timestamp: m.timestamp,
      })),
      hasMore: sliceStart > 0,
    };
  });
}

interface StoredMessage {
  id: string;
  conversationId: string;
  sender: string;
  senderType: "user" | "agent";
  content: string;
  status?: string;
  timestamp: string;
}
