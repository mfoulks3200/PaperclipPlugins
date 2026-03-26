import React, { useState, useEffect, useRef } from "react";
import type { AgentStatus } from "../types.js";
import { StatusIndicator } from "./StatusIndicator.js";

export interface AgentOption {
  id: string;
  name: string;
  title: string;
  status: AgentStatus;
}

interface AgentPickerProps {
  agents: AgentOption[];
  onSelect: (agent: AgentOption) => void;
  onBack: () => void;
}

export function AgentPicker({ agents, onSelect, onBack }: AgentPickerProps) {
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const filtered = search
    ? agents.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.title.toLowerCase().includes(search.toLowerCase()),
      )
    : agents;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onBack();
    } else if (e.key === "ArrowDown") {
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
    <div
      onKeyDown={handleKeyDown}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--host-bg-primary)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-sm)",
          padding: "var(--space-md) var(--space-lg)",
          borderBottom: "1px solid var(--host-border)",
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back"
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
        <span
          style={{
            fontSize: "var(--host-font-size-lg)",
            fontWeight: "var(--host-font-weight-bold)",
            color: "var(--host-text-primary)",
          }}
        >
          Select Agent
        </span>
      </div>

      {/* Search */}
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
            ref={searchRef}
            type="text"
            placeholder="Search agents..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setFocusedIndex(-1);
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

      {/* Agent list */}
      <div
        role="listbox"
        aria-label="Available agents"
        style={{ flex: 1, overflowY: "auto" }}
      >
        {filtered.map((agent, idx) => (
          <div
            key={agent.id}
            role="option"
            aria-selected={idx === focusedIndex}
            onClick={() => onSelect(agent)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
              padding: "var(--space-md) var(--space-lg)",
              cursor: "pointer",
              backgroundColor:
                idx === focusedIndex ? "var(--host-bg-secondary)" : "transparent",
              transition: "var(--transition-fast)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--host-bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "var(--host-font-size-base)",
                fontWeight: "var(--host-font-weight-medium)",
                color: "var(--host-text-secondary)",
                flexShrink: 0,
              }}
            >
              {agent.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "var(--host-font-size-base)",
                  fontWeight: "var(--host-font-weight-medium)",
                  color: "var(--host-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {agent.name}
              </div>
              <div
                style={{
                  fontSize: "var(--host-font-size-sm)",
                  color: "var(--host-text-secondary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {agent.title}
              </div>
            </div>
            <StatusIndicator status={agent.status} />
          </div>
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              padding: "var(--space-xl)",
              textAlign: "center",
              color: "var(--host-text-secondary)",
              fontSize: "var(--host-font-size-base)",
            }}
          >
            No agents found
          </div>
        )}
      </div>
    </div>
  );
}
