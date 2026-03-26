# @paperclipai/plugin-chat

Sidebar chat plugin for direct agent messaging in Paperclip. Send messages to agents, view conversation history, and receive real-time responses — all without creating an issue first.

## Features

- **Direct messaging** — Start conversations with any Paperclip agent
- **Conversation history** — Paginated message history with persistent storage
- **Real-time updates** — Live agent responses and status changes via SSE stream
- **Agent status** — See when agents are online, busy, idle, or offline
- **Configurable retention** — Control how long conversation history is kept

## Installation

```bash
npx paperclipai plugin install ./packages/chat
```

The installer reads the manifest, prompts for capability approval, and starts the worker.

## Configuration

The plugin accepts the following configuration options:

| Option                 | Type     | Default | Description                                     |
| ---------------------- | -------- | ------- | ----------------------------------------------- |
| `defaultAgentId`       | `string` | —       | Agent to pre-select when starting a new chat     |
| `historyRetentionDays` | `number` | `30`    | Number of days to retain conversation history    |

Configuration is set by the instance operator through the Paperclip plugin settings UI.

## Architecture

The plugin follows the standard Paperclip plugin structure with three entry points:

```
packages/chat/
  src/
    manifest.ts              # Plugin identity, capabilities, config schema
    worker.ts                # Lifecycle hooks and handler registration
    types.ts                 # Shared TypeScript interfaces
    handlers/
      chat-send.ts           # chat.send action — routes messages to agents
      chat-history.ts        # chat.history data provider — paginated history
      conversations-list.ts  # conversations.list data provider — conversation index
      stream.ts              # chat.stream SSE channel — real-time events
      events.ts              # Domain event handlers (agent.response, agent.status)
    ui/
      index.tsx              # React sidebar component
  tests/
    worker.test.ts           # Worker unit tests
  build.mjs                  # esbuild bundler config (SDK presets)
  tsconfig.json
  package.json
```

### Capabilities

The plugin requests these host capabilities:

| Capability            | Purpose                                                 |
| --------------------- | ------------------------------------------------------- |
| `events.subscribe`    | Listen for `agent.response` and `agent.status` events   |
| `events.emit`         | Emit chat events for other plugins (stretch goal)       |
| `http.outbound`       | Route messages to agents via the Paperclip API          |
| `plugin.state.read`   | Read conversation history from the state store          |
| `plugin.state.write`  | Persist messages and conversation indexes               |

### Data Flow

```
User sends message
  → UI calls usePluginAction("chat.send").execute({ agentId, message })
  → Worker persists message, POSTs to /api/agents/{agentId}/messages
  → Agent processes and responds
  → Host emits agent.response event
  → Worker persists response, pushes to chat.stream
  → UI receives update via usePluginStream("chat.stream")
  → Message thread re-renders
```

### State Store Keys

All state is scoped to the `company` level:

| Key Pattern                  | Content                                           |
| ---------------------------- | ------------------------------------------------- |
| `conversations`              | Conversation index (sorted by last activity)      |
| `messages:{conversationId}`  | Ordered message array for a conversation          |
| `agent-status:{agentId}`     | Cached agent availability status                  |

## Worker API

### Actions

#### `chat.send`

Send a message to an agent.

**Payload:**

```typescript
{
  agentId: string;         // Target agent ID
  message: string;         // Message content
  conversationId?: string; // Omit to start a new conversation
}
```

**Result:**

```typescript
{
  conversationId: string;  // Conversation the message belongs to
  messageId: string;       // ID of the sent message
}
```

### Data Providers

#### `chat.history`

Fetch paginated message history for a conversation.

**Params:**

```typescript
{
  conversationId: string;  // Required
  limit?: number;          // Max messages per page (default: 50)
  before?: string;         // Message ID cursor for pagination
}
```

**Result:**

```typescript
{
  messages: Message[];     // Page of messages
  hasMore: boolean;        // Whether older messages exist
}
```

#### `conversations.list`

Fetch the conversation index, sorted by most recent activity.

**Params:**

```typescript
{
  limit?: number;          // Max conversations (default: 50)
  offset?: number;         // Pagination offset (default: 0)
}
```

**Result:**

```typescript
{
  conversations: Conversation[];
}
```

### Stream Channel

#### `chat.stream`

SSE channel that pushes real-time events to the UI. Subscribe in React with `usePluginStream("chat.stream")`.

**Event types:**

| Type       | Description                  | Key Fields                                  |
| ---------- | ---------------------------- | ------------------------------------------- |
| `message`  | New message arrived          | `conversationId`, `messageId`, `content`    |
| `status`   | Agent status changed         | `agentId`, `status`                         |
| `typing`   | Agent typing indicator       | `conversationId`, `agentId`, `isTyping`     |

## UI Integration

The plugin renders into the `sidebar` slot. Use these SDK hooks in custom UI components:

```tsx
import {
  usePluginData,
  usePluginAction,
  usePluginStream,
  useHostContext,
} from "@paperclipai/plugin-sdk/ui";

// Fetch conversation list
const { data: convos } = usePluginData("conversations.list", { limit: 50 });

// Fetch message history
const { data: history } = usePluginData("chat.history", { conversationId });

// Send a message
const sendAction = usePluginAction("chat.send");
await sendAction.execute({ agentId: "agent-1", message: "Hello" });

// Subscribe to real-time events
usePluginStream("chat.stream", (event) => {
  if (event.type === "message") {
    // Handle new message
  }
});

// Access host theme tokens
const { theme } = useHostContext();
```

## Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start local dev server with hot reload
pnpm --filter @paperclipai/plugin-chat dev

# Type-check
pnpm --filter @paperclipai/plugin-chat typecheck

# Run tests
pnpm --filter @paperclipai/plugin-chat test

# Build for production
pnpm --filter @paperclipai/plugin-chat build
```

### Running Tests

Tests use `vitest` with the SDK test harness:

```bash
pnpm --filter @paperclipai/plugin-chat test
```

The test harness (`createTestHarness`) provides:
- `harness.emit(event, payload, context)` — simulate domain events
- `harness.getState(scope)` — inspect persisted state
- `harness.logs` — captured log entries for assertions

### Extending the Plugin

To add a new handler:

1. Create a new file in `src/handlers/` following the existing pattern
2. Define your types in `src/types.ts`
3. Register the handler in `src/worker.ts` within the `setup()` hook
4. Add tests in `tests/`
5. Run `pnpm build` to verify the bundle

## Types Reference

Key interfaces exported from `src/types.ts`:

| Type                      | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `Conversation`            | Chat thread metadata (agent, last message)     |
| `Message`                 | Individual message (sender, content, status)   |
| `ConversationIndex`       | Container for conversation list                |
| `MessageHistory`          | Paginated message result set                   |
| `ChatSendPayload`         | Input for `chat.send` action                   |
| `ChatSendResult`          | Output from `chat.send` action                 |
| `ChatHistoryParams`       | Params for `chat.history` data provider        |
| `ConversationsListParams` | Params for `conversations.list` data provider  |
| `StreamEvent`             | Union of all real-time stream event types      |
| `AgentStatus`             | `"online" \| "busy" \| "idle" \| "offline"`    |

## License

See root [LICENSE](../../LICENSE) for details.
