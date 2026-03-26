import React, { useState } from "react";
import type { Conversation, AgentStatus } from "../types.js";
import { StatusIndicator } from "./StatusIndicator.js";

interface ConversationListProps {
  conversations: Conversation[];
  agentStatuses: Map<string, AgentStatus>;
  onSelect: (conversation: Conversation) => void;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d`;
}

export function ConversationList({
  conversations,
  agentStatuses,
  onSelect,
}: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const filtered = search
    ? conversations.filter((c) =>
        c.agentName.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase()),
      )
    : conversations;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusedIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocusedIndex(filtered.length - 1);
    } else if (e.key === "Enter" && focusedIndex >= 0 && focusedIndex < filtered.length) {
      e.preventDefault();
      onSelect(filtered[focusedIndex]);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "var(--space-sm) var(--space-lg)" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-sm)",
            backgroundColor: "var(--host-bg-tertiary)",
            borderRadius: "var(--radius-sm)",
            padding: "var(--space-sm)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--host-text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFocusedIndex(-1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearch("");
                (e.target as HTMLInputElement).blur();
              }
            }}
            style={{
              flex: 1,
              border: "none",
              backgroundColor: "transparent",
              color: "var(--host-text-primary)",
              fontSize: "var(--host-font-size-base)",
              fontFamily: "var(--host-font-family)",
              outline: "none",
            }}
          />
        </div>
      </div>

      <div
        role="listbox"
        aria-label="Conversations"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{
          flex: 1,
          overflowY: "auto",
          outline: "none",
        }}
      >
        {filtered.map((conv, idx) => (
          <div
            key={conv.id}
            role="option"
            aria-selected={idx === focusedIndex}
            onClick={() => onSelect(conv)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-sm)",
              padding: "var(--space-md) var(--space-lg)",
              cursor: "pointer",
              backgroundColor:
                idx === focusedIndex ? "var(--host-bg-secondary)" : "transparent",
              transition: "var(--transition-fast)",
            }}
          >
            <div style={{ position: "relative", flexShrink: 0, marginTop: 2 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-full)",
                  backgroundColor: "var(--host-bg-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--host-font-size-sm)",
                  fontWeight: "var(--host-font-weight-medium)",
                  color: "var(--host-text-secondary)",
                }}
              >
                {conv.agentName.charAt(0).toUpperCase()}
              </div>
              <div style={{ position: "absolute", bottom: -1, right: -1 }}>
                <StatusIndicator status={agentStatuses.get(conv.agentId) ?? "offline"} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: "var(--space-sm)",
                }}
              >
                <span
                  style={{
                    fontWeight: conv.unreadCount > 0
                      ? "var(--host-font-weight-bold)"
                      : "var(--host-font-weight-medium)",
                    fontSize: "var(--host-font-size-base)",
                    color: "var(--host-text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {conv.agentName}
                </span>
                <span
                  style={{
                    fontSize: "var(--host-font-size-sm)",
                    color: "var(--host-text-secondary)",
                    flexShrink: 0,
                  }}
                >
                  {formatRelativeTime(conv.lastMessageAt)}
                </span>
              </div>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "var(--host-font-size-sm)",
                  color: "var(--host-text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  lineHeight: "var(--host-line-height)",
                }}
              >
                {conv.lastMessage}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
