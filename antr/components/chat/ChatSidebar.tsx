"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { CHAT_ROOMS, useChatStore } from "@/store/chatStore";
import { searchUsers } from "@/lib/api/users";
import UserAvatar from "./UserAvatar";
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
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);

  const [searchQuery, setSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "channels" | "dms">("all");

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
        // Secondary client-side guard against showing self
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

  const filteredRooms = CHAT_ROOMS.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleStartDm = (user: UserSearchResult) => {
    if (!isLoggedIn) {
      if (typeof window !== "undefined") {
        window.location.href = "/authentication";
      }
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
    <aside className="w-full h-full bg-[#08090d] border-r border-white/[0.06] flex flex-col select-none">
      {/* Brand Header */}
      <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between bg-[#0a0c12]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-zinc-950 font-black text-xs shadow-md shadow-emerald-500/20 tracking-wider">
            AY
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white">Annoyms</span>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="px-3 py-2 border-b border-white/[0.04] bg-[#08090d]">
        <div className="relative">
          <svg
            className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
            type="text"
            placeholder="Search channels or other users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-900/60 border border-white/[0.06] rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setUserSearchResults([]);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter Bar (When not actively searching) */}
      {!searchQuery.trim() && (
        <div className="px-3 py-2 flex items-center gap-1.5 border-b border-white/[0.04] bg-[#090b10]">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
              activeTab === "all"
                ? "bg-white/[0.08] text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "channels"
                ? "bg-white/[0.08] text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
            }`}
          >
            <span>Channels</span>
            {totalUnreadChannels > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("dms")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "dms"
                ? "bg-white/[0.08] text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
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
                        onClick={() => handleStartDm(user)}
                        className="w-full text-left px-3 py-2.5 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-500/30 transition-all flex items-center justify-between gap-2.5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Rich Persona Avatar with image or initials */}
                          <UserAvatar
                            src={user.avatarUrl}
                            name={user.username}
                            size="sm"
                            isBlocked={isBlocked}
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-white group-hover:text-emerald-300 truncate">
                                @{user.username}
                              </span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                                Yr {user.studentYear ?? 1}
                              </span>
                              {isBlocked && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                                  Blocked
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 font-mono truncate">
                              {user.tag || "Student"}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold tracking-wide shrink-0 transition-colors"
                        >
                          Message
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                !isSearchingUsers && (
                  <p className="px-2 py-1 text-xs text-zinc-500 italic">No other users found</p>
                )
              )}
            </div>

            {/* Search Results: Channels */}
            <div>
              <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
                <span>CHANNELS</span>
                <span>{filteredRooms.length}</span>
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
                        className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-2.5 cursor-pointer ${
                          isActive
                            ? "bg-white/[0.08] text-white"
                            : "hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-xs shrink-0">
                          {room.emoji || "#"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate text-zinc-200">{room.name}</p>
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
                  <div className="px-3 py-3 rounded-xl border border-dashed border-white/[0.06] text-center">
                    <p className="text-[11px] text-zinc-400 font-medium">No direct messages yet</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Search any user above to start chatting
                    </p>
                  </div>
                ) : (
                  dmConversations.map((dm) => {
                    const isActive =
                      activeChatType === "dm" && activeDmUser?.userId === dm.userId;
                    const unread = unreadDmCounts[dm.userId] || 0;
                    const isBlocked = blockedUserIds.includes(dm.userId);
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
                        className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center gap-3 cursor-pointer group ${
                          isActive
                            ? "bg-white/[0.08] border border-white/[0.1] text-white shadow-sm"
                            : "border border-transparent hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {/* Avatar */}
                        <UserAvatar
                          src={dm.avatarUrl}
                          name={dm.username}
                          size="md"
                          isBlocked={isBlocked}
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  isActive ? "text-white" : "text-zinc-200 group-hover:text-white"
                                }`}
                              >
                                @{dm.username}
                              </span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono shrink-0">
                                Yr {dm.studentYear ?? 1}
                              </span>
                            </div>
                            {timeStr && (
                              <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                                {timeStr}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-xs truncate ${
                                isBlocked
                                  ? "text-rose-400/80 italic font-mono text-[11px]"
                                  : snippet.isMedia
                                  ? "text-emerald-400 font-medium"
                                  : "text-zinc-400 group-hover:text-zinc-300"
                              }`}
                            >
                              {isBlocked ? "User Blocked" : snippet.text}
                            </p>

                            {unread > 0 && (
                              <span
                                className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
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
                  <span>CHANNELS</span>
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
                      className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all duration-150 flex items-center gap-3 cursor-pointer group ${
                        isActive
                          ? "bg-white/[0.08] border border-white/[0.1] shadow-sm text-white"
                          : "border border-transparent hover:bg-white/[0.03] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {/* Channel Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-base transition-transform group-hover:scale-105 ${
                            isActive
                              ? "bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                              : "bg-zinc-900 border border-white/[0.06] text-zinc-300"
                          }`}
                        >
                          {room.emoji || "#"}
                        </div>
                      </div>

                      {/* Channel Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span
                            className={`text-xs sm:text-sm font-semibold truncate ${
                              isActive ? "text-white" : "text-zinc-200 group-hover:text-white"
                            }`}
                          >
                            {room.name}
                          </span>
                          {timeStr && (
                            <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                              {timeStr}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-xs truncate ${
                              snippet.isMedia
                                ? "text-emerald-400 font-medium"
                                : "text-zinc-400 group-hover:text-zinc-300"
                            }`}
                          >
                            {snippet.text}
                          </p>

                          {unseenCount > 0 && (
                            <span
                              className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
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
      <div className="p-3 border-t border-white/[0.06] bg-[#0a0c12] pb-24 md:pb-3">
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
  );
}
