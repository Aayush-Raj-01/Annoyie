"use client";

import React, { useState } from "react";
import { useChatStore, CHAT_ROOMS } from "@/store/chatStore";
import UserAvatar from "./UserAvatar";
import UserProfileModal from "./UserProfileModal";
import FolderTabs, { TabItem, IsometricCubeIcon } from "./FolderTab";

interface ChatHeaderProps {
  onBack?: () => void;
}

export default function ChatHeader({ onBack }: ChatHeaderProps) {
  const activeChatType = useChatStore((state) => state.activeChatType);
  const activeRoom = useChatStore((state) => state.activeRoom);
  const activeDmUser = useChatStore((state) => state.activeDmUser);
  const blockedUserIds = useChatStore((state) => state.blockedUserIds);
  const blockUser = useChatStore((state) => state.blockUser);
  const unblockUser = useChatStore((state) => state.unblockUser);
  const activeRoomId = useChatStore((state) => state.activeRoomId);
  const setActiveRoom = useChatStore((state) => state.setActiveRoom);
  const isUserOnline = useChatStore((state) => state.isUserOnline);

  const isDm = activeChatType === "dm" && Boolean(activeDmUser);
  const isBlocked = isDm && activeDmUser ? blockedUserIds.includes(activeDmUser.userId) : false;
  const isOnline = isDm && activeDmUser ? isUserOnline(activeDmUser.userId, activeDmUser.username) : false;
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  const handleToggleBlock = () => {
    if (!activeDmUser) return;
    if (isBlocked) unblockUser(activeDmUser.userId);
    else blockUser(activeDmUser.userId);
  };

  // Build folder tabs dynamically using real group names
  const headerTabs: TabItem[] = React.useMemo(() => {
    const room1 = CHAT_ROOMS.find((r) => r.id === 1);
    const room6 = CHAT_ROOMS.find((r) => r.id === 6);
    const room7 = CHAT_ROOMS.find((r) => r.id === 7);

    const list: TabItem[] = [
      {
        id: "room-1",
        label: room1?.name || "All Year",
        icon: "hash",
      },
      {
        id: "room-6",
        label: room6?.name || "Coding",
        icon: "cube", // 3D isometric cube icon
      },
      {
        id: "room-7",
        label: room7?.name || "Creative",
        icon: "hash",
      },
    ];

    // If current channel isn't among the defaults, append it with its real group name
    if (!isDm && activeRoomId !== 1 && activeRoomId !== 6 && activeRoomId !== 7) {
      list.push({
        id: `room-${activeRoom.id}`,
        label: activeRoom.name,
        customIcon: activeRoom.emoji ? <span className="text-sm">{activeRoom.emoji}</span> : undefined,
        icon: activeRoom.emoji ? undefined : "hash",
      });
    }

    // If in DM, append active peer tab
    if (isDm && activeDmUser) {
      list.push({
        id: `dm-${activeDmUser.userId}`,
        label: `@${activeDmUser.username}`,
        icon: "chat",
        closable: true,
      });
    }

    return list;
  }, [isDm, activeRoomId, activeRoom, activeDmUser]);

  const activeTabId = isDm && activeDmUser ? `dm-${activeDmUser.userId}` : `room-${activeRoomId}`;

  const handleSelectTab = (id: string | number) => {
    const str = String(id);
    if (str.startsWith("room-")) {
      const rId = parseInt(str.replace("room-", ""), 10);
      setActiveRoom(rId);
    }
  };

  const handleCloseTab = (id: string | number) => {
    const str = String(id);
    if (str.startsWith("dm-")) {
      setActiveRoom(1);
    }
  };

  return (
    <>
      {/* Folder Tabs Strip with Smooth Concave Notch (Image 2) */}
      <FolderTabs
        tabs={headerTabs}
        activeId={activeTabId}
        onSelect={handleSelectTab}
        onClose={handleCloseTab}
        bgColor="#121417"
      />

      <header className="h-[56px] px-4 sm:px-6 bg-[#121417] border-b border-white/[0.08] flex items-center justify-between z-20 shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              aria-label="Back"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {isDm && activeDmUser ? (
            /* DM User Header */
            <button
              type="button"
              onClick={() => setProfileUserId(activeDmUser.userId)}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity cursor-pointer text-left min-w-0"
              title="View profile"
            >
              <UserAvatar
                src={activeDmUser.avatarUrl}
                name={activeDmUser.username}
                size="sm"
                isBlocked={isBlocked}
                showStatus={true}
                isConnected={isOnline}
                className="shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-zinc-100 truncate">
                    @{activeDmUser.username}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full ${
                      isOnline
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-zinc-500"}`} />
                    <span>{isOnline ? "Online" : "Offline"}</span>
                  </span>
                </div>
                {activeDmUser.studentYear && (
                  <p className="text-[11px] text-zinc-400 font-medium">
                    Year {activeDmUser.studentYear} Student
                  </p>
                )}
              </div>
            </button>
          ) : (
            /* Channel Header */
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-lg text-zinc-300 shrink-0">
                {activeRoom.id === 6 ? <IsometricCubeIcon className="w-5 h-5" /> : activeRoom.emoji || "#"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-zinc-100 truncate">
                    {activeRoom.name}
                  </h1>
                  {activeRoom.requiredYear && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      YR {activeRoom.requiredYear}
                    </span>
                  )}
                </div>
                {activeRoom.description && (
                  <p className="text-[11px] text-zinc-400 truncate max-w-xs sm:max-w-md">
                    {activeRoom.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {isDm && activeDmUser && (
            <button
              type="button"
              onClick={handleToggleBlock}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                isBlocked
                  ? "bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/25"
                  : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08]"
              }`}
              title={isBlocked ? "Unblock user" : "Block user"}
            >
              {isBlocked ? "Unblock" : "Block"}
            </button>
          )}
        </div>
      </header>

      <UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
    </>
  );
}
