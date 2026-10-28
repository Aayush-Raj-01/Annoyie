"use client";

import React, { useState } from "react";
import type { Message } from "@/types/chat";
import { parseMessageContent } from "@/lib/chat/mediaData";
import { formatStudentYear } from "@/app/lib/auth";
import UserAvatar from "./UserAvatar";
import ImageZoomModal from "@/components/marketplace/ImageZoomModal";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  showSenderHeader?: boolean;
  onAvatarClick?: (senderId: number) => void;
  currentUserName?: string;
}

function renderMessageContentWithTags(content: string, currentUserName?: string) {
  const mentionRegex = /(@[\w-]+)/g;
  const parts = content.split(mentionRegex);

  return parts.map((part, idx) => {
    if (part.startsWith("@") && part.length > 1) {
      const mentionName = part.slice(1);
      const isMeMentioned =
        Boolean(currentUserName) &&
        mentionName.toLowerCase() === currentUserName?.toLowerCase();

      return (
        <span
          key={idx}
          className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded font-mono text-[11px] font-semibold transition-all select-none ${
            isMeMentioned
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/35"
              : "bg-sky-500/15 text-sky-300 border border-sky-500/25"
          }`}
        >
          {part}
        </span>
      );
    }
    return part;
  });
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
  onAvatarClick,
  currentUserName,
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
  const [isPhotoZoomOpen, setIsPhotoZoomOpen] = useState(false);

  const senderId =
    typeof message.senderId === "number"
      ? message.senderId
      : typeof message.sender === "object" && typeof (message.sender as any)?.id === "number"
      ? (message.sender as any).id
      : undefined;

  return (
    <>
      <div
        className={`w-full group flex items-end gap-2.5 my-1.5 transition-all duration-150 animate-in fade-in-50 slide-in-from-bottom-1 ${
          isMe ? "flex-row-reverse justify-start" : "flex-row justify-start"
        }`}
      >
        {/* Avatar for other users */}
        {!isMe ? (
          onAvatarClick && senderId ? (
            <button
              type="button"
              onClick={() => onAvatarClick(senderId)}
              className="shrink-0 mb-0.5 cursor-pointer hover:scale-105 transition-transform active:scale-95"
              title={`View ${senderName}'s profile`}
            >
              <UserAvatar src={avatarUrl} name={senderName} size="sm" />
            </button>
          ) : (
            <UserAvatar
              src={avatarUrl}
              name={senderName}
              size="sm"
              className="shrink-0 mb-0.5"
            />
          )
        ) : null}

        {/* Bubble Content Body */}
        <div
          className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] flex flex-col ${
            isMe ? "items-end" : "items-start"
          }`}
        >
          {/* Sender Name & Meta Header */}
          {!isMe && showSenderHeader && (
            <div className="flex items-center gap-1.5 mb-1 px-1 select-none flex-wrap">
              <span
                onClick={onAvatarClick && senderId ? () => onAvatarClick(senderId) : undefined}
                className={`text-xs font-semibold ${senderColor} ${
                  onAvatarClick && senderId ? "cursor-pointer hover:underline" : ""
                }`}
              >
                {senderName}
              </span>
              {formattedYear && (
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium font-mono"
                  title={`Academic: ${formattedYear}`}
                >
                  {formattedYear}
                </span>
              )}
              {tag && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.04] text-zinc-400 border border-white/[0.06] font-medium font-mono">
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
                onClick={() => setIsPhotoZoomOpen(true)}
                className="w-28 h-28 sm:w-36 sm:h-36 object-contain hover:scale-105 transition-transform duration-200 drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] cursor-zoom-in"
                loading="lazy"
                title="Click photo to zoom"
              />
              {timeFormatted && (
                <div className="flex items-center justify-end gap-1 mt-0.5 px-1 text-[10px] text-zinc-500 font-mono">
                  <span>{timeFormatted}</span>
                </div>
              )}
            </div>
          ) : media.type === "gif" || media.type === "image" ? (
            /* Media Render: GIF or Image */
            <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] shadow-xl bg-zinc-950/90 max-w-[280px] sm:max-w-[340px] my-1 group/img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media.url}
                alt="Media"
                onClick={() => setIsPhotoZoomOpen(true)}
                className="w-full h-auto max-h-80 object-cover cursor-zoom-in hover:brightness-105 transition-all"
                loading="lazy"
                title="Click photo to zoom"
              />
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[9px] font-mono font-bold text-white tracking-wider uppercase border border-white/10 pointer-events-none">
                {media.type === "gif" ? "GIF" : "PHOTO"}
              </div>
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[9px] font-mono font-bold text-emerald-400 opacity-90 sm:opacity-0 sm:group-hover/img:opacity-100 transition-opacity border border-white/10 pointer-events-none flex items-center gap-1">
                <span>🔍</span>
                <span>ZOOM</span>
              </div>
              {timeFormatted && (
                <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-mono text-zinc-300 flex items-center gap-1">
                  <span>{timeFormatted}</span>
                </div>
              )}
            </div>
          ) : (
            /* Standard Text Message Bubble - Matching Reference Image */
            <div
              className={`relative px-4 py-2.5 rounded-2xl text-[13px] sm:text-sm leading-relaxed shadow-sm break-words select-text ${
                isMe
                  ? "bg-emerald-600 text-white rounded-tr-sm shadow-md"
                  : "bg-[#202228] text-zinc-100 rounded-tl-sm border border-white/[0.04] shadow-sm"
              }`}
            >
              <p className="whitespace-pre-wrap inline">{renderMessageContentWithTags(message.content, currentUserName)}</p>
              {/* Inline subtle timestamp */}
              {timeFormatted && (
                <span
                  className={`inline-flex items-center ml-2.5 text-[10px] font-mono select-none align-bottom shrink-0 ${
                    isMe ? "text-white/80" : "text-zinc-400"
                  }`}
                >
                  <span>{timeFormatted}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Interactive Lightbox Zoom Modal */}
      {media.url && (
        <ImageZoomModal
          isOpen={isPhotoZoomOpen}
          onClose={() => setIsPhotoZoomOpen(false)}
          images={[media.url]}
          title={media.type === "sticker" ? (media.name || "Sticker") : `${senderName}'s Photo`}
        />
      )}
    </>
  );
}
