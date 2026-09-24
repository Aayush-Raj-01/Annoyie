"use client";

import React from "react";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
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

function resolveSenderName(sender: unknown, fallback?: unknown): string {
  if (typeof sender === "string" && sender.trim()) return sender.trim();
  if (sender && typeof sender === "object") {
    const s = sender as Record<string, unknown>;
    if (typeof s.username === "string" && s.username.trim()) return s.username.trim();
    if (typeof s.name === "string" && s.name.trim()) return s.name.trim();
    if (typeof s.email === "string" && s.email.trim()) return s.email.trim();
  }
  if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
  return "Anonymous";
}

export default function MessageBubble({ message, isMe }: MessageBubbleProps) {
  const timeFormatted = formatMessageTime(message.createdAt);
  const senderName = resolveSenderName(message.sender, (message as any)?.senderEmail);
  const avatarGradient = getAvatarGradient(senderName);
  const initial = (senderName || "A").charAt(0).toUpperCase();
  const tag = message.tag || (typeof message.sender === "object" ? (message.sender as any)?.tag : undefined);

  return (
    <div
      className={`group flex items-end gap-2.5 my-2.5 transition-opacity duration-200 animate-in fade-in-50 slide-in-from-bottom-1 ${
        isMe ? "flex-row-reverse justify-start" : "flex-row justify-start"
      }`}
    >
      {/* Avatar (only shown on non-me, or subtle indicator for me) */}
      {!isMe ? (
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-tr ${avatarGradient} flex items-center justify-center text-xs font-bold text-white shadow-md shadow-black/30 shrink-0 select-none`}
          title={senderName}
        >
          {initial}
        </div>
      ) : (
        <div className="w-2" /> // spacer
      )}

      {/* Bubble Content */}
      <div
        className={`max-w-[82%] sm:max-w-[70%] flex flex-col ${
          isMe ? "items-end" : "items-start"
        }`}
      >
        {/* Sender Name & Meta Header (only if not me) */}
        {!isMe && (
          <div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-xs font-semibold text-zinc-300">
              {senderName}
            </span>
            {tag && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 font-medium">
                {tag}
              </span>
            )}
            {timeFormatted && (
              <span className="text-[10px] text-zinc-500 font-mono">
                {timeFormatted}
              </span>
            )}
          </div>
        )}

        {/* Message Pill */}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
            isMe
              ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-xs shadow-indigo-900/30 border border-indigo-500/30"
              : "bg-zinc-800/90 text-zinc-100 rounded-bl-xs border border-zinc-700/60 shadow-black/20"
          }`}
        >
          <p className="whitespace-pre-wrap select-text">{message.content}</p>
        </div>

        {/* Timestamp footer for current user */}
        {isMe && timeFormatted && (
          <div className="flex items-center gap-1 mt-0.5 px-1 text-[10px] text-zinc-500 font-mono">
            <span>{timeFormatted}</span>
            <svg
              className="w-3 h-3 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
