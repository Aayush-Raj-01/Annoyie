"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import type { Message } from "@/types/chat";
import MessageBubble from "./MessageBubble";
import UserProfileModal from "./UserProfileModal";
import LoadingAnimation from "@/components/ui/LoadingAnimation";

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
  isYearRestricted?: boolean;
  requiredYear?: number;
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

function formatDayLabel(isoString?: string): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "";
    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();
    if (isToday) return "Today";

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();
    if (isYesterday) return "Yesterday";

    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
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
  isYearRestricted = false,
  requiredYear,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  const handleAvatarClick = useCallback((senderId: number) => {
    setProfileUserId(senderId);
  }, []);

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
    <>
      <div className="relative flex-1 min-h-0 bg-[#08090d] flex flex-col overflow-hidden">
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
          className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 scrollbar-thin scrollbar-thumb-zinc-800/60 relative z-10 flex flex-col"
        >
          {/* Year-Restricted Group Notice */}
          {isYearRestricted && (
            <div className="flex-1 flex items-center justify-center py-16 px-4 text-center my-auto">
              <div className="max-w-md p-6 rounded-3xl bg-zinc-900/60 border border-white/[0.08] backdrop-blur-xl shadow-2xl">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl mx-auto mb-3.5 shadow-inner font-mono font-bold">
                  🔒
                </div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Year-Restricted Cohort</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  This channel is strictly reserved for {requiredYear ? `Year ${requiredYear}` : "cohort"} students. Members of other academic years cannot view conversation history or chat here.
                </p>
              </div>
            </div>
          )}

          {/* Professional Loading State */}
          {!isYearRestricted && isLoading && (
            <div className="py-12 w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-6">
              <LoadingAnimation
                size="md"
                text="Syncing Timeline"
                subtitle="Retrieving message history"
              />
              {/* Subtle Staggered Message Wireframe Shimmer */}
              <div className="w-full space-y-3 pt-2 opacity-50">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] shrink-0" />
                  <div className="h-10 w-44 rounded-2xl bg-white/[0.03] border border-white/[0.05] relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent animate-shimmer-slide" />
                  </div>
                </div>
                <div className="flex items-start justify-end">
                  <div className="h-12 w-52 rounded-2xl bg-emerald-950/20 border border-emerald-500/10 relative overflow-hidden">
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-emerald-400/[0.06] to-transparent animate-shimmer-slide" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isYearRestricted && isError && (
            <div className="text-center py-8 px-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl my-4 max-w-md mx-auto">
              <div className="text-xl mb-2">⚠️</div>
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
          {!isYearRestricted && !isLoading && !isError && messages.length === 0 && (
            <div className="text-center py-12 text-zinc-500 space-y-2 max-w-md mx-auto my-auto select-none">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-xl mb-1 text-zinc-400">
                {isDm ? "🔒" : "#"}
              </div>
              <p className="text-sm font-semibold text-zinc-200 tracking-tight">
                {isDm
                  ? `Direct message with @${dmUsername || "User"}`
                  : `Welcome to #${roomName}`}
              </p>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                {isDm
                  ? "This is the start of your private, end-to-end direct messaging history."
                  : "Start the conversation with your campus peers."}
              </p>
            </div>
          )}

          {/* Messages Feed with Sender Clustering & Date Separators */}
          <div className="w-full flex-1 flex flex-col space-y-1">
            {!isYearRestricted && !isLoading &&
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

                // Date separator calculation
                const currentDateLabel = formatDayLabel(message.createdAt);
                const prevDateLabel = prevMessage ? formatDayLabel(prevMessage.createdAt) : null;
                const showDateSeparator = currentDateLabel && currentDateLabel !== prevDateLabel;

                return (
                  <React.Fragment key={message.id}>
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-4 select-none">
                        <span className="text-xs text-zinc-500 font-medium">
                          {currentDateLabel}
                        </span>
                      </div>
                    )}
                    <MessageBubble
                      message={message}
                      isMe={isMe}
                      showSenderHeader={showSenderHeader}
                      onAvatarClick={!isMe ? handleAvatarClick : undefined}
                      currentUserName={currentUserName}
                    />
                  </React.Fragment>
                );
              })}
          </div>

          <div ref={bottomRef} className="h-2" />
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-5 right-5 z-30 p-2.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-white/10 shadow-xl shadow-black/50 transition-transform active:scale-95 animate-in fade-in zoom-in-75 cursor-pointer backdrop-blur-md"
            title="Scroll to latest messages"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* Profile modal — opens when a message avatar is clicked */}
      <UserProfileModal
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </>
  );
}
