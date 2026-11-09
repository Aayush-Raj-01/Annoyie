"use client";

import React from "react";

interface NewChatButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
  shortcut?: string;
}

export function ChatBubbleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Speech bubble outline */}
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      {/* 3 dots */}
      <circle cx="8.5" cy="12" r="0.8" fill="currentColor" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" />
      <circle cx="15.5" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}

export default function NewChatButton({
  onClick,
  className = "",
  label = "New Chat",
  shortcut,
}: NewChatButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#121c17]/90 hover:bg-[#15231c] border border-white/[0.07] hover:border-emerald-500/40 transition-all duration-200 group cursor-pointer shadow-lg shadow-black/30 overflow-hidden active:scale-[0.99] ${className}`}
    >
      {/* Subtle Right-to-Left Neon Green Gradient Glow Wash */}
      <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-emerald-500/20 via-emerald-500/5 to-transparent pointer-events-none group-hover:from-emerald-500/30 transition-all duration-300" />

      {/* Left: Chat Bubble with 3 dots + Label */}
      <div className="flex items-center gap-3 z-10 min-w-0">
        <div className="text-zinc-300 group-hover:text-emerald-400 transition-colors shrink-0">
          <ChatBubbleIcon className="w-5 h-5" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors truncate">
          {label}
        </span>
      </div>

      {/* Right: Emerald-Green Glow Indicator Pill */}
      <div className="flex items-center gap-2 z-10 shrink-0">
        {shortcut && (
          <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 px-1.5 py-0.5 rounded bg-white/5 border border-white/[0.05]">
            {shortcut}
          </span>
        )}
        <div className="w-1.5 h-6 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.95)] group-hover:shadow-[0_0_18px_rgba(52,211,153,1)] group-hover:scale-y-110 transition-all duration-200" />
      </div>
    </button>
  );
}

