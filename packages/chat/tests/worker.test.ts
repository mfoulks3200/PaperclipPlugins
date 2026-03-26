import { describe, it, expect, beforeEach } from "vitest";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import type { TestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest from "../src/manifest.js";
import plugin from "../src/worker.js";

const COMPANY_ID = "test-company-1";

describe("chat worker", () => {
  let harness: TestHarness;

  beforeEach(async () => {
    harness = createTestHarness({ manifest });
    await plugin.definition.setup(harness.ctx);
  });

  describe("chat.send action handler", () => {
    it("should create a conversation and persist the user message", async () => {
      const result = (await harness.performAction("chat.send", {
        agentId: "agent-1",
        message: "Hello agent",
        companyId: COMPANY_ID,
      })) as { conversationId: string; messageId: string };

      expect(result).toHaveProperty("conversationId");
      expect(result).toHaveProperty("messageId");

      // Verify conversation was created in state
      const convIndex = harness.getState({
        scopeKind: "company",
        scopeId: COMPANY_ID,
        stateKey: "conversations",
      }) as { conversations: Array<{ id: string; agentId: string }> };

      expect(convIndex).toBeDefined();
      expect(convIndex.conversations).toHaveLength(1);
      expect(convIndex.conversations[0].agentId).toBe("agent-1");

      // Verify message was persisted
      const messages = harness.getState({
        scopeKind: "company",
        scopeId: COMPANY_ID,
        stateKey: `messages:${result.conversationId}`,
      }) as Array<{ content: string; senderType: string }>;

      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe("Hello agent");
      expect(messages[0].senderType).toBe("user");
    });

    it("should append to an existing conversation", async () => {
      const first = (await harness.performAction("chat.send", {
        agentId: "agent-1",
        message: "First message",
        companyId: COMPANY_ID,
      })) as { conversationId: string };

      await harness.performAction("chat.send", {
        agentId: "agent-1",
        message: "Second message",
        conversationId: first.conversationId,
        companyId: COMPANY_ID,
      });

      const messages = harness.getState({
        scopeKind: "company",
        scopeId: COMPANY_ID,
        stateKey: `messages:${first.conversationId}`,
      }) as Array<{ content: string }>;

      expect(messages).toHaveLength(2);
      expect(messages[1].content).toBe("Second message");
    });

    it("should reject missing agentId or message", async () => {
      await expect(
        harness.performAction("chat.send", {
          agentId: "",
          message: "hello",
          companyId: COMPANY_ID,
        }),
      ).rejects.toThrow("agentId and message are required");

      await expect(
        harness.performAction("chat.send", { agentId: "a1", message: "", companyId: COMPANY_ID }),
      ).rejects.toThrow("agentId and message are required");
    });
  });

  describe("chat.history data provider", () => {
    it("should return paginated message history", async () => {
      const convId = "test-conv-1";

      // Seed state by setting messages via ctx.state directly
      await harness.ctx.state.set(
        { scopeKind: "company", scopeId: COMPANY_ID, stateKey: `messages:${convId}` },
        Array.from({ length: 5 }, (_, i) => ({
          id: `msg-${i}`,
          conversationId: convId,
          sender: "user",
          senderType: "user",
          content: `Message ${i}`,
          status: "sent",
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        })),
      );

      const result = (await harness.getData("chat.history", {
        conversationId: convId,
        limit: 3,
        companyId: COMPANY_ID,
      })) as { messages: unknown[]; hasMore: boolean };

      expect(result.messages).toHaveLength(3);
      expect(result.hasMore).toBe(true);
    });

    it("should reject missing conversationId", async () => {
      await expect(harness.getData("chat.history", { companyId: COMPANY_ID })).rejects.toThrow(
        "conversationId is required",
      );
    });
  });

  describe("conversations.list data provider", () => {
    it("should return conversations sorted by most recent", async () => {
      await harness.ctx.state.set(
        { scopeKind: "company", scopeId: COMPANY_ID, stateKey: "conversations" },
        {
          conversations: [
            {
              id: "old",
              agentId: "a1",
              agentName: "Agent One",
              lastMessage: "old msg",
              lastMessageAt: "2025-01-01T00:00:00Z",
              unreadCount: 0,
              createdAt: "2025-01-01T00:00:00Z",
            },
            {
              id: "new",
              agentId: "a2",
              agentName: "Agent Two",
              lastMessage: "new msg",
              lastMessageAt: "2025-06-01T00:00:00Z",
              unreadCount: 1,
              createdAt: "2025-06-01T00:00:00Z",
            },
          ],
        },
      );

      const result = (await harness.getData("conversations.list", {
        companyId: COMPANY_ID,
      })) as { conversations: Array<{ id: string }> };

      expect(result.conversations).toHaveLength(2);
      expect(result.conversations[0].id).toBe("new");
      expect(result.conversations[1].id).toBe("old");
    });

    it("should support pagination", async () => {
      await harness.ctx.state.set(
        { scopeKind: "company", scopeId: COMPANY_ID, stateKey: "conversations" },
        {
          conversations: Array.from({ length: 5 }, (_, i) => ({
            id: `conv-${i}`,
            agentId: `agent-${i}`,
            agentName: `Agent ${i}`,
            lastMessage: `msg ${i}`,
            lastMessageAt: new Date(Date.now() + i * 1000).toISOString(),
            unreadCount: 0,
            createdAt: new Date(Date.now() + i * 1000).toISOString(),
          })),
        },
      );

      const result = (await harness.getData("conversations.list", {
        limit: 2,
        offset: 1,
        companyId: COMPANY_ID,
      })) as { conversations: unknown[] };

      expect(result.conversations).toHaveLength(2);
    });
  });

  describe("agent.response event handler", () => {
    it("should persist message to state", async () => {
      await harness.emit(
        "plugin.paperclip-chat.agent-response",
        {
          agentId: "agent-1",
          conversationId: "conv-1",
          messageId: "msg-1",
          content: "Hello from the agent!",
        },
        { companyId: COMPANY_ID },
      );

      const messages = harness.getState({
        scopeKind: "company",
        scopeId: COMPANY_ID,
        stateKey: "messages:conv-1",
      }) as Array<{ id: string; content: string; senderType: string }>;

      expect(messages).toHaveLength(1);
      expect(messages[0]).toMatchObject({
        id: "msg-1",
        sender: "agent-1",
        senderType: "agent",
        content: "Hello from the agent!",
      });
    });

    it("should append to existing messages", async () => {
      await harness.emit(
        "plugin.paperclip-chat.agent-response",
        {
          agentId: "agent-1",
          conversationId: "conv-1",
          messageId: "msg-1",
          content: "First message",
        },
        { companyId: COMPANY_ID },
      );

      await harness.emit(
        "plugin.paperclip-chat.agent-response",
        {
          agentId: "agent-1",
          conversationId: "conv-1",
          messageId: "msg-2",
          content: "Second message",
        },
        { companyId: COMPANY_ID },
      );

      const messages = harness.getState({
        scopeKind: "company",
        scopeId: COMPANY_ID,
        stateKey: "messages:conv-1",
      }) as Array<{ id: string }>;

      expect(messages).toHaveLength(2);
      expect(messages[0].id).toBe("msg-1");
      expect(messages[1].id).toBe("msg-2");
    });

    it("should log the event", async () => {
      await harness.emit(
        "plugin.paperclip-chat.agent-response",
        {
          agentId: "agent-1",
          conversationId: "conv-1",
          messageId: "msg-1",
          content: "Hello",
        },
        { companyId: COMPANY_ID },
      );

      const logEntry = harness.logs.find((l) => l.message === "Received agent.response");
      expect(logEntry).toBeDefined();
      expect(logEntry!.meta).toMatchObject({
        agentId: "agent-1",
        conversationId: "conv-1",
      });
    });
  });

  describe("agent.status event handler", () => {
    it("should cache agent status in state", async () => {
      await harness.emit(
        "agent.status_changed",
        {
          agentId: "agent-1",
          status: "busy",
        },
        { companyId: COMPANY_ID },
      );

      const cached = harness.getState({
        scopeKind: "company",
        scopeId: COMPANY_ID,
        stateKey: "agent-status:agent-1",
      }) as { status: string };

      expect(cached).toMatchObject({ status: "busy" });
    });

    it("should log the event", async () => {
      await harness.emit(
        "agent.status_changed",
        {
          agentId: "agent-1",
          status: "idle",
        },
        { companyId: COMPANY_ID },
      );

      const logEntry = harness.logs.find((l) => l.message === "Received agent.status");
      expect(logEntry).toBeDefined();
      expect(logEntry!.meta).toMatchObject({
        agentId: "agent-1",
        status: "idle",
      });
    });
  });
});
