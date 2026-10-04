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
    id?: number;
    anonymousName: string;
    tag?: string;
    email?: string;
    avatarUrl?: string;
    studentYear?: number;
  };
  isLoggedIn?: boolean;
}

export default function ChatContainer({ currentUser, isLoggedIn = true }: ChatContainerProps) {
  const activeChatType = useChatStore((state) => state.activeChatType);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const activeRoom = useChatStore((state) => state.activeRoom);
  const activeDmUser = useChatStore((state) => state.activeDmUser);
  const blockedUserIds = useChatStore((state) => state.blockedUserIds);
  const setActiveRoom = useChatStore((state) => state.setActiveRoom);
  const addMessage = useChatStore((state) => state.addMessage);
  const unblockUser = useChatStore((state) => state.unblockUser);

  const isDm = activeChatType === "dm" && Boolean(activeDmUser);
  const isBlocked = isDm && activeDmUser ? blockedUserIds.includes(activeDmUser.userId) : false;

  // React Query hook: loads either cohort room messages or direct messages between currentUser and activeDmUser
  const { messages, isLoading, isFetching, isError, error, refetch } = useChatMessages(
    activeChatType,
    activeRoomId,
    currentUser.id,
    activeDmUser?.userId
  );

  // WebSocket hook: connects to /chat, handles real-time incoming messages, reconnects
  const { isConnected, isConnecting, send } = useChatWebSocket();

  // Mobile WhatsApp-style view state: "list" shows chats list, "chat" shows conversation
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const handleSendMessage = async (content: string) => {
    if (!isLoggedIn) {
      console.warn("User must be logged in to chat");
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) return;

    if (isDm && isBlocked) {
      console.warn("Cannot send message to blocked user");
      return;
    }

    const senderName = currentUser.anonymousName || "Anonymous";
    const senderEmail = currentUser.email || senderName;
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (isDm && activeDmUser) {
      if (currentUser.id && activeDmUser.userId === currentUser.id) {
        console.warn("Cannot send message to yourself");
        return;
      }
      if (
        currentUser.anonymousName &&
        activeDmUser.username.toLowerCase().trim() === currentUser.anonymousName.toLowerCase().trim()
      ) {
        console.warn("Cannot send message to yourself");
        return;
      }

      // 1. Optimistic DM update in UI
      addMessage({
        id: tempId,
        sender: senderName,
        senderEmail: senderEmail,
        senderId: currentUser.id,
        receiverId: activeDmUser.userId,
        receiver: {
          id: activeDmUser.userId,
          username: activeDmUser.username,
          avatarUrl: activeDmUser.avatarUrl,
        },
        content: trimmed,
        createdAt: new Date().toISOString(),
        avatarUrl: currentUser.avatarUrl,
        tag: currentUser.tag,
        studentYear: currentUser.studentYear,
      });

      // 2. Transmit DM to backend via WebSocket or HTTP fallback
      try {
        await send(
          trimmed,
          senderName,
          undefined,
          senderEmail,
          currentUser.avatarUrl,
          currentUser.tag,
          currentUser.studentYear,
          activeDmUser.userId,
          currentUser.id
        );
      } catch (err) {
        console.error("Failed to send direct message:", err);
      }
    } else {
      // 1. Optimistic channel update in UI
      addMessage({
        id: tempId,
        sender: senderName,
        senderEmail: senderEmail,
        senderId: currentUser.id,
        content: trimmed,
        createdAt: new Date().toISOString(),
        roomId: activeRoomId,
        avatarUrl: currentUser.avatarUrl,
        tag: currentUser.tag,
        studentYear: currentUser.studentYear,
      });

      // 2. Transmit Channel message to backend
      try {
        await send(
          trimmed,
          senderName,
          activeRoomId,
          senderEmail,
          currentUser.avatarUrl,
          currentUser.tag,
          currentUser.studentYear,
          undefined,
          currentUser.id
        );
      } catch (err) {
        console.error("Failed to send channel message:", err);
      }
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
          isLoggedIn={isLoggedIn}
          onSelectRoom={(roomId) => {
            setActiveRoom(roomId);
            setMobileView("chat");
          }}
          onSelectDm={() => {
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
          currentUserId={currentUser.id}
          currentUserEmail={currentUser.email}
          currentUserName={currentUser.anonymousName}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onRetry={() => refetch()}
          roomName={isDm && activeDmUser ? `@${activeDmUser.username}` : activeRoom.name}
          isDm={isDm}
          dmUsername={activeDmUser?.username}
          isBlocked={isBlocked}
          onUnblock={() => activeDmUser && unblockUser(activeDmUser.userId)}
        />

        {/* Message Input Bar */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected && isConnecting}
          isBlocked={isBlocked}
          isLoggedIn={isLoggedIn}
          placeholder={
            isDm && activeDmUser
              ? `Message @${activeDmUser.username}`
              : `Message #${activeRoom.name}`
          }
          senderName={currentUser.anonymousName || "Anonymous"}
        />
      </main>
    </div>
  );
}
