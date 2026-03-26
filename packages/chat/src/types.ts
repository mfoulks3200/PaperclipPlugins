/** Core types for the chat plugin state and messaging. */

export interface Conversation {
  id: string;
  agentId: string;
  agentName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: "user" | "agent";
  content: string;
  status: "sending" | "sent" | "delivered" | "failed";
  timestamp: string;
}

export interface ConversationIndex {
  conversations: Conversation[];
}

export interface MessageHistory {
  messages: Message[];
  hasMore: boolean;
}

/** Payload for the chat.send action. */
export interface ChatSendPayload {
  agentId: string;
  message: string;
  conversationId?: string;
}

/** Result from the chat.send action. */
export interface ChatSendResult {
  conversationId: string;
  messageId: string;
}

/** Params for the chat.history data provider. */
export interface ChatHistoryParams {
  conversationId: string;
  limit?: number;
  before?: string;
}

/** Params for the conversations.list data provider. */
export interface ConversationsListParams {
  limit?: number;
  offset?: number;
}

/**
 * Stream event types pushed to UI via the chat.stream SSE channel.
 */

export interface StreamMessage {
  type: "message";
  conversationId: string;
  messageId: string;
  agentId: string;
  content: string;
  timestamp: string;
}

export interface StreamStatusChange {
  type: "status";
  agentId: string;
  status: AgentStatus;
  timestamp: string;
}

export interface StreamTypingIndicator {
  type: "typing";
  conversationId: string;
  agentId: string;
  isTyping: boolean;
  timestamp: string;
}

export type StreamEvent = StreamMessage | StreamStatusChange | StreamTypingIndicator;

export type AgentStatus = "online" | "busy" | "idle" | "offline";

export interface AgentResponseEvent {
  agentId: string;
  conversationId: string;
  messageId: string;
  content: string;
}

export interface AgentStatusEvent {
  agentId: string;
  status: AgentStatus;
}
