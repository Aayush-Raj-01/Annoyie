"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CHAT_ROOMS, useChatStore } from "@/store/chatStore";
import type { ChatRoom } from "@/types/chat";

interface ChatSidebarProps {
  currentUser: {
    anonymousName: string;
    tag?: string;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

export default function ChatSidebar({ currentUser, isOpen = true, onClose }: ChatSidebarProps) {
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const setActiveRoom = useChatStore((state) => state.setActiveRoom);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);
  const messagesByRoom = useChatStore((state) => state.messagesByRoom);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredRooms = CHAT_ROOMS.filter(
    (room) =>
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-72 md:w-80 bg-zinc-950/95 md:bg-zinc-900/60 backdrop-blur-xl border-r border-zinc-800/80 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20">
            A
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Annoyms
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                v2.0
              </span>
            </span>
            <p className="text-[11px] text-zinc-400">Anonymous Realtime Rooms</p>
          </div>
        </div>

        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          aria-label="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Room Search */}
      <div className="px-3 py-2.5 border-b border-zinc-800/40">
        <div className="relative">
          <svg
            className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
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
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-900/80 border border-zinc-800/80 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="px-2 py-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          <span>Channels</span>
          <span className="text-[10px] font-mono">{filteredRooms.length}</span>
        </div>

        {filteredRooms.map((room) => {
          const isActive = room.id === activeRoomId;
          const roomMsgs = messagesByRoom[room.id] ?? [];
          const count = roomMsgs.length;

          return (
            <button
              key={room.id}
              onClick={() => {
                setActiveRoom(room.id);
                if (onClose) onClose();
              }}
              className={`w-full group text-left px-3 py-2.5 rounded-xl transition-all duration-150 flex items-start gap-3 border ${
                isActive
                  ? "bg-gradient-to-r from-indigo-950/70 to-indigo-900/40 border-indigo-500/40 text-white shadow-sm shadow-indigo-950/50"
                  : "bg-transparent border-transparent text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform group-hover:scale-105 ${
                  isActive
                    ? "bg-indigo-600/30 border border-indigo-400/40 text-white"
                    : "bg-zinc-800/70 border border-zinc-700/40 text-zinc-300"
                }`}
              >
                {room.emoji || "💬"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs truncate">
                    {room.name}
                  </span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-indigo-500/30 text-indigo-200 border border-indigo-400/30"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {room.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* User Profile & Connection Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                {currentUser.anonymousName ? currentUser.anonymousName.charAt(0).toUpperCase() : "A"}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-zinc-900 ${
                  isConnected
                    ? "bg-emerald-500 animate-pulse"
                    : isConnecting
                    ? "bg-amber-400 animate-bounce"
                    : "bg-rose-500"
                }`}
                title={isConnected ? "Online" : isConnecting ? "Reconnecting..." : "Disconnected"}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-100 truncate">
                {currentUser.anonymousName || "Anonymous User"}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                <span>{currentUser.tag || "Guest"}</span>
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
                  {isConnected ? "Live" : isConnecting ? "Connecting..." : "Offline"}
                </span>
              </div>
            </div>
          </div>

          <Link
            href="/profile"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Account Profile"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        </div>
      </div>
    </aside>
  );
}
