import React, { useState, useCallback, useMemo } from "react";
import {
  useHostContext,
  usePluginData,
  usePluginAction,
  usePluginStream,
} from "@paperclipai/plugin-sdk/ui";
import type {
  Conversation,
  Message,
  ConversationIndex,
  MessageHistory,
  StreamEvent,
  AgentStatus,
} from "../types.js";
import { ConversationList } from "./ConversationList.js";
import { MessageThread } from "./MessageThread.js";
import { MessageInput } from "./MessageInput.js";
import { AgentPicker } from "./AgentPicker.js";
import type { AgentOption } from "./AgentPicker.js";
import { StatusIndicator } from "./StatusIndicator.js";
import { EmptyState } from "./EmptyState.js";

type View = "list" | "chat" | "picker";

export default function ChatSidebar() {
  useHostContext();
  const [view, setView] = useState<View>("list");
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [beforeCursor, setBeforeCursor] = useState<string | undefined>(undefined);

  // Data providers
  const conversationsResult = usePluginData<ConversationIndex>(
    "conversations.list",
    { limit: 50, offset: 0 },
  );

  const historyResult = usePluginData<MessageHistory>(
    "chat.history",
    activeConversation
      ? { conversationId: activeConversation.id, limit: 50, before: beforeCursor }
      : {},
  );

  // Action
  const sendAction = usePluginAction("chat.send");

  // Stream
  const stream = usePluginStream<StreamEvent>("chat.stream");

  // Derive agent statuses from stream events
  const agentStatuses = useMemo(() => {
    const statuses = new Map<string, AgentStatus>();
    for (const event of stream.events) {
      if (event.type === "status") {
        statuses.set(event.agentId, event.status);
      }
    }
    return statuses;
  }, [stream.events]);

  // Derive typing state for active conversation
  const typingAgentId = useMemo(() => {
    if (!activeConversation) return null;
    // Find the latest typing event for this conversation
    for (let i = stream.events.length - 1; i >= 0; i--) {
      const event = stream.events[i];
      if (
        event.type === "typing" &&
        event.conversationId === activeConversation.id
      ) {
        return event.isTyping ? event.agentId : null;
      }
    }
    return null;
  }, [stream.events, activeConversation]);

  // Merge server messages with stream messages and local optimistic messages
  const mergedMessages = useMemo(() => {
    const serverMessages = historyResult.data?.messages ?? [];
    const streamMessages: Message[] = [];

    for (const event of stream.events) {
      if (
        event.type === "message" &&
        activeConversation &&
        event.conversationId === activeConversation.id
      ) {
        streamMessages.push({
          id: event.messageId,
          conversationId: event.conversationId,
          sender: "agent",
          content: event.content,
          status: "delivered",
          timestamp: event.timestamp,
        });
      }
    }

    // Deduplicate by message ID
    const seen = new Set<string>();
    const all: Message[] = [];

    for (const msg of [...serverMessages, ...localMessages, ...streamMessages]) {
      if (!seen.has(msg.id)) {
        seen.add(msg.id);
        all.push(msg);
      }
    }

    all.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return all;
  }, [historyResult.data, stream.events, localMessages, activeConversation]);

  const conversations = conversationsResult.data?.conversations ?? [];

  // Handlers
  const handleSelectConversation = useCallback((conv: Conversation) => {
    setActiveConversation(conv);
    setLocalMessages([]);
    setBeforeCursor(undefined);
    setView("chat");
  }, []);

  const handleBack = useCallback(() => {
    setView("list");
    setActiveConversation(null);
    setLocalMessages([]);
    setBeforeCursor(undefined);
    conversationsResult.refresh();
  }, [conversationsResult]);

  const handleSend = useCallback(
    async (message: string) => {
      if (!activeConversation) return;

      const optimisticId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticMsg: Message = {
        id: optimisticId,
        conversationId: activeConversation.id,
        sender: "user",
        content: message,
        status: "sending",
        timestamp: new Date().toISOString(),
      };

      setLocalMessages((prev) => [...prev, optimisticMsg]);

      try {
        await sendAction({
          agentId: activeConversation.agentId,
          message,
          conversationId: activeConversation.id,
        });
        setLocalMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? { ...m, status: "sent" as const } : m,
          ),
        );
      } catch {
        setLocalMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? { ...m, status: "failed" as const } : m,
          ),
        );
      }
    },
    [activeConversation, sendAction],
  );

  const handleLoadMore = useCallback(() => {
    const msgs = historyResult.data?.messages;
    if (msgs && msgs.length > 0) {
      setBeforeCursor(msgs[0].id);
    }
  }, [historyResult.data]);

  const handleStartChat = useCallback(() => {
    setView("picker");
  }, []);

  const handleAgentSelected = useCallback(
    async (agent: AgentOption) => {
      // Create a new conversation by sending to the agent
      const tempConv: Conversation = {
        id: `new-${Date.now()}`,
        agentId: agent.id,
        agentName: agent.name,
        lastMessage: "",
        lastMessageAt: new Date().toISOString(),
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      };
      setActiveConversation(tempConv);
      setLocalMessages([]);
      setBeforeCursor(undefined);
      setView("chat");
    },
    [],
  );

  const handlePickerBack = useCallback(() => {
    if (conversations.length > 0) {
      setView("list");
    } else {
      setView("list");
    }
  }, [conversations.length]);

  // Mock agents from conversations for picker (host context would provide real list)
  const availableAgents = useMemo<AgentOption[]>(() => {
    const seen = new Set<string>();
    const agents: AgentOption[] = [];
    for (const conv of conversations) {
      if (!seen.has(conv.agentId)) {
        seen.add(conv.agentId);
        agents.push({
          id: conv.agentId,
          name: conv.agentName,
          title: "Agent",
          status: agentStatuses.get(conv.agentId) ?? "offline",
        });
      }
    }
    return agents;
  }, [conversations, agentStatuses]);

  // Render
  return (
    <div
      role="complementary"
      aria-label="Chat sidebar"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "var(--host-font-family)",
        backgroundColor: "var(--host-bg-primary)",
        color: "var(--host-text-primary)",
      }}
    >
      {view === "picker" && (
        <AgentPicker
          agents={availableAgents}
          onSelect={handleAgentSelected}
          onBack={handlePickerBack}
        />
      )}

      {view === "list" && (
        <>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--space-md) var(--space-lg)",
              borderBottom: "1px solid var(--host-border)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "var(--host-font-size-lg)",
                fontWeight: "var(--host-font-weight-bold)",
              }}
            >
              Chat
            </h2>
            <button
              onClick={handleStartChat}
              aria-label="New conversation"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                border: "none",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "transparent",
                color: "var(--host-text-primary)",
                cursor: "pointer",
                transition: "var(--transition-fast)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {conversationsResult.loading && conversations.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--host-text-secondary)",
                fontSize: "var(--host-font-size-base)",
              }}
            >
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState onStartChat={handleStartChat} />
          ) : (
            <ConversationList
              conversations={conversations}
              agentStatuses={agentStatuses}
              onSelect={handleSelectConversation}
            />
          )}
        </>
      )}

      {view === "chat" && activeConversation && (
        <>
          {/* Chat header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              padding: "var(--space-md) var(--space-lg)",
              borderBottom: "1px solid var(--host-border)",
              backgroundColor: "var(--host-bg-secondary)",
            }}
          >
            <button
              onClick={handleBack}
              aria-label="Back to conversations"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                border: "none",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "transparent",
                color: "var(--host-text-primary)",
                cursor: "pointer",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--host-bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "var(--host-font-size-sm)",
                fontWeight: "var(--host-font-weight-medium)",
                color: "var(--host-text-secondary)",
                flexShrink: 0,
              }}
            >
              {activeConversation.agentName.charAt(0).toUpperCase()}
            </div>

            <span
              style={{
                flex: 1,
                fontSize: "var(--host-font-size-base)",
                fontWeight: "var(--host-font-weight-medium)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeConversation.agentName}
            </span>

            <StatusIndicator
              status={agentStatuses.get(activeConversation.agentId) ?? "offline"}
            />
          </div>

          {/* Message thread */}
          <MessageThread
            messages={mergedMessages}
            hasMore={historyResult.data?.hasMore ?? false}
            loading={historyResult.loading}
            agentName={activeConversation.agentName}
            typingAgentId={typingAgentId}
            onLoadMore={handleLoadMore}
          />

          {/* Input */}
          <MessageInput onSend={handleSend} />
        </>
      )}
    </div>
  );
}
