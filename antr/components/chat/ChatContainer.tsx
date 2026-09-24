"use client";

import React, { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

interface ChatContainerProps {
  currentUser: {
    anonymousName: string;
    tag?: string;
  };
}

export default function ChatContainer({ currentUser }: ChatContainerProps) {
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const activeRoom = useChatStore((state) => state.activeRoom);

  // React Query hook: loads previous messages for activeRoomId, caches them, refetches on switch
  const { messages, isLoading, isFetching, isError, error, refetch } =
    useChatMessages(activeRoomId);

  // WebSocket hook: connects to /chat, subscribes to /topic/messages, reconnects on drop
  const { isConnected, isConnecting, send } = useChatWebSocket();

  // Mobile sidebar drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSendMessage = (content: string) => {
    try {
      send(content, currentUser.anonymousName || "Anonymous", activeRoomId);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* Overlay backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Left Sidebar: Room List */}
      <ChatSidebar
        currentUser={currentUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Chat Top Header */}
        <ChatHeader
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onRefresh={() => refetch()}
          isFetching={isFetching}
        />

        {/* Message Feed Window */}
        <MessageList
          messages={messages}
          currentUserName={currentUser.anonymousName}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          roomName={activeRoom.name}
        />

        {/* Message Input Bar */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected && !isConnecting}
          senderName={currentUser.anonymousName || "Anonymous"}
        />
      </main>
    </div>
  );
}
