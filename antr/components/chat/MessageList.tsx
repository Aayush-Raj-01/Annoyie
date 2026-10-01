"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Message } from "@/types/chat";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: Message[];
  currentUserName: string;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  roomName: string;
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
  currentUserName,
  isLoading,
  isError,
  error,
  onRetry,
  roomName,
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

        {/* Welcome Room Clean Header */}
        {!isLoading && (
          <div className="py-8 mb-4 max-w-xl mx-auto flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.08] flex items-center justify-center text-emerald-400 text-xl font-bold font-mono mb-3 shadow-lg shadow-black/40 ring-1 ring-white/[0.04]">
              #
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Welcome to #{roomName}
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm leading-relaxed">
              This is the official channel log. Transmissions here are broadcast in real-time to all connected operatives.
            </p>
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent mt-4" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && messages.length === 0 && (
          <div className="text-center py-10 text-zinc-500 space-y-1">
            <div className="text-2xl mb-1 opacity-70">💬</div>
            <p className="text-xs font-medium text-zinc-400">No transmissions yet in #{roomName}.</p>
            <p className="text-[11px] text-zinc-500">Say hello or drop a sticker to get things rolling.</p>
          </div>
        )}

        {/* Messages Feed with Sender Clustering */}
        <div className="max-w-4xl mx-auto">
          {!isLoading &&
            messages.map((message, index) => {
              const senderName = resolveSenderString(message.sender, (message as any)?.senderEmail);
              const myName = typeof currentUserName === "string" ? currentUserName.trim().toLowerCase() : "";
              const isMe =
                Boolean(myName) &&
                Boolean(senderName) &&
                senderName.toLowerCase() === myName;

              // Check if previous message was from the same sender within 2 minutes
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const prevSender = prevMessage
                ? resolveSenderString(prevMessage.sender, (prevMessage as any)?.senderEmail)
                : null;

              const isSameSender = prevSender === senderName;
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
