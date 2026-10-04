"use client";

import React from "react";
import { useChatStore } from "@/store/chatStore";
import UserAvatar from "./UserAvatar";

interface ChatHeaderProps {
  onBack?: () => void;
  onRefresh?: () => void;
  isFetching?: boolean;
}

export default function ChatHeader({ onBack, onRefresh, isFetching }: ChatHeaderProps) {
  const activeChatType = useChatStore((state) => state.activeChatType);
  const activeRoom = useChatStore((state) => state.activeRoom);
  const activeDmUser = useChatStore((state) => state.activeDmUser);
  const blockedUserIds = useChatStore((state) => state.blockedUserIds);
  const blockUser = useChatStore((state) => state.blockUser);
  const unblockUser = useChatStore((state) => state.unblockUser);

  const isDm = activeChatType === "dm" && Boolean(activeDmUser);
  const isBlocked = isDm && activeDmUser ? blockedUserIds.includes(activeDmUser.userId) : false;

  const handleToggleBlock = () => {
    if (!activeDmUser) return;
    if (isBlocked) {
      unblockUser(activeDmUser.userId);
    } else {
      blockUser(activeDmUser.userId);
    }
  };

  return (
    <header className="h-16 px-3.5 sm:px-5 border-b border-white/[0.06] bg-[#090b10]/90 backdrop-blur-xl flex items-center justify-between z-10 shrink-0 select-none">
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        {/* Mobile Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden -ml-1 p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            aria-label="Back to chats"
            title="Back to chats"
          >
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-xs font-medium text-emerald-400 font-mono">Chats</span>
          </button>
        )}

        {isDm && activeDmUser ? (
          /* DM User Header Profile */
          <>
            <UserAvatar
              src={activeDmUser.avatarUrl}
              name={activeDmUser.username}
              size="md"
              isBlocked={isBlocked}
            />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight truncate">
                  @{activeDmUser.username}
                </h1>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium font-mono shrink-0">
                  Yr {activeDmUser.studentYear ?? 1}
                </span>
                {isBlocked && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium font-mono shrink-0">
                    Blocked
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 truncate">
                <span className="truncate max-w-xs sm:max-w-md font-mono">
                  {activeDmUser.tag ? `${activeDmUser.tag} • Direct Message` : "Direct Message (Encrypted)"}
                </span>
              </div>
            </div>
          </>
        ) : (
          /* Channel Header */
          <>
            <div className="w-10 h-10 rounded-2xl bg-zinc-900/90 border border-white/[0.08] flex items-center justify-center text-lg shrink-0 shadow-inner ring-1 ring-white/[0.04]">
              {activeRoom.emoji || "#"}
            </div>

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
          </>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Block / Unblock Button (Exclusive to DMs) */}
        {isDm && activeDmUser && (
          <button
            onClick={handleToggleBlock}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
              isBlocked
                ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 hover:border-white/20"
                : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500/40"
            }`}
            title={isBlocked ? "Unblock this user" : "Block this user"}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isBlocked ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              )}
            </svg>
            <span>{isBlocked ? "Unblock" : "Block"}</span>
          </button>
        )}

        {/* Refresh Messages Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isFetching}
            title="Refresh messages"
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
