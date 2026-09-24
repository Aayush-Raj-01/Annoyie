"use client";

import React from "react";
import { useChatStore } from "@/store/chatStore";

interface ChatHeaderProps {
  onToggleSidebar?: () => void;
  onRefresh?: () => void;
  isFetching?: boolean;
}

export default function ChatHeader({ onToggleSidebar, onRefresh, isFetching }: ChatHeaderProps) {
  const activeRoom = useChatStore((state) => state.activeRoom);
  const isConnected = useChatStore((state) => state.isConnected);
  const isConnecting = useChatStore((state) => state.isConnecting);

  return (
    <header className="h-16 px-4 border-b border-zinc-800/80 bg-zinc-950/70 backdrop-blur-md flex items-center justify-between z-10">
      <div className="flex items-center gap-3 min-w-0">
        {/* Toggle button on mobile */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          aria-label="Toggle Channels"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-zinc-700/60 flex items-center justify-center text-xl shrink-0 shadow-inner">
          {activeRoom.emoji || "💬"}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm md:text-base font-bold text-white tracking-tight truncate">
              {activeRoom.name}
            </h1>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
              #{activeRoom.id}
            </span>
          </div>
          <p className="text-xs text-zinc-400 truncate max-w-xs sm:max-w-md">
            {activeRoom.description || "Real-time anonymous discussions"}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isFetching}
            title="Refresh room messages"
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-750 transition-all disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isFetching ? "animate-spin text-indigo-400" : ""}`}
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

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs shadow-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse"
                : isConnecting
                ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)] animate-ping"
                : "bg-rose-500"
            }`}
          />
          <span className="hidden sm:inline text-[11px] font-medium text-zinc-300">
            {isConnected ? "STOMP Live" : isConnecting ? "Reconnecting..." : "Offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
