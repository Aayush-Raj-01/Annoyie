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
    return { text: `${prefix}✨ ${parts[0] || "Sticker"}`, isMedia: true };
  }
  if (trimmed.startsWith("[gif:") || trimmed.includes("giphy.com")) {
    return { text: `${prefix}🎬 GIF`, isMedia: true };
  }
  if (/^https?:\/\/\S+\.(gif|webp|png|jpe?g)/i.test(trimmed)) {
    return { text: `${prefix}🖼️ Image`, isMedia: true };
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

  // Determine current user ID and names for exclusion
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
      const myNames = [
        currentUser.anonymousName,
        stored?.anonymousName,
      ]
        .filter(Boolean)
        .map((n) => n!.toLowerCase().trim());

      if (user.username && myNames.includes(user.username.toLowerCase().trim())) {
        return true;
      }
      return false;
    },
    [effectiveMyId, currentUser.anonymousName]
  );

  // Debounced search for users from backend with self-exclusion
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
      if (room.requiredYear) {
        return userYear === room.requiredYear;
      }
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
      <aside className="w-full h-full bg-[#121316] border-r border-white/[0.05] flex flex-col select-none relative">
        {/* Header: Avatar + "Chats" title */}
        <div className="p-4 border-b border-white/[0.04] flex items-center justify-between bg-[#14151a]">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={currentUser.avatarUrl}
              name={currentUser.anonymousName}
              size="md"
              className="shrink-0"
            />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">
              Chats
            </h1>
          </div>
        </div>

        {/* Search Input Bar: Inset Capsule */}
        <div className="px-4 py-3 border-b border-white/[0.04] bg-[#121316]">
          <div className="relative">
            <svg
              className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
            <input
              id="chat-search-input"
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-2 text-xs bg-[#18191f] border border-white/[0.04] rounded-full text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 transition-all font-sans"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setUserSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Segmented Filter Bar */}
        {!searchQuery.trim() && (
          <div className="px-4 py-2 flex items-center gap-1 border-b border-white/[0.04] bg-[#14151a]">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1.5 px-2 rounded-full text-xs font-medium transition-colors cursor-pointer text-center ${
                activeTab === "all"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("channels")}
              className={`flex-1 py-1.5 px-2 rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "channels"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Rooms</span>
              {totalUnreadChannels > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("dms")}
              className={`flex-1 py-1.5 px-2 rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "dms"
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>DMs</span>
              {totalUnreadDms > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[9px] font-mono">
                  {totalUnreadDms}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Main List Area */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800">
          {/* If Active Search Query: Show Combined Results */}
          {searchQuery.trim() ? (
            <div className="space-y-4">
              {/* Search Results: Users */}
              <div>
                <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
                  <span>USERS FOUND</span>
                  {isSearchingUsers ? (
                    <span className="animate-spin text-emerald-400">◌</span>
                  ) : (
                    <span>{userSearchResults.length}</span>
                  )}
                </div>

                {userSearchResults.length > 0 ? (
                  <div className="space-y-1">
                    {userSearchResults.map((user) => {
                      const isBlocked = blockedUserIds.includes(user.id);
                      return (
                        <div
                          key={`user-search-${user.id}`}
                          className="w-full text-left px-3 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all flex items-center justify-between gap-2.5 cursor-pointer group"
                        >
                          <div
                            className="flex items-center gap-2.5 min-w-0 flex-1"
                            onClick={() => setProfileUserId(user.id)}
                          >
                            <UserAvatar
                              src={user.avatarUrl}
                              name={user.username}
                              size="sm"
                              isBlocked={isBlocked}
                              showStatus={true}
                              isConnected={isUserOnline(user.id, user.username)}
                            />

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-white group-hover:text-emerald-300 truncate">
                                  @{user.username}
                                </span>
                                {isUserOnline(user.id, user.username) && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Active now" />
                                )}
                                <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                                  Yr {user.studentYear ?? 1}
                                </span>
                                {isBlocked && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                                    Blocked
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-500 truncate font-mono">
                                {user.tag || "Campus Peer"}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartDm(user)}
                            className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors shrink-0 cursor-pointer"
                          >
                            Chat
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-2 py-1 text-xs text-zinc-500 italic">No users found</p>
                )}
              </div>

              {/* Search Results: Channels */}
              <div>
                <div className="px-2 pb-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
                  <span>ROOMS MATCHING</span>
                </div>

                {filteredRooms.length > 0 ? (
                  <div className="space-y-1">
                    {filteredRooms.map((room) => {
                      const isActive = activeChatType === "channel" && room.id === activeRoomId;
                      return (
                        <button
                          key={`search-room-${room.id}`}
                          onClick={() => {
                            setActiveRoom(room.id);
                            setSearchQuery("");
                            if (onSelectRoom) onSelectRoom(room.id);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-150 flex items-center gap-2.5 cursor-pointer ${
                            isActive
                              ? "bg-white/[0.08] text-white border border-white/[0.08]"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                          }`}
                        >
                          <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-xs shrink-0">
                            {room.emoji || "#"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-medium truncate text-zinc-200">{room.name}</p>
                              {room.requiredYear && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-mono shrink-0">
                                  Yr {room.requiredYear}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 truncate">{room.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="px-2 py-1 text-xs text-zinc-500 italic">No channels found</p>
                )}
              </div>
            </div>
          ) : (
            /* Default Mode: Grouped Channels and Direct Messages */
            <>
              {/* DIRECT MESSAGES SECTION */}
              {(activeTab === "all" || activeTab === "dms") && (
                <div className="space-y-1">
                  <div className="px-2 pb-1 flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
                    <span>DIRECT MESSAGES</span>
                    <span>{dmConversations.length}</span>
                  </div>

                  {dmConversations.length === 0 ? (
                    <div className="px-3 py-4 rounded-xl border border-dashed border-white/[0.06] text-center select-none">
                      <p className="text-xs text-zinc-400 font-medium">No direct messages yet</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Search peers above to start a conversation
                      </p>
                    </div>
                  ) : (
                    dmConversations.map((dm) => {
                      const isActive =
                        activeChatType === "dm" && activeDmUser?.userId === dm.userId;
                      const unread = unreadDmCounts[dm.userId] || 0;
                      const isBlocked = blockedUserIds.includes(dm.userId);
                      const isOnline = isUserOnline(dm.userId, dm.username);
                      const dmMessages = messagesByDm[dm.userId] || [];
                      const lastMsg =
                        dmMessages.length > 0 ? dmMessages[dmMessages.length - 1] : null;
                      const snippet = lastMsg
                        ? getMessageSnippet(lastMsg.content)
                        : dm.lastMessage
                        ? getMessageSnippet(dm.lastMessage)
                        : { text: "Open conversation", isMedia: false };
                      const timeStr = lastMsg
                        ? formatChatTime(lastMsg.createdAt)
                        : dm.lastMessageTime
                        ? formatChatTime(dm.lastMessageTime)
                        : "";

                      return (
                        <button
                          key={`dm-${dm.userId}`}
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
                          className={`w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-colors flex items-center gap-3.5 cursor-pointer group relative ${
                            isActive
                              ? "bg-white/[0.05] text-white"
                              : "hover:bg-white/[0.02] text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {/* Left Accent indicator when active */}
                          {isActive && (
                            <span className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-400 rounded-r"></span>
                          )}

                          {/* Avatar */}
                          <div
                            onClick={(e) => { e.stopPropagation(); setProfileUserId(dm.userId); }}
                            className="shrink-0"
                          >
                            <UserAvatar
                              src={dm.avatarUrl}
                              name={dm.username}
                              size="md"
                              isBlocked={isBlocked}
                              showStatus={true}
                              isConnected={isOnline}
                              className="shrink-0"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`text-sm font-semibold truncate ${
                                    isActive ? "text-white" : "text-zinc-100 group-hover:text-white"
                                  }`}
                                >
                                  {dm.username}
                                </span>
                                {isOnline && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Active now" />
                                )}
                              </div>
                              {timeStr && (
                                <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                                  {timeStr}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={`text-xs truncate ${
                                  isBlocked
                                    ? "text-rose-400/80 italic font-mono text-[11px]"
                                    : "text-zinc-400 group-hover:text-zinc-300"
                                }`}
                              >
                                {isBlocked ? "User Blocked" : snippet.text}
                              </p>

                              {unread > 0 && (
                                <span
                                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 bg-emerald-500 text-zinc-950 shadow-sm"
                                  title={`${unread} unread message${unread > 1 ? "s" : ""}`}
                                >
                                  {unread > 99 ? "99+" : unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* CHANNELS SECTION */}
              {(activeTab === "all" || activeTab === "channels") && (
                <div className="space-y-1 pt-2">
                  <div className="px-2 pb-1 flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
                    <span>ROOMS</span>
                    <span>{filteredRooms.length}</span>
                  </div>

                  {filteredRooms.map((room) => {
                    const isActive = activeChatType === "channel" && room.id === activeRoomId;
                    const roomMsgs = messagesByRoom[room.id] ?? [];
                    const unseenCount = unreadCounts[room.id] || 0;
                    const lastMsg = roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : null;
                    const timeStr = lastMsg ? formatChatTime(lastMsg.createdAt) : "";
                    const lastSenderName = lastMsg ? resolveSenderName(lastMsg.sender, lastMsg.senderEmail) : "";
                    const snippet = lastMsg
                      ? getMessageSnippet(lastMsg.content, lastSenderName)
                      : { text: room.description || "Tap to chat", isMedia: false };

                    return (
                      <button
                        key={room.id}
                        onClick={() => {
                          setActiveRoom(room.id);
                          if (onSelectRoom) onSelectRoom(room.id);
                        }}
                        className={`w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-colors flex items-center gap-3.5 cursor-pointer group relative ${
                          isActive
                            ? "bg-white/[0.05] text-white"
                            : "hover:bg-white/[0.02] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {/* Left Accent indicator when active */}
                        {isActive && (
                          <span className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-400 rounded-r"></span>
                        )}

                        {/* Channel Avatar */}
                        <div className="relative shrink-0">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-base transition-transform group-hover:scale-105 ring-1 ring-white/10 ${
                              isActive
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-[#18191f] text-zinc-300"
                            }`}
                          >
                            {room.emoji || "#"}
                          </div>
                        </div>

                        {/* Channel Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`text-sm font-semibold truncate ${
                                  isActive ? "text-white" : "text-zinc-100 group-hover:text-white"
                                }`}
                              >
                                {room.name}
                              </span>
                            </div>
                            {timeStr && (
                              <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                                {timeStr}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs truncate text-zinc-400 group-hover:text-zinc-300">
                              {snippet.text}
                            </p>

                            {unseenCount > 0 && (
                              <span
                                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 bg-emerald-500 text-zinc-950 shadow-sm"
                                title={`${unseenCount} unseen message${unseenCount > 1 ? "s" : ""}`}
                              >
                                {unseenCount > 99 ? "99+" : unseenCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* User Profile Footer Panel */}
        <div className="p-3 border-t border-white/[0.07] bg-[#090b10] pb-24 md:pb-3">
          <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-zinc-900/60 border border-white/[0.06]">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserAvatar
                src={currentUser.avatarUrl}
                name={currentUser.anonymousName || "Anonymous"}
                size="sm"
                showStatus={true}
                isConnected={isConnected}
                isConnecting={isConnecting}
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate">
                    {isLoggedIn ? (currentUser.anonymousName || "Anonymous") : "Guest User"}
                  </p>
                  {isLoggedIn && currentUser.studentYear && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium font-mono shrink-0">
                      Yr {currentUser.studentYear}
                    </span>
                  )}
                  {!isLoggedIn && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium font-mono shrink-0">
                      Read-Only
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                  {isLoggedIn ? (
                    <>
                      <span>{currentUser.tag || "Student"}</span>
                      <span>•</span>
                      <span
                        className={
                          isConnected
                            ? "text-emerald-400 font-medium"
                            : isConnecting
                            ? "text-amber-400 font-medium"
                            : "text-rose-400"
                        }
                      >
                        {isConnected ? "Secure" : isConnecting ? "Syncing" : "Offline"}
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-500">Sign in to send messages</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* User Profile Modal */}
      <UserProfileModal
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onMessage={(id) => {
          const found =
            userSearchResults.find((u) => u.id === id) ||
            dmConversations.find((d) => d.userId === id) as UserSearchResult | undefined;
          if (found) {
            handleStartDm({
              id,
              username: (found as any).username ?? "",
              avatarUrl: (found as any).avatarUrl,
              tag: (found as any).tag,
              studentYear: (found as any).studentYear,
            });
          } else {
            openDm({ id, username: "User" });
          }
        }}
      />
    </>
  );
}
