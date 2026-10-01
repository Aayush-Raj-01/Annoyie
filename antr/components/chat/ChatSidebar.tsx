"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CHAT_ROOMS, useChatStore } from "@/store/chatStore";

interface ChatSidebarProps {
  currentUser: {
    anonymousName: string;
    tag?: string;
    avatarUrl?: string;
  };
  onSelectRoom?: (roomId: number) => void;
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

export default function ChatSidebar({ currentUser, onSelectRoom }: ChatSidebarProps) {
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const setActiveRoom = useChatStore((state) => state.setActiveRoom);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);
  const messagesByRoom = useChatStore((state) => state.messagesByRoom);
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredRooms = CHAT_ROOMS.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <aside className="w-full h-full bg-[#08090d] border-r border-white/[0.06] flex flex-col select-none">
      {/* Brand Header & Quick Action Icons */}
      <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between bg-[#0a0c12]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-zinc-950 font-black text-xs shadow-md shadow-emerald-500/20 tracking-wider">
            AY
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">
                Annoyms
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                chat
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected
                    ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                    : isConnecting
                    ? "bg-amber-400 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <span>{isConnected ? "Encrypted Live" : isConnecting ? "Connecting" : "Offline"}</span>
            </p>
          </div>
        </div>

        {/* Top-Right Quick Links */}
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Home"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
          <Link
            href="/olx"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Market"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </Link>
          <Link
            href="/profile"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Profile"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </Link>
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
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-zinc-900/60 border border-white/[0.06] rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Channels Section Header */}
      <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500">
        <span>CHANNELS</span>
        <span>{filteredRooms.length}</span>
      </div>

      {/* Floating Channels List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
        {filteredRooms.map((room) => {
          const isActive = room.id === activeRoomId;
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
                  ? "bg-white/[0.06] border border-white/[0.08] shadow-sm text-white"
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
                {/* Top: Name & Timestamp */}
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

                {/* Bottom: Snippet & Unseen Badge */}
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

      {/* User Profile Footer Panel */}
      <div className="p-3 border-t border-white/[0.06] bg-[#0a0c12]">
        <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-zinc-900/60 border border-white/[0.06]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              {currentUser.avatarUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.anonymousName || "User"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                  {currentUser.anonymousName ? currentUser.anonymousName.charAt(0).toUpperCase() : "A"}
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-2 ring-zinc-950 ${
                  isConnected
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : isConnecting
                    ? "bg-amber-400 animate-pulse"
                    : "bg-rose-500"
                }`}
                title={isConnected ? "Online" : isConnecting ? "Connecting..." : "Offline"}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">
                {currentUser.anonymousName || "Anonymous"}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                <span>{currentUser.tag || "Operative"}</span>
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
              </div>
            </div>
          </div>

          <Link
            href="/profile"
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Profile Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </div>
    </aside>
  );
}
