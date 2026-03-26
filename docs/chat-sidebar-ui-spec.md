# Chat Sidebar UI — Component Specification

## 1. Component Hierarchy

```
ChatSidebar (root, fills sidebar slot)
├── SidebarHeader
│   ├── Title ("Chat")
│   └── NewConversationButton (icon button)
├── ViewRouter (switches between views)
│   ├── ConversationListView
│   │   ├── SearchBar (filter conversations)
│   │   └── ConversationList
│   │       └── ConversationItem (repeating)
│   │           ├── AgentAvatar + StatusDot
│   │           ├── ConversationMeta (agent name, timestamp)
│   │           └── LastMessagePreview (truncated)
│   ├── ActiveChatView
│   │   ├── ChatHeader
│   │   │   ├── BackButton (returns to list)
│   │   │   ├── AgentAvatar + AgentName
│   │   │   └── StatusIndicator (online/busy/idle)
│   │   ├── MessageThread (scrollable)
│   │   │   └── MessageBubble (repeating)
│   │   │       ├── SenderLabel (user or agent name)
│   │   │       ├── MessageContent (markdown-rendered)
│   │   │       ├── Timestamp
│   │   │       └── DeliveryStatus (sent/delivered/error)
│   │   └── MessageInput
│   │       ├── TextArea (auto-resize, max 6 lines)
│   │       ├── AgentPicker (inline selector, shown on new conversations)
│   │       └── SendButton (icon button)
│   ├── AgentPickerView (full-screen overlay for agent selection)
│   │   ├── PickerHeader ("Select Agent")
│   │   ├── AgentSearchInput
│   │   └── AgentList
│   │       └── AgentOption (repeating)
│   │           ├── AgentAvatar
│   │           ├── AgentName + Role
│   │           └── StatusIndicator
│   └── EmptyStateView
│       ├── Illustration (simple line art icon)
│       ├── Heading ("No conversations yet")
│       ├── Description ("Start a chat with any agent")
│       └── StartChatButton (CTA)
```

## 2. Wireframes

### 2.1 Empty State

```
┌──────────────────────────────┐
│  Chat                    [+] │  ← SidebarHeader
├──────────────────────────────┤
│                              │
│                              │
│          ┌──────┐            │
│          │ 💬   │            │  ← Illustration (chat icon)
│          └──────┘            │
│                              │
│    No conversations yet      │  ← Heading (--text-primary)
│                              │
│   Start a chat with any      │  ← Description (--text-secondary)
│   agent to get going.        │
│                              │
│      ┌────────────────┐      │
│      │  Start a Chat   │     │  ← Primary CTA button
│      └────────────────┘      │
│                              │
│                              │
└──────────────────────────────┘
```

### 2.2 Conversation List

```
┌──────────────────────────────┐
│  Chat                    [+] │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ 🔍 Search...           │  │  ← SearchBar
│  └────────────────────────┘  │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ 🟢 CTO                │  │  ← ConversationItem (active)
│  │ Deploy question...  2m │  │     highlighted bg
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🟡 Engineer            │  │  ← ConversationItem
│  │ PR is ready for... 1h │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ ⚫ QA Lead              │  │  ← ConversationItem (offline)
│  │ Tests passed on...  3d │  │
│  └────────────────────────┘  │
│                              │
│                              │
└──────────────────────────────┘
```

### 2.3 Active Chat

```
┌──────────────────────────────┐
│  [←]  CTO             🟢    │  ← ChatHeader
├──────────────────────────────┤
│                              │
│  ┌──────────────────────┐    │
│  │ You            10:32 │    │  ← User message (right-aligned)
│  │ Can we deploy the    │    │
│  │ chat plugin today?   │    │
│  └──────────────────────┘    │
│                              │
│    ┌──────────────────────┐  │
│    │ CTO           10:33  │  │  ← Agent message (left-aligned)
│    │ Yes, the PR passed   │  │
│    │ CI. I'll merge after │  │
│    │ the design review.   │  │
│    └──────────────────────┘  │
│                              │
│  ┌──────────────────────┐    │
│  │ You            10:34 │    │
│  │ Sounds good 👍       │    │
│  │                  ✓✓  │    │  ← DeliveryStatus
│  └──────────────────────┘    │
│                              │
├──────────────────────────────┤
│ ┌──────────────────────┐ [↑]│  ← MessageInput area
│ │ Type a message...    │    │
│ └──────────────────────┘    │
└──────────────────────────────┘
```

### 2.4 Agent Picker (Overlay)

```
┌──────────────────────────────┐
│  [←]  Select Agent           │  ← PickerHeader
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ 🔍 Search agents...    │  │
│  └────────────────────────┘  │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ 🟢  CEO                │  │
│  │     Chief Executive    │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🟢  CTO                │  │
│  │     Chief Technology   │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🟡  Engineer           │  │
│  │     Software Engineer  │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ ⚫  QA Lead             │  │
│  │     Quality Assurance  │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

## 3. Interaction Specs

### 3.1 Send Message

| Step | User Action | System Response |
|------|------------|-----------------|
| 1 | User types in `TextArea` | TextArea auto-resizes up to 6 lines, then scrolls internally |
| 2 | User presses Enter (or taps SendButton) | Message appended to thread with status `sending` |
| 3 | — | `usePluginAction("chat.send").execute({ agentId, message })` fires |
| 4 | — | On success: status changes to `sent` (single check). On error: status shows `error` with retry affordance |
| 5 | — | Agent response arrives via `usePluginStream("chat.stream")` and appends to thread with typing indicator |

- **Shift+Enter** inserts a newline (does not send).
- **SendButton** is disabled when TextArea is empty or whitespace-only.
- While an agent is responding, a pulsing "typing" indicator appears at the bottom of the thread.

### 3.2 Switch Conversation

| Step | User Action | System Response |
|------|------------|-----------------|
| 1 | User clicks a `ConversationItem` | ViewRouter transitions to `ActiveChatView` |
| 2 | — | `usePluginData("chat.history", { conversationId })` fetches message history |
| 3 | — | Thread scrolls to most recent message |
| 4 | User clicks `BackButton` | ViewRouter transitions back to `ConversationListView` |

- Transition uses a horizontal slide animation (list slides left, chat slides in from right; reverse on back).
- Duration: 200ms ease-out.

### 3.3 Select Agent (New Conversation)

| Step | User Action | System Response |
|------|------------|-----------------|
| 1 | User clicks `NewConversationButton` [+] | ViewRouter shows `AgentPickerView` overlay |
| 2 | User optionally types in `AgentSearchInput` | Agent list filters in real-time (client-side) |
| 3 | User clicks an `AgentOption` | New conversation created, ViewRouter transitions to `ActiveChatView` with selected agent |
| 4 | User clicks `BackButton` in picker | Returns to previous view without creating conversation |

### 3.4 Scroll History

| Behavior | Detail |
|----------|--------|
| Initial load | Show last 50 messages; scroll to bottom |
| Scroll up | When user scrolls to top, load previous 50 messages (paginated via `usePluginData`) |
| Loading indicator | Spinner at top of thread during history fetch |
| New message while scrolled up | "New message" pill appears at bottom; clicking it scrolls to latest |
| Auto-scroll | If user is within 1 message height of the bottom, auto-scroll on new messages |

## 4. Responsive Behavior

The sidebar slot has constrained width. The plugin must adapt gracefully.

| Constraint | Behavior |
|-----------|----------|
| **Min width** | 280px — below this, content truncates but remains usable |
| **Max width** | 400px — sidebar slot max; components fill available width |
| **Ideal width** | 320px — optimized layout target |
| **Height** | 100% of sidebar slot; internal scroll on `MessageThread` only |
| **Text truncation** | `ConversationItem` last message truncates with ellipsis at 2 lines max |
| **Agent names** | Truncate with ellipsis if longer than available space |
| **Message bubbles** | Max width 85% of thread width; long words use `overflow-wrap: break-word` |
| **Input area** | Fixed to bottom; TextArea fills width minus SendButton |

No breakpoints needed — the sidebar is always in a narrow, mobile-like form factor. All components use relative/flex sizing.

## 5. Accessibility

### 5.1 Keyboard Navigation

| Key | Context | Action |
|-----|---------|--------|
| `Tab` | Anywhere | Moves focus through interactive elements in DOM order |
| `Enter` | ConversationItem focused | Opens conversation |
| `Enter` | TextArea focused | Sends message |
| `Shift+Enter` | TextArea focused | Inserts newline |
| `Escape` | AgentPickerView | Closes picker, returns to previous view |
| `Escape` | SearchBar focused | Clears search and blurs |
| `Arrow Up/Down` | ConversationList / AgentList | Moves selection between items |
| `Home/End` | ConversationList / AgentList | Jump to first/last item |

### 5.2 Screen Reader Support

| Element | ARIA Attribute | Value |
|---------|---------------|-------|
| `ChatSidebar` | `role="complementary"`, `aria-label` | "Chat sidebar" |
| `ConversationList` | `role="listbox"`, `aria-label` | "Conversations" |
| `ConversationItem` | `role="option"`, `aria-selected` | true/false |
| `MessageThread` | `role="log"`, `aria-live="polite"` | — |
| `MessageBubble` | `aria-label` | "{Sender} at {time}: {message preview}" |
| `StatusIndicator` | `aria-label` | "Agent status: online/busy/idle" |
| `SendButton` | `aria-label` | "Send message" |
| `NewConversationButton` | `aria-label` | "New conversation" |
| `BackButton` | `aria-label` | "Back to conversations" |
| Typing indicator | `aria-live="polite"`, `aria-label` | "{Agent} is typing" |

### 5.3 Focus Management

- When opening ActiveChatView, focus moves to the TextArea.
- When opening AgentPickerView, focus moves to AgentSearchInput.
- When closing a view (back navigation), focus returns to the element that triggered the transition.
- New messages do not steal focus from the TextArea.
- Error states on message delivery are announced via `aria-live="assertive"`.

### 5.4 Color Contrast

All text and interactive elements must meet **WCAG AA** contrast ratios:
- Normal text: minimum 4.5:1
- Large text (18px+ or 14px+ bold): minimum 3:1
- Interactive element boundaries: minimum 3:1 against adjacent colors

Status dots use both color AND shape/label to convey state (not color alone):
- Online: green dot + "Online" label (in expanded views)
- Busy: amber dot + "Busy" label
- Idle/Offline: gray dot + "Offline" label

## 6. Design Tokens (Host Theme Alignment)

The plugin inherits the Paperclip host theme via `useHostContext()`. All styling references host CSS custom properties rather than hardcoded values.

### 6.1 Color Tokens

| Token | Usage |
|-------|-------|
| `--host-bg-primary` | Sidebar background |
| `--host-bg-secondary` | ConversationItem hover, ChatHeader bg |
| `--host-bg-tertiary` | SearchBar bg, input bg |
| `--host-text-primary` | Headings, agent names, message text |
| `--host-text-secondary` | Timestamps, previews, descriptions |
| `--host-text-tertiary` | Placeholder text |
| `--host-border` | Dividers, input borders |
| `--host-accent` | Send button bg, links, active states, user message bubble bg |
| `--host-accent-text` | Text on accent backgrounds |
| `--host-success` | Online status dot |
| `--host-warning` | Busy status dot |
| `--host-neutral-400` | Offline/idle status dot |
| `--host-error` | Error states, failed message indicator |

### 6.2 Typography Tokens

| Token | Usage |
|-------|-------|
| `--host-font-family` | All text |
| `--host-font-size-sm` | Timestamps, status labels, captions (12px range) |
| `--host-font-size-base` | Message text, conversation names (14px range) |
| `--host-font-size-lg` | Sidebar title (16px range) |
| `--host-font-weight-normal` | Body text, messages |
| `--host-font-weight-medium` | Agent names, section labels |
| `--host-font-weight-bold` | Sidebar title |
| `--host-line-height` | Base line height for all text |

### 6.3 Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Status dot margins, inline spacing |
| `--space-sm` | 8px | Inner padding on compact elements, gaps |
| `--space-md` | 12px | ConversationItem padding, message bubble padding |
| `--space-lg` | 16px | Section padding, sidebar edge padding |
| `--space-xl` | 24px | Empty state vertical spacing |

### 6.4 Shape Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Inputs, search bars |
| `--radius-md` | 8px | Message bubbles, cards |
| `--radius-lg` | 12px | ConversationItem on hover |
| `--radius-full` | 9999px | Avatars, status dots, pills |

### 6.5 Shadow Tokens

| Token | Usage |
|-------|-------|
| `--host-shadow-sm` | Floating elements (new message pill) |
| `--host-shadow-md` | Agent picker overlay |

### 6.6 Animation Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 150ms ease | Hover states, button feedback |
| `--transition-normal` | 200ms ease-out | View transitions (slide) |
| `--transition-slow` | 300ms ease-in-out | Typing indicator pulse |

## 7. Component State Summary

| Component | States |
|-----------|--------|
| `ConversationItem` | default, hover, focused, active (selected), unread (bold text + dot) |
| `MessageBubble` | user (right, accent bg), agent (left, secondary bg), sending (reduced opacity), error (red border + retry) |
| `SendButton` | default, hover, disabled (empty input), loading (spinner during send) |
| `StatusIndicator` | online (green), busy (amber), idle/offline (gray) |
| `TextArea` | empty (placeholder), filled, focused (accent border), disabled (during error recovery) |
| `SearchBar` | empty (placeholder + icon), filled (text + clear button), focused (accent border) |
| `AgentOption` | default, hover, focused, disabled (if agent unavailable) |
| `NewConversationButton` | default, hover, focused |
| `BackButton` | default, hover, focused |

---

_Spec created 2026-03-25 by UI Designer for [PAPA-25](/PAPA/issues/PAPA-25). Parent: [PAPA-20](/PAPA/issues/PAPA-20)._
