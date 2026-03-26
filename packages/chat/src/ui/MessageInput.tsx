import React, { useState, useRef, useCallback } from "react";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    // Cap at ~6 lines (approx 6 * 20px line height)
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    resize();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "var(--space-sm)",
        padding: "var(--space-sm) var(--space-lg)",
        borderTop: "1px solid var(--host-border)",
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          resize: "none",
          border: "1px solid var(--host-border)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--space-sm)",
          fontSize: "var(--host-font-size-base)",
          fontFamily: "var(--host-font-family)",
          lineHeight: "var(--host-line-height)",
          color: "var(--host-text-primary)",
          backgroundColor: "var(--host-bg-tertiary)",
          outline: "none",
          maxHeight: 120,
          overflow: "auto",
        }}
      />
      <button
        onClick={submit}
        disabled={!canSend}
        aria-label="Send message"
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          borderRadius: "var(--radius-sm)",
          backgroundColor: canSend ? "var(--host-accent)" : "var(--host-bg-tertiary)",
          color: canSend ? "var(--host-accent-text)" : "var(--host-text-tertiary)",
          cursor: canSend ? "pointer" : "default",
          transition: "var(--transition-fast)",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  );
}
