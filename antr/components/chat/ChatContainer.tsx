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
    email?: string;
    avatarUrl?: string;
    studentYear?: number;
  };
}

export default function ChatContainer({ currentUser }: ChatContainerProps) {
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const activeRoom = useChatStore((state) => state.activeRoom);
  const setActiveRoom = useChatStore((state) => state.setActiveRoom);
  const addMessage = useChatStore((state) => state.addMessage);

  // React Query hook: loads previous messages for activeRoomId, caches them, refetches on switch
  const { messages, isLoading, isFetching, isError, error, refetch } =
    useChatMessages(activeRoomId);

  // WebSocket hook: connects to /chat, subscribes to /topic/messages, reconnects on drop
  const { isConnected, isConnecting, send } = useChatWebSocket();

  // Mobile WhatsApp-style view state: "list" shows chats list, "chat" shows conversation
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const handleSendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const senderName = currentUser.anonymousName || "Anonymous";
    const senderEmail = currentUser.email || senderName;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // 1. Optimistically display in UI immediately
    addMessage({
      id: tempId,
      sender: senderName,
      senderEmail: senderEmail,
      content: trimmed,
      createdAt: new Date().toISOString(),
      roomId: activeRoomId,
      avatarUrl: currentUser.avatarUrl,
      tag: currentUser.tag,
      studentYear: currentUser.studentYear,
    });

    // 2. Transmit to server (via WebSocket with automatic HTTP fallback)
    try {
      await send(
        trimmed,
        senderName,
        activeRoomId,
        senderEmail,
        currentUser.avatarUrl,
        currentUser.tag,
        currentUser.studentYear
      );
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#08090d] text-zinc-100 overflow-hidden font-sans">
      {/* Left Chats List: On mobile takes 100% width when mobileView === 'list'; on desktop is always fixed w-80 */}
      <div
        className={`h-full md:flex md:w-80 md:shrink-0 ${
          mobileView === "list" ? "flex flex-col w-full" : "hidden"
        }`}
      >
        <ChatSidebar
          currentUser={currentUser}
          onSelectRoom={(roomId) => {
            setActiveRoom(roomId);
            setMobileView("chat");
          }}
        />
      </div>

      {/* Main Conversation Pane: On mobile takes 100% width when mobileView === 'chat'; on desktop always fills remaining space */}
      <main
        className={`h-full flex-col min-w-0 relative md:flex md:flex-1 ${
          mobileView === "chat" ? "flex w-full" : "hidden"
        }`}
      >
        {/* Chat Top Header with WhatsApp Back Button on Mobile */}
        <ChatHeader
          onBack={() => setMobileView("list")}
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
          disabled={false}
          senderName={currentUser.anonymousName || "Anonymous"}
        />
      </main>
    </div>
  );
}
