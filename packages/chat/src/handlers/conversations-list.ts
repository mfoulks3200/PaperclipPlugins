/**
 * conversations.list data provider — returns the conversation index
 * with optional pagination, sorted by most recent first.
 */

import type { PluginContext } from "@paperclipai/plugin-sdk";
import type { Conversation } from "../types.js";

export function registerConversationsListProvider(ctx: PluginContext): void {
  ctx.data.register("conversations.list", async (params) => {
    const limit = (params.limit as number) ?? 50;
    const offset = (params.offset as number) ?? 0;
    const companyId = (params.companyId as string) ?? "default";

    const stored = ((await ctx.state.get({
      scopeKind: "company",
      scopeId: companyId,
      stateKey: "conversations",
    })) ?? { conversations: [] }) as { conversations: Conversation[] };

    const sorted = [...stored.conversations].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );

    return {
      conversations: sorted.slice(offset, offset + limit),
    };
  });
}
