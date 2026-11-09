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
    return { text: `${prefix}GIF`, isMedia: true };
  }
  if (/^https?:\/\/\S+\.(gif|webp|png|jpe?g)/i.test(trimmed)) {
    return { text: `${prefix}Image`, isMedia: true };
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

  const tabClass = (tab: typeof activeTab) =>
    `flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
      activeTab === tab
        ? "bg-emerald-500 text-black shadow-[0_4px_14px_rgba(16,185,129,0.25)]"
        : "text-zinc-400 hover:text-white hover:bg-white/5"
    }`;

  return (
    <>
      <aside className="w-full h-full bg-[#0F0F12] flex flex-col select-none relative overflow-hidden">
        {/* Header with Title */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/[0.04]">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Messages</h1>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => document.getElementById("chat-search-input")?.focus()}
              className="p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 sm:px-5 py-2">
          <div className="relative group">
            <svg
              className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-emerald-500 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              id="chat-search-input"
              type="text"
              placeholder="Search peers or rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-[#16171e] border border-white/[0.06] rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-[#1a1b24] transition-all"
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
        </div>

        {!searchQuery.trim() && (
          <div className="px-4 sm:px-5 py-2 flex items-center gap-1.5">
            <button type="button" onClick={() => setActiveTab("all")} className={tabClass("all")}>
              All
            </button>
            <button type="button" onClick={() => setActiveTab("channels")} className={`${tabClass("channels")} flex items-center justify-center gap-1.5`}>
              <span>Rooms</span>
              {totalUnreadChannels > 0 && (
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "channels" ? "bg-black" : "bg-emerald-400"}`} />
              )}
            </button>
            <button type="button" onClick={() => setActiveTab("dms")} className={`${tabClass("dms")} flex items-center justify-center gap-1.5`}>
              <span>DMs</span>
              {totalUnreadDms > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full font-bold text-[9px] font-mono ${
                    activeTab === "dms" ? "bg-black text-emerald-500" : "bg-emerald-500 text-black"
                  }`}
                >
                  {totalUnreadDms}
                </span>
              )}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {searchQuery.trim() ? (
            <div className="space-y-6 pt-2">
              <div>
                <div className="px-3 pb-2 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-emerald-500/80">
                  <span>People</span>
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
                          className="w-full text-left px-3 py-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.05] transition-all flex items-center justify-between gap-3 cursor-pointer group"
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
                              <span className="text-sm font-bold text-white group-hover:text-emerald-400 truncate block transition-colors">
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
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black transition-all shrink-0 cursor-pointer"
                            title="Start chat"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-6 text-center rounded-2xl border border-dashed border-white/[0.06]">
                    <p className="text-xs text-zinc-500">{isSearchingUsers ? "Searching…" : "No people found"}</p>
                  </div>
                )}
              </div>

              <div>
                <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-zinc-500">
                  Rooms
                </div>
                {filteredRooms.length > 0 ? (
                  <div className="space-y-1">
                    {filteredRooms.map((room) => {
                      const isActive = activeChatType === "channel" && room.id === activeRoomId;
                      return (
                        <button
                          key={`search-room-${room.id}`}
                          type="button"
                          onClick={() => {
                            setActiveRoom(room.id);
                            setSearchQuery("");
                            if (onSelectRoom) onSelectRoom(room.id);
                          }}
                          className={`w-full text-left px-3 py-3 rounded-2xl transition-all flex items-center gap-3 cursor-pointer border ${
                            isActive
                              ? "bg-white/10 text-white border-white/10"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border-transparent"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-lg shrink-0">
                            {room.emoji || "#"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold truncate text-zinc-100">{room.name}</p>
                              {room.requiredYear && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold shrink-0">
                                  YR {room.requiredYear}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{room.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-3 py-6 text-center rounded-2xl border border-dashed border-white/[0.06]">
                    <p className="text-xs text-zinc-500">No rooms found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {(activeTab === "all" || activeTab === "dms") && (
                <div className="space-y-1">
                  <div className="px-3 pb-2 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500">
                    <span>Direct messages</span>
                    {dmConversations.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 normal-case tracking-normal">{dmConversations.length}</span>
                    )}
                  </div>

                  {dmConversations.length === 0 ? (
                    <div className="px-4 py-8 rounded-2xl border border-dashed border-white/[0.06] text-center">
                      <p className="text-xs text-zinc-400 font-medium">No direct messages yet</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Search a peer above to start one</p>
                    </div>
                  ) : (
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
                        : { text: "Open conversation", isMedia: false };
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
                          className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all flex items-center gap-3.5 cursor-pointer group relative border overflow-hidden ${
                            isActive
                              ? "bg-[#121c17]/95 border-emerald-500/35 shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                              : "hover:bg-white/[0.04] border-transparent hover:border-white/[0.05]"
                          }`}
                        >
                          {/* Right-side subtle green gradient wash for active conversation (Image 3) */}
                          {isActive && (
                            <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-emerald-500/20 via-emerald-500/5 to-transparent pointer-events-none rounded-r-2xl" />
                          )}

                          <div onClick={(e) => { e.stopPropagation(); setProfileUserId(dm.userId); }} className="shrink-0 relative z-10">
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
                              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-black text-[10px] font-black flex items-center justify-center border-2 border-[#0F0F12]">
                                {unread > 9 ? "9+" : unread}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 z-10">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-zinc-200 group-hover:text-white"}`}>
                                {dm.username}
                              </span>
                              {timeStr && (
                                <span className={`text-[10px] font-mono font-bold shrink-0 ${isActive ? "text-emerald-400" : "text-zinc-500"}`}>
                                  {timeStr}
                                </span>
                              )}
                            </div>
                            <p className={`text-[12px] truncate font-medium ${isBlocked ? "text-rose-400/70 italic" : isActive ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"}`}>
                              {isBlocked ? "Blocked" : snippet.text}
                            </p>
                          </div>

                          {/* Emerald-Green Glow Indicator Pill (Image 3) */}
                          {isActive && (
                            <div className="w-1.5 h-6 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.95)] shrink-0 z-10" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {(activeTab === "all" || activeTab === "channels") && (
                <div className="space-y-1 pt-4">
                  <div className="px-3 pb-2 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-zinc-500">
                    <span>Rooms</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 normal-case tracking-normal">{filteredRooms.length}</span>
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
                      : { text: room.description || "Public room", isMedia: false };

                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => {
                          setActiveRoom(room.id);
                          if (onSelectRoom) onSelectRoom(room.id);
                        }}
                        className={`w-full text-left px-3.5 py-3 rounded-2xl transition-all flex items-center gap-3.5 cursor-pointer group relative border overflow-hidden ${
                          isActive
                            ? "bg-[#121c17]/95 border-emerald-500/35 shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
                            : "hover:bg-white/[0.04] border-transparent hover:border-white/[0.05]"
                        }`}
                      >
                        {/* Right-side subtle green gradient wash for active room (Image 3) */}
                        {isActive && (
                          <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-emerald-500/20 via-emerald-500/5 to-transparent pointer-events-none rounded-r-2xl" />
                        )}

                        <div className="relative shrink-0 z-10">
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all border ${
                              isActive
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                                : "bg-[#18191f] text-zinc-400 border-white/[0.05] group-hover:scale-105"
                            }`}
                          >
                            {room.emoji || "#"}
                          </div>
                          {unseenCount > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-black text-[10px] font-black flex items-center justify-center border-2 border-[#0F0F12]">
                              {unseenCount > 9 ? "9+" : unseenCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 z-10">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-zinc-200 group-hover:text-white"}`}>
                              {room.name}
                            </span>
                            {timeStr && (
                              <span className={`text-[10px] font-mono font-bold shrink-0 ${isActive ? "text-emerald-400" : "text-zinc-500"}`}>
                                {timeStr}
                              </span>
                            )}
                          </div>
                          <p className={`text-[12px] truncate font-medium ${isActive ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"}`}>
                            {snippet.text}
                          </p>
                        </div>

                        {/* Emerald-Green Glow Indicator Pill (Image 3) */}
                        {isActive && (
                          <div className="w-1.5 h-6 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.95)] shrink-0 z-10" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 bg-[#0F0F12] border-t border-white/[0.04] pb-24 md:pb-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.04]">
            <UserAvatar
              src={currentUser.avatarUrl}
              name={currentUser.anonymousName || "Anonymous"}
              size="md"
              showStatus={true}
              isConnected={isConnected}
              isConnecting={isConnecting}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white truncate">
                  {isLoggedIn ? currentUser.anonymousName || "Anonymous" : "Guest"}
                </p>
                {isLoggedIn && currentUser.studentYear && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold font-mono shrink-0">
                    Y{currentUser.studentYear}
                  </span>
                )}
                {!isLoggedIn && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold font-mono shrink-0">
                    Read only
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-medium mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : isConnecting ? "bg-amber-400" : "bg-zinc-600"}`} />
                <span>
                  {isLoggedIn
                    ? isConnected
                      ? "Online"
                      : isConnecting
                      ? "Connecting"
                      : "Offline"
                    : "Sign in to send messages"}
                </span>
              </div>
            </div>
          </div>
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
