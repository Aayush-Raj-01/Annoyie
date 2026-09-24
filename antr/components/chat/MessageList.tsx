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

  // Auto scroll on new messages
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
    <div className="relative flex-1 min-h-0 bg-zinc-950/40 flex flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {/* Loading Skeleton */}
        {isLoading && (
          <div className="space-y-4 py-6 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-800" />
              <div className="space-y-1.5 flex-1">
                <div className="w-24 h-3 bg-zinc-800 rounded" />
                <div className="w-48 h-10 bg-zinc-800/60 rounded-2xl" />
              </div>
            </div>
            <div className="flex items-start gap-3 justify-end">
              <div className="space-y-1.5 flex flex-col items-end">
                <div className="w-20 h-3 bg-zinc-800 rounded" />
                <div className="w-40 h-10 bg-indigo-900/40 rounded-2xl" />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="text-center py-8 px-4 bg-red-950/20 border border-red-900/30 rounded-2xl my-4">
            <div className="text-2xl mb-2">⚠️</div>
            <p className="text-sm font-medium text-red-300">Failed to load previous messages</p>
            <p className="text-xs text-red-400/80 mt-1 max-w-sm mx-auto">
              {error instanceof Error ? error.message : "The chat backend could not be reached."}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-800/40 hover:bg-red-800/60 text-red-200 border border-red-700/50 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        )}

        {/* Welcome Room Banner */}
        {!isLoading && (
          <div className="text-center py-6 border-b border-zinc-800/40 mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-2xl mb-2 shadow-inner">
              💬
            </div>
            <h2 className="text-sm font-bold text-zinc-200">
              Welcome to #{roomName}
            </h2>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              This is the start of #{roomName}. Messages are exchanged in real-time over STOMP WebSockets and saved in PostgreSQL.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && messages.length === 0 && (
          <div className="text-center py-12 text-zinc-500 space-y-2">
            <div className="text-4xl">👋</div>
            <p className="text-sm font-medium text-zinc-400">No messages yet in this room.</p>
            <p className="text-xs text-zinc-500">Be the first to say hello!</p>
          </div>
        )}

        {/* Messages Feed */}
        {!isLoading &&
          messages.map((message) => {
            const senderName = resolveSenderString(message.sender, (message as any)?.senderEmail);
            const myName = typeof currentUserName === "string" ? currentUserName.trim().toLowerCase() : "";
            const isMe =
              Boolean(myName) &&
              Boolean(senderName) &&
              senderName.toLowerCase() === myName;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isMe={isMe}
              />
            );
          })}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50 border border-indigo-400/40 transition-transform active:scale-95 animate-in fade-in zoom-in-75"
          title="Scroll to latest"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}
    </div>
  );
}
