"use client";

import React, { useState, useRef, useEffect } from "react";
import MediaPicker from "./MediaPicker";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
  senderName: string;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message...",
  senderName,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<"stickers" | "gifs" | "emojis">("stickers");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || disabled) return;

    onSendMessage(content.trim());
    setContent("");
    setShowMediaPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectMedia = (mediaToken: string) => {
    onSendMessage(mediaToken);
    setShowMediaPicker(false);
  };

  const handleSelectEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const openPickerWithTab = (tab: "stickers" | "gifs" | "emojis") => {
    if (showMediaPicker && pickerTab === tab) {
      setShowMediaPicker(false);
    } else {
      setPickerTab(tab);
      setShowMediaPicker(true);
    }
  };

  return (
    <div className="relative border-t border-white/[0.06] bg-[#090b10]/95 backdrop-blur-xl px-3 pt-3 pb-20 sm:px-4 sm:pt-4 sm:pb-20 z-20">
      {/* Tabbed Sticker / GIF / Emoji Picker Drawer */}
      <MediaPicker
        isOpen={showMediaPicker}
        initialTab={pickerTab}
        onClose={() => setShowMediaPicker(false)}
        onSelectMedia={handleSelectMedia}
        onSelectEmoji={handleSelectEmoji}
      />

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {/* Unified Floating Pill Capsule */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-[#12151e]/90 hover:bg-[#12151e] border border-white/[0.08] focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10 rounded-2xl shadow-xl shadow-black/40 transition-all">
          {/* Quick Media Action: Emojis */}
          <button
            type="button"
            onClick={() => openPickerWithTab("emojis")}
            className={`p-2 rounded-xl text-base transition-all duration-150 cursor-pointer flex items-center justify-center ${
              showMediaPicker && pickerTab === "emojis"
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
            }`}
            title="Insert Emojis"
          >
            😀
          </button>

          {/* Quick Media Action: GIFs */}
          <button
            type="button"
            onClick={() => openPickerWithTab("gifs")}
            className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer flex items-center gap-1 ${
              showMediaPicker && (pickerTab === "gifs" || pickerTab === "stickers")
                ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
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
            disabled={disabled}
            placeholder={
              disabled
                ? "Connecting to chat room..."
                : `${placeholder} (as ${senderName})`
            }
            className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 px-2 py-1 font-sans focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || !content.trim()}
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
