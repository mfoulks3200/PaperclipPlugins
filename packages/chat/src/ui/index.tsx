import React from "react";
import { useHostContext } from "@paperclipai/plugin-sdk/ui";

export default function ChatSidebar() {
  useHostContext();

  return (
    <div className="chat-sidebar">
      <h2>Chat</h2>
      <p>Chat plugin loading...</p>
    </div>
  );
}
