import React from "react";

interface EmptyStateProps {
  onStartChat: () => void;
}

export function EmptyState({ onStartChat }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "var(--space-lg)",
        textAlign: "center",
        gap: "var(--space-xl)",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--host-bg-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
        }}
        aria-hidden="true"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--host-text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "var(--host-font-size-lg)",
            fontWeight: "var(--host-font-weight-medium)",
            color: "var(--host-text-primary)",
          }}
        >
          No conversations yet
        </h3>
        <p
          style={{
            margin: "var(--space-sm) 0 0",
            fontSize: "var(--host-font-size-base)",
            color: "var(--host-text-secondary)",
          }}
        >
          Start a chat with any agent to get going.
        </p>
      </div>

      <button
        onClick={onStartChat}
        style={{
          padding: "var(--space-sm) var(--space-lg)",
          backgroundColor: "var(--host-accent)",
          color: "var(--host-accent-text)",
          border: "none",
          borderRadius: "var(--radius-sm)",
          fontSize: "var(--host-font-size-base)",
          fontWeight: "var(--host-font-weight-medium)",
          fontFamily: "var(--host-font-family)",
          cursor: "pointer",
          transition: "var(--transition-fast)",
        }}
        aria-label="Start a chat"
      >
        Start a Chat
      </button>
    </div>
  );
}
