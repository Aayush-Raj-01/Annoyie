"use client";

import React from "react";
import type { Message } from "@/types/chat";
import { parseMessageContent } from "@/lib/chat/mediaData";
import { formatStudentYear } from "@/app/lib/auth";
import UserAvatar from "./UserAvatar";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  showSenderHeader?: boolean;
}

// Generate consistent avatar background based on username string
function getAvatarGradient(name: string) {
  const gradients = [
    "from-indigo-600 to-violet-600",
    "from-emerald-600 to-teal-600",
    "from-rose-600 to-pink-600",
    "from-amber-600 to-orange-600",
    "from-cyan-600 to-blue-600",
    "from-fuchsia-600 to-purple-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

function getSenderNameColor(name: string) {
  const colors = [
    "text-emerald-400",
    "text-sky-400",
    "text-indigo-400",
    "text-amber-400",
    "text-rose-400",
    "text-teal-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatMessageTime(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function resolveSenderName(message: Message): string {
  if (typeof (message as any)?.senderUsername === "string" && (message as any).senderUsername.trim()) {
    return (message as any).senderUsername.trim();
  }
  if (message.sender && typeof message.sender === "object") {
    const s = message.sender as Record<string, unknown>;
    if (typeof s.username === "string" && s.username.trim()) return s.username.trim();
    if (typeof s.name === "string" && s.name.trim()) return s.name.trim();
  }
  if (typeof message.sender === "string" && message.sender.trim()) {
    return message.sender.trim();
  }
  if (typeof (message as any)?.senderEmail === "string" && (message as any).senderEmail.trim()) {
    return (message as any).senderEmail.trim();
  }
  return "Anonymous";
}

export default function MessageBubble({
  message,
  isMe,
  showSenderHeader = true,
}: MessageBubbleProps) {
  const timeFormatted = formatMessageTime(message.createdAt);
  const senderName = resolveSenderName(message);
  const senderColor = getSenderNameColor(senderName);
  const avatarUrl =
    message.avatarUrl ||
    (typeof message.sender === "object" ? (message.sender as any)?.avatarUrl : undefined);
  const rawStudentYear =
    message.studentYear ??
    (typeof message.sender === "object" ? (message.sender as any)?.studentYear : undefined);
  const studentYear =
    rawStudentYear != null && rawStudentYear >= 1 && rawStudentYear <= 6 ? rawStudentYear : 1;
  const tag =
    message.tag ||
    (typeof message.sender === "object" ? (message.sender as any)?.tag : undefined);
  const formattedYear = formatStudentYear(studentYear);

  // Parse if message is a Sticker, GIF, or regular text
  const media = parseMessageContent(message.content);

  return (
    <div
      className={`group flex items-end gap-2.5 my-1.5 transition-all duration-150 animate-in fade-in-50 slide-in-from-bottom-1 ${
        isMe ? "flex-row-reverse justify-start" : "flex-row justify-start"
      }`}
    >
      {/* Avatar (shown for other users) */}
      {!isMe ? (
        <UserAvatar
          src={avatarUrl}
          name={senderName}
          size="sm"
          className="shrink-0 mb-0.5"
        />
      ) : (
        <div className="w-1" /> // subtle spacer
      )}

      {/* Bubble Content Body */}
      <div
        className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        {/* Sender Name & Meta Header (only if not me and showSenderHeader is true) */}
        {!isMe && showSenderHeader && (
          <div className="flex items-center gap-1.5 mb-1 px-1 select-none flex-wrap">
            <span className={`text-xs font-semibold ${senderColor}`}>
              {senderName}
            </span>
            {formattedYear && (
              <span
                className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium font-mono"
                title={`Academic: ${formattedYear}`}
              >
                {formattedYear}
              </span>
            )}
            {tag && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/[0.04] text-zinc-400 border border-white/[0.06] font-medium font-mono">
                {tag}
              </span>
            )}
          </div>
        )}

        {/* Media Render: Sticker */}
        {media.type === "sticker" && media.url ? (
          <div className="relative group/sticker my-1 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.url}
              alt={media.name || "Sticker"}
              className="w-28 h-28 sm:w-36 sm:h-36 object-contain hover:scale-105 transition-transform duration-200 drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
              loading="lazy"
            />
            {timeFormatted && (
              <div className="flex items-center justify-end gap-1 mt-0.5 px-1 text-[10px] text-zinc-500 font-mono">
                <span>{timeFormatted}</span>
              </div>
            )}
          </div>
        ) : media.type === "gif" || media.type === "image" ? (
          /* Media Render: GIF or Image */
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl bg-zinc-950/80 max-w-[280px] sm:max-w-[340px] my-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.url}
              alt="GIF media"
              className="w-full h-auto max-h-80 object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-mono font-bold text-white tracking-wider uppercase border border-white/10">
              GIF
            </div>
            {timeFormatted && (
              <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-zinc-300 flex items-center gap-1">
                <span>{timeFormatted}</span>
              </div>
            )}
          </div>
        ) : (
          /* Standard Text Message Bubble with WhatsApp/Telegram Tail & Placement */
          <div
            className={`relative px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-[13px] sm:text-sm leading-relaxed shadow-sm break-words select-text ${
              isMe
                ? "bg-[#0b5c46] hover:bg-[#0c644d] text-white rounded-br-xs border border-emerald-500/25 shadow-emerald-950/30"
                : "bg-[#181b24] text-zinc-100 rounded-bl-xs border border-white/[0.06] shadow-black/40"
            }`}
          >
            <p className="whitespace-pre-wrap inline">{message.content}</p>
            {/* Inline subtle timestamp */}
            {timeFormatted && (
              <span
                className={`inline-flex items-center ml-2 text-[10px] font-mono select-none align-bottom shrink-0 ${
                  isMe ? "text-emerald-200/70" : "text-zinc-500"
                }`}
              >
                <span>{timeFormatted}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
