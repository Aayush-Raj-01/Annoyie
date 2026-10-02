"use client";

import React from "react";
import { useChatStore } from "@/store/chatStore";

interface ChatHeaderProps {
  onBack?: () => void;
  onRefresh?: () => void;
  isFetching?: boolean;
}

export default function ChatHeader({ onBack, onRefresh, isFetching }: ChatHeaderProps) {
  const activeRoom = useChatStore((state) => state.activeRoom);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);

  return (
    <header className="h-16 px-3.5 sm:px-5 border-b border-white/[0.06] bg-[#090b10]/90 backdrop-blur-xl flex items-center justify-between z-10 shrink-0 select-none">
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* WhatsApp-style Back Button (mobile only) */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden -ml-1 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            aria-label="Back to channels"
            title="Back to channels"
          >
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs font-medium text-emerald-400 font-mono">Chats</span>
          </button>
        )}

        {/* Room Insignia Badge */}
        <div className="w-10 h-10 rounded-2xl bg-zinc-900/90 border border-white/[0.08] flex items-center justify-center text-lg shrink-0 shadow-inner ring-1 ring-white/[0.04]">
          {activeRoom.emoji || "#"}
        </div>

        {/* Room Title and Live Presence Subtitle */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
              {activeRoom.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 truncate">
            <span className="truncate max-w-xs sm:max-w-md">
              {activeRoom.description || "Real-time anonymous discussions"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Encrypted Beacon & Refresh */}
      <div className="flex items-center gap-2 sm:gap-3">

        {/* Refresh Room Messages Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isFetching}
            title="Refresh room messages"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] border border-white/[0.06] transition-all disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <svg
              className={`w-4 h-4 ${isFetching ? "animate-spin text-emerald-400" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
