"use client";

import React, { useState, useEffect } from "react";
import { onInAppNotification, InAppNotification } from "@/lib/notifications/chatNotifier";
import { useChatStore } from "@/store/chatStore";

export default function ChatNotificationBanner() {
  const [activeNotification, setActiveNotification] = useState<InAppNotification | null>(null);
  const openDm = useChatStore((state) => state.openDm);
  const setActiveRoom = useChatStore((state) => state.setActiveRoom);

  useEffect(() => {
    const unsubscribe = onInAppNotification((notif) => {
      setActiveNotification(notif);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!activeNotification) return;

    const timer = setTimeout(() => {
      setActiveNotification(null);
    }, 4500);

    return () => clearTimeout(timer);
  }, [activeNotification]);

  if (!activeNotification) return null;

  const handleClick = () => {
    if (activeNotification.type === "dm" && activeNotification.senderId) {
      openDm({
        id: activeNotification.senderId,
        username: activeNotification.senderName,
        avatarUrl: activeNotification.senderAvatar,
      });
    } else if (activeNotification.type === "group_tag" && activeNotification.roomId) {
      setActiveRoom(activeNotification.roomId);
    }
    setActiveNotification(null);
  };

  const isTag = activeNotification.type === "group_tag";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-top-3 fade-in duration-200">
      <div
        onClick={handleClick}
        className={`p-3 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${
          isTag
            ? "bg-gradient-to-r from-emerald-950/90 via-zinc-900/90 to-teal-950/90 border-emerald-500/40 shadow-emerald-950/40"
            : "bg-[#0f1118]/95 border-white/10 shadow-black/60 hover:border-emerald-500/30"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar or Icon Badge */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center font-bold text-xs text-zinc-300">
              {activeNotification.senderAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeNotification.senderAvatar}
                  alt={activeNotification.senderName}
                  className="w-full h-full object-cover"
                />
              ) : (
                activeNotification.senderName.slice(0, 1).toUpperCase()
              )}
            </div>
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] shadow-sm ${
                isTag
                  ? "bg-emerald-500 text-zinc-950 font-bold"
                  : "bg-sky-500 text-white"
              }`}
            >
              {isTag ? "🔔" : "💬"}
            </span>
          </div>

          {/* Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                {activeNotification.senderName}
              </span>
              {isTag ? (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  tagged you in #{activeNotification.roomName || "group"}
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400">
                  sent you a message
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 line-clamp-1 mt-0.5 font-sans">
              {activeNotification.content}
            </p>
          </div>
        </div>

        {/* Action / Dismiss */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 hidden sm:inline">
            Reply →
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveNotification(null);
            }}
            className="w-6 h-6 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
