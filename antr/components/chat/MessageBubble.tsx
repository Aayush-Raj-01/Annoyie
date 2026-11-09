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

  // Parse if message is a Sticker, GIF, Audio, or regular text
  const media = parseMessageContent(message.content);
  const [isPhotoZoomOpen, setIsPhotoZoomOpen] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  // Audio simulation timer
  React.useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 6;
        });
      }, 250);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingAudio]);

  const handleCopyText = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

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

          {/* Media Render: Audio Voice Note */}
          {media.type === "audio" ? (
            <div
              className={`relative p-3 rounded-[1.4rem] min-w-[220px] sm:min-w-[260px] flex flex-col gap-2 transition-all border select-none ${
                isMe
                  ? "bg-gradient-to-br from-[#1c131d] to-[#251525] border-pink-500/30 shadow-[0_8px_25px_rgba(244,63,94,0.15)] rounded-br-md text-white"
                  : "bg-[#181920] border-white/[0.08] rounded-bl-md text-zinc-100 shadow-xl"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Play/Pause Button with Glowing Pink Accent */}
                <button
                  type="button"
                  onClick={() => setIsPlayingAudio((p) => !p)}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff1e83] to-[#ff5ca8] text-zinc-950 flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(255,30,131,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer font-black"
                  title={isPlayingAudio ? "Pause voice note" : "Play voice note"}
                >
                  {isPlayingAudio ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="5" width="4" height="14" rx="1" />
                      <rect x="14" y="5" width="4" height="14" rx="1" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>

                {/* Animated Waveform Visualizer */}
                <div className="flex-1 flex items-center gap-[2.5px] h-8 px-1">
                  {[40, 70, 30, 90, 60, 100, 45, 80, 65, 35, 95, 75, 40, 85, 55, 30, 70, 95, 50, 80].map(
                    (height, idx) => {
                      const isPast = (idx / 20) * 100 <= audioProgress;
                      return (
                        <span
                          key={idx}
                          style={{ height: `${height}%` }}
                          className={`w-[3px] rounded-full transition-all duration-150 ${
                            isPlayingAudio
                              ? isPast
                                ? "bg-pink-400 shadow-[0_0_6px_rgba(244,63,94,0.6)]"
                                : "bg-zinc-600 animate-pulse"
                              : isPast
                              ? "bg-pink-400/80"
                              : "bg-zinc-600/70"
                          }`}
                        />
                      );
                    }
                  )}
                </div>
              </div>

              {/* Audio Meta Row */}
              <div className="flex items-center justify-between px-1 text-[10px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5 text-pink-400 font-semibold">
                  <span>✦</span>
                  <span>{media.name || "Voice Note"}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span>
                    0:{media.duration && media.duration < 10 ? `0${media.duration}` : media.duration || 16}
                  </span>
                  {timeFormatted && <span className="text-zinc-500">• {timeFormatted}</span>}
                </div>
              </div>
            </div>
          ) : media.type === "sticker" && media.url ? (
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
              className={`relative group/msg px-4 py-2.5 rounded-[1.25rem] text-[13.5px] sm:text-sm leading-relaxed break-words select-text ${
                isMe
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-md shadow-[0_8px_20px_rgba(16,185,129,0.18)]"
                  : "bg-[#181a22] text-zinc-100 rounded-bl-md border border-white/[0.06] shadow-md shadow-black/20"
              }`}
            >
              <p className="whitespace-pre-wrap inline">{renderMessageContentWithTags(message.content, currentUserName)}</p>
              {timeFormatted && (
                <span
                  className={`inline-flex items-center ml-2.5 text-[10px] font-medium select-none align-bottom shrink-0 ${
                    isMe ? "text-white/70" : "text-zinc-500"
                  }`}
                >
                  <span>{timeFormatted}</span>
                </span>
              )}

              {/* Quick Copy Action on Hover */}
              <button
                type="button"
                onClick={handleCopyText}
                className="opacity-0 group-hover/msg:opacity-100 transition-opacity absolute -top-3 right-2 px-1.5 py-0.5 rounded-md bg-zinc-900/90 border border-white/10 text-[9px] font-mono text-zinc-300 hover:text-white shadow-lg cursor-pointer"
                title="Copy message"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
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
