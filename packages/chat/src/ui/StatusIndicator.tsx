import React from "react";
import type { AgentStatus } from "../types.js";

const STATUS_CONFIG: Record<
  AgentStatus,
  { color: string; label: string }
> = {
  online: { color: "var(--host-success)", label: "Online" },
  busy: { color: "var(--host-warning)", label: "Busy" },
  idle: { color: "var(--host-neutral-400)", label: "Offline" },
  offline: { color: "var(--host-neutral-400)", label: "Offline" },
};

interface StatusIndicatorProps {
  status: AgentStatus;
  showLabel?: boolean;
}

export function StatusIndicator({ status, showLabel }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-xs)" }}
      aria-label={`Agent status: ${config.label}`}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "var(--radius-full)",
          backgroundColor: config.color,
          flexShrink: 0,
        }}
      />
      {showLabel && (
        <span
          style={{
            fontSize: "var(--host-font-size-sm)",
            color: "var(--host-text-secondary)",
          }}
        >
          {config.label}
        </span>
      )}
    </span>
  );
}
