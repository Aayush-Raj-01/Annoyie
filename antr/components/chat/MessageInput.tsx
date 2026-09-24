"use client";

import React, { useState, useRef, useEffect } from "react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  senderName: string;
}

const QUICK_EMOJIS = ["👋", "🔥", "🚀", "😂", "❤️", "👀", "💻", "✨"];

export default function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  senderName,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || disabled) return;

    onSendMessage(content.trim());
    setContent("");
    setShowEmojis(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAddEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="border-t border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md p-3 sm:p-4">
      {/* Quick emoji drawer */}
      {showEmojis && (
        <div className="mb-2 p-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-1.5 flex-wrap animate-in fade-in duration-150">
          <span className="text-[11px] text-zinc-500 font-medium px-2">Quick:</span>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleAddEmoji(emoji)}
              className="p-1.5 text-base hover:bg-zinc-800 rounded-lg transition-transform hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Emoji toggle */}
        <button
          type="button"
          onClick={() => setShowEmojis((prev) => !prev)}
          className={`p-2.5 rounded-xl border transition-colors ${
            showEmojis
              ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
              : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
          }`}
          title="Toggle emojis"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>

        {/* Text Input */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? "Connecting to chat..."
                : `${placeholder} (as ${senderName})`
            }
            className="w-full px-4 py-2.5 text-sm bg-zinc-900/90 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={disabled || !content.trim()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold text-xs tracking-wide shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span className="hidden sm:inline">Send</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
