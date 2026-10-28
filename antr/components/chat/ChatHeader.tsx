"use client";

import React, { useState } from "react";
import { useChatStore } from "@/store/chatStore";
import UserAvatar from "./UserAvatar";
import UserProfileModal from "./UserProfileModal";

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
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  const handleToggleBlock = () => {
    if (!activeDmUser) return;
    if (isBlocked) {
      unblockUser(activeDmUser.userId);
    } else {
      blockUser(activeDmUser.userId);
    }
  };

  return (
    <>
      <header className="h-16 px-3 sm:px-6 border-b border-white/[0.05] bg-[#14151a] flex items-center justify-between z-20 shrink-0 select-none">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Mobile Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-1 rounded-full text-zinc-300 hover:text-white hover:bg-white/[0.06] active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              aria-label="Back to conversations"
              title="Back to conversations"
            >
              <svg className="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {isDm && activeDmUser ? (
            /* DM User Header Profile */
            <button
              onClick={() => setProfileUserId(activeDmUser.userId)}
              className="flex items-center gap-3 hover:opacity-95 transition-opacity cursor-pointer rounded-xl text-left min-w-0"
              title="View profile"
            >
              <UserAvatar
                src={activeDmUser.avatarUrl}
                name={activeDmUser.username}
                size="md"
                isBlocked={isBlocked}
                className="ring-1 ring-white/10 shrink-0"
              />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                    {activeDmUser.username}
                  </h1>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-400 text-xs font-sans">
                    {isBlocked ? "Blocked" : "Active now"}
                  </span>
                </div>
              </div>
            </button>
          ) : (
            /* Channel Header */
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#1c1d24] ring-1 ring-white/10 flex items-center justify-center text-base shrink-0 text-zinc-200">
                {activeRoom.emoji || "#"}
              </div>

              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                  {activeRoom.name}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-zinc-400 text-xs">Public Room</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Block / Unblock Button (Exclusive to DMs) */}
          {isDm && activeDmUser && (
            <button
              onClick={handleToggleBlock}
              className={`p-2 rounded-full text-xs font-medium transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                isBlocked
                  ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10"
                  : "bg-white/[0.04] hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-white/[0.06]"
              }`}
              title={isBlocked ? "Unblock user" : "Block user"}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isBlocked ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                )}
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Profile modal triggered from DM header */}
      <UserProfileModal
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </>
  );
}
