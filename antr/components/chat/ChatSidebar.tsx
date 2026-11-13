"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CHAT_ROOMS, useChatStore } from "@/store/chatStore";
import { searchUsers } from "@/lib/api/users";
import UserAvatar from "./UserAvatar";
import UserProfileModal from "./UserProfileModal";
import type { UserSearchResult } from "@/types/chat";

interface ChatSidebarProps {
  currentUser: {
    id?: number;
    anonymousName: string;
    tag?: string;
    avatarUrl?: string;
    studentYear?: number;
    email?: string;
  };
  isLoggedIn?: boolean;
  onSelectRoom?: (roomId: number) => void;
  onSelectDm?: (userId: number) => void;
}

function formatChatTime(timestamp?: string | number | Date): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function resolveSenderName(sender: unknown, fallback?: unknown): string {
  if (typeof sender === "string" && sender.trim()) return sender.trim();
  if (sender && typeof sender === "object") {
    const s = sender as Record<string, unknown>;
    if (typeof s.username === "string" && s.username.trim()) return s.username.trim();
    if (typeof s.name === "string" && s.name.trim()) return s.name.trim();
    if (typeof s.email === "string" && s.email.trim()) return s.email.trim();
  }
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  return "";
}

function getMessageSnippet(content?: string, senderName?: string): { text: string; isMedia: boolean } {
  if (!content) return { text: "No messages yet", isMedia: false };
  const trimmed = content.trim();
  const prefix = senderName ? `${senderName}: ` : "";

  if (trimmed.startsWith("[sticker:")) {
    const parts = trimmed.slice(9, -1).split(":");
    return { text: `${prefix}Sticker`, isMedia: true };
  }
  if (trimmed.startsWith("[gif:") || trimmed.includes("giphy.com")) {
    return { text: `${prefix}GIF`, isMedia: true };
  }
  if (/^https?:\/\/\S+\.(gif|webp|png|jpe?g)/i.test(trimmed)) {
    return { text: `${prefix}Photo`, isMedia: true };
  }
  return { text: `${prefix}${trimmed}`, isMedia: false };
}

function getStoredProfile() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("annoyms_user_profile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getRoomBadge(roomId: number, emoji?: string) {
  switch (roomId) {
    case 1:
      return {
        bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        icon: <span className="font-mono font-bold text-base">#</span>,
      };
    case 2:
      return {
        bg: "bg-sky-500/15 text-sky-400 border-sky-500/25",
        icon: <span className="font-mono font-bold text-xs">Y1</span>,
      };
    case 3:
      return {
        bg: "bg-amber-500/15 text-amber-400 border-amber-500/25",
        icon: <span className="font-mono font-bold text-xs">Y2</span>,
      };
    case 4:
      return {
        bg: "bg-teal-500/15 text-teal-400 border-teal-500/25",
        icon: <span className="font-mono font-bold text-xs">Y3</span>,
      };
    case 5:
      return {
        bg: "bg-purple-500/15 text-purple-400 border-purple-500/25",
        icon: <span className="font-mono font-bold text-xs">Y4</span>,
      };
    case 6:
      return {
        bg: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
        icon: <span className="font-mono font-bold text-xs">&lt;/&gt;</span>,
      };
    case 7:
      return {
        bg: "bg-rose-500/15 text-rose-400 border-rose-500/25",
        icon: <span className="text-base">🎨</span>,
      };
    case 8:
      return {
        bg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        icon: <span className="text-base">📚</span>,
      };
    default:
      return {
        bg: "bg-white/10 text-zinc-300 border-white/10",
        icon: emoji ? (
          <span className="text-base">{emoji}</span>
        ) : (
          <span className="font-mono font-bold text-base">#</span>
        ),
      };
  }
}

export default function ChatSidebar({ currentUser, isLoggedIn = true, onSelectRoom, onSelectDm }: ChatSidebarProps) {
  const router = useRouter();
  const activeChatType = useChatStore((state) => state.activeChatType);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const activeDmUser = useChatStore((state) => state.activeDmUser);
  const dmConversations = useChatStore((state) => state.dmConversations);
  const messagesByRoom = useChatStore((state) => state.messagesByRoom);
  const messagesByDm = useChatStore((state) => state.messagesByDm);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const unreadDmCounts = useChatStore((state) => state.unreadDmCounts);
  const blockedUserIds = useChatStore((state) => state.blockedUserIds);
  const storeUserId = useChatStore((state) => state.currentUserId);

  const setActiveRoom = useChatStore((state) => state.setActiveRoom);
  const openDm = useChatStore((state) => state.openDm);
  const isUserOnline = useChatStore((state) => state.isUserOnline);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);

  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "channels" | "dms">("all");
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  const effectiveMyId = useMemo(() => {
    return currentUser.id || storeUserId || getStoredProfile()?.id;
  }, [currentUser.id, storeUserId]);

  const effectiveMyName = useMemo(() => {
    const name = currentUser.anonymousName || getStoredProfile()?.anonymousName;
    return name && name !== "Anonymous" ? name : undefined;
  }, [currentUser.anonymousName]);

  const isSelfUser = useCallback(
    (user: { id?: number; username?: string }) => {
      if (effectiveMyId && user.id && Number(effectiveMyId) === Number(user.id)) {
        return true;
      }
      const stored = getStoredProfile();
      const myNames = [currentUser.anonymousName, stored?.anonymousName]
        .filter(Boolean)
        .map((n) => n!.toLowerCase().trim());

      if (user.username && myNames.includes(user.username.toLowerCase().trim())) {
        return true;
      }
      return false;
    },
    [effectiveMyId, currentUser.anonymousName]
  );

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setUserSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    setIsSearchingUsers(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(query, effectiveMyId, effectiveMyName);
        const filtered = results.filter((u) => !isSelfUser(u));
        setUserSearchResults(filtered);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, effectiveMyId, effectiveMyName, isSelfUser]);

  const userYear = currentUser.studentYear || getStoredProfile()?.studentYear;

  const accessibleRooms = useMemo(() => {
    return CHAT_ROOMS.filter((room) => {
      if (room.requiredYear) return userYear === room.requiredYear;
      return true;
    });
  }, [userYear]);

  const filteredRooms = useMemo(() => {
    return accessibleRooms.filter(
      (room) =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [accessibleRooms, searchQuery]);

  const handleStartDm = (user: UserSearchResult) => {
    if (!isLoggedIn) {
      router.push("/authentication");
      return;
    }
    if (isSelfUser(user)) {
      console.warn("Cannot start a direct message with yourself");
      return;
    }
    openDm({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      tag: user.tag,
      studentYear: user.studentYear,
    });
    setSearchQuery("");
    if (onSelectDm) onSelectDm(user.id);
  };

  const totalUnreadChannels = Object.values(unreadCounts).reduce((acc, count) => acc + count, 0);
  const totalUnreadDms = Object.values(unreadDmCounts).reduce((acc, count) => acc + count, 0);


  return (
    <>
      <aside className="w-full h-full bg-[#0a0d11] text-zinc-100 flex flex-col select-none relative overflow-hidden font-sans">
        {/* Subtle Ambient Background Glow */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-emerald-950/20 via-transparent to-transparent pointer-events-none -z-0" />

        {/* 1. Header (Inspired by the Sarah Greeting + Status Meter) */}
        <div className="px-4 sm:px-5 pt-4 pb-3 flex items-center justify-between relative z-10">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setProfileUserId(currentUser.id || null)}
          >
            <div className="relative">
              <UserAvatar
                src={currentUser.avatarUrl}
                name={currentUser.anonymousName || "Anonymous"}
                size="md"
                showStatus={false}
                className="ring-2 ring-emerald-500/30 group-hover:ring-emerald-400 transition-all"
              />
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a0d11] ${isConnected ? "bg-emerald-400" : isConnecting ? "bg-amber-400 animate-pulse" : "bg-zinc-600"}`} />
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] text-zinc-400 font-medium leading-none">
                {isLoggedIn ? "Good day!" : "Welcome!"}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm sm:text-base font-bold text-white group-hover:text-zinc-200 transition-colors">
                  {currentUser.anonymousName || "Anonymous"}
                </span>
                {currentUser.studentYear && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-semibold">
                    Y{currentUser.studentYear}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Status Gauge Pill (Inspired by the 85% Mind Balance pill) */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md">
            {/* Circular Gauge Ring */}
            <div className="relative w-5 h-5 flex items-center justify-center">
              <svg className="w-5 h-5 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" fill="none" className="text-white/[0.08]" />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeDasharray="56.5"
                  strokeDashoffset={isConnected ? "8" : "28"}
                  strokeLinecap="round"
                  className={isConnected ? "text-emerald-400" : isConnecting ? "text-amber-400" : "text-zinc-600"}
                />
              </svg>
              <span className="text-[8px] font-mono font-bold text-emerald-300 absolute">
                {isConnected ? "✓" : "•"}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-zinc-200">
              {isConnected ? "Campus Live" : isConnecting ? "Connecting" : "Offline"}
            </span>
          </div>
        </div>

        {/* Scrollable Main Overview Feed */}
        <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 relative z-10">
          {/* Search Bar */}
          <div className="relative group pt-1">
            <svg
              className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-emerald-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              id="chat-search-input"
              type="text"
              placeholder="Search classmates or rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white/[0.04] border border-white/[0.07] rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.07] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setUserSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center rounded-full bg-white/10 text-zinc-400 hover:text-white text-[10px] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {searchQuery.trim() ? (
            /* Search Results Mode */
            <div className="space-y-4 pt-1">
              <div>
                <div className="pb-2 text-xs font-semibold text-zinc-400 flex items-center justify-between">
                  <span>Classmates & Peers</span>
                  {isSearchingUsers ? (
                    <span className="animate-spin text-zinc-400">◌</span>
                  ) : (
                    <span>{userSearchResults.length}</span>
                  )}
                </div>
                {userSearchResults.length > 0 ? (
                  <div className="space-y-1.5">
                    {userSearchResults.map((user) => {
                      const isBlocked = blockedUserIds.includes(user.id);
                      return (
                        <div
                          key={`user-search-${user.id}`}
                          className="w-full text-left p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1" onClick={() => setProfileUserId(user.id)}>
                            <UserAvatar
                              src={user.avatarUrl}
                              name={user.username}
                              size="md"
                              isBlocked={isBlocked}
                              showStatus={true}
                              isConnected={isUserOnline(user.id, user.username)}
                            />
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-white group-hover:text-zinc-200 truncate block">
                                @{user.username}
                              </span>
                              <p className="text-[11px] text-zinc-500 truncate font-medium">
                                {isBlocked ? "Blocked" : user.tag || `Year ${user.studentYear ?? 1}`}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleStartDm(user)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white text-zinc-300 hover:text-black transition-all shrink-0 cursor-pointer"
                            title="Start chat"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-white/[0.06]">
                    <p className="text-xs text-zinc-500">{isSearchingUsers ? "Searching…" : "No classmates found"}</p>
                  </div>
                )}
              </div>

              <div>
                <div className="pb-2 text-xs font-semibold text-zinc-400">
                  Rooms
                </div>
                {filteredRooms.length > 0 ? (
                  <div className="space-y-1.5">
                    {filteredRooms.map((room) => {
                      const isActive = activeChatType === "channel" && room.id === activeRoomId;
                      const badge = getRoomBadge(room.id, room.emoji);
                      return (
                        <button
                          key={`search-room-${room.id}`}
                          type="button"
                          onClick={() => {
                            setActiveRoom(room.id);
                            setSearchQuery("");
                            if (onSelectRoom) onSelectRoom(room.id);
                          }}
                          className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3 cursor-pointer border ${
                            isActive
                              ? "bg-white/[0.08] text-white border-white/15"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border-transparent"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${badge.bg}`}>
                            {badge.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate text-zinc-100">{room.name}</p>
                            <p className="text-[11px] text-zinc-500 truncate">{room.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl border border-dashed border-white/[0.06]">
                    <p className="text-xs text-zinc-500">No rooms found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Normal Feed Mode: Direct Clean Chat Conversations */
            <>
              {/* Conversations Section */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Conversations
                  </h3>

                  {/* Minimal Tab Switcher */}
                  <div className="flex items-center p-0.5 rounded-lg bg-white/[0.05] border border-white/[0.06] text-[11px]">
                    <button
                      type="button"
                      onClick={() => setActiveTab("all")}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                        activeTab === "all" ? "bg-white/15 text-white font-bold" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("dms")}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                        activeTab === "dms" ? "bg-white/15 text-white font-bold" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>Direct</span>
                      {totalUnreadDms > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("channels")}
                      className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                        activeTab === "channels" ? "bg-white/15 text-white font-bold" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <span>Rooms</span>
                      {totalUnreadChannels > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* List Container */}
                <div className="space-y-1.5">
                  {/* Direct Messages */}
                  {(activeTab === "all" || activeTab === "dms") &&
                    dmConversations.map((dm) => {
                      const isActive = activeChatType === "dm" && activeDmUser?.userId === dm.userId;
                      const unread = unreadDmCounts[dm.userId] || 0;
                      const isBlocked = blockedUserIds.includes(dm.userId);
                      const isOnline = isUserOnline(dm.userId, dm.username);
                      const dmMessages = messagesByDm[dm.userId] || [];
                      const lastMsg = dmMessages.length > 0 ? dmMessages[dmMessages.length - 1] : null;
                      const snippet = lastMsg
                        ? getMessageSnippet(lastMsg.content)
                        : dm.lastMessage
                        ? getMessageSnippet(dm.lastMessage)
                        : { text: "Tap to chat", isMedia: false };
                      const timeStr = lastMsg
                        ? formatChatTime(lastMsg.createdAt)
                        : dm.lastMessageTime
                        ? formatChatTime(dm.lastMessageTime)
                        : "";

                      return (
                        <button
                          key={`dm-${dm.userId}`}
                          type="button"
                          onClick={() => {
                            openDm({
                              id: dm.userId,
                              username: dm.username,
                              avatarUrl: dm.avatarUrl,
                              tag: dm.tag,
                              studentYear: dm.studentYear,
                            });
                            if (onSelectDm) onSelectDm(dm.userId);
                          }}
                          className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3.5 cursor-pointer group border ${
                            isActive
                              ? "bg-white/[0.08] border-white/15 text-white shadow-sm"
                              : "bg-[#12141c]/70 hover:bg-[#181b26] border-white/[0.05]"
                          }`}
                        >
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileUserId(dm.userId);
                            }}
                            className="shrink-0 relative"
                          >
                            <UserAvatar
                              src={dm.avatarUrl}
                              name={dm.username}
                              size="md"
                              isBlocked={isBlocked}
                              showStatus={true}
                              isConnected={isOnline}
                              className="group-hover:scale-105 transition-transform"
                            />
                            {unread > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-emerald-400 text-zinc-950 text-[10px] font-black flex items-center justify-center shadow-sm">
                                {unread > 9 ? "9+" : unread}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-zinc-200 group-hover:text-white"}`}>
                                {dm.username}
                              </span>
                              {timeStr && (
                                <span className={`text-[11px] font-mono shrink-0 ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>
                                  {timeStr}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs truncate ${isBlocked ? "text-rose-400/80 italic" : isActive ? "text-zinc-300" : "text-zinc-400 group-hover:text-zinc-300"}`}>
                              {isBlocked ? "Blocked" : snippet.text}
                            </p>
                          </div>
                        </button>
                      );
                    })}

                  {/* Rooms list */}
                  {(activeTab === "all" || activeTab === "channels") &&
                    filteredRooms.map((room) => {
                      const isActive = activeChatType === "channel" && room.id === activeRoomId;
                      const roomMsgs = messagesByRoom[room.id] ?? [];
                      const unseenCount = unreadCounts[room.id] || 0;
                      const lastMsg = roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : null;
                      const timeStr = lastMsg ? formatChatTime(lastMsg.createdAt) : "";
                      const lastSenderName = lastMsg ? resolveSenderName(lastMsg.sender, lastMsg.senderEmail) : "";
                      const snippet = lastMsg
                        ? getMessageSnippet(lastMsg.content, lastSenderName)
                        : { text: room.description || "Public room", isMedia: false };
                      const badge = getRoomBadge(room.id, room.emoji);

                      return (
                        <button
                          key={`room-${room.id}`}
                          type="button"
                          onClick={() => {
                            setActiveRoom(room.id);
                            if (onSelectRoom) onSelectRoom(room.id);
                          }}
                          className={`w-full text-left p-3 rounded-2xl transition-all flex items-center gap-3.5 cursor-pointer group border ${
                            isActive
                              ? "bg-white/[0.08] border-white/15 text-white shadow-sm"
                              : "bg-[#12141c]/70 hover:bg-[#181b26] border-white/[0.05]"
                          }`}
                        >
                          <div className="relative shrink-0">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 ${badge.bg}`}>
                              {badge.icon}
                            </div>
                            {unseenCount > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-emerald-400 text-zinc-950 text-[10px] font-black flex items-center justify-center shadow-sm">
                                {unseenCount > 9 ? "9+" : unseenCount}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-zinc-200 group-hover:text-white"}`}>
                                {room.name}
                              </span>
                              {timeStr && (
                                <span className={`text-[11px] font-mono shrink-0 ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>
                                  {timeStr}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs truncate ${isActive ? "text-zinc-300" : "text-zinc-400 group-hover:text-zinc-300"}`}>
                              {snippet.text}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      <UserProfileModal
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onMessage={(id) => {
          const found =
            userSearchResults.find((u) => u.id === id) ||
            (dmConversations.find((d) => d.userId === id) as UserSearchResult | undefined);
          if (found) {
            handleStartDm({
              id,
              username: (found as { username?: string }).username ?? "",
              avatarUrl: (found as { avatarUrl?: string }).avatarUrl,
              tag: (found as { tag?: string }).tag,
              studentYear: (found as { studentYear?: number }).studentYear,
            });
          } else {
            openDm({ id, username: "User" });
          }
        }}
      />
    </>
  );
}
