"use client";

import React, { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput, { MentionMember } from "./MessageInput";
import ChatNotificationBanner from "./ChatNotificationBanner";
import { requestNotificationPermission } from "@/lib/notifications/chatNotifier";
import { searchUsers } from "@/lib/api/users";
import PinterestBackground from "@/components/ui/PinterestBackground";

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
  const dmConversations = useChatStore((state) => state.dmConversations);
  const blockedUserIds = useChatStore((state) => state.blockedUserIds);
  const setActiveRoom = useChatStore((state) => state.setActiveRoom);
  const addMessage = useChatStore((state) => state.addMessage);
  const unblockUser = useChatStore((state) => state.unblockUser);

  const isDm = activeChatType === "dm" && Boolean(activeDmUser);
  const isBlocked = isDm && activeDmUser ? blockedUserIds.includes(activeDmUser.userId) : false;

  const isRoomYearRestricted =
    !isDm &&
    Boolean(activeRoom?.requiredYear && currentUser.studentYear && currentUser.studentYear !== activeRoom.requiredYear);

  // React Query hook: loads either cohort room messages or direct messages between currentUser and activeDmUser
  const { messages, isLoading, isFetching, isError, error, refetch } = useChatMessages(
    activeChatType,
    activeRoomId,
    currentUser.id,
    activeDmUser?.userId,
    currentUser.studentYear
  );

  // Auto fallback to Room 1 (All Year) if currently on a year room belonging to another cohort
  React.useEffect(() => {
    if (activeChatType === "channel" && activeRoom?.requiredYear) {
      if (currentUser.studentYear && currentUser.studentYear !== activeRoom.requiredYear) {
        setActiveRoom(1);
      }
    }
  }, [activeChatType, activeRoom, currentUser.studentYear, setActiveRoom]);

  // Synchronize past direct messages from the server on mount or login
  React.useEffect(() => {
    if (currentUser.id) {
      useChatStore.getState().syncDmConversationsFromBackend(currentUser.id);
    }
  }, [currentUser.id]);

  // WebSocket hook: connects to /chat, handles real-time incoming messages, reconnects
  const { isConnected, isConnecting, send } = useChatWebSocket();
  const setIsMobileChatOpen = useChatStore((state) => state.setIsMobileChatOpen);

  // Mobile WhatsApp-style view state: "list" shows chats list, "chat" shows conversation
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [campusUsers, setCampusUsers] = useState<MentionMember[]>([]);

  // Keep global store aware of mobile chat screen status to auto-hide navbar on phones
  React.useEffect(() => {
    setIsMobileChatOpen(mobileView === "chat");
  }, [mobileView, setIsMobileChatOpen]);

  React.useEffect(() => {
    return () => {
      setIsMobileChatOpen(false);
    };
  }, [setIsMobileChatOpen]);

  React.useEffect(() => {
    requestNotificationPermission().catch(() => {});
  }, []);

  // Fetch campus cohort members for autocomplete
  React.useEffect(() => {
    let isMounted = true;
    searchUsers("", currentUser.id, currentUser.anonymousName)
      .then((users) => {
        if (!isMounted || !Array.isArray(users)) return;
        setCampusUsers(
          users.map((u) => ({
            id: u.id,
            username: u.username,
            avatarUrl: u.avatarUrl,
            studentYear: u.studentYear,
          }))
        );
      })
      .catch((err) => console.warn("Could not prefetch campus users for mentions:", err));

    return () => {
      isMounted = false;
    };
  }, [currentUser.id, currentUser.anonymousName]);

  // Compute unique participants in current conversation for @mention suggestions
  const uniqueRoomMembers: MentionMember[] = React.useMemo(() => {
    const map = new Map<string, MentionMember>();
    const myName = currentUser.anonymousName?.toLowerCase().trim();

    // 1. Current room participants (highest priority)
    for (const m of messages) {
      const name =
        (m as any).senderUsername ||
        (typeof m.sender === "string" ? m.sender : (m.sender as any)?.username) ||
        (m as any).senderEmail;

      if (name && typeof name === "string" && name !== "Anonymous") {
        const cleanName = name.trim();
        const key = cleanName.toLowerCase();
        if (key !== myName && !map.has(key)) {
          map.set(key, {
            id: m.senderId,
            username: cleanName,
            avatarUrl: m.avatarUrl,
            studentYear: m.studentYear,
          });
        }
      }
    }

    // 2. DM conversations
    for (const dm of dmConversations) {
      if (dm.username && dm.username !== "Anonymous") {
        const cleanName = dm.username.trim();
        const key = cleanName.toLowerCase();
        if (key !== myName && !map.has(key)) {
          map.set(key, {
            id: dm.userId,
            username: cleanName,
            avatarUrl: dm.avatarUrl,
            studentYear: dm.studentYear,
          });
        }
      }
    }

    // 3. All campus users
    for (const u of campusUsers) {
      const key = u.username.toLowerCase().trim();
      if (key !== myName && !map.has(key)) {
        map.set(key, u);
      }
    }

    return Array.from(map.values());
  }, [messages, dmConversations, campusUsers, currentUser.anonymousName]);

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
      if (activeRoom?.requiredYear && currentUser.studentYear && currentUser.studentYear !== activeRoom.requiredYear) {
        console.warn(`[CHAT] Cannot post in Room #${activeRoomId}: restricted to Year ${activeRoom.requiredYear}`);
        return;
      }

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
    <div className="flex h-[100dvh] w-full bg-[#121316] text-zinc-100 overflow-hidden font-sans relative selection:bg-emerald-500/30 selection:text-white">
      {/* Floating In-App Chat Notification Banner */}
      <ChatNotificationBanner />

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
          isYearRestricted={isRoomYearRestricted}
          requiredYear={activeRoom?.requiredYear}
        />

        {/* Message Input Bar */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={(!isConnected && isConnecting) || isRoomYearRestricted}
          isBlocked={isBlocked}
          isLoggedIn={isLoggedIn}
          isYearRestricted={isRoomYearRestricted}
          requiredYear={activeRoom?.requiredYear}
          placeholder={
            isRoomYearRestricted
              ? `Year ${activeRoom.requiredYear} only`
              : isDm && activeDmUser
              ? `Message @${activeDmUser.username}`
              : `Message #${activeRoom.name}`
          }
          senderName={currentUser.anonymousName || "Anonymous"}
          roomMembers={uniqueRoomMembers}
        />
      </main>
    </div>
  );
}
