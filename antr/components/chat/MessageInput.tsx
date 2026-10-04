"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import MediaPicker from "./MediaPicker";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  isBlocked?: boolean;
  isLoggedIn?: boolean;
  placeholder?: string;
  senderName: string;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
  isBlocked = false,
  isLoggedIn = true,
  placeholder = "Type a message...",
  senderName,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<"stickers" | "gifs" | "emojis">("stickers");
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);
  const lastSendTimeRef = useRef(0);

  useEffect(() => {
    if (!isBlocked && isLoggedIn) {
      inputRef.current?.focus();
    }
  }, [isBlocked, isLoggedIn]);

  const isActuallyDisabled = disabled || isBlocked || !isLoggedIn;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = content.trim();
    if (!text || isActuallyDisabled) return;

    // De-bounce rapid submissions (Enter key + form submit, double clicks within 400ms)
    const now = Date.now();
    if (isSubmittingRef.current || now - lastSendTimeRef.current < 400) {
      return;
    }
    isSubmittingRef.current = true;
    lastSendTimeRef.current = now;

    setContent("");
    setShowMediaPicker(false);

    try {
      onSendMessage(text);
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectMedia = (mediaToken: string) => {
    if (isActuallyDisabled) return;
    const now = Date.now();
    if (isSubmittingRef.current || now - lastSendTimeRef.current < 400) return;
    isSubmittingRef.current = true;
    lastSendTimeRef.current = now;
    setShowMediaPicker(false);
    try {
      onSendMessage(mediaToken);
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 300);
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    if (isActuallyDisabled) return;
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const openPickerWithTab = (tab: "stickers" | "gifs" | "emojis") => {
    if (isActuallyDisabled) return;
    if (showMediaPicker && pickerTab === tab) {
      setShowMediaPicker(false);
    } else {
      setPickerTab(tab);
      setShowMediaPicker(true);
    }
  };

  // If user is not logged in, render a sleek locked action banner
  if (!isLoggedIn) {
    return (
      <div className="relative border-t border-white/[0.06] bg-[#090b10]/95 backdrop-blur-xl px-3 pt-3 pb-20 sm:px-4 sm:pt-4 sm:pb-20 z-20">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 bg-zinc-900/80 border border-white/[0.08] rounded-2xl shadow-xl shadow-black/40">
          <div className="flex items-center gap-3 min-w-0 text-center sm:text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-lg shrink-0">
              🔒
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">
                Log in to chat
              </p>
              <p className="text-[11px] text-zinc-400">
                You must be signed in with an account to send messages in channels and direct messages.
              </p>
            </div>
          </div>

          <Link
            href="/authentication"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-wide shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <span>Sign In to Chat</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative border-t border-white/[0.06] bg-[#090b10]/95 backdrop-blur-xl px-3 pt-3 pb-20 sm:px-4 sm:pt-4 sm:pb-20 z-20">
      {/* Tabbed Sticker / GIF / Emoji Picker Drawer */}
      {!isActuallyDisabled && (
        <MediaPicker
          isOpen={showMediaPicker}
          initialTab={pickerTab}
          onClose={() => setShowMediaPicker(false)}
          onSelectMedia={handleSelectMedia}
          onSelectEmoji={handleSelectEmoji}
        />
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Unified Floating Pill Capsule */}
        <div
          className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-[#12151e]/90 rounded-2xl shadow-xl shadow-black/40 transition-all ${
            isBlocked
              ? "border border-rose-500/20 bg-rose-950/10"
              : "hover:bg-[#12151e] border border-white/[0.08] focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10"
          }`}
        >
          {/* Quick Media Action: Emojis */}
          <button
            type="button"
            disabled={isActuallyDisabled}
            onClick={() => openPickerWithTab("emojis")}
            className={`p-2 rounded-xl text-base transition-all duration-150 flex items-center justify-center ${
              isActuallyDisabled
                ? "opacity-30 cursor-not-allowed text-zinc-500"
                : showMediaPicker && pickerTab === "emojis"
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] cursor-pointer"
            }`}
            title="Insert Emojis"
          >
            😀
          </button>

          {/* Quick Media Action: GIFs */}
          <button
            type="button"
            disabled={isActuallyDisabled}
            onClick={() => openPickerWithTab("gifs")}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1 ${
              isActuallyDisabled
                ? "opacity-30 cursor-not-allowed text-zinc-500"
                : showMediaPicker && (pickerTab === "gifs" || pickerTab === "stickers")
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)] cursor-pointer"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] cursor-pointer"
            }`}
            title="GIPHY GIFs & Stickers"
          >
            <span className="text-sm">🎬</span>
            <span className="hidden sm:inline text-[11px] font-mono font-bold tracking-tight">GIF</span>
          </button>

          {/* Seamless Text Input */}
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isActuallyDisabled}
            placeholder={
              isBlocked
                ? "You have blocked this user. Unblock them to chat."
                : disabled
                ? "Connecting to chat room..."
                : `${placeholder} (as ${senderName})`
            }
            className={`flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm px-2 py-1 font-sans focus:ring-0 ${
              isBlocked
                ? "text-rose-300/70 placeholder-rose-400/50 cursor-not-allowed italic"
                : "text-zinc-100 placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isActuallyDisabled || !content.trim()}
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs tracking-wide shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all duration-150 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shrink-0"
            title="Send message"
          >
            <span className="hidden sm:inline">Send</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
