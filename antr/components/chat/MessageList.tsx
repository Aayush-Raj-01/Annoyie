"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Message } from "@/types/chat";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  currentUserId?: number;
  currentUserEmail?: string;
  currentUserName: string;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  roomName: string;
  isDm?: boolean;
  dmUsername?: string;
  isBlocked?: boolean;
  onUnblock?: () => void;
}

function resolveSenderString(sender: unknown, fallback?: unknown): string {
  if (typeof sender === "string") return sender.trim();
  if (sender && typeof sender === "object") {
    const s = sender as Record<string, unknown>;
    if (typeof s.username === "string" && s.username.trim()) return s.username.trim();
    if (typeof s.name === "string" && s.name.trim()) return s.name.trim();
    if (typeof s.email === "string" && s.email.trim()) return s.email.trim();
  }
  if (typeof fallback === "string") return fallback.trim();
  return "";
}

export default function MessageList({
  messages,
  currentUserId,
  currentUserEmail,
  currentUserName,
  isLoading,
  isError,
  error,
  onRetry,
  roomName,
  isDm = false,
  dmUsername,
  isBlocked = false,
  onUnblock,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Track scroll position to show "Scroll to bottom" button
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isFarUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isFarUp);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative flex-1 min-h-0 bg-[#08090d] flex flex-col overflow-hidden">
      {/* Subtle Dot Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:32px_32px] opacity-15 pointer-events-none" />

      {/* Blocked User Notice Banner */}
      {isDm && isBlocked && (
        <div className="relative z-20 bg-rose-950/40 border-b border-rose-500/20 px-4 py-2.5 flex items-center justify-between gap-3 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 text-rose-300">
            <span className="text-base">🚫</span>
            <span>
              You have blocked <strong>@{dmUsername || "this user"}</strong>. You will not receive any new messages from them.
            </span>
          </div>
          {onUnblock && (
            <button
              onClick={onUnblock}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-semibold text-[11px] transition-colors cursor-pointer shrink-0"
            >
              Unblock
            </button>
          )}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 scrollbar-thin scrollbar-thumb-zinc-800 relative z-10"
      >
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 py-8 animate-pulse max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800" />
              <div className="space-y-2 flex-1">
                <div className="w-24 h-3 bg-zinc-800 rounded" />
                <div className="w-56 h-10 bg-zinc-900 rounded-2xl" />
              </div>
            </div>
            <div className="flex items-start gap-3 justify-end">
              <div className="space-y-2 flex flex-col items-end">
                <div className="w-20 h-3 bg-zinc-800 rounded" />
                <div className="w-48 h-10 bg-emerald-950/40 rounded-2xl" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-8 px-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl my-4 max-w-md mx-auto">
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-sm font-semibold text-rose-300">Could not retrieve messages</p>
            <p className="text-xs text-zinc-400 mt-1">
              {error instanceof Error ? error.message : "The chat backend could not be reached."}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 transition-colors cursor-pointer"
              >
                Retry Connection
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && messages.length === 0 && (
          <div className="text-center py-12 text-zinc-500 space-y-1.5 max-w-md mx-auto">
            <div className="text-3xl mb-1 opacity-70">
              {isDm ? "🔒" : "💬"}
            </div>
            <p className="text-sm font-medium text-zinc-300">
              {isDm
                ? `Direct message with @${dmUsername || "User"}`
                : `Make Heat Start in ${roomName}.`}
            </p>
            <p className="text-xs text-zinc-500">
              {isDm
                ? "This is the start of your direct, private message history."
                : "Start with a banger chat"}
            </p>
          </div>
        )}

        {/* Messages Feed with Sender Clustering */}
        <div className="max-w-4xl mx-auto">
          {!isLoading &&
            messages.map((message, index) => {
              const msgSenderId =
                typeof message.senderId === "number"
                  ? message.senderId
                  : typeof message.sender === "object" && typeof (message.sender as any)?.id === "number"
                  ? (message.sender as any).id
                  : undefined;

              const rawEmail = (message as any)?.senderEmail || (typeof message.sender === "object" ? (message.sender as any)?.email : undefined);
              const msgSenderEmail = typeof rawEmail === "string" && rawEmail.includes("@") ? rawEmail.trim().toLowerCase() : undefined;

              const senderName =
                (typeof (message as any)?.senderUsername === "string" && (message as any).senderUsername.trim()) ||
                resolveSenderString(message.sender, (message as any)?.senderEmail);
              const myName = typeof currentUserName === "string" ? currentUserName.trim().toLowerCase() : "";

              let isMe = false;
              if (currentUserId != null && msgSenderId != null && Number(currentUserId) === Number(msgSenderId)) {
                isMe = true;
              } else if (currentUserEmail && msgSenderEmail && currentUserEmail.trim().toLowerCase() === msgSenderEmail) {
                isMe = true;
              } else {
                isMe = Boolean(myName) && Boolean(senderName) && senderName.toLowerCase() === myName;
              }

              // Check if previous message was from the same sender within 2 minutes
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const prevSenderId =
                typeof prevMessage?.senderId === "number"
                  ? prevMessage.senderId
                  : typeof prevMessage?.sender === "object" && typeof (prevMessage?.sender as any)?.id === "number"
                  ? (prevMessage?.sender as any).id
                  : undefined;

              const prevSender = prevMessage
                ? (typeof (prevMessage as any)?.senderUsername === "string" && (prevMessage as any).senderUsername.trim()) ||
                  resolveSenderString(prevMessage.sender, (prevMessage as any)?.senderEmail)
                : null;

              const isSameSender =
                (msgSenderId != null && prevSenderId != null && Number(msgSenderId) === Number(prevSenderId)) ||
                (prevSender === senderName);
              let isWithinTwoMinutes = false;

              if (isSameSender && prevMessage?.createdAt && message.createdAt) {
                const diffMs = Math.abs(
                  new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime()
                );
                isWithinTwoMinutes = diffMs < 120000;
              }

              const showSenderHeader = !isSameSender || !isWithinTwoMinutes;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMe={isMe}
                  showSenderHeader={showSenderHeader}
                />
              );
            })}
        </div>

        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-5 right-5 z-30 p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-xl shadow-emerald-500/25 border border-emerald-400/40 transition-transform active:scale-95 animate-in fade-in zoom-in-75 cursor-pointer"
          title="Scroll to latest messages"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
}
