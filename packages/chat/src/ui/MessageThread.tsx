import React, { useEffect, useRef, useState, useCallback } from "react";
import type { Message } from "../types.js";

interface MessageThreadProps {
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
  agentName: string;
  typingAgentId: string | null;
  onLoadMore: () => void;
}

const STATUS_ICONS: Record<string, string> = {
  sending: "\u2022",
  sent: "\u2713",
  delivered: "\u2713\u2713",
  failed: "\u2717",
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageThread({
  messages,
  hasMore,
  loading,
  agentName,
  typingAgentId,
  onLoadMore,
}: MessageThreadProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showNewPill, setShowNewPill] = useState(false);
  const prevLenRef = useRef(messages.length);
  const userScrolledUpRef = useRef(false);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }, []);

  // Auto-scroll on new messages if near bottom
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      if (isNearBottom()) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowNewPill(false);
      } else {
        setShowNewPill(true);
      }
    }
    prevLenRef.current = messages.length;
  }, [messages.length, isNearBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, []);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;

    if (isNearBottom()) {
      setShowNewPill(false);
      userScrolledUpRef.current = false;
    } else {
      userScrolledUpRef.current = true;
    }

    // Load more when scrolled to top
    if (el.scrollTop === 0 && hasMore && !loading) {
      onLoadMore();
    }
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowNewPill(false);
  }

  return (
    <div
      ref={containerRef}
      role="log"
      aria-live="polite"
      aria-label="Message thread"
      onScroll={handleScroll}
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "var(--space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-sm)",
        position: "relative",
      }}
    >
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--space-sm)",
            color: "var(--host-text-secondary)",
            fontSize: "var(--host-font-size-sm)",
          }}
        >
          Loading...
        </div>
      )}

      {messages.map((msg) => {
        const isUser = msg.sender === "user";
        return (
          <div
            key={msg.id}
            aria-label={`${isUser ? "You" : agentName} at ${formatTime(msg.timestamp)}: ${msg.content.slice(0, 100)}`}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: isUser ? "flex-end" : "flex-start",
              maxWidth: "85%",
              alignSelf: isUser ? "flex-end" : "flex-start",
            }}
          >
            <span
              style={{
                fontSize: "var(--host-font-size-sm)",
                color: "var(--host-text-secondary)",
                marginBottom: 2,
                fontWeight: "var(--host-font-weight-medium)",
              }}
            >
              {isUser ? "You" : agentName}
              <span style={{ marginLeft: "var(--space-sm)", fontWeight: "var(--host-font-weight-normal)" }}>
                {formatTime(msg.timestamp)}
              </span>
            </span>

            <div
              style={{
                padding: "var(--space-md)",
                borderRadius: "var(--radius-md)",
                backgroundColor: isUser
                  ? "var(--host-accent)"
                  : "var(--host-bg-secondary)",
                color: isUser
                  ? "var(--host-accent-text)"
                  : "var(--host-text-primary)",
                fontSize: "var(--host-font-size-base)",
                lineHeight: "var(--host-line-height)",
                overflowWrap: "break-word",
                wordBreak: "break-word",
                opacity: msg.status === "sending" ? 0.7 : 1,
                borderLeft: msg.status === "failed"
                  ? "3px solid var(--host-error)"
                  : "none",
              }}
            >
              {msg.content}
            </div>

            {isUser && msg.status && (
              <span
                style={{
                  fontSize: "var(--host-font-size-sm)",
                  color: msg.status === "failed"
                    ? "var(--host-error)"
                    : "var(--host-text-secondary)",
                  marginTop: 2,
                }}
                aria-live={msg.status === "failed" ? "assertive" : undefined}
              >
                {STATUS_ICONS[msg.status] ?? ""}
              </span>
            )}
          </div>
        );
      })}

      {typingAgentId && (
        <div
          aria-live="polite"
          aria-label={`${agentName} is typing`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            padding: "var(--space-sm) var(--space-md)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--host-bg-secondary)",
            alignSelf: "flex-start",
            fontSize: "var(--host-font-size-sm)",
            color: "var(--host-text-secondary)",
          }}
        >
          <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
            {"\u2022\u2022\u2022"}
          </span>
        </div>
      )}

      <div ref={bottomRef} />

      {showNewPill && (
        <button
          onClick={scrollToBottom}
          style={{
            position: "sticky",
            bottom: "var(--space-sm)",
            alignSelf: "center",
            padding: "var(--space-xs) var(--space-md)",
            backgroundColor: "var(--host-accent)",
            color: "var(--host-accent-text)",
            border: "none",
            borderRadius: "var(--radius-full)",
            fontSize: "var(--host-font-size-sm)",
            fontFamily: "var(--host-font-family)",
            cursor: "pointer",
            boxShadow: "var(--host-shadow-sm)",
          }}
        >
          New message
        </button>
      )}
    </div>
  );
}
