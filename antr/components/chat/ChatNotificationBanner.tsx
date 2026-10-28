"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onInAppNotification, InAppNotification } from "@/lib/notifications/chatNotifier";
import { useChatStore } from "@/store/chatStore";

const TYPE_CONFIG: Record<
  InAppNotification["type"],
  { icon: string; label: string; accent: string; bg: string; border: string }
> = {
  dm: {
    icon: "💬",
    label: "sent you a message",
    accent: "text-sky-400",
    bg: "bg-[#0f1118]/95",
    border: "border-white/10 hover:border-sky-500/30",
  },
  group_tag: {
    icon: "🔔",
    label: "tagged you",
    accent: "text-emerald-400",
    bg: "bg-gradient-to-r from-emerald-950/90 via-zinc-900/90 to-teal-950/90",
    border: "border-emerald-500/40",
  },
  marketplace_new: {
    icon: "🛒",
    label: "posted a new listing",
    accent: "text-amber-400",
    bg: "bg-gradient-to-r from-amber-950/80 via-zinc-900/90 to-zinc-950/90",
    border: "border-amber-500/30 hover:border-amber-500/50",
  },
  gallery_new: {
    icon: "🖼️",
    label: "shared a photo",
    accent: "text-purple-400",
    bg: "bg-gradient-to-r from-purple-950/80 via-zinc-900/90 to-zinc-950/90",
    border: "border-purple-500/30 hover:border-purple-500/50",
  },
  message_room: {
    icon: "💬",
    label: "in",
    accent: "text-indigo-400",
    bg: "bg-gradient-to-r from-indigo-950/80 via-zinc-900/90 to-zinc-950/90",
    border: "border-indigo-500/30 hover:border-indigo-500/50",
  },
};

export default function AppNotificationBanner() {
  const [active, setActive] = useState<InAppNotification | null>(null);
  const openDm = useChatStore((s) => s.openDm);
  const setActiveRoom = useChatStore((s) => s.setActiveRoom);
  const router = useRouter();

  useEffect(() => {
    return onInAppNotification((notif) => setActive(notif));
  }, []);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setActive(null), 4500);
    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;

  const cfg = TYPE_CONFIG[active.type] ?? TYPE_CONFIG.dm;

  const handleClick = () => {
    if (active.type === "dm" && active.senderId) {
      openDm({ id: active.senderId, username: active.senderName, avatarUrl: active.senderAvatar });
    } else if (active.type === "group_tag" && active.roomId) {
      setActiveRoom(active.roomId);
    } else if (active.type === "marketplace_new" || active.actionUrl) {
      router.push(active.actionUrl ?? "/marketplace");
    } else if (active.type === "gallery_new") {
      router.push("/gallery");
    } else if (active.type === "message_room" && active.roomId) {
      setActiveRoom(active.roomId);
    }
    setActive(null);
  };

  const actionLabel =
    active.type === "dm" ? "Reply →" :
    active.type === "marketplace_new" ? "View →" :
    active.type === "gallery_new" ? "Open →" :
    "View →";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md animate-in slide-in-from-top-3 fade-in duration-200 pointer-events-auto">
      <div
        onClick={handleClick}
        className={`p-3 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${cfg.bg} ${cfg.border}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar / Image */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-zinc-800 border border-white/10 overflow-hidden flex items-center justify-center font-bold text-xs text-zinc-300">
              {active.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : active.senderAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.senderAvatar} alt={active.senderName} className="w-full h-full object-cover" />
              ) : (
                active.senderName.slice(0, 1).toUpperCase()
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-zinc-900 border border-white/10 shadow-sm">
              {cfg.icon}
            </span>
          </div>

          {/* Text */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white truncate max-w-[120px]">
                {active.senderName}
              </span>
              <span className={`text-[10px] ${cfg.accent}`}>
                {active.type === "group_tag"
                  ? `tagged you in #${active.roomName ?? "group"}`
                  : active.type === "message_room"
                  ? `in #${active.roomName ?? "room"}`
                  : cfg.label}
              </span>
              {active.listingPrice != null && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ₹{active.listingPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 line-clamp-1 mt-0.5">
              {active.listingTitle ?? active.content}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <span className={`text-[10px] font-semibold ${cfg.accent} bg-white/5 px-2 py-1 rounded-lg border border-white/10 hidden sm:inline`}>
            {actionLabel}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActive(null); }}
            className="w-6 h-6 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
